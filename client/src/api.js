import { API_BASE_URL } from './config';
import { withRequestDeadline } from './request-deadline';

export class ApiError extends Error {
  constructor(message, { status = 0, code = 'REQUEST_FAILED', retryAfter = null } = {}) {
    super(message); this.name = 'ApiError'; this.status = status; this.code = code; this.retryAfter = retryAfter;
  }
}

function validateRoom(data, includeText) {
  const valid = data && typeof data === 'object' && !Array.isArray(data)
    && /^[A-Za-z0-9]{8,32}$/.test(data.roomId)
    && Number.isSafeInteger(data.charCount) && data.charCount >= 0
    && ['createdAt', 'updatedAt', 'expiresAt'].every(key => typeof data[key] === 'string' && Number.isFinite(Date.parse(data[key])))
    && (data.revision === undefined || (Number.isSafeInteger(data.revision) && data.revision >= 1))
    && (!includeText || (typeof data.text === 'string' && data.text.length === data.charCount));
  if (!valid) throw new ApiError('The server returned invalid room data.', { code: 'INVALID_RESPONSE' });
  return data;
}

export function createApi({ baseUrl = API_BASE_URL, fetchImpl = (...args) => fetch(...args), timeoutMs = 15000 } = {}) {
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1) throw new Error('Invalid request deadline.');
  async function request(path, { headers, signal, ...options } = {}) {
   return withRequestDeadline(async activeSignal => {
    const response = await fetchImpl(`${baseUrl}${path}`, {
      ...options, signal: activeSignal, headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...headers },
    });
    let data = null;
    if (response.status !== 204) {
      try { data = JSON.parse(await response.text()); }
      catch (error) { if (activeSignal.aborted) throw error; if (response.ok) throw new ApiError('The server returned an unreadable response.', { code: 'INVALID_RESPONSE' }); }
    }
    if (!response.ok) {
      throw new ApiError(typeof data?.message === 'string' ? data.message : 'The server could not complete this request.', {
        status: response.status, code: typeof data?.code === 'string' ? data.code : 'REQUEST_FAILED',
        retryAfter: response.headers?.get('retry-after') || null,
      });
    }
    return data;
   }, { signal, timeoutMs, errorFactory: (message, code) => new ApiError(message, { code }) });
  }
  return {
    create: async (text, ttlMinutes, options) => validateRoom(await request('/rooms', { ...options, method: 'POST', body: JSON.stringify({ text, ttlMinutes }) }), false),
    read: async (id, options) => validateRoom(await request(`/rooms/${encodeURIComponent(id)}`, options), true),
    update: async (id, text, { revision, ...options } = {}) => validateRoom(await request(`/rooms/${encodeURIComponent(id)}`, {
      ...options, method: 'PUT', headers: revision === undefined ? {} : { 'If-Match': `"${revision}"` }, body: JSON.stringify({ text }),
    }), false),
    async remove(id, options) {
      const data = await request(`/rooms/${encodeURIComponent(id)}`, { ...options, method: 'DELETE' });
      if (data !== null) throw new ApiError('The server returned invalid deletion data.', { code: 'INVALID_RESPONSE' });
    },
  };
}

export const api = createApi();
