import axiosInstance from './axiosInstance';

export const getAnnouncements = async () => {
  const response = await axiosInstance.get('/api/announcements');
  return response.data;
};

export const createAnnouncement = async (payload: Record<string, unknown>) => {
  const response = await axiosInstance.post('/api/announcements', payload);
  return response.data;
};

export const updateAnnouncement = async (id: string, payload: Record<string, unknown>) => {
  const response = await axiosInstance.put(`/api/announcements/${id}`, payload);
  return response.data;
};

export const deleteAnnouncement = async (id: string) => {
  const response = await axiosInstance.delete(`/api/announcements/${id}`);
  return response.data;
};
