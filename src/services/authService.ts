import axiosInstance from './axiosInstance';
import type { LoginCredentials } from '../types';

export const login = async (credentials: LoginCredentials) => {
  const response = await axiosInstance.post('/api/auth/login', credentials);
  return response.data;
};

export const logout = async () => {
  const response = await axiosInstance.post('/api/auth/logout');
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await axiosInstance.get('/api/auth/me');
  return response.data;
}; 

export const setupPassword = async (token: string, password: string) => {
  const response = await axiosInstance.post('/api/auth/setup-password', {
    token,
    password
  });
  return response.data;
};

export const forgotPassword = async (email: string) => {
  const response = await axiosInstance.post('/api/auth/forgot-password', {
    email
  });
  return response.data;
};

export const resetPassword = async (token: string, password: string) => {
  const response = await axiosInstance.post('/api/auth/reset-password', {
    token,
    password
  });
  return response.data;
}; 