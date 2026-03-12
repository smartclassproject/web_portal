import axiosInstance from './axiosInstance';

export interface ClassItem {
  _id: string;
  name: string;
  code?: string;
  schoolId: string;
}

export const getClasses = async (search?: string): Promise<{ data: ClassItem[] }> => {
  const params = search ? `?search=${encodeURIComponent(search)}` : '';
  const response = await axiosInstance.get(`/api/classes${params}`);
  return { data: response.data.data ?? response.data };
};

export const getClassById = async (id: string): Promise<ClassItem> => {
  const response = await axiosInstance.get(`/api/classes/${id}`);
  return response.data.data ?? response.data;
};

export const createClass = async (data: { name: string; code?: string }): Promise<ClassItem> => {
  const response = await axiosInstance.post('/api/classes', data);
  return response.data.data ?? response.data;
};

export const updateClass = async (id: string, data: { name?: string; code?: string }): Promise<ClassItem> => {
  const response = await axiosInstance.put(`/api/classes/${id}`, data);
  return response.data.data ?? response.data;
};

export const deleteClass = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/api/classes/${id}`);
};
