export type UploadStatus = 'uploading' | 'completed' | 'error';

export interface UploadedAttachment {
  id: string;
  status: UploadStatus;
  url?: string;
  name: string;
  contentType?: string;
}