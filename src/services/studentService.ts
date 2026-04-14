import axiosInstance from './axiosInstance';

export const getSchoolStudents = async (page = 1, limit = 10) => {
  const response = await axiosInstance.get(`/api/students/students?page=${page}&limit=${limit}`);
  return response.data;
};

export const uploadStudentPhoto = async (file: File) => {
  const form = new FormData();
  form.append('photo', file);
  const response = await axiosInstance.post('/api/students/profile-photo', form);
  return response.data as { success: boolean; data?: { profileUrl: string }; message?: string };
};

export type CreateStudentPayload = {
  name: string;
  cardId?: string;
  majorId: string;
  classId: string;
  dateOfBirth: string;
  email?: string;
  phone?: string;
  parentFirstName?: string;
  parentLastName?: string;
  parentPhoneNumber?: string;
  profileUrl?: string;
  isActive: boolean;
  enrollmentYear?: number;
  enrollmentDate?: string;
  gender: string;
  entryTerm: number;
  enrollmentSeason: string;
  enrollmentCohortYear: number;
  academicYear: number;
};

export const createStudent = async (student: CreateStudentPayload) => {
  const response = await axiosInstance.post('/api/students/students', student);
  return response.data;
};

export type UpdateStudentPayload = {
  name: string;
  cardId?: string;
  classId?: string;
  majorId: string;
  dateOfBirth: string;
  email?: string;
  phone?: string;
  parentFirstName?: string;
  parentLastName?: string;
  parentPhoneNumber?: string;
  isActive: boolean;
  enrollmentYear?: number;
  profileUrl?: string;
  gender?: string;
  entryTerm?: number;
  enrollmentSeason?: string;
  enrollmentCohortYear?: number;
  academicYear?: number;
};

export const updateStudent = async (id: string, student: UpdateStudentPayload) => {
  const response = await axiosInstance.put(`/api/students/students/${id}`, student);
  return response.data;
};

export const deleteStudent = async (id: string) => {
  const response = await axiosInstance.delete(`/api/students/students/${id}`);
  return response.data;
};
