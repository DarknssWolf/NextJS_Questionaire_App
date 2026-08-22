'use client';

import type React from 'react';
import { Plus, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  createSupplier,
  checkSupplierEmailExists,
} from '@/server/services/supplier.service';
import {
  getCompanySizes,
  getCountries,
  getIndustries,
  getSpendCategories,
} from '@/server/services/lookup.service';
import { toast } from 'sonner';
import {
  useForm,
  type FieldErrors,
  type UseFormRegister,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSupplierContext } from '@/providers/suppliers/SupplierContextProvider';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type {
  CompanySize,
  Country,
  Industry,
  SpendCategory,
} from '@/models/Supplier';

const supplierSchema = z.object({
  companyId: z.number(),
  name: z.string().min(1, 'Company name is required'),
  registrationNumber: z.string().min(1, 'Registration number is required'),
  countryId: z.number().min(1, 'Please select a country'),
  industryId: z.number().min(1, 'Please select an industry'),
  address: z.string().min(1, 'Address is required'),
  website: z
    .string()
    .refine(
      (val) => !val || /^https?:\/\/.+/.test(val),
      'Please enter a valid website URL (https://example.com)'
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
  additionalNotes: z.string().optional(),
  spendCategoryId: z.number().min(1, 'Please select a spend category'),
});

type SupplierFormData = z.infer<typeof supplierSchema>;

type FormFieldProps = {
  name: keyof SupplierFormData;
  label: string;
  type?: string;
  required?: boolean;
  children?: React.ReactNode;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  showWarning?: boolean;
  warningMessage?: string;
  register: UseFormRegister<SupplierFormData>;
  errors: FieldErrors<SupplierFormData>;
  isCheckingEmail: boolean;
};

const FormField = ({
  name,
  label,
  type = 'text',
  required = false,
  children,
  onChange,
  showWarning = false,
  warningMessage,
  register,
  errors,
  isCheckingEmail,
}: FormFieldProps) => (
  <div className="space-y-2">
    <label htmlFor={name} className="text-muted-foreground text-sm font-medium">
      {label} {required && '*'}
    </label>
    {children ?? (
      <Input
        variant="brand"
        type={type}
        id={name}
        {...register(name, {
          valueAsNumber: type === 'number',
          onChange: onChange,
        })}
        className={cn(
          'max-w-none',
          errors[name] && 'border-destructive',
          !errors[name] && showWarning && 'border-accent-warning'
        )}
      />
    )}
    {errors[name] && (
      <div className="text-destructive flex items-center gap-1 text-sm">
        <span>⚠</span>
        {errors[name]?.message}
      </div>
    )}
    {!errors[name] && showWarning && warningMessage && (
      <div className="border-accent-warning/40 bg-risk-yellow/20 text-accent-warning flex items-start gap-2 rounded-md border p-3 text-sm">
        <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
        <span>{warningMessage}</span>
      </div>
    )}
    {isCheckingEmail && name === 'primaryContactEmail' && (
      <div className="text-muted-foreground flex items-center gap-2 text-sm">
        <div className="border-muted-foreground h-3 w-3 animate-spin rounded-full border-2 border-t-transparent" />
        Checking email...
      </div>
    )}
  </div>
);

export default function SuppliersForm() {
  const { companyId } = useSupplierContext();
  const router = useRouter();
  const [lookupData, setLookupData] = useState<{
    spendCategories: SpendCategory[];
    industries: Industry[];
    countries: Country[];
    companySizes: CompanySize[];
  }>({
    spendCategories: [],
    industries: [],
    countries: [],
    companySizes: [],
  });

  const [emailWarning, setEmailWarning] = useState<{
    show: boolean;
    supplierName?: string;
  }>({ show: false });
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const emailCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    async function fetchLookupData() {
      try {
        const [spendCategories, industries, countries, companySizes] =
          await Promise.all([
            getSpendCategories(),
            getIndustries(),
            getCountries(),
            getCompanySizes(),
          ]);

        setLookupData({ spendCategories, industries, countries, companySizes });
      } catch (error) {
        console.error('Error fetching lookup data:', error);
        toast.error('Failed to load form data');
      }
    }

    void fetchLookupData();
  }, []);

  const { spendCategories, industries, countries, companySizes } = lookupData;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: {
      companyId: companyId,
      name: '',
      registrationNumber: '',
      industryId: 0,
      countryId: 0,
      address: '',
      website: '',
      companySizeId: 0,
      primaryContactName: '',
      primaryContactPosition: '',
      primaryContactEmail: '',
      primaryContactPhone: '',
      additionalNotes: '',
      spendCategoryId: 0,
    },
  });

  const onFormSubmit = async (data: SupplierFormData) => {
    try {
      const result = await createSupplier({
        ...data,
        fteHeadcount: 0,
        annualSpend: 0,
        peakSeason: '',
        status: 'active',
      });
      if (result.success) {
        toast.success('Supplier added successfully!', {
          description: 'Redirecting to supplier list...',
        });
        setTimeout(() => {
          router.push('/suppliers');
        }, 500);
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error('Error adding supplier. Please try again.');
    }
  };

  const handleCancel = () => {
    reset();
  };

  const checkEmail = useCallback(async (email: string) => {
    if (!email?.includes('@')) {
      setEmailWarning({ show: false });
      return;
    }

    setIsCheckingEmail(true);
    try {
      const result = await checkSupplierEmailExists(email);
      if (result.exists && result.supplier) {
        setEmailWarning({
          show: true,
          supplierName: result.supplier.name,
        });
      } else {
        setEmailWarning({ show: false });
      }
    } catch (error) {
      console.error('Error checking email:', error);
      setEmailWarning({ show: false });
    } finally {
      setIsCheckingEmail(false);
    }
  }, []);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;

    if (emailCheckTimeoutRef.current) {
      clearTimeout(emailCheckTimeoutRef.current);
    }

    setEmailWarning({ show: false });

    emailCheckTimeoutRef.current = setTimeout(() => {
      void checkEmail(email);
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (emailCheckTimeoutRef.current) {
        clearTimeout(emailCheckTimeoutRef.current);
      }
    };
  }, []);

  const fieldProps = { register, errors, isCheckingEmail };

  return (
    <Card>
      <div className="p-6">
        <h2 className="text-base-700 mb-6 text-xl font-medium">
          Add Supplier Manually
        </h2>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-8">
          <div className="space-y-4">
            <h3 className="text-base-700 text-lg font-medium">
              Company Information
            </h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                {...fieldProps}
                name="name"
                label="Company Name"
                required
              />
              <FormField
                {...fieldProps}
                name="registrationNumber"
                label="Registration Number"
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                {...fieldProps}
                name="industryId"
                label="Industry"
                required
              >
                <NativeSelect
                  variant="brand"
                  id="industryId"
                  {...register('industryId', {
                    valueAsNumber: true,
                  })}
                  className={cn(
                    'max-w-none',
                    errors.industryId && 'border-destructive'
                  )}
                >
                  <option value={0}>Select Industry</option>
                  {industries.map((ind) => (
                    <option key={ind.id} value={ind.id}>
                      {ind.name}
                    </option>
                  ))}
                </NativeSelect>
              </FormField>

              <FormField
                {...fieldProps}
                name="spendCategoryId"
                label="spend category"
                required
              >
                <NativeSelect
                  variant="brand"
                  id="spendCategoryId"
                  {...register('spendCategoryId', {
                    valueAsNumber: true,
                  })}
                  className={cn(
                    'max-w-none',
                    errors.spendCategoryId && 'border-destructive'
                  )}
                >
                  <option value={0}>Select Spend Category</option>
                  {spendCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.category1}
                    </option>
                  ))}
                </NativeSelect>
              </FormField>
            </div>

            <FormField
              {...fieldProps}
              name="countryId"
              label="Country"
              required
            >
              <NativeSelect
                variant="brand"
                id="countryId"
                {...register('countryId', {
                  valueAsNumber: true,
                })}
                className={cn(
                  'max-w-none',
                  errors.countryId && 'border-destructive'
                )}
              >
                <option value={0}>Select Country</option>
                {countries.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </NativeSelect>
            </FormField>

            <FormField {...fieldProps} name="address" label="Address" required>
              <Textarea
                variant="brand"
                id="address"
                rows={3}
                {...register('address')}
                className={cn(
                  'max-w-none resize-none',
                  errors.address && 'border-destructive'
                )}
              />
            </FormField>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                {...fieldProps}
                name="website"
                label="Website"
                type="url"
              />
              <FormField
                {...fieldProps}
                name="companySizeId"
                label="Company Size"
                required
              >
                <NativeSelect
                  variant="brand"
                  id="companySizeId"
                  {...register('companySizeId', {
                    valueAsNumber: true,
                  })}
                  className={cn(
                    'max-w-none',
                    errors.companySizeId && 'border-destructive'
                  )}
                >
                  <option value={0}>Select Company Size</option>
                  {companySizes.map((size) => (
                    <option key={size.id} value={size.id}>
                      {size.name} employees
                    </option>
                  ))}
                </NativeSelect>
              </FormField>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-base-700 text-lg font-medium">
              Primary Contact
            </h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                {...fieldProps}
                name="primaryContactName"
                label="Contact Name"
                required
              />
              <FormField
                {...fieldProps}
                name="primaryContactPosition"
                label="Position"
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                {...fieldProps}
                name="primaryContactEmail"
                label="Email"
                type="email"
                required
                onChange={handleEmailChange}
                showWarning={emailWarning.show}
                warningMessage={
                  emailWarning.supplierName
                    ? `A supplier with this email already exists (${emailWarning.supplierName}). The supplier will be linked to your company with existing details.`
                    : undefined
                }
              />
              <FormField
                {...fieldProps}
                name="primaryContactPhone"
                label="Phone Number"
                type="tel"
                required
              />
            </div>

            <FormField
              {...fieldProps}
              name="additionalNotes"
              label="Additional Notes"
            >
              <Textarea
                variant="brand"
                id="additionalNotes"
                rows={4}
                {...register('additionalNotes')}
                className="max-w-none resize-none"
              />
            </FormField>
          </div>

          <div className="flex justify-between pt-4">
            <Button
              type="button"
              variant="outline"
              className="bg-card text-muted-foreground hover:bg-muted"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="brand" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Supplier
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </Card>
  );
}
