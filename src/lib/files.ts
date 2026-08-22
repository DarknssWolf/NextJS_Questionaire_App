import {
  type FileRecord,
  downloadFile,
} from '@/server/services/file-storage.service';

export const download = async (fileRecord: FileRecord) => {
  const result = await downloadFile(fileRecord.id);
  if (!result) return;

  const binaryData = Uint8Array.from(atob(result.data), (c) => c.charCodeAt(0));

  const blob = new Blob([binaryData], { type: result.file.mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = result.file.originalFileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
