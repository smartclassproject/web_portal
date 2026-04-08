import axiosInstance from './axiosInstance';

export const getSchoolInquiries = async (status?: string) => {
  const response = await axiosInstance.get('/api/inquiries', { params: status ? { status } : undefined });
  return response.data;
};

export const replyToInquiry = async (id: string, message: string) => {
  const response = await axiosInstance.post(`/api/inquiries/${id}/reply`, { message });
  return response.data;
};

export const updateInquiryStatus = async (id: string, payload: Record<string, unknown>) => {
  const response = await axiosInstance.put(`/api/inquiries/${id}/status`, payload);
  return response.data;
};
