import { GoogleGenerativeAI } from '@google/generative-ai';
import { MappingSuggestion, FieldInterpretation, FormField } from '@shared/schemas';

export class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;
  private apiKey: string | null = null;

  async initialize(apiKey?: string): Promise<void> {
    try {
      // Try to get API key from parameter, secure storage, or env
      const key = apiKey || 
                  await window.electronAPI.getSecureValue('gemini-api-key') ||
                  import.meta.env.VITE_GEMINI_API_KEY;

      if (!key) {
        throw new Error('No API key provided');
      }

      this.apiKey = key;
      this.genAI = new GoogleGenerativeAI(key);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
    } catch (error: any) {
      console.error('Failed to initialize Gemini:', error);
      throw new Error(`Gemini initialization failed: ${error.message}`);
    }
  }

  async suggestFieldMapping(
    fieldName: string,
    fieldContext: string,
    availableClientFields: string[]
  ): Promise<MappingSuggestion> {
    if (!this.model) {
      throw new Error('Gemini service not initialized');
    }

    const prompt = `You are helping map PDF form fields to client data fields.

PDF Field Name: "${fieldName}"
Context: ${fieldContext}

Available client data fields:
${availableClientFields.join(', ')}

Based on the PDF field name and context, suggest which client data field it should map to.
Provide your response in JSON format with:
- suggestedField: the best matching field name
- confidence: a number between 0 and 1
- reasoning: brief explanation
- alternatives: array of up to 3 alternative matches with their confidence scores

Example response:
{
  "suggestedField": "firstName",
  "confidence": 0.95,
  "reasoning": "Field name clearly indicates first name",
  "alternatives": [
    {"field": "lastName", "confidence": 0.3}
  ]
}`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON in response');
      }

      const suggestion = JSON.parse(jsonMatch[0]);
      return suggestion as MappingSuggestion;
    } catch (error: any) {
      console.error('Gemini API error:', error);
      // Return fallback suggestion
      return {
        suggestedField: availableClientFields[0] || '',
        confidence: 0.1,
        reasoning: 'AI service unavailable, showing first available field',
        alternatives: [],
      };
    }
  }

  async interpretFieldPurpose(
    fieldName: string,
    surroundingText: string
  ): Promise<FieldInterpretation> {
    if (!this.model) {
      throw new Error('Gemini service not initialized');
    }

    const prompt = `Analyze this PDF form field and determine its purpose.

Field Name: "${fieldName}"
Surrounding Text: "${surroundingText}"

Provide your response in JSON format with:
- purpose: what this field is for (e.g., "Collect user's first name")
- expectedDataType: the type of data (e.g., "string", "date", "number", "email", "phone")
- suggestedFormat: how the data should be formatted (e.g., "MM/DD/YYYY", "(XXX) XXX-XXXX")
- confidence: a number between 0 and 1

Example response:
{
  "purpose": "Collect user's date of birth",
  "expectedDataType": "date",
  "suggestedFormat": "MM/DD/YYYY",
  "confidence": 0.9
}`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON in response');
      }

      const interpretation = JSON.parse(jsonMatch[0]);
      return interpretation as FieldInterpretation;
    } catch (error: any) {
      console.error('Gemini API error:', error);
      return {
        purpose: 'Unknown',
        expectedDataType: 'string',
        suggestedFormat: '',
        confidence: 0.1,
      };
    }
  }

  async validateMapping(
    field: FormField,
    clientField: string,
    sampleValue: any
  ): Promise<number> {
    if (!this.model) {
      return 0.5; // Default confidence if AI not available
    }

    const prompt = `Validate if this field mapping makes sense.

PDF Field: "${field.name}" (type: ${field.type})
Mapped to Client Field: "${clientField}"
Sample Value: "${sampleValue}"

Does this mapping make sense? Respond with a confidence score between 0 and 1.
Only respond with the number, nothing else.`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();
      
      const score = parseFloat(text);
      return isNaN(score) ? 0.5 : Math.max(0, Math.min(1, score));
    } catch (error: any) {
      console.error('Gemini API error:', error);
      return 0.5;
    }
  }

  isConfigured(): boolean {
    return this.model !== null;
  }

  async setApiKey(key: string): Promise<void> {
    await window.electronAPI.setSecureValue('gemini-api-key', key);
    await this.initialize(key);
  }

  async getApiKey(): Promise<string | null> {
    return this.apiKey;
  }
}

export const geminiService = new GeminiService();
