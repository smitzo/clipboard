const crypto = require('node:crypto');
function loadConfig(env = process.env) {
  function integer(name, fallback, min, max) {
    const raw = env[name] === undefined ? fallback : env[name];
    const value = typeof raw === 'number' || (typeof raw === 'string' && raw.trim()) ? Number(raw) : NaN;
    if (!Number.isSafeInteger(value) || value < min || value > max) {
      throw new Error(`Invalid configuration: ${name}.`);
    }
    return value;
  }
  const minTtlMinutes = integer('MIN_TTL_MINUTES', 5, 1, 525600);
  const maxTtlMinutes = integer('MAX_TTL_MINUTES', 1440, minTtlMinutes, 525600);
  const defaultTtlMinutes = integer('DEFAULT_TTL_MINUTES', 60, minTtlMinutes, maxTtlMinutes);
  if (env.NODE_ENV === 'production' && (!env.CLIPBOARD_SECRET || env.CLIPBOARD_SECRET.length < 32)) {
    throw new Error('Invalid configuration: CLIPBOARD_SECRET.');
  }
  const clientUrl = env.CLIENT_URL || 'http://localhost:5173';
  return {
    port: integer('PORT', 5000, 0, 65535),
    clientUrl, minTtlMinutes, defaultTtlMinutes, maxTtlMinutes,
    maxTextChars: integer('MAX_TEXT_CHARS', 20000, 1, 20000),
    maxRooms: integer('MAX_ROOMS', 1000, 1, 1000000),
    maxStorageBytes: integer('MAX_STORAGE_BYTES', 64 * 1024 * 1024, 1, 1024 * 1024 * 1024),
    secret: env.CLIPBOARD_SECRET || crypto.randomBytes(32).toString('hex'),
    allowedOrigins: new Set((env.CORS_ORIGIN || clientUrl).split(',').map(origin => origin.trim()).filter(Boolean)),
  };
}
module.exports = { loadConfig };
