import 'axios';

declare module 'axios' {
  export interface AxiosRequestConfig {
    /** When true, the global response error toast is not shown (caller handles UX). */
    skipErrorToast?: boolean;
  }
}
