import { apiClient } from './client';
import type { ApiResponse } from '@/types/api';

export interface PresignedUrlResponse {
  uploadUrl: string;
  fileUrl: string;
  key: string;
  expiresAt: string;
}

export interface ConfirmUploadRequest {
  key: string;
  contentType?: string;
  size?: number;
  metadata?: Record<string, string>;
}

export interface ConfirmUploadResponse {
  url: string;
  key: string;
  size: number;
}

export interface UploadFileOptions {
  onProgress?: (percent: number) => void;
  signal?: AbortSignal;
}

export const uploadApi = {
  getPresignedUrl(data: {
    filename: string;
    contentType: string;
    folder?: string;
  }): Promise<ApiResponse<PresignedUrlResponse>> {
    return apiClient.post<PresignedUrlResponse>('/upload/presign', data);
  },

  confirmUpload(data: ConfirmUploadRequest): Promise<ApiResponse<ConfirmUploadResponse>> {
    return apiClient.post<ConfirmUploadResponse>('/upload/confirm', data);
  },

  async uploadFile(
    file: File,
    options?: UploadFileOptions & { folder?: string }
  ): Promise<ApiResponse<ConfirmUploadResponse>> {
    const presigned = await uploadApi.getPresignedUrl({
      filename: file.name,
      contentType: file.type,
      folder: options?.folder,
    });

    if (!presigned.success || !presigned.data) {
      return presigned as unknown as ApiResponse<ConfirmUploadResponse>;
    }

    const { uploadUrl, key } = presigned.data;

    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', file.type);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && options?.onProgress) {
          options.onProgress(Math.round((event.loaded / event.total) * 100));
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Upload failed: ${xhr.status}`));
        }
      };

      xhr.onerror = () => reject(new Error('Upload failed'));
      xhr.onabort = () => reject(new DOMException('Aborted', 'AbortError'));

      if (options?.signal) {
        options.signal.addEventListener('abort', () => xhr.abort());
      }

      xhr.send(file);
    });

    return uploadApi.confirmUpload({
      key,
      contentType: file.type,
      size: file.size,
    });
  },
};
