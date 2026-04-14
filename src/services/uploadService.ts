import axiosInstance from './axiosInstance';

export const uploadFileAsset = async (context: string, file: File) => {
  const form = new FormData();
  form.append('file', file);
  const response = await axiosInstance.post(`/api/uploads/${context}`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};
