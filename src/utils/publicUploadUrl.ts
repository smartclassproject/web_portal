const backendBase = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000').replace(/\/$/, '');
const isBrowser = typeof window !== 'undefined';
const isHttpsPage = isBrowser && window.location.protocol === 'https:';

const toSameOriginUploadUrl = (pathname: string) => {
  if (isBrowser) {
    return `${window.location.origin}${pathname}`;
  }
  return pathname;
};

/** Turn `/uploads/...` or full URLs into a browser-loadable image URL. */
export function publicUploadUrl(path?: string | null): string {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) {
    if (!isHttpsPage) return path;
    try {
      const parsed = new URL(path);
      if (parsed.protocol === 'http:' && parsed.pathname.startsWith('/uploads/')) {
        return toSameOriginUploadUrl(parsed.pathname);
      }
      return path;
    } catch {
      return path;
    }
  }

  const p = path.startsWith('/') ? path : `/${path}`;
  if (isHttpsPage && p.startsWith('/uploads/')) {
    return toSameOriginUploadUrl(p);
  }
  return `${backendBase}${p}`;
}
