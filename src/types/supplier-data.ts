import { z } from 'zod';

export const SupplierRowSchema = z.object({
  'Company Name': z.string().min(1, 'Company Name is required'),
  'Registration Number': z.string().min(1, 'Registration Number is required'),
  'Primary Contact Name': z.string().optional().or(z.literal('')),
  'Primary Contact Email': z
    .string()
    .min(1, 'Primary Contact Email is required')
    .email('Primary Contact Email must be a valid email'),
  'Additional Notes': z.string().optional().or(z.literal('')),
});

export type SupplierRow = z.infer<typeof SupplierRowSchema>;

export interface SupplierProcessResult {
  baseFileName: string;
  parsedData: SupplierRow[];
  errors?: Array<{
    row: number;
    field: string;
    message: string;
  }>;
}

export interface SupplierFile {
  id: number;
  fileName: string;
}
