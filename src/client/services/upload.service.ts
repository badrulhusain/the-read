import { api, unwrapData } from '@/lib/api';
import type { UploadImageResponse, UploadImageType } from '@/types/blog';

interface UploadOptions {
  onProgress?: (progress: number) => void;
}

export const uploadService = {
  async uploadImage(file: File, type: UploadImageType, options: UploadOptions = {}) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const { data } = await api.post<UploadImageResponse>('/uploads/image', formData, {
      onUploadProgress: (event) => {
        if (!options.onProgress || !event.total) return;
        options.onProgress(Math.round((event.loaded / event.total) * 100));
      },
    });

    return unwrapData<UploadImageResponse>(data);
  },
};
