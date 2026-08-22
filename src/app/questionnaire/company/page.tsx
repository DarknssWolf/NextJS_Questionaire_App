'use client';
import QuestionnaireHeader from '@/components/questionnaire/questionnaire-header';
import { SignaturePad } from '@/components/questionnaire/signature-pad';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MonthRangePicker } from '@/components/ui/monthrangepicker';
import { NativeSelect } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  type QuestionnaireSupplierFormData,
  supplierSchema,
} from '@/lib/schemas/questionnaire-supplier-form';
import { cn } from '@/lib/utils';
import { useQuestionnaireContext } from '@/providers/questionnaire/QuestionnaireContextProvider';
import { updateSupplier } from '@/server/services/questionnaire.service';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import {
  Controller,
  useForm,
  type FieldErrors,
  type UseFormRegister,
} from 'react-hook-form';
import { toast } from 'sonner';

type FormFieldProps = {
  name: keyof QuestionnaireSupplierFormData;
  label: string;
  type?: string;
  required?: boolean;
  readOnly?: boolean;
  children?: React.ReactNode;
  register: UseFormRegister<QuestionnaireSupplierFormData>;
  errors: FieldErrors<QuestionnaireSupplierFormData>;
};

const FormField = ({
  name,
  label,
  type = 'text',
  required = false,
  readOnly = false,
  children,
  register,
  errors,
}: FormFieldProps) => (
  <div className="space-y-2">
    <label htmlFor={name} className="text-muted-foreground text-sm font-medium">
      {label} {required && '*'}
    </label>
    {children ??
      (readOnly ? (
        <>
          <div className="relative">
            <input
              readOnly
              type={type}
              id={name}
              {...register(name, {
                valueAsNumber: type === 'number',
              })}
              className={`border-brand-500/30 bg-brand-500/5 text-brand-navy w-full rounded-md border px-3 py-2 font-medium focus:outline-hidden`}
            />
            <div className="absolute top-1/2 right-4 -translate-y-1/2 transform">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                className="stroke-brand-500"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
          </div>
          <p className="text-brand-500 mt-1 text-xs">
            Pre-filled by requesting company
          </p>
        </>
      ) : (
        <Input
          variant="brand"
          type={type}
          id={name}
          {...register(name, {
            valueAsNumber: type === 'number',
          })}
          className={cn('max-w-none', errors[name] && 'border-destructive')}
        />
      ))}
    {errors[name] && (
      <div className="text-destructive flex items-center gap-1 text-sm">
        <span>⚠</span>
        {errors[name]?.message}
      </div>
    )}
  </div>
);

export default function CompanyDetailPage() {
  const router = useRouter();
  const { supplierDetails } = useQuestionnaireContext();

  const lookupData = {
    industries: supplierDetails.supplierDetailLookupData?.industries ?? [],
    countries: supplierDetails.supplierDetailLookupData?.countries ?? [],
    spendCategories:
      supplierDetails.supplierDetailLookupData?.spendCategories ?? [],
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    control,
  } = useForm<QuestionnaireSupplierFormData>({
    resolver: zodResolver(supplierSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: {
      name: supplierDetails.name,
      registrationNumber: supplierDetails.registrationNumber,
      countryId: supplierDetails.countryId ?? 0,
      industryId: supplierDetails.industryId ?? 0,
      address: supplierDetails.address,
      website: supplierDetails.website ?? '',
      companySizeId: supplierDetails.companySizeId ?? 0,
      primaryContactName: supplierDetails.primaryContactName,
      primaryContactPosition: supplierDetails.primaryContactPosition,
      primaryContactEmail: supplierDetails.primaryContactEmail,
      primaryContactPhone: supplierDetails.primaryContactPhone,
      mainProductType: supplierDetails.mainProductType ?? '',
      fteHeadcount: supplierDetails.fteHeadcount ?? 0,
      annualSpend: supplierDetails.annualSpend ?? 0,
      peakSeason: supplierDetails.peakSeason ?? '',
      lowSeason: supplierDetails.lowSeason ?? '',
      spendCategoryId: supplierDetails.spendCategoryId ?? 0,
      affidavitWaiverName: supplierDetails.affidavitWaiverName ?? '',
      affidavitWaiverSurname: supplierDetails.affidavitWaiverSurname ?? '',
      affidavitWaiverSignature: supplierDetails.affidavitWaiverSignature ?? '',
      affidavitWaiverConfirmation:
        supplierDetails.affidavitWaiverConfirmation ?? false,
    },
  });

  if (
    !supplierDetails?.supplierId ||
    !supplierDetails?.supplierDetailLookupData
  ) {
    toast.error('Supplier details not found');
    router.push('/questionnaire');
    return null;
  }

  const { supplierId } = supplierDetails;
  const { spendCategories, industries, countries } = lookupData;
  const { companySizes } = supplierDetails.supplierDetailLookupData;
  const today = new Date();
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 2);
  const initialRange = { start: today, end: nextMonth };

  const onFormSubmit = async (data: QuestionnaireSupplierFormData) => {
    try {
      const result = await updateSupplier(supplierId, data);

      if (!result.success) {
        toast.error(result.message ?? 'Failed to update supplier details');
        return;
      }

      router.push(`/questionnaire/contacts?supplierId=${supplierId}`);
    } catch (error) {
      console.error('Error updating supplier details:', error);
      toast.error('An error occurred while updating supplier details');
      return;
    }
  };

  const fieldProps = { register, errors };

  return (
    <>
      <QuestionnaireHeader />
      <div className="container mx-auto">
        <div className="grow px-4 py-8">
          <div className="mb-8">
            <h1 className="text-brand-navy mb-1 text-2xl font-bold">
              Company Information
            </h1>
            <p className="text-zinc-700">
              Please provide basic information about your company.
            </p>
          </div>

          <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-8">
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  {...fieldProps}
                  name="name"
                  label="Company Name"
                  readOnly
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
                  name="mainProductType"
                  label="Main Product Type"
                  required
                />
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
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  {...fieldProps}
                  name="spendCategoryId"
                  label="Spend Category"
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
              </div>

              <FormField
                {...fieldProps}
                name="address"
                label="Address"
                required
              >
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

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  {...fieldProps}
                  name="peakSeason"
                  label="Peak Season"
                >
                  <Controller
                    name="peakSeason"
                    control={control}
                    render={({ field }) => (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Input
                            variant="brand"
                            type="text"
                            readOnly
                            value={field.value || ''}
                            placeholder="Select Peak Season"
                            className={cn(
                              'max-w-none cursor-pointer',
                              errors.peakSeason && 'border-destructive'
                            )}
                          />
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <MonthRangePicker
                            selectedMonthRange={initialRange}
                            onMonthRangeSelect={(newDates) => {
                              field.onChange(
                                `${format(newDates.start, 'MMMM')} - ${format(newDates.end, 'MMMM')}`
                              );
                            }}
                            showQuickSelectors={false}
                          />
                        </PopoverContent>
                      </Popover>
                    )}
                  />
                </FormField>

                <FormField {...fieldProps} name="lowSeason" label="Low Season">
                  <Controller
                    name="lowSeason"
                    control={control}
                    render={({ field }) => (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Input
                            variant="brand"
                            type="text"
                            readOnly
                            value={field.value || ''}
                            placeholder="Select Low Season"
                            className={cn(
                              'max-w-none cursor-pointer',
                              errors.lowSeason && 'border-destructive'
                            )}
                          />
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <MonthRangePicker
                            selectedMonthRange={initialRange}
                            onMonthRangeSelect={(newDates) => {
                              field.onChange(
                                `${format(newDates.start, 'MMMM')} - ${format(newDates.end, 'MMMM')}`
                              );
                            }}
                            showQuickSelectors={false}
                          />
                        </PopoverContent>
                      </Popover>
                    )}
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  {...fieldProps}
                  name="annualSpend"
                  label="What is your annual spend with the requesting company?"
                  type="number"
                  required
                />
                <FormField
                  {...fieldProps}
                  name="fteHeadcount"
                  label="FTE headcount for the current financial year?"
                  type="number"
                  required
                />
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
                  label="Primary Contact Name"
                  required
                />
                <FormField
                  {...fieldProps}
                  name="primaryContactPosition"
                  label="Primary Contact Position"
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  {...fieldProps}
                  name="primaryContactEmail"
                  label="Primary Contact Email"
                  type="email"
                  required
                  readOnly
                />
                <FormField
                  {...fieldProps}
                  name="primaryContactPhone"
                  label="Primary Contact Phone"
                  type="tel"
                  required
                />
              </div>
            </div>

            <div className="mt-8 rounded-lg border border-gray-300 bg-gray-50 p-6">
              <h3 className="text-brand-navy mb-4 font-semibold">
                Affidavit Waiver
              </h3>
              <div className="mb-4 text-sm text-gray-700">
                <p>
                  I hereby affirm that all information provided in this
                  evaluation is accurate, complete, and truthful to the best of
                  my knowledge. I understand that providing false or misleading
                  information may result in the termination of business
                  relationships and potential legal consequences.
                </p>
                <p className="mt-2">
                  I acknowledge that this information will be used to assess our
                  company&apos;s practices, and I am authorized to submit this
                  information on behalf of my organization.
                </p>
              </div>

              <div className="mb-4 grid grid-cols-1 gap-6 md:grid-cols-2">
                <FormField
                  {...fieldProps}
                  name="affidavitWaiverName"
                  label="Affidavit Waiver Name"
                  required
                />
                <FormField
                  {...fieldProps}
                  name="affidavitWaiverSurname"
                  label="Affidavit Waiver Surname"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="text-muted-foreground mb-2 block text-sm font-medium">
                  Signature <span className="text-destructive">*</span>
                </label>
                <Controller
                  name="affidavitWaiverSignature"
                  control={control}
                  render={({ field }) => (
                    <div
                      className={
                        errors.affidavitWaiverSignature
                          ? 'border-destructive rounded-lg border'
                          : ''
                      }
                    >
                      <SignaturePad
                        onChange={(signatureData) =>
                          field.onChange(signatureData ?? '')
                        }
                        value={field.value}
                      />
                    </div>
                  )}
                />
                {errors.affidavitWaiverSignature && (
                  <div className="text-destructive mt-1 flex items-center gap-1 text-sm">
                    <span>⚠</span>
                    {errors.affidavitWaiverSignature.message}
                  </div>
                )}
              </div>

              <div className="flex items-start">
                <Controller
                  name="affidavitWaiverConfirmation"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="checkbox"
                      id="affidavitWaiverConfirmation"
                      checked={field.value}
                      onChange={field.onChange}
                      className={cn(
                        'focus:ring-brand-500 border-input mt-0.5 h-5 w-5 rounded-sm',
                        errors.affidavitWaiverConfirmation
                          ? 'border-destructive ring-destructive ring-1'
                          : 'text-brand-500'
                      )}
                    />
                  )}
                />
                <label
                  htmlFor="affidavitWaiverConfirmation"
                  className="ml-2 font-medium text-gray-800"
                >
                  I confirm that all information provided is accurate and I am
                  authorized to submit this evaluation on behalf of my company.
                  <span className="text-destructive ml-1">*</span>
                </label>
              </div>
              {errors.affidavitWaiverConfirmation && (
                <div className="text-destructive mt-1 ml-7 flex items-center gap-1 text-sm">
                  <span>⚠</span>
                  {errors.affidavitWaiverConfirmation.message}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                variant="brand"
                className="px-10 py-6 text-[16px]"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'save & continue'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
