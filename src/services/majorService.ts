import axiosInstance from './axiosInstance';

export const getSchoolMajors = async (page = 1, limit = 10) => {
  const response = await axiosInstance.get(`/api/majors/school/majors?page=${page}&limit=${limit}`);
  return response.data;
};

export const createMajor = async (major: { schoolId: string; name: string; code: string; description: string }) => {
  const response = await axiosInstance.post('/api/majors/majors', major);
  return response.data;
};

export const updateMajor = async (id: string, major: { name: string; code: string; description: string }) => {
  const response = await axiosInstance.put(`/api/majors/majors/${id}`, major);
  return response.data;
};

export const deleteMajor = async (id: string) => {
  const response = await axiosInstance.delete(`/api/majors/majors/${id}`);
  return response.data;
};
