import axiosInstance from './axiosInstance';

export const getStudentProfile = async () => {
  const response = await axiosInstance.get('/api/student-app/me');
  return response.data;
};

export const getStudentFees = async () => {
  const response = await axiosInstance.get('/api/student-app/fees');
  return response.data;
};

export const submitStudentFeeProof = async (payload: Record<string, unknown>) => {
  const response = await axiosInstance.post('/api/student-app/fees/submissions', payload);
  return response.data;
};

export const getStudentMaterials = async () => {
  const response = await axiosInstance.get('/api/student-app/materials');
  return response.data;
};

export const getStudentLessons = async () => {
  const response = await axiosInstance.get('/api/student-app/lessons');
  return response.data;
};

export const getStudentInquiries = async () => {
  const response = await axiosInstance.get('/api/student-app/inquiries');
  return response.data;
};

export const createStudentInquiry = async (payload: { subject: string; message: string }) => {
  const response = await axiosInstance.post('/api/student-app/inquiries', payload);
  return response.data;
};

export const replyStudentInquiry = async (id: string, message: string) => {
  const response = await axiosInstance.post(`/api/student-app/inquiries/${id}/reply`, { message });
  return response.data;
};

export const getStudentPrivacyPolicy = async () => {
  const response = await axiosInstance.get('/api/student-app/privacy-policy');
  return response.data;
};

export const changeStudentPassword = async (payload: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}) => {
  const response = await axiosInstance.post('/api/student-app/change-password', payload);
  return response.data;
};
