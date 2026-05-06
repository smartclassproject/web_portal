import axios, { type AxiosError } from 'axios';

type ApiErrorBody = {
  message?: string;
  errors?: Array<{ message?: string; msg?: string; field?: string }>;
};

/**
 * Human-readable message from axios errors (backend JSON, validation arrays, network).
 */
export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const ax = error as AxiosError<ApiErrorBody>;
    const data = ax.response?.data;

    if (data && typeof data === 'object') {
      if (typeof data.message === 'string' && data.message.trim()) {
        return data.message.trim();
      }
      if (Array.isArray(data.errors) && data.errors.length > 0) {
        const parts = data.errors
          .map((e) => e?.message || e?.msg || e?.field)
          .filter((s): s is string => typeof s === 'string' && s.length > 0);
        if (parts.length) {
          return parts.slice(0, 4).join('; ');
        }
      }
    }

    const status = ax.response?.status;
    if (!ax.response) {
      return 'Network error. Check your connection and try again.';
    }
    if (status === 401) {
      return typeof data?.message === 'string' && data.message.trim()
        ? data.message.trim()
        : 'Unauthorized. Please sign in again.';
    }
    if (status === 403) {
      return typeof data?.message === 'string' && data.message.trim()
        ? data.message.trim()
        : 'Access denied.';
    }
    if (status === 404) {
      return typeof data?.message === 'string' && data.message.trim()
        ? data.message.trim()
        : 'Resource not found.';
    }
    return ax.response.statusText || `Request failed (${status})`;
  }

  if (error instanceof Error) {
    return error.message;
  }
  return 'Something went wrong. Please try again.';
}
