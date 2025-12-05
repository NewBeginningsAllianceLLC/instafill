import { PDFDocument, PDFForm, PDFTextField, PDFCheckBox, PDFDropdown } from 'pdf-lib';
import { Client, PDFTemplate, FieldMapping, FormField } from '@shared/schemas';
import { formatDate, formatPhone } from '@shared/utils/validators';
import { geminiService } from './GeminiService';

export class FormFillService {
  async fillForm(
    template: PDFTemplate,
    client: Client,
    useAI: boolean = true
  ): Promise<{ pdfBytes: Uint8Array; mappings: FieldMapping[] }> {
    try {
      // Load the PDF
      const pdfBytes = await window.electronAPI.readFile(template.filePath);
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const form = pdfDoc.getForm();

      // Create field mappings
      const mappings = await this.createFieldMappings(template.fields, client, useAI);

      // Fill the form
      for (const mapping of mappings) {
        if (mapping.value !== null && mapping.value !== undefined) {
          await this.fillField(form, mapping);
        }
      }

      // Flatten the form (make it non-editable)
      // form.flatten();

      const filledPdfBytes = await pdfDoc.save();
      return {
        pdfBytes: filledPdfBytes,
        mappings,
      };
    } catch (error: any) {
      throw new Error(`Failed to fill form: ${error.message}`);
    }
  }

  private async createFieldMappings(
    fields: FormField[],
    client: Client,
    useAI: boolean
  ): Promise<FieldMapping[]> {
    const mappings: FieldMapping[] = [];
    const clientFields = this.getClientFieldPaths(client);

    for (const field of fields) {
      let clientDataPath = field.suggestedMapping || '';
      let confidence = field.suggestedMapping ? 0.7 : 0.3;
      let manuallyMapped = false;

      // Use AI to improve mapping if enabled
      if (useAI && geminiService.isConfigured() && !field.suggestedMapping) {
        try {
          const suggestion = await geminiService.suggestFieldMapping(
            field.name,
            '',
            clientFields
          );
          clientDataPath = suggestion.suggestedField;
          confidence = suggestion.confidence;
        } catch (error) {
          console.warn('AI mapping failed, using fallback:', error);
        }
      }

      // Get the value from client data
      const value = this.getValueFromPath(client, clientDataPath);

      // Apply transformers based on field type
      const transformedValue = this.transformValue(value, field.type);

      mappings.push({
        fieldId: field.id,
        fieldName: field.name,
        clientDataPath,
        value: transformedValue,
        confidence,
        manuallyMapped,
      });
    }

    return mappings;
  }

  private getClientFieldPaths(client: Client): string[] {
    const paths: string[] = [];

    const addPaths = (obj: any, prefix: string = '') => {
      for (const key in obj) {
        const path = prefix ? `${prefix}.${key}` : key;
        const value = obj[key];

        if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
          addPaths(value, path);
        } else {
          paths.push(path);
        }
      }
    };

    addPaths(client);
    return paths;
  }

  private getValueFromPath(obj: any, path: string): any {
    if (!path) return null;

    const parts = path.split('.');
    let current = obj;

    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return null;
      }
    }

    return current;
  }

  private transformValue(value: any, fieldType: FormField['type']): string {
    if (value === null || value === undefined) return '';

    switch (fieldType) {
      case 'date':
        return formatDate(value);
      case 'text':
        if (typeof value === 'string' && value.match(/^\d{10,11}$/)) {
          return formatPhone(value);
        }
        return String(value);
      case 'checkbox':
        return value ? 'Yes' : 'No';
      default:
        return String(value);
    }
  }

  private async fillField(form: PDFForm, mapping: FieldMapping): Promise<void> {
    try {
      const field = form.getField(mapping.fieldName);

      if (field instanceof PDFTextField) {
        field.setText(String(mapping.value));
      } else if (field instanceof PDFCheckBox) {
        const isChecked = mapping.value === true || 
                         mapping.value === 'true' || 
                         mapping.value === 'Yes' ||
                         mapping.value === '1';
        if (isChecked) {
          field.check();
        } else {
          field.uncheck();
        }
      } else if (field instanceof PDFDropdown) {
        field.select(String(mapping.value));
      }
    } catch (error: any) {
      console.warn(`Failed to fill field ${mapping.fieldName}:`, error.message);
    }
  }

  async exportPDF(
    pdfBytes: Uint8Array,
    client: Client,
    template: PDFTemplate,
    outputDirectory?: string
  ): Promise<string> {
    try {
      const fileName = `${client.lastName}_${client.firstName}_${template.name}_${Date.now()}.pdf`;
      
      let directory = outputDirectory;
      if (!directory) {
        directory = await window.electronAPI.selectDirectory();
        if (!directory) {
          throw new Error('No output directory selected');
        }
      }

      const filePath = `${directory}/${fileName}`;
      await window.electronAPI.writeFile(filePath, pdfBytes);

      return filePath;
    } catch (error: any) {
      throw new Error(`Failed to export PDF: ${error.message}`);
    }
  }
}

export const formFillService = new FormFillService();
