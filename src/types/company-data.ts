import z from 'zod';

export const companyDataSchema = z.object({
  'Company Name': z.string().min(1),
  'Registration Number': z.string().optional().or(z.literal('')),
  'Primary Contact Name': z.string().optional().or(z.literal('')),
  'Primary Contact Email': z.string().email(),
  'Secondary Contact Name': z.string().optional().or(z.literal('')),
  'Secondary Contact Email': z.string().email().optional().or(z.literal('')),
  'Additional Notes': z.string().optional().or(z.literal('')),
});

export type CompanyData = z.infer<typeof companyDataSchema>;
