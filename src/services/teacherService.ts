import axiosInstance from './axiosInstance';

export const getSchoolTeachers = async (page = 1, limit = 10) => {
  const response = await axiosInstance.get(`/api/teachers/teachers?page=${page}&limit=${limit}`);
  return response.data;
};

export const createTeacher = async (teacher: { 
  schoolId: string; 
  name: string; 
  email: string; 
  phone: string; 
  department?: string; 
  specialization?: string; 
  profileUrl?: string; 
}) => {
  const response = await axiosInstance.post('/api/teachers/teachers', teacher);
  return response.data;
};

export const updateTeacher = async (id: string, teacher: { 
  name: string; 
  email: string; 
  phone: string; 
  department?: string; 
  specialization?: string; 
  profileUrl?: string; 
}) => {
  const response = await axiosInstance.put(`/api/teachers/teachers/${id}`, teacher);
  return response.data;
};

export const deleteTeacher = async (id: string) => {
  const response = await axiosInstance.delete(`/api/teachers/teachers/${id}`);
  return response.data;
};
