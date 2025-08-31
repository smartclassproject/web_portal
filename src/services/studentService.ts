import axiosInstance from './axiosInstance';

export const getSchoolStudents = async (page = 1, limit = 10) => {
  const response = await axiosInstance.get(`/api/students/students?page=${page}&limit=${limit}`);
  return response.data;
};

export const createStudent = async (student: { 
  schoolId: string; 
  name: string; 
  studentId: string; 
  cardId: string; 
  majorId: string; 
  class: string; 
  dateOfBirth: string; 
  email: string; 
  phone?: string; 
  profileUrl?: string; 
  isActive: boolean; 
  enrollmentDate: string; 
}) => {
  const response = await axiosInstance.post('/api/students/students', student);
  return response.data;
};

export const updateStudent = async (id: string, student: { 
  name: string; 
  studentId: string; 
  cardId: string; 
  class: string; 
  dateOfBirth: string; 
  email: string; 
  phone?: string; 
  isActive: boolean; 
}) => {
  const response = await axiosInstance.put(`/api/students/students/${id}`, student);
  return response.data;
};

export const deleteStudent = async (id: string) => {
  const response = await axiosInstance.delete(`/api/students/students/${id}`);
  return response.data;
};

