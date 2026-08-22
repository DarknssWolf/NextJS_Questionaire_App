'use server';
import { db } from '@/server/db';
import { fileUploadTable } from '@/server/db/schema/fileUploadTable';
import { fileBlobTable } from '@/server/db/schema/fileBlobTable';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { getCurrentDateString } from '@/lib/date';

export type fileUploadCategory = 'documents';

export interface FileUploadData {
  file: File;
  fileUploadCategory: fileUploadCategory;
}

export interface FileRecord {
  id: number;
  fileName: string;
  originalFileName: string;
  mimeType: string;
  fileSize: number;
  storageKey: string;
  fileUploadCategory: fileUploadCategory;
  status: string;
}

export async function uploadFile(data: FileUploadData): Promise<FileRecord> {
  try {
    const { file } = data;

    const fileBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(fileBuffer);

    const fileExtension = file.name.split('.').pop();
    const uniqueFileName = `${nanoid()}.${fileExtension}`;
    const storageKey = `${data.fileUploadCategory}/${getCurrentDateString()}/${uniqueFileName}`;

    const fileRecord = await db.transaction(async (tx) => {
      const [record] = await tx
        .insert(fileUploadTable)
        .values({
          fileName: uniqueFileName,
          originalFileName: file.name,
          mimeType: file.type,
          fileSize: file.size,
          storageKey,
          fileUploadCategory: data.fileUploadCategory,
          status: 'active',
        })
        .returning();

      await tx.insert(fileBlobTable).values({
        fileUploadId: record.id,
        data: buffer,
      });

      return record;
    });

    return {
      ...fileRecord,
      fileUploadCategory: fileRecord.fileUploadCategory as fileUploadCategory,
    };
  } catch (error) {
    console.error('File upload error:', error);
    throw new Error('Failed to upload file');
  }
}

export async function getFilesByKey(key: string): Promise<FileRecord[]> {
  const files = await db
    .select()
    .from(fileUploadTable)
    .where(eq(fileUploadTable.storageKey, key));

  return files.map((file) => ({
    ...file,
    fileUploadCategory: file.fileUploadCategory as fileUploadCategory,
  }));
}

export async function getFileById(id: number): Promise<FileRecord | undefined> {
  const [file] = await db
    .select()
    .from(fileUploadTable)
    .where(eq(fileUploadTable.id, id));
  return file
    ? {
        ...file,
        fileUploadCategory: file.fileUploadCategory as fileUploadCategory,
      }
    : undefined;
}

export async function downloadFile(id: number): Promise<{
  data: string;
  file: {
    mimeType: string;
    originalFileName: string;
  };
} | null> {
  try {
    const file = await getFileById(id);
    if (!file) return null;

    const [blob] = await db
      .select({ data: fileBlobTable.data })
      .from(fileBlobTable)
      .where(eq(fileBlobTable.fileUploadId, id));

    if (!blob) return null;

    const base64Data = Buffer.from(blob.data).toString('base64');

    return {
      data: base64Data,
      file: {
        mimeType: file.mimeType,
        originalFileName: file.originalFileName,
      },
    };
  } catch (error) {
    console.error('Download error:', error);
    return null;
  }
}

export async function deleteFile(id: number): Promise<boolean> {
  const file = await getFileById(id);
  if (!file) return false;

  await db.transaction(async (tx) => {
    await tx
      .update(fileUploadTable)
      .set({ status: 'deleted' })
      .where(eq(fileUploadTable.id, id));

    await tx.delete(fileBlobTable).where(eq(fileBlobTable.fileUploadId, id));
  });

  return true;
}
