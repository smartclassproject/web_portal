import axiosInstance from './axiosInstance';

export const getSchoolStudents = async (page = 1, limit = 10) => {
  const response = await axiosInstance.get(`/api/students/students?page=${page}&limit=${limit}`);
  return response.data;
};

export type StudentDependenciesResponse = {
  majors: Array<{ _id: string; name: string; code?: string }>;
  classes: Array<{ _id: string; name: string; code?: string }>;
};

export const getStudentDependencies = async () => {
  const response = await axiosInstance.get('/api/students/dependencies');
  return response.data as { success: boolean; data: StudentDependenciesResponse };
};

export const downloadStudentImportTemplate = async () => {
  const response = await axiosInstance.get('/api/students/import/template', {
    responseType: 'blob',
  });
  return response.data as Blob;
};

export type StudentCsvImportRowResult = {
  rowNumber: number;
  status: 'created' | 'failed' | 'skipped';
  studentId?: string;
  errors: string[];
};

export type StudentCsvImportResponse = {
  summary: {
    totalRows: number;
    validRows: number;
    createdCount: number;
    failedCount: number;
  };
  results: StudentCsvImportRowResult[];
};

export const importStudentsCsv = async (file: File) => {
  const form = new FormData();
  form.append('file', file);
  const response = await axiosInstance.post('/api/students/import/csv', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data as { success: boolean; data: StudentCsvImportResponse; message: string };
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
