const crypto = require('node:crypto');
function loadConfig(env = process.env) {
 const clientUrl = env.CLIENT_URL || 'http://localhost:5173';
 return { port: Number(env.PORT || 5000), clientUrl, defaultTtlMinutes: Number(env.DEFAULT_TTL_MINUTES || 60), maxTtlMinutes: Number(env.MAX_TTL_MINUTES || 1440), maxTextChars: Number(env.MAX_TEXT_CHARS || 20000), secret: env.CLIPBOARD_SECRET || crypto.randomBytes(32).toString('hex'), allowedOrigins: new Set((env.CORS_ORIGIN || clientUrl).split(',').map(origin => origin.trim()).filter(Boolean)) };
}
module.exports = { loadConfig };
