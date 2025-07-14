export function resolveApiUrl(value, { development = true, origin = 'http://localhost:5173' } = {}) {
  const configured = value === undefined || value === '' ? (development ? 'http://localhost:5000/api' : `${origin}/api`) : value;
  let url;
  try { url = new URL(configured); } catch { throw new Error('API URL must be an absolute HTTP(S) URL.'); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
    throw new Error('API URL must use HTTP(S) without credentials, query or fragment.');
  }
  if (origin.startsWith('https:') && url.protocol !== 'https:') throw new Error('API URL must use HTTPS on a secure page.');
  return url.href.replace(/\/+$/, '');
}

export const API_BASE_URL = resolveApiUrl(import.meta.env.VITE_API_URL, {
  development: import.meta.env.DEV, origin: window.location.origin,
});
