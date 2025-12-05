import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFTemplate, FormField, PDFTemplateSchema } from '@shared/schemas';
import { validateData } from '@shared/utils/validators';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export class PDFTemplateService {
  private templates: Map<string, PDFTemplate> = new Map();

  async loadTemplate(filePath: string): Promise<PDFTemplate> {
    try {
      const pdfBytes = await window.electronAPI.readFile(filePath);
      const pdfDoc = await PDFDocument.load(pdfBytes, { 
        ignoreEncryption: true,
        updateMetadata: false 
      });
      
      const form = pdfDoc.getForm();
      const fields = form.getFields();
      
      const formFields: FormField[] = fields.map((field, index) => {
        const fieldName = field.getName();
        const fieldType = this.detectFieldType(field);
        
        return {
          id: `field_${index}`,
          name: fieldName,
          type: fieldType,
          position: {
            page: 0, // Will be determined later
            x: 0,
            y: 0,
            width: 0,
            height: 0,
          },
          required: false,
          suggestedMapping: this.suggestMapping(fieldName),
        };
      });

      const fileName = filePath.split(/[\\/]/).pop() || 'unknown.pdf';
      const template: PDFTemplate = {
        id: this.generateId(),
        name: fileName.replace('.pdf', ''),
        category: 'Uncategorized',
        filePath,
        fields: formFields,
        metadata: {
          pageCount: pdfDoc.getPageCount(),
          fileSize: pdfBytes.length,
          addedDate: new Date(),
        },
      };

      const validation = validateData(PDFTemplateSchema, template);
      if (!validation.success) {
        throw new Error(`Template validation failed: ${validation.result.errors.join(', ')}`);
      }

      this.templates.set(template.id, template);
      return template;
    } catch (error: any) {
      throw new Error(`Failed to load PDF template: ${error.message}`);
    }
  }

  private detectFieldType(field: any): FormField['type'] {
    const fieldType = field.constructor.name;
    
    if (fieldType.includes('Text')) return 'text';
    if (fieldType.includes('CheckBox')) return 'checkbox';
    if (fieldType.includes('Radio')) return 'radio';
    if (fieldType.includes('Dropdown')) return 'dropdown';
    if (fieldType.includes('Signature')) return 'signature';
    
    return 'text';
  }

  private suggestMapping(fieldName: string): string | undefined {
    const name = fieldName.toLowerCase();
    
    const mappings: Record<string, string> = {
      'first': 'firstName',
      'firstname': 'firstName',
      'first_name': 'firstName',
      'fname': 'firstName',
      'last': 'lastName',
      'lastname': 'lastName',
      'last_name': 'lastName',
      'lname': 'lastName',
      'email': 'email',
      'mail': 'email',
      'phone': 'phone',
      'telephone': 'phone',
      'tel': 'phone',
      'mobile': 'phone',
      'address': 'address.street',
      'street': 'address.street',
      'city': 'address.city',
      'state': 'address.state',
      'zip': 'address.zipCode',
      'zipcode': 'address.zipCode',
      'postal': 'address.zipCode',
      'dob': 'dateOfBirth',
      'birthdate': 'dateOfBirth',
      'birth_date': 'dateOfBirth',
      'date_of_birth': 'dateOfBirth',
    };

    for (const [key, value] of Object.entries(mappings)) {
      if (name.includes(key)) {
        return value;
      }
    }

    return undefined;
  }

  private generateId(): string {
    return `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async generateThumbnail(template: PDFTemplate): Promise<string> {
    try {
      const pdfBytes = await window.electronAPI.readFile(template.filePath);
      const loadingTask = pdfjsLib.getDocument({ data: pdfBytes });
      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(1);
      
      const viewport = page.getViewport({ scale: 0.5 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (!context) {
        throw new Error('Failed to get canvas context');
      }

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise;

      return canvas.toDataURL('image/png');
    } catch (error: any) {
      console.error('Failed to generate thumbnail:', error);
      return '';
    }
  }

  getTemplate(id: string): PDFTemplate | null {
    return this.templates.get(id) || null;
  }

  getAllTemplates(): PDFTemplate[] {
    return Array.from(this.templates.values());
  }

  categorizeTemplate(template: PDFTemplate): string {
    const name = template.name.toLowerCase();
    
    if (name.includes('consent')) return 'Consent Forms';
    if (name.includes('authorization')) return 'Authorization Forms';
    if (name.includes('plan')) return 'Plans';
    if (name.includes('agreement')) return 'Agreements';
    if (name.includes('application')) return 'Applications';
    
    return 'Other';
  }

  deleteTemplate(templateId: string): boolean {
    return this.templates.delete(templateId);
  }

  clearTemplates(): void {
    this.templates.clear();
  }
}

export const pdfTemplateService = new PDFTemplateService();
