import { api } from './api';


export interface MediaUploadResponse {
    url: string;
}

export const uploadMedia = async (file: File): Promise<MediaUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<MediaUploadResponse>('/arquivos/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
}
