import axiosInstance from './axiosInstance';

export interface CreateCourseData {
  name: string;
  code: string;
  majorId: string;
  description: string;
  credits: number;
}

export interface UpdateCourseData {
  name?: string;
  code?: string;
  majorId?: string;
  description?: string;
  credits?: number;
}

export const getSchoolCourses = async (page = 1, limit = 10) => {
  const response = await axiosInstance.get(`/api/courses?page=${page}&limit=${limit}`);
  return response.data;
};

export const createCourse = async (courseData: CreateCourseData) => {
  const response = await axiosInstance.post('/api/courses', courseData);
  return response.data;
};

export const updateCourse = async (id: string, courseData: UpdateCourseData) => {
  const response = await axiosInstance.put(`/api/courses/${id}`, courseData);
  return response.data;
};

export const deleteCourse = async (id: string) => {
  const response = await axiosInstance.delete(`/api/courses/${id}`);
  return response.data;
};
