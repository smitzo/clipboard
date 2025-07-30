export function readRetryDelay(error, now = Date.now()) {
  const retryable = ['NETWORK_ERROR', 'TIMEOUT'].includes(error.code) || [429, 502, 503, 504].includes(error.status);
  if (!retryable) return null;
  const hint = error.retryAfter;
  let delay = 1000;
  if (typeof hint === 'string' && /^\d+$/.test(hint)) delay = Number(hint) * 1000;
  else if (hint && Number.isFinite(Date.parse(hint))) delay = Date.parse(hint) - now;
  return Math.min(30000, Math.max(0, delay));
}
