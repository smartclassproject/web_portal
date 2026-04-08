import axiosInstance from './axiosInstance';

export const getPaymentInstructions = async () => {
  const response = await axiosInstance.get('/api/fees/instructions');
  return response.data;
};

export const upsertPaymentInstructions = async (payload: Record<string, unknown>) => {
  const response = await axiosInstance.post('/api/fees/instructions', payload);
  return response.data;
};

export const getFeeAccounts = async (params?: Record<string, string | number>) => {
  const response = await axiosInstance.get('/api/fees/accounts', { params });
  return response.data;
};

export const upsertFeeAccount = async (payload: Record<string, unknown>) => {
  const response = await axiosInstance.post('/api/fees/accounts', payload);
  return response.data;
};

export const getPaymentSubmissions = async (params?: Record<string, string | number>) => {
  const response = await axiosInstance.get('/api/fees/submissions', { params });
  return response.data;
};

export const approveSubmission = async (id: string) => {
  const response = await axiosInstance.put(`/api/fees/submissions/${id}/approve`);
  return response.data;
};

export const rejectSubmission = async (id: string, rejectionReason: string) => {
  const response = await axiosInstance.put(`/api/fees/submissions/${id}/reject`, { rejectionReason });
  return response.data;
};
