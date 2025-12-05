import { useState, useRef, useEffect } from 'react';
import { geminiService } from '../services/GeminiService';
import { clientDataService } from '../services/ClientDataService';
import { pdfTemplateService } from '../services/PDFTemplateService';
import { formFillService } from '../services/FormFillService';

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
      content: "Hi! I'm your PDF Auto-Filler assistant. I can help you fill out PDF forms automatically. What would you like to do?\n\n• Upload client data (JSON, CSV, or Excel)\n• Upload a PDF form to fill\n• Fill a form with client data\n• Ask me anything about the process!",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
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

  const handleFileUpload = async (type: 'client' | 'pdf') => {
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

    // Check for upload commands
    if (input.includes('upload') || input.includes('import') || input.includes('load')) {
      if (input.includes('client') || input.includes('data') || input.includes('csv') || input.includes('json') || input.includes('excel')) {
        await handleFileUpload('client');
        return;
      }
      if (input.includes('pdf') || input.includes('form') || input.includes('template')) {
        await handleFileUpload('pdf');
        return;
      }
    }

    // Check for fill commands
    if (input.includes('fill')) {
      const clients = clientDataService.getAllClients();
      const templates = pdfTemplateService.getAllTemplates();

      if (clients.length === 0) {
        addMessage('assistant', "I don't have any client data yet. Please upload a client data file first!");
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
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-slate-950/50 backdrop-blur-xl border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-10 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-6xl font-light text-white tracking-tight">
                PDF Auto Filler
              </h1>
              <p className="text-2xl text-slate-400 mt-3 font-light">Intelligent form automation</p>
            </div>
            <div className="flex gap-5">
              <button
                onClick={() => handleFileUpload('client')}
                className="px-10 py-5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-2xl font-medium text-xl transition-all backdrop-blur-sm flex items-center gap-4"
              >
                <span className="text-3xl">📊</span> Upload Client Data
              </button>
              <button
                onClick={() => handleFileUpload('pdf')}
                className="px-10 py-5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-2xl font-medium text-xl transition-all backdrop-blur-sm flex items-center gap-4"
              >
                <span className="text-3xl">📄</span> Upload PDF Form
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-10 py-10 space-y-8">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-3xl px-10 py-8 transition-all ${
                  message.role === 'user'
                    ? 'bg-blue-600/20 backdrop-blur-xl border border-blue-500/30 text-blue-100'
                    : 'bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 text-slate-200'
                }`}
              >
                <div className="flex items-start gap-5">
                  <span className="text-4xl opacity-80">
                    {message.role === 'user' ? '👤' : '🤖'}
                  </span>
                  <div className="flex-1">
                    <p className="whitespace-pre-wrap leading-relaxed text-2xl font-light">{message.content}</p>
                    <p
                      className={`text-base mt-4 font-light ${
                        message.role === 'user' ? 'text-blue-300/60' : 'text-slate-500'
                      }`}
                    >
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl px-10 py-8">
                <div className="flex items-center gap-5">
                  <span className="text-4xl opacity-80">🤖</span>
                  <div className="flex gap-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-slate-950/50 backdrop-blur-xl border-t border-slate-700/50">
        <div className="max-w-6xl mx-auto px-10 py-8">
          <div className="flex gap-5">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 px-8 py-6 bg-slate-800/50 border border-slate-700/50 rounded-2xl focus:border-blue-500/50 focus:outline-none text-2xl font-light text-white placeholder-slate-500 backdrop-blur-sm transition-all"
              disabled={loading}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="px-12 py-6 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-medium text-2xl disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Send
            </button>
          </div>
          <p className="text-lg text-slate-500 mt-5 text-center font-light">
            Try: "upload client data" • "upload pdf" • "fill form" • "list clients"
          </p>
        </div>
      </div>
    </div>
  );
}
