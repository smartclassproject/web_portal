import type { Lesson, LessonMaterial } from '../types';
import axiosInstance from './axiosInstance';

export interface CreateLessonData {
  courseId: string;
  scheduleId?: string;
  title: string;
  description?: string;
  lessonDate: string;
  materials?: LessonMaterial[];
  isPublished?: boolean;
}

export interface UpdateLessonData {
  title?: string;
  description?: string;
  lessonDate?: string;
  materials?: LessonMaterial[];
  isPublished?: boolean;
}

export interface LessonResponse {
  data: Lesson[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

// Get lessons with pagination and filters
export const getLessons = async (
  page = 1,
  limit = 10,
  courseId?: string,
  scheduleId?: string,
  isPublished?: boolean
): Promise<LessonResponse> => {
  try {
    let url = `/api/lessons?page=${page}&limit=${limit}`;
    
    if (courseId) {
      url += `&courseId=${courseId}`;
    }
    
    if (scheduleId) {
      url += `&scheduleId=${scheduleId}`;
    }
    
    if (isPublished !== undefined) {
      url += `&isPublished=${isPublished}`;
    }
    
    const response = await axiosInstance.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching lessons:', error);
    throw error;
  }
};

// Get lesson by ID
export const getLessonById = async (id: string): Promise<Lesson> => {
  try {
    const response = await axiosInstance.get(`/api/lessons/${id}`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching lesson:', error);
    throw error;
  }
};

// Create a new lesson
export const createLesson = async (lessonData: CreateLessonData): Promise<Lesson> => {
  try {
    const response = await axiosInstance.post('/api/lessons', lessonData);
    return response.data.data;
  } catch (error) {
    console.error('Error creating lesson:', error);
    throw error;
  }
};

// Update a lesson
export const updateLesson = async (id: string, lessonData: UpdateLessonData): Promise<Lesson> => {
  try {
    const response = await axiosInstance.put(`/api/lessons/${id}`, lessonData);
    return response.data.data;
  } catch (error) {
    console.error('Error updating lesson:', error);
    throw error;
  }
};

// Delete a lesson
export const deleteLesson = async (id: string): Promise<void> => {
  try {
    await axiosInstance.delete(`/api/lessons/${id}`);
  } catch (error) {
    console.error('Error deleting lesson:', error);
    throw error;
  }
};
