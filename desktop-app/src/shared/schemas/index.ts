import { z } from 'zod';

// Address Schema
export const AddressSchema = z.object({
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
});

// Client Schema
export const ClientSchema = z.object({
  id: z.string(),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  dateOfBirth: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: AddressSchema.optional(),
  customFields: z.record(z.any()),
  metadata: z.object({
    source: z.string(),
    lastUpdated: z.date(),
  }),
});

// Form Field Schema
export const FormFieldSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['text', 'checkbox', 'radio', 'dropdown', 'signature', 'date']),
  position: z.object({
    page: z.number(),
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
  }),
  required: z.boolean(),
  maxLength: z.number().optional(),
  options: z.array(z.string()).optional(),
  suggestedMapping: z.string().optional(),
});

// PDF Template Schema
export const PDFTemplateSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Template name is required'),
  category: z.string(),
  filePath: z.string(),
  fields: z.array(FormFieldSchema),
  thumbnail: z.string().optional(),
  metadata: z.object({
    pageCount: z.number(),
    fileSize: z.number(),
    addedDate: z.date(),
  }),
});

// Field Mapping Schema
export const FieldMappingSchema = z.object({
  fieldId: z.string(),
  fieldName: z.string(),
  clientDataPath: z.string(),
  value: z.any(),
  confidence: z.number().min(0).max(1),
  manuallyMapped: z.boolean(),
  transformer: z.function().args(z.any()).returns(z.string()).optional(),
});

// Mapping Suggestion Schema
export const MappingSuggestionSchema = z.object({
  suggestedField: z.string(),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
  alternatives: z.array(
    z.object({
      field: z.string(),
      confidence: z.number().min(0).max(1),
    })
  ),
});

// Field Interpretation Schema
export const FieldInterpretationSchema = z.object({
  purpose: z.string(),
  expectedDataType: z.string(),
  suggestedFormat: z.string(),
  confidence: z.number().min(0).max(1),
});

// Export Options Schema
export const ExportOptionsSchema = z.object({
  outputDirectory: z.string(),
  fileNamePattern: z.string(),
  flattenForm: z.boolean(),
  openAfterExport: z.boolean(),
  organizationStrategy: z.enum(['none', 'by-client', 'by-date', 'by-template']),
});

// Export Result Schema
export const ExportResultSchema = z.object({
  success: z.boolean(),
  filePath: z.string().optional(),
  error: z.string().optional(),
  timestamp: z.date(),
});

// Validation Result Schema
export const ValidationResultSchema = z.object({
  valid: z.boolean(),
  errors: z.array(z.string()),
  warnings: z.array(z.string()),
});

// Type inference from schemas
export type Address = z.infer<typeof AddressSchema>;
export type Client = z.infer<typeof ClientSchema>;
export type FormField = z.infer<typeof FormFieldSchema>;
export type PDFTemplate = z.infer<typeof PDFTemplateSchema>;
export type FieldMapping = z.infer<typeof FieldMappingSchema>;
export type MappingSuggestion = z.infer<typeof MappingSuggestionSchema>;
export type FieldInterpretation = z.infer<typeof FieldInterpretationSchema>;
export type ExportOptions = z.infer<typeof ExportOptionsSchema>;
export type ExportResult = z.infer<typeof ExportResultSchema>;
export type ValidationResult = z.infer<typeof ValidationResultSchema>;
