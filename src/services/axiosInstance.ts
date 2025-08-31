import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'https://backend-d602.onrender.com',
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

export default axiosInstance; 