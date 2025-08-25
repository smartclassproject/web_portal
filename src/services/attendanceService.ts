import axiosInstance from './axiosInstance';

export const getAttendance = async (page = 1, limit = 10) => {
  const response = await axiosInstance.get(`/api/attendance?page=${page}&limit=${limit}`);
  return response.data;
};

export const getSchoolAttendance = async (page = 1, limit = 10) => {
  const response = await axiosInstance.get(`/api/attendance/school/attendance?page=${page}&limit=${limit}`);
  return response.data;
};


export const getAttendanceBySchool = async (schoolId: string, page = 1, limit = 10) => {
  const response = await axiosInstance.get(`/api/attendance/school/${schoolId}?page=${page}&limit=${limit}`);
  return response.data;
};

export const getAttendanceByDate = async (date: string, page = 1, limit = 10) => {
  const response = await axiosInstance.get(`/api/attendance/date/${date}?page=${page}&limit=${limit}`);
  return response.data;
}; 