// Global type definitions for the application

export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  email?: string;
  phone?: string;
  address?: Address;
  customFields: Record<string, any>;
  metadata: {
    source: string;
    lastUpdated: Date;
  };
}

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

export interface PDFTemplate {
  id: string;
  name: string;
  category: string;
  filePath: string;
  fields: FormField[];
  thumbnail?: string;
  metadata: {
    pageCount: number;
    fileSize: number;
    addedDate: Date;
  };
}

export type FieldType = 'text' | 'checkbox' | 'radio' | 'dropdown' | 'signature' | 'date';

export interface FormField {
  id: string;
  name: string;
  type: FieldType;
  position: { 
    page: number; 
    x: number; 
    y: number; 
    width: number; 
    height: number;
  };
  required: boolean;
  maxLength?: number;
  options?: string[];
  suggestedMapping?: string;
}

export interface FieldMapping {
  fieldId: string;
  fieldName: string;
  clientDataPath: string;
  value: any;
  confidence: number;
  manuallyMapped: boolean;
  transformer?: (value: any) => string;
}

export interface MappingRule {
  pattern: RegExp;
  clientField: string;
  transformer?: (value: any) => string;
}

export interface MappingSuggestion {
  suggestedField: string;
  confidence: number;
  reasoning: string;
  alternatives: Array<{ field: string; confidence: number }>;
}

export interface FieldInterpretation {
  purpose: string;
  expectedDataType: string;
  suggestedFormat: string;
  confidence: number;
}

export interface ExportOptions {
  outputDirectory: string;
  fileNamePattern: string;
  flattenForm: boolean;
  openAfterExport: boolean;
  organizationStrategy: 'none' | 'by-client' | 'by-date' | 'by-template';
}

export interface ExportResult {
  success: boolean;
  filePath?: string;
  error?: string;
  timestamp: Date;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface AppError extends Error {
  code: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  userMessage: string;
  recoverable: boolean;
}
