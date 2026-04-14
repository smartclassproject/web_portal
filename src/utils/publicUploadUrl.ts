const backendBase = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000').replace(/\/$/, '');

/** Turn `/uploads/...` or full URLs into a browser-loadable image URL. */
export function publicUploadUrl(path?: string | null): string {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${backendBase}${p}`;
}
