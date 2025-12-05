import { useState, useRef, useEffect } from 'react';
import { geminiService } from '../services/GeminiService';
import { clientDataService } from '../services/ClientDataService';
import { pdfTemplateService } from '../services/PDFTemplateService';
import { formFillService } from '../services/FormFillService';
import { documentParserService } from '../services/DocumentParserService';
import { Client } from '@shared/schemas';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm your PDF Auto-Filler assistant. I can help you build client profiles from documents and fill PDF forms automatically.\n\n📄 Upload Documents (PDF, Word, Text)\n• I'll extract client information using AI\n• Upload multiple files to build a complete profile\n• Say 'save client' when done\n\n📋 Fill Forms\n• Upload a PDF form template\n• Say 'fill form' to auto-fill with client data\n\nTry: 'upload document' or 'upload pdf form'",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [buildingClient, setBuildingClient] = useState<Partial<Client> | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Check if electronAPI is available
    if (!window.electronAPI) {
      setInitError('Electron API not available. Please restart the app.');
      return;
    }

    // Initialize Gemini
    geminiService.initialize().catch(() => {
      console.log('Gemini not configured, using basic mode');
    });
  }, []);

  if (initError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-red-50">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Initialization Error</h1>
          <p className="text-red-800">{initError}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-red-600 text-white rounded"
          >
            Reload App
          </button>
        </div>
      </div>
    );
  }

  const addMessage = (role: 'user' | 'assistant', content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const handleFileUpload = async (type: 'client' | 'pdf' | 'document') => {
    try {
      if (type === 'client') {
        const filePath = await window.electronAPI.selectFile({
          filters: [
            { name: 'Data Files', extensions: ['json', 'csv', 'xlsx', 'xls'] },
          ],
        });

        if (!filePath) return;

        addMessage('user', `Uploading client data file: ${filePath.split(/[\\/]/).pop()}`);
        setLoading(true);

        const clients = await clientDataService.loadClientsFromFile(filePath);
        
        addMessage(
          'assistant',
          `Great! I've loaded ${clients.length} client${clients.length !== 1 ? 's' : ''} from your file:\n\n${clients
            .slice(0, 5)
            .map((c) => `• ${c.firstName} ${c.lastName}`)
            .join('\n')}${clients.length > 5 ? `\n• ...and ${clients.length - 5} more` : ''}\n\nNow you can upload a PDF form to fill, or ask me to fill a form for a specific client!`
        );
      } else if (type === 'document') {
        const filePath = await window.electronAPI.selectFile({
          filters: [
            { name: 'Documents', extensions: ['pdf', 'docx', 'doc', 'txt'] },
            { name: 'All Files', extensions: ['*'] },
          ],
        });

        if (!filePath) return;

        const fileName = filePath.split(/[\\/]/).pop();
        addMessage('user', `Uploading document: ${fileName}`);
        setLoading(true);

        // Extract text from document
        const text = await documentParserService.extractTextFromFile(filePath);
        
        // Extract client data using AI
        const extractedData = await documentParserService.extractClientDataFromText(
          text,
          buildingClient || undefined
        );

        setBuildingClient(extractedData);
        setUploadedFiles([...uploadedFiles, fileName!]);

        const dataPreview = `📋 Client Profile Updated:\n\n${
          extractedData.firstName || extractedData.lastName
            ? `Name: ${extractedData.firstName || ''} ${extractedData.lastName || ''}\n`
            : ''
        }${extractedData.dateOfBirth ? `DOB: ${extractedData.dateOfBirth}\n` : ''}${
          extractedData.email ? `Email: ${extractedData.email}\n` : ''
        }${extractedData.phone ? `Phone: ${extractedData.phone}\n` : ''}${
          extractedData.address?.street ? `Address: ${extractedData.address.street}\n` : ''
        }${
          extractedData.address?.city
            ? `${extractedData.address.city}, ${extractedData.address.state || ''} ${extractedData.address.zipCode || ''}\n`
            : ''
        }${
          extractedData.customFields && Object.keys(extractedData.customFields).length > 0
            ? `\nAdditional Info:\n${Object.entries(extractedData.customFields)
                .map(([k, v]) => `• ${k}: ${v}`)
                .join('\n')}`
            : ''
        }`;

        addMessage(
          'assistant',
          `${dataPreview}\n\n📁 Files processed: ${uploadedFiles.length + 1}\n\nYou can:\n• Upload more documents to add information\n• Say "save client" to save this profile\n• Upload a PDF form to fill with this data`
        );
      } else {
        const filePath = await window.electronAPI.selectFile({
          filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
        });

        if (!filePath) return;

        addMessage('user', `Uploading PDF template: ${filePath.split(/[\\/]/).pop()}`);
        setLoading(true);

        const template = await pdfTemplateService.loadTemplate(filePath);
        const category = pdfTemplateService.categorizeTemplate(template);
        template.category = category;

        addMessage(
          'assistant',
          `Perfect! I've analyzed your PDF form "${template.name}".\n\n📄 Details:\n• ${template.fields.length} fillable fields detected\n• ${template.metadata.pageCount} page${template.metadata.pageCount !== 1 ? 's' : ''}\n• Category: ${category}\n\n🔍 Fields found:\n${template.fields
            .slice(0, 8)
            .map((f) => `• ${f.name}`)
            .join('\n')}${template.fields.length > 8 ? `\n• ...and ${template.fields.length - 8} more` : ''}\n\nReady to fill this form! Just tell me which client to use, or ask me anything about how to customize the filling process.`
        );
      }
    } catch (error: any) {
      addMessage('assistant', `❌ Oops! ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const processCommand = async (userInput: string) => {
    const input = userInput.toLowerCase();

    // Check for save client command
    if (input.includes('save client') || input.includes('save profile')) {
      if (!buildingClient || !buildingClient.firstName || !buildingClient.lastName) {
        addMessage('assistant', "I don't have enough client information yet. Please upload documents with client details first!");
        return;
      }

      const client: Client = {
        id: `client_${Date.now()}`,
        firstName: buildingClient.firstName!,
        lastName: buildingClient.lastName!,
        dateOfBirth: buildingClient.dateOfBirth,
        email: buildingClient.email,
        phone: buildingClient.phone,
        address: buildingClient.address,
        customFields: buildingClient.customFields || {},
        metadata: {
          source: 'documents',
          lastUpdated: new Date(),
        },
      };

      clientDataService.addClient(client);
      addMessage(
        'assistant',
        `✅ Client profile saved!\n\n${client.firstName} ${client.lastName} has been added to your client list.\n\nYou can now upload a PDF form to fill with this data, or start building a new client profile.`
      );
      setBuildingClient(null);
      setUploadedFiles([]);
      return;
    }

    // Check for upload commands
    if (input.includes('upload') || input.includes('import') || input.includes('load') || input.includes('add')) {
      if (input.includes('document') || input.includes('file') || input.includes('word') || input.includes('doc')) {
        await handleFileUpload('document');
        return;
      }
      if (input.includes('client') || input.includes('data') || input.includes('csv') || input.includes('json') || input.includes('excel')) {
        await handleFileUpload('client');
        return;
      }
      if (input.includes('pdf') || input.includes('form') || input.includes('template')) {
        await handleFileUpload('pdf');
        return;
      }
      // Default to document upload
      await handleFileUpload('document');
      return;
    }

    // Check for fill commands
    if (input.includes('fill')) {
      let clients = clientDataService.getAllClients();
      const templates = pdfTemplateService.getAllTemplates();

      // Check if we have a building client to use
      if (buildingClient && buildingClient.firstName && buildingClient.lastName) {
        const tempClient: Client = {
          id: 'temp_client',
          firstName: buildingClient.firstName,
          lastName: buildingClient.lastName,
          dateOfBirth: buildingClient.dateOfBirth,
          email: buildingClient.email,
          phone: buildingClient.phone,
          address: buildingClient.address,
          customFields: buildingClient.customFields || {},
          metadata: {
            source: 'documents',
            lastUpdated: new Date(),
          },
        };
        clients = [tempClient, ...clients];
      }

      if (clients.length === 0) {
        addMessage('assistant', "I don't have any client data yet. Please upload documents or a client data file first!");
        return;
      }

      if (templates.length === 0) {
        addMessage('assistant', "I don't have any PDF templates yet. Please upload a PDF form first!");
        return;
      }

      // Try to find client by name
      let selectedClient = clients[0];
      for (const client of clients) {
        if (input.includes(client.firstName.toLowerCase()) || input.includes(client.lastName.toLowerCase())) {
          selectedClient = client;
          break;
        }
      }

      const selectedTemplate = templates[0];

      addMessage('assistant', `Filling "${selectedTemplate.name}" for ${selectedClient.firstName} ${selectedClient.lastName}... 🚀`);
      setLoading(true);

      try {
        const result = await formFillService.fillForm(selectedTemplate, selectedClient, true);
        const filePath = await formFillService.exportPDF(result.pdfBytes, selectedClient, selectedTemplate);

        addMessage(
          'assistant',
          `✅ Success! I've filled the form and saved it to:\n\n📁 ${filePath}\n\nThe form has been automatically filled with ${selectedClient.firstName}'s information. Would you like to fill another form?`
        );
      } catch (error: any) {
        addMessage('assistant', `❌ Error filling form: ${error.message}`);
      } finally {
        setLoading(false);
      }
      return;
    }

    // Check for list commands
    if (input.includes('list') || input.includes('show')) {
      if (input.includes('client')) {
        const clients = clientDataService.getAllClients();
        if (clients.length === 0) {
          addMessage('assistant', "No clients loaded yet. Upload a client data file to get started!");
        } else {
          addMessage(
            'assistant',
            `Here are the ${clients.length} client${clients.length !== 1 ? 's' : ''} I have:\n\n${clients
              .map((c, i) => `${i + 1}. ${c.firstName} ${c.lastName}${c.email ? ` (${c.email})` : ''}`)
              .join('\n')}`
          );
        }
        return;
      }
      if (input.includes('template') || input.includes('pdf') || input.includes('form')) {
        const templates = pdfTemplateService.getAllTemplates();
        if (templates.length === 0) {
          addMessage('assistant', "No PDF templates loaded yet. Upload a PDF form to get started!");
        } else {
          addMessage(
            'assistant',
            `Here are the ${templates.length} template${templates.length !== 1 ? 's' : ''} I have:\n\n${templates
              .map((t, i) => `${i + 1}. ${t.name} (${t.fields.length} fields, ${t.metadata.pageCount} pages)`)
              .join('\n')}`
          );
        }
        return;
      }
    }

    // Use AI for general questions
    if (geminiService.isConfigured()) {
      try {
        setLoading(true);
        const model = await geminiService['model'];
        if (model) {
          const result = await model.generateContent(
            `You are a helpful PDF form filling assistant. The user asked: "${userInput}"\n\nProvide a helpful, concise response about PDF form filling, client data management, or how to use this application. Keep it friendly and conversational.`
          );
          const response = await result.response;
          addMessage('assistant', response.text());
        }
      } catch (error) {
        addMessage(
          'assistant',
          "I can help you with:\n• Uploading client data\n• Uploading PDF forms\n• Filling forms automatically\n• Listing your clients and templates\n\nJust ask me what you'd like to do!"
        );
      } finally {
        setLoading(false);
      }
    } else {
      addMessage(
        'assistant',
        "I can help you with:\n• Uploading client data (say 'upload client data')\n• Uploading PDF forms (say 'upload pdf')\n• Filling forms (say 'fill form')\n• Listing clients or templates (say 'list clients')\n\nWhat would you like to do?"
      );
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    addMessage('user', userMessage);
    setLoading(true);

    await processCommand(userMessage);
    setLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e]">
      {/* Header */}
      <div className="bg-[#1e1e1e] border-b border-[#2d2d2d]">
        <div className="max-w-5xl mx-auto px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-xl">📄</span>
              </div>
              <h1 className="text-2xl font-normal text-[#e3e3e3]">
                PDF Auto Filler
              </h1>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleFileUpload('document')}
                className="px-6 py-2.5 bg-[#2d2d2d] hover:bg-[#3d3d3d] text-[#e3e3e3] rounded-full font-normal text-sm transition-all flex items-center gap-2"
              >
                <span className="text-lg">📄</span> Upload Documents
              </button>
              <button
                onClick={() => handleFileUpload('pdf')}
                className="px-6 py-2.5 bg-[#2d2d2d] hover:bg-[#3d3d3d] text-[#e3e3e3] rounded-full font-normal text-sm transition-all flex items-center gap-2"
              >
                <span className="text-lg">📋</span> Upload Form
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-6 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${
                message.role === 'user' 
                  ? 'bg-[#8ab4f8]' 
                  : 'bg-gradient-to-br from-blue-500 to-purple-600'
              }`}>
                <span className="text-lg">
                  {message.role === 'user' ? '👤' : '🤖'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[#e3e3e3] text-lg leading-relaxed whitespace-pre-wrap font-normal">
                  {message.content}
                </p>
                <p className="text-[#9aa0a6] text-xs mt-3">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-6">
              <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-lg">🤖</span>
              </div>
              <div className="flex-1">
                <div className="flex gap-2 items-center">
                  <div className="w-2 h-2 bg-[#8ab4f8] rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-[#8ab4f8] rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-[#8ab4f8] rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-[#1e1e1e] border-t border-[#2d2d2d]">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="bg-[#2d2d2d] rounded-3xl p-2 flex items-end gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Message PDF Auto Filler..."
              className="flex-1 px-5 py-4 bg-transparent text-[#e3e3e3] text-base placeholder-[#9aa0a6] focus:outline-none resize-none"
              disabled={loading}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="flex-shrink-0 w-10 h-10 bg-[#8ab4f8] hover:bg-[#aecbfa] disabled:bg-[#3d3d3d] disabled:cursor-not-allowed rounded-full flex items-center justify-center transition-all"
            >
              <svg className="w-5 h-5 text-[#1e1e1e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            </button>
          </div>
          <p className="text-[#9aa0a6] text-xs mt-4 text-center">
            Try: "upload document" • "upload pdf form" • "save client" • "fill form"
          </p>
        </div>
      </div>
    </div>
  );
}
