import axios from 'axios';

const configuredBackendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const isHttpsPage = typeof window !== 'undefined' && window.location.protocol === 'https:';
const backendUrl =
  isHttpsPage && configuredBackendUrl.startsWith('http://')
    ? configuredBackendUrl.replace(/^http:\/\//, 'https://')
    : configuredBackendUrl;

if (isHttpsPage && configuredBackendUrl.startsWith('http://')) {
  console.error(
    '[SmartClass] Insecure VITE_BACKEND_URL blocked on HTTPS page. ' +
      `Configured: ${configuredBackendUrl}. Using: ${backendUrl}`
  );
}

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
    // Surface likely deployment misconfigurations with a clearer message.
    if (!error.response && isHttpsPage && configuredBackendUrl.startsWith('http://')) {
      console.error(
        '[SmartClass] Request failed before reaching backend. ' +
          'Set VITE_BACKEND_URL to a valid HTTPS API URL in Vercel environment variables.'
      );
    }
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