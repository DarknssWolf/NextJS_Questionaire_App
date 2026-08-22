import { useCallback, useEffect, useState } from 'react';
import { type DocumentCategory } from '@/server/services/document-requirements.service';
import { type FileRecord } from '@/server/services/file-storage.service';
import {
  getRequiredDocumentsForSupplierAction,
  uploadFileAction,
  deleteFileAction,
  updateSupplierDocumentStatusAction,
  getSubmissionFilesAction,
} from '@/app/questionnaire/documentation-actions';
import { toast } from 'sonner';

export const useDocumentationManager = (
  supplierId: number,
  submissionId: number
) => {
  const [documentCategories, setDocumentCategories] = useState<
    DocumentCategory[]
  >([]);
  const [docActiveTab, setDocActiveTab] = useState('core');
  const [uploadedFiles, setUploadedFiles] = useState<Map<string, FileRecord>>(
    new Map()
  );

  const isDocumentationComplete = useCallback((): boolean => {
    return documentCategories.every((category) =>
      category.documents.every((doc) => doc.completed)
    );
  }, [documentCategories]);

  const getActiveDocuments = useCallback(() => {
    const activeCategoryObj = documentCategories.find(
      (cat) => cat.id === docActiveTab
    );
    return activeCategoryObj?.documents ?? [];
  }, [documentCategories, docActiveTab]);

  const calculateMissingDocumentation = useCallback(() => {
    return documentCategories.reduce(
      (sum, cat) => sum + cat.documents.filter((doc) => !doc.completed).length,
      0
    );
  }, [documentCategories]);

  const handleFileUpload = useCallback(
    (documentId: string, submissionId: number) =>
      async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];

        try {
          const fileRecord = await uploadFileAction({
            file,
            fileUploadCategory: 'documents',
          });

          const statusUpdate = await updateSupplierDocumentStatusAction(
            supplierId,
            parseInt(documentId),
            'uploaded',
            fileRecord.id,
            undefined,
            submissionId
          );

          if (!statusUpdate.success) {
            console.error(
              'Failed to update document status:',
              statusUpdate.message
            );
          }

          setUploadedFiles((prevFiles) =>
            new Map(prevFiles).set(documentId, fileRecord)
          );

          setDocumentCategories((prevCategories) =>
            prevCategories.map((category) => ({
              ...category,
              documents: category.documents.map((doc) =>
                String(doc.id) === documentId
                  ? {
                      ...doc,
                      completed: true,
                      lastUpdated: new Date().toISOString().split('T')[0],
                    }
                  : doc
              ),
            }))
          );

          toast.success(`File "${file.name}" uploaded successfully`);
        } catch (error) {
          console.error('File upload error:', error);
          toast.error(`Failed to upload file "${file.name}"`);
        }
      },
    [supplierId]
  );

  const handleFileRemove = useCallback(
    async (documentId: string) => {
      try {
        const fileRecord = uploadedFiles.get(documentId);
        if (fileRecord) {
          await deleteFileAction(fileRecord.id);

          const statusUpdate = await updateSupplierDocumentStatusAction(
            supplierId,
            parseInt(documentId),
            'pending',
            undefined,
            undefined,
            undefined
          );

          if (!statusUpdate.success) {
            console.error(
              'Failed to update document status:',
              statusUpdate.message
            );
          }

          setUploadedFiles((prevFiles) => {
            const newFiles = new Map(prevFiles);
            newFiles.delete(documentId);
            return newFiles;
          });
        }

        setDocumentCategories((prevCategories) =>
          prevCategories.map((category) => ({
            ...category,
            documents: category.documents.map((document) =>
              String(document.id) === documentId
                ? {
                    ...document,
                    completed: false,
                    lastUpdated: new Date().toISOString().split('T')[0],
                  }
                : document
            ),
          }))
        );

        toast.success('Document removed successfully');
      } catch (error) {
        console.error('File removal error:', error);
        toast.error('Failed to remove document');
      }
    },
    [supplierId, uploadedFiles]
  );

  useEffect(() => {
    async function fetchDocumentRequirements() {
      if (supplierId) {
        const data = await getRequiredDocumentsForSupplierAction(supplierId);
        setDocumentCategories(data.categories);
        setDocActiveTab(data.categories[0]?.id || '');
      }
    }

    void fetchDocumentRequirements();
  }, [supplierId]);

  useEffect(() => {
    async function loadUploadedFiles() {
      if (!submissionId) return;

      try {
        const files = await getSubmissionFilesAction(submissionId);
        const fileMap = new Map<string, FileRecord>();

        // File records carry no documentId, so files are matched to documents by original filename.
        files.forEach((file) => {
          fileMap.set(file.originalFileName, file);
        });

        setUploadedFiles(fileMap);
      } catch (error) {
        console.error('Error loading uploaded files:', error);
      }
    }

    void loadUploadedFiles();
  }, [submissionId]);

  return {
    documentCategories,
    docActiveTab,
    setDocActiveTab,
    isDocumentationComplete,
    getActiveDocuments,
    calculateMissingDocumentation,
    handleFileUpload,
    handleFileRemove,
    uploadedFiles,
  };
};
