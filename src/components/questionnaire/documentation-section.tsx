import {
  AlertCircle,
  CheckCircle,
  Download,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  type ActiveDocument,
  type DocumentCategory,
} from '@/server/services/document-requirements.service';
import {
  getDocumentIconClasses,
  getDocumentStatClasses,
} from '@/lib/questionnaire-styles';
import { Button } from '@/components/ui/button';
import { type FileRecord } from '@/server/services/file-storage.service';
import { download } from '@/lib/files';

interface DocumentationSectionProps {
  documentCategories: DocumentCategory[];
  submissionId: number;
  docActiveTab: string;
  onTabChange: (tabId: string) => void;
  categoryProgress: {
    percentage: number;
    completed: number;
    total: number;
  };
  getActiveDocuments: () => ActiveDocument[];
  calculateMissingDocumentation: () => number;
  onFileUpload: (
    documentId: string,
    submissionId: number
  ) => (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFileRemove: (documentId: string) => void;
  onSaveDraft: () => void;
  onMarkComplete: () => void;
  uploadedFiles: Map<string, FileRecord>;
  isDisabled?: boolean;
}

export default function DocumentationSection({
  documentCategories,
  submissionId,
  docActiveTab,
  onTabChange,
  categoryProgress,
  getActiveDocuments,
  calculateMissingDocumentation,
  onFileUpload,
  onFileRemove,
  onSaveDraft,
  onMarkComplete,
  uploadedFiles,
  isDisabled = false,
}: DocumentationSectionProps) {
  const totalUploaded = documentCategories.reduce(
    (acc, cat) => acc + cat.documents.filter((doc) => doc.completed).length,
    0
  );

  const handleDownload = async (documentId: string) => {
    try {
      const fileRecord = uploadedFiles.get(documentId);
      if (!fileRecord) return;

      void download(fileRecord);
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-brand-navy text-2xl font-bold">
          Supporting Documentation
        </h1>
        <div className="flex items-center gap-6">
          <div className={getDocumentStatClasses('uploaded')}>
            <CheckCircle className="mr-2 h-5 w-5" />
            <span className="font-medium">{totalUploaded} Uploaded</span>
          </div>
          <div className={getDocumentStatClasses('missing')}>
            <AlertCircle className="mr-2 h-5 w-5" />
            <span className="font-medium">
              {calculateMissingDocumentation()} Missing
            </span>
          </div>
        </div>
      </div>

      <div className="mb-8 flex items-center justify-between text-gray-600">
        <p>Last Updated: {new Date().toLocaleDateString()}</p>
        <p className="mt-2 text-center text-sm font-medium text-gray-600">
          {categoryProgress.completed} of {categoryProgress.total} documents
          uploaded
        </p>
      </div>

      <div className="mb-6">
        {documentCategories.map((category) => (
          <Button
            key={category.id}
            variant="tab"
            size="pill"
            data-state={docActiveTab === category.id ? 'active' : 'inactive'}
            onClick={() => onTabChange(category.id)}
          >
            {category.name}
          </Button>
        ))}
      </div>

      <div className="mb-8 space-y-4">
        {getActiveDocuments().map((doc) => (
          <div
            key={doc.id}
            className="rounded-md border border-gray-200 bg-white"
          >
            <div className="flex items-center justify-between p-4">
              <div className="flex items-start gap-3">
                <div className={getDocumentIconClasses(doc.completed)}>
                  {doc.completed ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <AlertCircle className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <div className="text-brand-navy font-medium">{doc.name}</div>
                  {doc.lastUpdated && (
                    <div className="text-accent-info text-sm">
                      Last updated: {doc.lastUpdated}
                    </div>
                  )}
                  {uploadedFiles.has(doc.id) && (
                    <div className="text-sm text-gray-600 italic">
                      File: {uploadedFiles.get(doc.id)?.originalFileName}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {doc.completed ? (
                  <>
                    <button
                      className="p-2 text-gray-400 hover:text-gray-600"
                      aria-label="Download document"
                      onClick={() => handleDownload(doc.id)}
                    >
                      <Download className="h-5 w-5" />
                    </button>
                    {!isDisabled && (
                      <button
                        className="p-2 text-gray-400 hover:text-gray-600"
                        aria-label="Delete document"
                        onClick={() => onFileRemove(doc.id)}
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    {isDisabled ? (
                      <div>
                        <Upload className="h-4 w-4 opacity-50" />
                        <span className="text-gray-400">locked</span>
                      </div>
                    ) : (
                      <Button
                        asChild
                        variant="brandOutline"
                        size="pillCompact"
                        className="cursor-pointer [&_svg]:size-4"
                      >
                        <label htmlFor={doc.id}>
                          <Upload className="h-4 w-4" />
                          <span>upload</span>
                          <input
                            type="file"
                            id={doc.id}
                            className="hidden"
                            onChange={onFileUpload(doc.id, submissionId)}
                          />
                        </label>
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-8 flex justify-between pt-6">
        {isDisabled ? (
          <div>
            <p className="font-medium text-gray-500">
              This documentation section has been marked as complete and is now
              locked for editing.
            </p>
          </div>
        ) : (
          <>
            <Button variant="brandOutline" size="pill" onClick={onSaveDraft}>
              save draft
            </Button>
            <Button variant="brandSolid" size="pill" onClick={onMarkComplete}>
              mark section complete
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
