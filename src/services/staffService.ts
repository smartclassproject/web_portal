import axiosInstance from './axiosInstance';

export interface StaffUser {
  _id: string;
  schoolId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  staffRole: string;
  customRoleTitle?: string;
  modules: string[];
  isActive: boolean;
  passwordSetup?: boolean;
  lastCredentialsSentAt?: string | null;
  createdByRole?: 'SUPER_ADMIN' | 'SCHOOL_ADMIN';
  createdAt: string;
  updatedAt?: string;
}

export interface StaffModule {
  _id: string;
  key: string;
  label: string;
  description?: string;
  isActive: boolean;
}

export interface StaffRoleTemplate {
  role: string;
  defaultModules: string[];
}

export interface CreateStaffPayload {
  schoolId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  staffRole: string;
  customRoleTitle?: string;
  modules: string[];
  password?: string;
}

export interface UpdateStaffPayload {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  staffRole?: string;
  customRoleTitle?: string;
  modules?: string[];
}

export const getStaffList = async (schoolId?: string) => {
  const query = schoolId ? `?schoolId=${encodeURIComponent(schoolId)}` : '';
  const response = await axiosInstance.get(`/api/staff${query}`);
  return response.data as { success: boolean; data: StaffUser[] };
};

export const getStaffModules = async () => {
  const response = await axiosInstance.get('/api/staff/modules');
  return response.data as { success: boolean; data: StaffModule[] };
};

export const getStaffRoleTemplates = async () => {
  const response = await axiosInstance.get('/api/staff/roles/templates');
  return response.data as { success: boolean; data: { templates: StaffRoleTemplate[] } };
};

export const createStaff = async (payload: CreateStaffPayload) => {
  const response = await axiosInstance.post('/api/staff', payload);
  return response.data as {
    success: boolean;
    data: StaffUser & { credentialsEmailSent?: boolean; defaultPassword?: string };
    message?: string;
  };
};

export const updateStaff = async (id: string, payload: UpdateStaffPayload) => {
  const response = await axiosInstance.put(`/api/staff/${id}`, payload);
  return response.data as { success: boolean; data: StaffUser; message?: string };
};

export const updateStaffStatus = async (id: string, isActive: boolean) => {
  const response = await axiosInstance.put(`/api/staff/${id}/status`, { isActive });
  return response.data as { success: boolean; data: StaffUser; message?: string };
};

export const deleteStaff = async (id: string) => {
  const response = await axiosInstance.delete(`/api/staff/${id}`);
  return response.data as { success: boolean; message?: string };
};

export const resetStaffCredentials = async (id: string, newPassword: string) => {
  const response = await axiosInstance.post(`/api/staff/${id}/reset-credentials`, { newPassword });
  return response.data as { success: boolean; message?: string };
};

export const resendStaffCredentials = async (id: string) => {
  const response = await axiosInstance.post(`/api/staff/${id}/resend-credentials`);
  return response.data as {
    success: boolean;
    message?: string;
    data?: {
      staffId: string;
      email: string;
      passwordSetup: boolean;
      lastCredentialsSentAt?: string | null;
    };
  };
};
