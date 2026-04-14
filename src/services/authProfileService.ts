import axiosInstance from './axiosInstance';

export type ProfileResponse =
  | {
      role: 'teacher';
      teacherUser: { _id: string; email: string };
      teacher: Record<string, unknown>;
      school: Record<string, unknown> | null;
    }
  | {
      role: 'super_admin' | 'school_admin';
      admin: Record<string, unknown>;
      school: Record<string, unknown> | null;
    };

export const getProfile = async () => {
  const res = await axiosInstance.get('/api/auth/profile');
  return res.data as { success: boolean; data: ProfileResponse };
};

export const patchProfile = async (body: Record<string, unknown>) => {
  const res = await axiosInstance.patch('/api/auth/profile', body);
  return res.data as { success: boolean; data: ProfileResponse };
};

export const changePassword = async (currentPassword: string, newPassword: string) => {
  const res = await axiosInstance.put('/api/auth/profile/password', { currentPassword, newPassword });
  return res.data;
};

export const uploadProfilePhoto = async (file: File) => {
  const form = new FormData();
  form.append('photo', file);
  const res = await axiosInstance.post('/api/auth/profile/photo', form);
  return res.data as { success: boolean; data?: { profileUrl: string } };
};
