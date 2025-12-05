import { useState, useEffect } from 'react';
import { Client, PDFTemplate } from '@shared/schemas';
import { clientDataService } from '../services/ClientDataService';
import { pdfTemplateService } from '../services/PDFTemplateService';
import { formFillService } from '../services/FormFillService';
import { geminiService } from '../services/GeminiService';

export function FormFiller() {
  const [clients, setClients] = useState<Client[]>([]);
  const [templates, setTemplates] = useState<PDFTemplate[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<PDFTemplate | null>(null);
  const [filling, setFilling] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [useAI, setUseAI] = useState(false);
  const [aiConfigured, setAiConfigured] = useState(false);

  useEffect(() => {
    // Load clients and templates
    setClients(clientDataService.getAllClients());
    setTemplates(pdfTemplateService.getAllTemplates());

    // Check if AI is configured
    checkAIConfiguration();
  }, []);

  const checkAIConfiguration = async () => {
    try {
      await geminiService.initialize();
      setAiConfigured(geminiService.isConfigured());
    } catch (error) {
      setAiConfigured(false);
    }
  };

  const handleFillForm = async () => {
    if (!selectedClient || !selectedTemplate) {
      setError('Please select both a client and a template');
      return;
    }

    try {
      setFilling(true);
      setError(null);
      setSuccess(null);

      const result = await formFillService.fillForm(
        selectedTemplate,
        selectedClient,
        useAI && aiConfigured
      );

      const filePath = await formFillService.exportPDF(
        result.pdfBytes,
        selectedClient,
        selectedTemplate
      );

      setSuccess(`PDF saved successfully to: ${filePath}`);
    } catch (err: any) {
      setError(err.message || 'Failed to fill form');
    } finally {
      setFilling(false);
    }
  };

  return (
    <div className="p-6 border-t border-gray-200">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Fill PDF Form</h2>
        <p className="text-gray-600">Select a client and template to automatically fill the form</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Client Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Client
          </label>
          <select
            value={selectedClient?.id || ''}
            onChange={(e) => {
              const client = clients.find((c) => c.id === e.target.value);
              setSelectedClient(client || null);
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Choose a client...</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.firstName} {client.lastName}
              </option>
            ))}
          </select>
          {selectedClient && (
            <div className="mt-2 p-3 bg-blue-50 rounded-lg text-sm">
              <p className="font-medium text-blue-900">
                {selectedClient.firstName} {selectedClient.lastName}
              </p>
              {selectedClient.email && (
                <p className="text-blue-700">{selectedClient.email}</p>
              )}
            </div>
          )}
        </div>

        {/* Template Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Template
          </label>
          <select
            value={selectedTemplate?.id || ''}
            onChange={(e) => {
              const template = templates.find((t) => t.id === e.target.value);
              setSelectedTemplate(template || null);
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Choose a template...</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name} ({template.fields.length} fields)
              </option>
            ))}
          </select>
          {selectedTemplate && (
            <div className="mt-2 p-3 bg-green-50 rounded-lg text-sm">
              <p className="font-medium text-green-900">{selectedTemplate.name}</p>
              <p className="text-green-700">
                {selectedTemplate.fields.length} fields • {selectedTemplate.metadata.pageCount} pages
              </p>
            </div>
          )}
        </div>
      </div>

      {/* AI Toggle */}
      {aiConfigured && (
        <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={useAI}
              onChange={(e) => setUseAI(e.target.checked)}
              className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
            />
            <span className="ml-2 text-sm font-medium text-purple-900">
              Use AI-powered field mapping (Gemini)
            </span>
          </label>
          <p className="text-xs text-purple-700 mt-1 ml-6">
            AI will intelligently match form fields to client data
          </p>
        </div>
      )}

      {/* Fill Button */}
      <button
        onClick={handleFillForm}
        disabled={filling || !selectedClient || !selectedTemplate}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg"
      >
        {filling ? 'Filling Form...' : 'Fill PDF Form'}
      </button>

      {/* Messages */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          <p className="font-medium">Success!</p>
          <p className="text-sm mt-1">{success}</p>
        </div>
      )}

      {/* Instructions */}
      {clients.length === 0 && templates.length === 0 && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
          <p className="font-medium">Getting Started:</p>
          <ol className="text-sm mt-2 ml-4 list-decimal space-y-1">
            <li>Import client data using the section above</li>
            <li>Upload a PDF template</li>
            <li>Select a client and template to fill the form</li>
          </ol>
        </div>
      )}
    </div>
  );
}
