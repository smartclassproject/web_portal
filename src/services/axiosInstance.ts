import axios from 'axios';

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const axiosInstance = axios.create({
  baseURL: backendUrl,
  headers: {
    'Accept': 'application/json',
  },
});

axiosInstance.interceptors.request.use(
  async (config) => {
    // For web, use localStorage. For React Native, use AsyncStorage.
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => {
    const data = response?.data;
    if (
      data &&
      data.success === false &&
      (data.message === 'Token expired' || data.message?.toLowerCase().includes('token expired'))
    ) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return Promise.reject(new Error(data.message));
    }
    return response;
  },
  (error) => {
    const data = error.response?.data;
    if (
      data &&
      data.success === false &&
      (data.message === 'Token expired' || data.message?.toLowerCase().includes('token expired'))
    ) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance; 