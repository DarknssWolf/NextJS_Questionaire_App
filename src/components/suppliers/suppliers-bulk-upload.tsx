'use client';

import { Button } from '@/components/ui/button';
import { FileUploadDropzone } from '@/components/ui/file-upload-dropzone';
import {
  parseSupplierCsvAction,
  insertSupplierDataAction,
} from '@/app/suppliers/actions';
import DynamicCSVTableEditor, {
  type CSVTableData,
  type CsvRow,
} from '@/components/ui/dynamic-csv-table';
import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import type { SupplierProcessResult, SupplierRow } from '@/types/supplier-data';
import type { UploadStep } from '@/types/upload';
import { SupplierRowSchema } from '@/types/supplier-data';
import { z } from 'zod';
import { useSupplierContext } from '@/providers/suppliers/SupplierContextProvider';
import { redirect } from 'next/navigation';
import { Download } from 'lucide-react';
import { checkExistingSuppliers } from '@/server/services/supplier.service';
export interface SupplierUploadProps {
  onSupplierUploadSuccess?: () => void;
}

const cell = (row: CsvRow, key: string): string => {
  const value = row[key];
  return typeof value === 'string' ? value : (value?.toString() ?? '');
};

const supplierHeaders = [
  'Company Name',
  'Registration Number',
  'Primary Contact Name',
  'Primary Contact Email',
  'Additional Notes',
];

const transformSupplierDataForTable = (
  supplierData: SupplierRow[]
): CSVTableData => {
  if (!supplierData || supplierData.length === 0) {
    return { headers: supplierHeaders, rows: [] };
  }

  const rows = supplierData.map((row) => {
    const displayRow: CsvRow = {};
    Object.entries(row).forEach(([key, value]) => {
      displayRow[key] = value ?? '';
    });
    return displayRow;
  });

  return { headers: supplierHeaders, rows };
};

const checkForExistingSuppliers = async (
  data: CsvRow[]
): Promise<
  Array<{
    row: number;
    field: string;
    message: string;
    email: string;
  }>
> => {
  const warnings: Array<{
    row: number;
    field: string;
    message: string;
    email: string;
  }> = [];

  try {
    const supplierRows: SupplierRow[] = data.map((row) => ({
      'Company Name': cell(row, 'Company Name'),
      'Registration Number': cell(row, 'Registration Number'),
      'Primary Contact Name': cell(row, 'Primary Contact Name'),
      'Primary Contact Email': cell(row, 'Primary Contact Email'),
      'Additional Notes': cell(row, 'Additional Notes'),
    }));

    const existingSuppliers = await checkExistingSuppliers(supplierRows);

    data.forEach((row, index) => {
      const email = cell(row, 'Primary Contact Email');
      if (email) {
        const existingSupplier = existingSuppliers.find(
          (s) => s.email.toLowerCase() === email.toLowerCase()
        );

        if (existingSupplier) {
          warnings.push({
            row: index + 1,
            field: 'Primary Contact Email',
            message:
              'This email already exists and will be linked to your company',
            email: existingSupplier.email,
          });
        }
      }
    });
  } catch (error) {
    console.error('Error checking existing suppliers:', error);
  }

  return warnings;
};

const validateSupplierData = async (
  data: CsvRow[]
): Promise<{
  errors: Array<{ row: number; field: string; message: string }>;
  duplicateRows: Set<number>;
}> => {
  const validation = z.array(SupplierRowSchema).safeParse(data);
  const errors: Array<{ row: number; field: string; message: string }> = [];
  const duplicateRows = new Set<number>();

  if (!validation.success) {
    errors.push(
      ...validation.error.issues.map((issue) => ({
        row: (issue.path[0] as number) + 1,
        field: issue.path[1] as string,
        message: issue.message,
      }))
    );
  }

  const companyNameRowMap = new Map<string, number[]>();
  const duplicateCompanyErrors: Array<{
    row: number;
    field: string;
    message: string;
  }> = [];

  data.forEach((row, index) => {
    const normalizedName = cell(row, 'Company Name').trim();
    if (normalizedName) {
      if (!companyNameRowMap.has(normalizedName)) {
        companyNameRowMap.set(normalizedName, []);
      }
      companyNameRowMap.get(normalizedName)!.push(index + 1);
    }
  });

  companyNameRowMap.forEach((rowNumbers, companyName) => {
    if (rowNumbers.length > 1) {
      rowNumbers.forEach((rowNum) => duplicateRows.add(rowNum));

      duplicateCompanyErrors.push({
        row: rowNumbers[0],
        field: 'Company Name',
        message: `Duplicate company name "${companyName}" found in rows: ${rowNumbers.join(', ')}`,
      });
    }
  });

  errors.push(...duplicateCompanyErrors);

  const emailRowMap = new Map<string, number[]>();
  const duplicateEmailErrors: Array<{
    row: number;
    field: string;
    message: string;
  }> = [];

  data.forEach((row, index) => {
    const normalizedEmail = cell(row, 'Primary Contact Email')
      .toLowerCase()
      .trim();
    if (normalizedEmail) {
      if (!emailRowMap.has(normalizedEmail)) {
        emailRowMap.set(normalizedEmail, []);
      }
      emailRowMap.get(normalizedEmail)!.push(index + 1);
    }
  });

  emailRowMap.forEach((rowNumbers, email) => {
    if (rowNumbers.length > 1) {
      rowNumbers.forEach((rowNum) => duplicateRows.add(rowNum));

      duplicateEmailErrors.push({
        row: rowNumbers[0],
        field: 'Primary Contact Email',
        message: `Duplicate email "${email}" found in rows: ${rowNumbers.join(', ')}`,
      });
    }
  });

  errors.push(...duplicateEmailErrors);

  return { errors, duplicateRows };
};

export default function SuppliersBulkUpload({
  onSupplierUploadSuccess,
}: SupplierUploadProps) {
  const { companyId } = useSupplierContext();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [currentStep, setCurrentStep] = useState<UploadStep>('upload');
  const [parseResult, setParseResult] = useState<SupplierProcessResult | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [pendingEditedData, setPendingEditedData] = useState<CsvRow[]>([]);
  const [validationErrors, setValidationErrors] = useState<
    Array<{
      row: number;
      field: string;
      message: string;
    }>
  >([]);
  const [duplicateRows, setDuplicateRows] = useState<Set<number>>(new Set());
  const [validationWarnings, setValidationWarnings] = useState<
    Array<{
      row: number;
      field: string;
      message: string;
      email: string;
    }>
  >([]);
  const [hasBeenRevalidated, setHasBeenRevalidated] = useState(false);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
  };

  const handleDownloadTemplate = () => {
    const csvContent = supplierHeaders.join(';') + '\n';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'supplier_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleParseFile = async () => {
    if (!selectedFile) {
      toast.error('No file selected');
      return;
    }

    setIsLoading(true);
    setUploadStatus('Parsing supplier file...');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const result = await parseSupplierCsvAction(formData);
      setParseResult(result);

      if (result.errors && result.errors.length > 0) {
        setUploadStatus(
          `Found ${result.errors.length} validation errors. Please review and fix them below.`
        );
        toast.warning(
          `File parsed with validation errors ${result.errors.length}`
        );
      } else if (!result.parsedData || result.parsedData.length === 0) {
        setUploadStatus('');
      } else {
        setUploadStatus('File parsed successfully! Review the data below.');
        toast.success('File parsed successfully');
      }

      if (result.parsedData && result.parsedData.length > 0) {
        void handleRevalidate(result.parsedData);
      }
      setCurrentStep('preview');
    } catch (error) {
      console.error('Error parsing supplier file:', error);
      toast.error('Error parsing supplier file');
      setUploadStatus('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevalidate = async (currentData: CsvRow[]) => {
    setIsLoading(true);
    setUploadStatus('Validating data...');

    try {
      if (!currentData || currentData.length === 0) {
        setValidationErrors([]);
        setValidationWarnings([]);
        setDuplicateRows(new Set());
        setHasBeenRevalidated(true);
        setUploadStatus('');
        setIsLoading(false);
        return;
      }

      const [validationResult, warnings] = await Promise.all([
        validateSupplierData(currentData),
        checkForExistingSuppliers(currentData),
      ]);

      const { errors, duplicateRows } = validationResult;
      setValidationErrors(errors);
      setValidationWarnings(warnings);
      setDuplicateRows(duplicateRows);
      setHasBeenRevalidated(true);

      if (errors.length > 0) {
        setUploadStatus(
          warnings.length > 0
            ? `Found ${errors.length} validation errors and ${warnings.length} warnings. Please review and fix them below.`
            : `Found ${errors.length} validation errors. Please review and fix them below.`
        );
        toast.warning(
          warnings.length > 0
            ? `Validation found ${errors.length} errors and ${warnings.length} warnings`
            : `Validation found ${errors.length} errors`
        );
      } else if (warnings.length > 0) {
        setUploadStatus(
          `Data is valid! Found ${warnings.length} existing suppliers that will be linked to your company.`
        );
        toast.success(
          `All data validated successfully. ${warnings.length} existing suppliers will be linked.`
        );
      } else {
        setUploadStatus('All data is valid! You can now save to database.');
        toast.success('All data validated successfully');
      }
    } catch (error) {
      console.error('Error during validation:', error);
      toast.error('Error validating data');
      setUploadStatus('Error validating data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToDatabase = async (editedData: CsvRow[]) => {
    if (!selectedFile) {
      toast.error('No file selected');
      return;
    }

    setPendingEditedData(editedData);
    setShowSaveDialog(true);
  };

  const handleConfirmSave = async () => {
    const validationResult = await validateSupplierData(pendingEditedData);
    const { errors } = validationResult;
    if (errors.length > 0) {
      setValidationErrors(errors);
      toast.error('Please fix validation errors before saving');
      return;
    }

    setIsLoading(true);
    setUploadStatus('Saving supplier data to database...');

    try {
      const editedDataMapped: SupplierRow[] = pendingEditedData.map((row) => ({
        'Company Name': cell(row, 'Company Name'),
        'Registration Number': cell(row, 'Registration Number'),
        'Primary Contact Name': cell(row, 'Primary Contact Name'),
        'Primary Contact Email': cell(row, 'Primary Contact Email'),
        'Additional Notes': cell(row, 'Additional Notes'),
      }));

      if (editedDataMapped.length > 100) {
        toast.info(
          'Processing large dataset - this may take a few minutes...',
          { duration: 3000 }
        );
      }

      const result = await insertSupplierDataAction(
        editedDataMapped,
        companyId
      );

      if (result.success) {
        setShowSaveDialog(false);
        setUploadStatus('Supplier data saved successfully!');
        toast.success(result.message);

        setCurrentStep('complete');

        setTimeout(() => {
          if (onSupplierUploadSuccess) {
            onSupplierUploadSuccess();
          } else {
            redirect('/suppliers');
          }
        }, 1000);
      } else {
        setUploadStatus('');
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error saving supplier data:', error);
      toast.error('Error saving supplier data to database');
      setUploadStatus('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToUpload = () => {
    setCurrentStep('upload');
    setParseResult(null);
    setUploadStatus('');
    setValidationErrors([]);
    setValidationWarnings([]);
    setDuplicateRows(new Set());
    setHasBeenRevalidated(false);
  };

  const memoizedTableData = useMemo(() => {
    if (!parseResult) return { headers: [], rows: [] };
    return transformSupplierDataForTable(parseResult.parsedData);
  }, [parseResult]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-foreground text-2xl font-bold">
          Upload Suppliers via CSV
        </h3>
        <p className="text-muted-foreground mt-2">
          Upload your supplier data for bulk import. Review and edit the data
          before saving to the database. <br />
          *PLEASE NOTE* accounts are created based on the Primary Contact Email.
          Make sure the Primary Contact Email is unique.
        </p>
      </div>

      {uploadStatus && (
        <div
          className={`rounded-lg p-3 text-center ${
            parseResult?.errors && parseResult.errors.length > 0
              ? 'bg-risk-yellow/25 text-risk-yellow-foreground'
              : 'bg-accent-info/10 text-accent-info'
          }`}
        >
          {uploadStatus}
        </div>
      )}

      {currentStep === 'upload' && (
        <>
          <div className="mx-auto max-w-2xl rounded-lg bg-white p-6 shadow-xs">
            <FileUploadDropzone
              onFileSelect={handleFileSelect}
              selectedFile={selectedFile}
              onRemoveFile={handleRemoveFile}
              isUploading={isLoading}
              title="Drag and drop your CSV file here"
            />
          </div>

          <div className="flex justify-center gap-4">
            <Button
              variant="outline"
              size="pill"
              onClick={handleDownloadTemplate}
            >
              <Download />
              Download Template
            </Button>

            {selectedFile && (
              <Button
                variant="brandSolid"
                size="pill"
                onClick={handleParseFile}
                disabled={isLoading}
              >
                {isLoading ? 'Parsing...' : 'Parse Supplier File'}
              </Button>
            )}
          </div>
        </>
      )}

      {currentStep === 'preview' && parseResult && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-foreground text-lg font-semibold">
              Review Supplier Data
            </h4>
            <button
              onClick={handleBackToUpload}
              className="text-muted-foreground hover:text-muted-foreground text-sm"
            >
              ← Back to Upload
            </button>
          </div>

          {(() => {
            const errorsToShow = hasBeenRevalidated
              ? validationErrors
              : (parseResult.errors ?? []);

            return (
              errorsToShow.length > 0 && (
                <div className="bg-risk-red/20 mb-4 rounded-lg p-4">
                  <h5 className="text-destructive mb-2 font-medium">
                    Validation Errors:
                  </h5>
                  <div className="max-h-32 overflow-y-auto">
                    {errorsToShow.map((error, index) => {
                      // Initial parse errors number rows +2 (header row); the table numbers them +1
                      const displayRow = hasBeenRevalidated
                        ? error.row
                        : error.row - 1;
                      return (
                        <div
                          key={`${error.field}-${error.row}-${error.message}-${index}`}
                          className="text-destructive text-sm"
                        >
                          Row {displayRow}, {error.field}: {error.message}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )
            );
          })()}

          {validationWarnings.length > 0 && hasBeenRevalidated && (
            <div className="bg-risk-yellow/25 mb-4 rounded-lg p-4">
              <h5 className="text-risk-yellow-foreground mb-2 font-medium">
                Existing Suppliers Found:
              </h5>
              <p className="text-risk-yellow-foreground mb-2 text-sm">
                These suppliers already exist and will be linked to your company
                instead of creating duplicates:
              </p>
              <div className="max-h-32 overflow-y-auto">
                {validationWarnings.map((warning, index) => (
                  <div
                    key={`${warning.email}-${warning.row}-${index}`}
                    className="text-risk-yellow-foreground text-sm"
                  >
                    Row {warning.row}: {warning.email} - {warning.message}
                  </div>
                ))}
              </div>
            </div>
          )}

          <DynamicCSVTableEditor
            data={memoizedTableData}
            onInsert={handleSaveToDatabase}
            onError={(error: string) => toast.error(error)}
            onRevalidate={handleRevalidate}
            hasValidationErrors={
              hasBeenRevalidated
                ? validationErrors.length > 0
                : parseResult.errors && parseResult.errors.length > 0
            }
            duplicateRows={duplicateRows}
          />
        </div>
      )}

      {currentStep === 'complete' && (
        <div className="py-8 text-center">
          <div className="bg-risk-green mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            <svg
              className="text-risk-green-foreground h-8 w-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h4 className="text-foreground mb-2 text-lg font-semibold">
            Supplier Data Saved Successfully!
          </h4>
          <p className="text-muted-foreground">
            Redirecting to suppliers page...
          </p>
        </div>
      )}

      {showSaveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6">
            <h3 className="text-foreground mb-4 text-lg font-semibold">
              Confirm Save to Database
            </h3>

            <div className="space-y-4">
              <div className="bg-muted rounded-lg p-3">
                <h4 className="text-muted-foreground mb-2 text-sm font-medium">
                  Summary:
                </h4>
                <ul className="text-muted-foreground space-y-1 text-sm">
                  <li>• Records: {pendingEditedData.length} suppliers</li>
                  {validationWarnings.length > 0 && (
                    <li className="text-risk-yellow-foreground">
                      • {validationWarnings.length} existing supplier(s) will be
                      linked to your company
                    </li>
                  )}
                </ul>

                {validationWarnings.length > 0 && (
                  <p className="text-risk-yellow-foreground mt-2 text-xs">
                    Existing suppliers will be linked to your company instead of
                    creating duplicates.
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="border-border text-muted-foreground hover:bg-muted flex-1 rounded-lg border px-4 py-2"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSave}
                className="bg-brand-500 hover:bg-brand-400 flex-1 rounded-lg px-4 py-2 text-white"
              >
                Save to Database
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
