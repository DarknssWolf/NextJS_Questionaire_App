import z from 'zod';

export const companyFormSchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  primaryContactName: z.string().min(1, 'Primary contact name is required'),
  primaryContactEmail: z.string().email('Invalid email address'),
  secondaryContactName: z.string().optional().or(z.literal('')),
  secondaryContactEmail: z
    .string()
    .email('Invalid email address')
    .optional()
    .or(z.literal('')),
});

export type CompanyFormData = z.infer<typeof companyFormSchema>;
