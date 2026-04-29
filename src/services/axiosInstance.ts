import axios from 'axios';

const isBrowser = typeof window !== 'undefined';
const isHttpsPage = isBrowser && window.location.protocol === 'https:';
const configuredBackendUrl = import.meta.env.VITE_BACKEND_URL?.trim();
const insecureConfiguredOnHttps = Boolean(
  isHttpsPage && configuredBackendUrl && configuredBackendUrl.startsWith('http://')
);
const backendUrl =
  insecureConfiguredOnHttps
    ? ''
    : (configuredBackendUrl || (isHttpsPage ? '' : 'http://localhost:5000'));
const apiDebugEnabled = import.meta.env.VITE_DEBUG_API === 'true';

const nowMs = () =>
  (typeof performance !== 'undefined' && typeof performance.now === 'function')
    ? performance.now()
    : Date.now();

const toAbsoluteUrl = (base: string | undefined, url: string | undefined) => {
  if (!url) return base || '';
  if (/^https?:\/\//.test(url)) return url;
  if (!base) return url;
  return `${base.replace(/\/$/, '')}/${url.replace(/^\//, '')}`;
};

if (insecureConfiguredOnHttps) {
  console.warn(
    '[RiseMe] Ignoring insecure VITE_BACKEND_URL on HTTPS page and falling back to same-origin API routes.'
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
    const startAt = nowMs();
    config.headers = config.headers || {};
    (config as typeof config & { __requestStartAt?: number }).__requestStartAt = startAt;

    // For web, use localStorage. For React Native, use AsyncStorage.
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    if (apiDebugEnabled) {
      const absoluteUrl = toAbsoluteUrl(config.baseURL, config.url);
      console.info('[RiseMe API] Request', {
        method: (config.method || 'GET').toUpperCase(),
        url: absoluteUrl,
        baseURL: config.baseURL,
        hasAuthToken: Boolean(token),
      });
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => {
    if (apiDebugEnabled) {
      const startAt = (response.config as typeof response.config & { __requestStartAt?: number }).__requestStartAt;
      const durationMs = typeof startAt === 'number' ? Math.round(nowMs() - startAt) : undefined;
      const absoluteUrl = toAbsoluteUrl(response.config.baseURL, response.config.url);
      console.info('[RiseMe API] Response', {
        method: (response.config.method || 'GET').toUpperCase(),
        url: absoluteUrl,
        status: response.status,
        durationMs,
      });
    }

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
    if (apiDebugEnabled) {
      const config = error.config || {};
      const startAt = (config as typeof config & { __requestStartAt?: number }).__requestStartAt;
      const durationMs = typeof startAt === 'number' ? Math.round(nowMs() - startAt) : undefined;
      const absoluteUrl = toAbsoluteUrl(config.baseURL, config.url);
      console.error('[RiseMe API] Error', {
        method: (config.method || 'GET').toUpperCase(),
        url: absoluteUrl,
        status: error.response?.status,
        code: error.code,
        message: error.message,
        isNetworkError: !error.response,
        durationMs,
      });
    }

    // Surface likely deployment misconfigurations with a clearer message.
    if (!error.response && isHttpsPage && backendUrl.startsWith('https://') && /:\d+/.test(backendUrl)) {
      console.error(
        '[RiseMe] Request failed before reaching backend. ' +
          'Use Vercel /api rewrite proxy or a valid HTTPS API domain with a trusted certificate.'
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