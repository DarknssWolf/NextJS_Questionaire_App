import z from 'zod';

export const supplierSchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  registrationNumber: z.string().min(1, 'Registration number is required'),
  countryId: z.number().min(1, 'Please select a country'),
  industryId: z.number().min(1, 'Please select an industry'),
  address: z.string().min(1, 'Address is required'),
  website: z
    .string()
    .refine(
      (val) => !val || /^https?:\/\/.+/.test(val),
      'Please enter a valid website URL (include http:// or https://)'
    )
    .optional(),
  companySizeId: z.number().min(1, 'Please select a company size'),
  primaryContactName: z.string().min(1, 'Contact name is required'),
  primaryContactPosition: z.string().min(1, 'Position is required'),
  primaryContactEmail: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  primaryContactPhone: z.string().min(1, 'Phone number is required'),
  mainProductType: z.string().min(1, 'Main product type is required'),
  fteHeadcount: z.number(),
  annualSpend: z.number(),
  peakSeason: z.string().min(1, 'Peak season is required'),
  lowSeason: z.string().min(1, 'Low season is required'),
  spendCategoryId: z.number().min(1, 'Please select a spend category'),
  affidavitWaiverName: z.string().min(1, 'Affidavit waiver name is required'),
  affidavitWaiverSurname: z
    .string()
    .min(1, 'Affidavit waiver surname is required'),
  affidavitWaiverSignature: z
    .string()
    .min(1, 'Affidavit waiver signature is required'),
  affidavitWaiverConfirmation: z.boolean().refine((val) => val, {
    message: 'Affidavit waiver must be checked',
  }),
});

export type QuestionnaireSupplierFormData = z.infer<typeof supplierSchema>;
