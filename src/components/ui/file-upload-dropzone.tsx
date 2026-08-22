import { useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface FileUploadDropzoneProps {
  onFileSelect: (file: File) => void;
  selectedFile?: File | null;
  onRemoveFile?: () => void;
  isUploading?: boolean;
  acceptedFileTypes?: string;
  title?: string;
  disabled?: boolean;
  className?: string;
}

export function FileUploadDropzone({
  onFileSelect,
  selectedFile,
  onRemoveFile,
  isUploading = false,
  acceptedFileTypes = '.csv',
  title = 'Drag and drop your CSV file here',
  disabled = false,
  className = '',
}: FileUploadDropzoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const validateAndSetFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Please select a CSV file');
      return;
    }
    onFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) validateAndSetFile(file);
  };

  const handleFileSelectInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndSetFile(file);
  };

  const handleRemoveFileClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRemoveFile) {
      onRemoveFile();
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    if (!selectedFile && !isUploading && !disabled) {
      fileInputRef.current?.click();
    }
  };

  const cardStateClasses = () => {
    if (disabled) return 'border-border bg-muted';
    if (selectedFile) return 'border-risk-green bg-statistic-green';
    if (dragActive) return 'border-accent-info bg-accent-info/10';
    return 'border-border bg-card';
  };

  const isInteractive = !selectedFile && !isUploading && !disabled;

  return (
    <Card
      className={cn(
        'border-2 border-dashed shadow-none transition-all',
        cardStateClasses(),
        className
      )}
    >
      <div
        className={cn(
          'p-12 text-center transition-colors',
          isInteractive && 'hover:bg-muted cursor-pointer'
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        {selectedFile ? (
          <div className="flex flex-col items-center space-y-4">
            <div className="bg-risk-green flex h-16 w-16 items-center justify-center rounded-lg">
              <FileText className="text-risk-green-foreground h-8 w-8" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-center space-x-2">
                <p className="text-risk-green-foreground text-lg font-medium">
                  {selectedFile.name}
                </p>
                {onRemoveFile && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveFileClick}
                    className="hover:bg-risk-red/30 h-6 w-6 p-0"
                  >
                    <X className="text-destructive h-4 w-4" />
                  </Button>
                )}
              </div>
              <p className="text-muted-foreground text-sm">
                {isUploading ? 'Processing...' : 'Ready to upload'}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-4">
            <Upload
              className={cn(
                'h-14 w-14',
                disabled ? 'text-muted-foreground/60' : 'text-muted-foreground'
              )}
            />
            <div className="space-y-2">
              <p
                className={cn(
                  'text-lg font-medium',
                  disabled ? 'text-muted-foreground' : 'text-base-700'
                )}
              >
                {title}
              </p>
              <p
                className={cn(
                  disabled ? 'text-muted-foreground' : 'text-base-600'
                )}
              >
                {disabled ? (
                  'Please complete the previous step first'
                ) : (
                  <span className="underline">or click to browse files</span>
                )}
              </p>
            </div>
          </div>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFileTypes}
        onChange={handleFileSelectInput}
        className="hidden"
        disabled={disabled}
      />
    </Card>
  );
}
