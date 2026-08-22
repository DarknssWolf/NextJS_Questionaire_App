'use server';

import {
  deleteFile,
  uploadFile,
  type FileUploadData,
} from '@/server/services/file-storage.service';
import { getRequiredDocumentsForSupplier } from '@/server/services/document-requirements.service';
import { getSubmissionFiles } from '@/server/services/submission.service';
import { updateSupplierDocumentStatus } from '@/server/services/supplier-document.service';

export async function getRequiredDocumentsForSupplierAction(
  supplierId: number
) {
  return await getRequiredDocumentsForSupplier(supplierId);
}

export async function getSubmissionFilesAction(submissionId: number) {
  return await getSubmissionFiles(submissionId);
}

export async function uploadFileAction(fileUploadData: FileUploadData) {
  return await uploadFile(fileUploadData);
}

export async function deleteFileAction(fileId: number) {
  return await deleteFile(fileId);
}

export async function updateSupplierDocumentStatusAction(
  supplierId: number,
  documentRequirementId: number,
  status: 'pending' | 'uploaded' | 'approved' | 'rejected',
  fileId?: number,
  rejectionReason?: string,
  submissionId?: number
) {
  return await updateSupplierDocumentStatus(
    supplierId,
    documentRequirementId,
    status,
    fileId,
    rejectionReason,
    submissionId
  );
}
