import mammoth from 'mammoth';
import { Client } from '@shared/schemas';
import { geminiService } from './GeminiService';

export class DocumentParserService {
  async extractTextFromFile(filePath: string): Promise<string> {
    const extension = filePath.split('.').pop()?.toLowerCase();

    try {
      switch (extension) {
        case 'txt':
          return await window.electronAPI.readFile(filePath);
        
        case 'docx':
        case 'doc':
          return await this.extractFromWord(filePath);
        
        case 'pdf':
          return await this.extractFromPDF(filePath);
        
        default:
          throw new Error(`Unsupported file type: ${extension}`);
      }
    } catch (error: any) {
      throw new Error(`Failed to extract text: ${error.message}`);
    }
  }

  private async extractFromWord(filePath: string): Promise<string> {
    const buffer = await window.electronAPI.readFile(filePath);
    const arrayBuffer = new Uint8Array(buffer).buffer;
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  }

  private async extractFromPDF(filePath: string): Promise<string> {
    try {
      // Read PDF as text - basic extraction
      const content = await window.electronAPI.readFile(filePath);
      // For now, just return a message that we have the PDF
      // The AI will work with whatever text we can extract
      return `PDF Document: ${filePath.split(/[\\/]/).pop()}\n\nThis is a PDF document. Please extract any client/patient information you can identify from the filename and context.`;
    } catch (error) {
      return `PDF Document: ${filePath.split(/[\\/]/).pop()}`;
    }
  }

  async extractClientDataFromText(text: string, existingClient?: Partial<Client>): Promise<Partial<Client>> {
    if (!geminiService.isConfigured()) {
      throw new Error('AI service not configured. Please set up Gemini API key.');
    }

    const prompt = `Extract client/patient information from the following document text. 
${existingClient ? `\n\nExisting client data to merge with:\n${JSON.stringify(existingClient, null, 2)}\n\n` : ''}

Document text:
${text}

Extract and return ONLY a JSON object with these fields (only include fields you find):
{
  "firstName": "string",
  "lastName": "string", 
  "dateOfBirth": "YYYY-MM-DD format",
  "email": "string",
  "phone": "string",
  "address": {
    "street": "string",
    "city": "string",
    "state": "string",
    "zipCode": "string"
  },
  "customFields": {
    // any other relevant information as key-value pairs
  }
}

${existingClient ? 'Merge this new information with the existing data, keeping the most complete/recent information.' : ''}

Return ONLY the JSON object, no other text.`;

    try {
      const model = geminiService['model'];
      if (!model) {
        throw new Error('AI model not initialized');
      }

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const responseText = response.text();

      // Extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Could not extract client data from document');
      }

      const extractedData = JSON.parse(jsonMatch[0]);
      
      // Merge with existing data if provided
      if (existingClient) {
        return this.mergeClientData(existingClient, extractedData);
      }

      return extractedData;
    } catch (error: any) {
      throw new Error(`AI extraction failed: ${error.message}`);
    }
  }

  private mergeClientData(existing: Partial<Client>, newData: Partial<Client>): Partial<Client> {
    const merged = { ...existing };

    // Merge top-level fields
    for (const [key, value] of Object.entries(newData)) {
      if (value !== null && value !== undefined && value !== '') {
        if (key === 'address' && typeof value === 'object') {
          merged.address = { ...existing.address, ...value };
        } else if (key === 'customFields' && typeof value === 'object') {
          merged.customFields = { ...existing.customFields, ...value };
        } else {
          (merged as any)[key] = value;
        }
      }
    }

    return merged;
  }

  async extractClientFromMultipleFiles(filePaths: string[]): Promise<Partial<Client>> {
    let clientData: Partial<Client> = {
      customFields: {},
    };

    for (const filePath of filePaths) {
      try {
        const text = await this.extractTextFromFile(filePath);
        const extractedData = await this.extractClientDataFromText(text, clientData);
        clientData = extractedData;
      } catch (error: any) {
        console.error(`Failed to process ${filePath}:`, error);
        // Continue with other files
      }
    }

    return clientData;
  }
}

export const documentParserService = new DocumentParserService();
