import axiosInstance from './axiosInstance';

// Get all school admins
export const getSchoolAdmins = async (page = 1, limit = 10) => {
  const response = await axiosInstance.get(`/api/admins?page=${page}&limit=${limit}`);
  return response.data;
};

// Create a new admin
export const createAdmin = async (admin: {
  email: string;
  password?: string;
  role: 'school_admin' | 'super_admin';
  schoolId: string;
  firstName: string;
  lastName: string;
  phone: string;
}) => {
  const response = await axiosInstance.post('/api/admins', admin);
  return response.data;
};

export const updateAdmin = async (id: string, admin: {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: 'school_admin' | 'super_admin';
  schoolId: string;
  isActive: boolean;
}) => {
  const response = await axiosInstance.put(`/api/admins/${id}`, admin);
  return response.data;
};

export const deleteAdmin = async (id: string) => {
  const response = await axiosInstance.delete(`/api/admins/${id}`);
  return response.data;
};

export const resendSetupEmail = async (email: string) => {
  const response = await axiosInstance.post(`/api/admins/resend-password-setup`, {email: email});
  return response.data;
};

export const createPasswordForAdmin = async (adminId: string, password: string) => {
  const response = await axiosInstance.post(`/api/admins/create-password-manually`, {
    adminId,
    password
  });
  return response.data;
};
