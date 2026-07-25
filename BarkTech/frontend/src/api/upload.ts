import { apiClient } from './client';
import type { ApiResponse } from '@/types/api';

export interface PresignedUrlResponse {
  uploadUrl: string;
  publicUrl: string;
  key: string;
  expiresIn: number;
}

export interface UploadResult {
  success: boolean;
  url?: string;
  key?: string;
  error?: string;
}

export interface UploadFileOptions {
  folder?: string;
  onProgress?: (percent: number) => void;
  signal?: AbortSignal;
}

export const uploadApi = {
  getPresignedUrl(data: {
    key: string;
    contentType: string;
    expiresIn?: number;
  }): Promise<ApiResponse<PresignedUrlResponse>> {
    return apiClient.post<PresignedUrlResponse>('/media/presign', data);
  },

  fileExists(key: string): Promise<ApiResponse<{ exists: boolean; publicUrl?: string }>> {
    return apiClient.get('/media/exists', { key });
  },

  deleteFile(key: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/media/file?key=${encodeURIComponent(key)}`);
  },

  listFiles(prefix?: string, limit?: number): Promise<ApiResponse<Array<{
    key: string;
    size: number;
    lastModified: string;
    publicUrl: string;
  }>>> {
    return apiClient.get('/media/list', { prefix: prefix || '', limit: limit || 100 });
  },

  async uploadFile(
    file: File,
    options?: UploadFileOptions
  ): Promise<UploadResult> {
    try {
      const ext = file.name.split('.').pop() || '';
      const folder = options?.folder || 'uploads';
      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const key = `${folder}/${timestamp}-${safeName}`;

      const presigned = await uploadApi.getPresignedUrl({
        key,
        contentType: file.type,
      });

      if (!presigned.success || !presigned.data) {
        return { success: false, error: presigned.error || 'Failed to get upload URL' };
      }

      const { uploadUrl, publicUrl } = presigned.data;

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
            reject(new Error(`S3 upload failed: ${xhr.status} ${xhr.statusText}`));
          }
        };

        xhr.onerror = () => reject(new Error('S3 upload network error'));
        xhr.onabort = () => reject(new DOMException('Aborted', 'AbortError'));

        if (options?.signal) {
          options.signal.addEventListener('abort', () => xhr.abort());
        }

        xhr.send(file);
      });

      return { success: true, url: publicUrl, key };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      return { success: false, error: message };
    }
  },

  async uploadFiles(
    files: File[],
    options?: UploadFileOptions
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = [];
    for (const file of files) {
      const result = await uploadApi.uploadFile(file, options);
      results.push(result);
    }
    return results;
  },
};
