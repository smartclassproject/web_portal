import type { CreateScheduleData, Schedule, ScheduleResponse, UpdateScheduleData } from '../types';
import axiosInstance from './axiosInstance';

// Get schedules with pagination and date filtering
export const getSchedules = async (
  page = 1, 
  limit = 10, 
  startDate?: string, 
  endDate?: string
): Promise<ScheduleResponse> => {
  try {
    let url = `/api/schedules?page=${page}&limit=${limit}`;
    
    if (startDate) {
      url += `&startDate=${startDate}`;
    }
    
    if (endDate) {
      url += `&endDate=${endDate}`;
    }
    
    const response = await axiosInstance.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching schedules:', error);
    throw error;
  }
};

// Create a new schedule
export const createSchedule = async (scheduleData: CreateScheduleData): Promise<Schedule> => {
  try {
    const response = await axiosInstance.post('/api/schedules', scheduleData);
    return response.data;
  } catch (error) {
    console.error('Error creating schedule:', error);
    throw error;
  }
};

// Update an existing schedule
export const updateSchedule = async (id: string, scheduleData: UpdateScheduleData): Promise<Schedule> => {
  try {
    const response = await axiosInstance.put(`/api/schedules/${id}`, scheduleData);
    return response.data;
  } catch (error) {
    console.error('Error updating schedule:', error);
    throw error;
  }
};

// Delete a schedule
export const deleteSchedule = async (id: string): Promise<void> => {
  try {
    await axiosInstance.delete(`/api/schedules/${id}`);
  } catch (error) {
    console.error('Error deleting schedule:', error);
    throw error;
  }
};
