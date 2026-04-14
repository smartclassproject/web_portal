import axiosInstance from './axiosInstance';

export const getSchools = async (page = 1, limit = 10) => {
  const response = await axiosInstance.get(`/api/schools?page=${page}&limit=${limit}`);
  return response.data;
};

export const createSchool = async (school: { name: string; location: string }) => {
  const response = await axiosInstance.post('/api/schools', school);
  return response.data;
};

export const updateSchool = async (id: string, school: { name: string; location: string }) => {
  const response = await axiosInstance.put(`/api/schools/${id}`, school);
  return response.data;
};

export const deleteSchool = async (id: string) => {
  const response = await axiosInstance.delete(`/api/schools/${id}`);
  return response.data;
};

export const getSchoolAdmins = async (page = 1, limit = 10) => {
  const response = await axiosInstance.get(`/api/admins?page=${page}&limit=${limit}`);
  return response.data;
};

/** Get current user's school (school_admin). */
export const getMySchool = async () => {
  const response = await axiosInstance.get('/api/schools/my-school');
  return response.data;
};

/** Update current user's school (school_admin; name, location, numberOfTerms, shortCode). */
export const updateMySchool = async (data: {
  name?: string;
  location?: string;
  numberOfTerms?: number;
  shortCode?: string;
  enrollmentSemestersEnabled?: string[];
  defaultEnrollmentSemester?: string | null;
}) => {
  const response = await axiosInstance.put('/api/schools/my-school', data);
  return response.data;
};