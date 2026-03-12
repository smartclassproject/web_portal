import type { Exam } from '../types';
import axiosInstance from './axiosInstance';

export interface CreateExamData {
  courseId: string;
  scheduleId?: string;
  title: string;
  description?: string;
  examDate: string;
  examTime: string;
  duration?: number;
  maxScore?: number;
  reportUrl?: string;
  isPublished?: boolean;
}

export interface UpdateExamData {
  title?: string;
  description?: string;
  examDate?: string;
  examTime?: string;
  duration?: number;
  maxScore?: number;
  reportUrl?: string;
  isPublished?: boolean;
}

export interface ExamResponse {
  data: Exam[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

// Get exams with pagination and filters
export const getExams = async (
  page = 1,
  limit = 10,
  courseId?: string,
  scheduleId?: string,
  isPublished?: boolean
): Promise<ExamResponse> => {
  try {
    let url = `/api/exams?page=${page}&limit=${limit}`;
    
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
    console.error('Error fetching exams:', error);
    throw error;
  }
};

// Get exam by ID
export const getExamById = async (id: string): Promise<Exam> => {
  try {
    const response = await axiosInstance.get(`/api/exams/${id}`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching exam:', error);
    throw error;
  }
};

// Create a new exam
export const createExam = async (examData: CreateExamData): Promise<Exam> => {
  try {
    const response = await axiosInstance.post('/api/exams', examData);
    return response.data.data;
  } catch (error) {
    console.error('Error creating exam:', error);
    throw error;
  }
};

// Update an exam
export const updateExam = async (id: string, examData: UpdateExamData): Promise<Exam> => {
  try {
    const response = await axiosInstance.put(`/api/exams/${id}`, examData);
    return response.data.data;
  } catch (error) {
    console.error('Error updating exam:', error);
    throw error;
  }
};

// Delete an exam
export const deleteExam = async (id: string): Promise<void> => {
  try {
    await axiosInstance.delete(`/api/exams/${id}`);
  } catch (error) {
    console.error('Error deleting exam:', error);
    throw error;
  }
};
