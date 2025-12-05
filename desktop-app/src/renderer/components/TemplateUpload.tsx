import { useState } from 'react';
import { PDFTemplate } from '@shared/schemas';
import { pdfTemplateService } from '../services/PDFTemplateService';

export function TemplateUpload() {
  const [templates, setTemplates] = useState<PDFTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async () => {
    try {
      setLoading(true);
      setError(null);

      const filePath = await window.electronAPI.selectFile({
        filters: [
          { name: 'PDF Files', extensions: ['pdf'] },
        ],
      });

      if (!filePath) {
        setLoading(false);
        return;
      }

      const template = await pdfTemplateService.loadTemplate(filePath);
      const category = pdfTemplateService.categorizeTemplate(template);
      template.category = category;

      setTemplates([...templates, template]);
    } catch (err: any) {
      setError(err.message || 'Failed to load PDF template');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 border-t border-gray-200">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">PDF Templates</h2>
        <p className="text-gray-600">Upload PDF forms to fill automatically</p>
      </div>

      <button
        onClick={handleUpload}
        disabled={loading}
        className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Loading...' : 'Upload PDF Template'}
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {templates.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            Loaded {templates.length} template{templates.length !== 1 ? 's' : ''}
          </h3>
          <div className="grid gap-4">
            {templates.map((template) => (
              <div
                key={template.id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-gray-900">{template.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Category: {template.category}
                    </p>
                    <p className="text-sm text-gray-600">
                      {template.fields.length} field{template.fields.length !== 1 ? 's' : ''} • {template.metadata.pageCount} page{template.metadata.pageCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    PDF
                  </span>
                </div>
                {template.fields.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs font-medium text-gray-700 mb-2">Detected Fields:</p>
                    <div className="flex flex-wrap gap-2">
                      {template.fields.slice(0, 5).map((field) => (
                        <span
                          key={field.id}
                          className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded"
                        >
                          {field.name}
                        </span>
                      ))}
                      {template.fields.length > 5 && (
                        <span className="text-xs text-gray-500">
                          +{template.fields.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
