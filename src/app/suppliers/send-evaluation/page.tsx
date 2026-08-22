'use client';

import type React from 'react';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { FileDown, Upload } from 'lucide-react';

export default function SendEvaluationPage() {
  const [file, setFile] = useState<File | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (uploadedFile?.type === 'text/csv') {
      setFile(uploadedFile);
    } else {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a valid CSV file.',
        variant: 'destructive',
      });
    }
  };

  const handleSendEvaluation = () => {
    if (!file) {
      toast({
        title: 'No file selected',
        description: 'Please upload a CSV file before sending evaluations.',
        variant: 'destructive',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const lines = content.split('\n').filter((line) => line.trim() !== '');
      const supplierCount = lines.length - 1;

      toast({
        title: 'Sending evaluations',
        description: `Sending evaluations to ${supplierCount} suppliers...`,
      });

      setTimeout(() => {
        toast({
          title: 'Evaluations sent successfully',
          description: `Evaluations have been sent to ${supplierCount} suppliers.`,
          variant: 'default',
        });
        router.push('/suppliers');
      }, 2000);
    };
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const templateContent = 'Supplier Name,Email,Industry,Country\n';
    const blob = new Blob([templateContent], {
      type: 'text/csv;charset=utf-8;',
    });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'supplier_evaluation_template.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="bg-background min-h-screen">
      <main className="container space-y-8 py-6">
        <Card className="rounded-[20px] border-none bg-white shadow-xs">
          <CardHeader className="p-6">
            <CardTitle className="text-brand-deep text-[23px] font-bold">
              Send Evaluation to Suppliers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <div className="space-y-4">
              <h2 className="text-brand-deep text-[18px] font-semibold">
                Upload CSV File
              </h2>
              <div className="flex w-full items-center justify-center">
                <label
                  htmlFor="csvFile"
                  className="border-dropzone-border bg-brand-50 hover:bg-brand-100 flex h-64 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="text-dropzone-muted mb-4 h-12 w-12" />
                    <p className="text-brand-deep mb-2 text-sm">
                      <span className="font-semibold">Click to upload</span> or
                      drag and drop
                    </p>
                    <p className="text-dropzone-muted text-xs">CSV file only</p>
                  </div>
                  <Input
                    id="csvFile"
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </label>
              </div>
              {file && (
                <p className="text-brand-500 text-sm">
                  File uploaded: {file.name}
                </p>
              )}
            </div>

            <div className="space-y-4">
              <h2 className="text-brand-deep text-[18px] font-semibold">
                CSV Template
              </h2>
              <Button
                variant="outline"
                onClick={downloadTemplate}
                className="border-brand-deep text-brand-deep hover:bg-brand-deep/10 rounded-full border-2 bg-transparent px-6 text-[14px] font-normal"
              >
                <FileDown className="mr-2 h-4 w-4" />
                Download CSV Template
              </Button>
            </div>

            <div className="mt-8 flex justify-end space-x-4">
              <Button
                variant="outline"
                onClick={() => router.push('/suppliers')}
                className="border-brand-deep text-brand-deep hover:bg-brand-deep/10 rounded-full border-2 bg-transparent px-6 text-[14px] font-normal"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendEvaluation}
                disabled={!file}
                className="bg-brand-deep text-brand-deep-foreground hover:bg-brand-deep/90 rounded-full px-6 text-[14px] font-normal"
              >
                Send Evaluation
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
      <Toaster />
    </div>
  );
}
