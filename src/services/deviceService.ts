import axiosInstance from './axiosInstance';

export const getDevices = async (page = 1, limit = 10, queryParams = '') => {
  const url = queryParams ? `/api/devices?${queryParams}` : `/api/devices?page=${page}&limit=${limit}`;
  const response = await axiosInstance.get(url);
  return response.data;
};

export const getSchoolDevices = async (page = 1, limit = 10, queryParams = '') => {
  const url = queryParams ? `/api/devices/school/devices?${queryParams}` : `/api/devices/school/devices?page=${page}&limit=${limit}`;
  const response = await axiosInstance.get(url);
  return response.data;
};

export const getDevicesBySchool = async (schoolId: string, page = 1, limit = 10) => {
  const response = await axiosInstance.get(`/api/devices/school/${schoolId}?page=${page}&limit=${limit}`);
  return response.data;
};

export const createDevice = async (device: {
  schoolId: string;
  classroom: string;
  location: string;
  deviceType?: string;
  serialNumber?: string;
  model?: string;
  manufacturer?: string;
  firmwareVersion?: string;
  status?: 'Operational' | 'Maintenance' | 'Offline' | 'Error';
  isActive?: boolean;
  batteryLevel?: number;
  signalStrength?: number;
  notes?: string;
}) => {
  const response = await axiosInstance.post('/api/devices', device);
  return response.data;
};

export const updateDevice = async (id: string, device: {
  classroom?: string;
  location?: string;
  isActive?: boolean;
  deviceType?: string;
  serialNumber?: string;
  model?: string;
  manufacturer?: string;
  firmwareVersion?: string;
  lastMaintenance?: string;
  nextMaintenance?: string;
  status?: 'Operational' | 'Maintenance' | 'Offline' | 'Error';
  notes?: string;
}) => {
  const response = await axiosInstance.put(`/api/devices/${id}`, device);
  return response.data;
};

export const deleteDevice = async (id: string) => {
  const response = await axiosInstance.delete(`/api/devices/${id}`);
  return response.data;
}; 