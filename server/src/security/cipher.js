const crypto = require('node:crypto');
function createTextCipher(secret) {
if (typeof secret !== 'string' || !secret.trim()) throw new Error('Encryption secret is required.');
const encryptionKey = crypto.createHash('sha256').update(secret).digest();
function encryptText(text) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);

  return {
    encryptedText: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    authTag: cipher.getAuthTag().toString('base64'),
  };
}
function decryptRoom(room) {
  function decode(key, length) {
    const value = room[key];
    if (typeof value !== 'string' || !value || Buffer.from(value, 'base64').toString('base64') !== value) throw new Error('Invalid encrypted record.');
    const bytes = Buffer.from(value, 'base64');
    if (length && bytes.length !== length) throw new Error('Invalid encrypted record.');
    return bytes;
  }
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    encryptionKey,
    decode('iv', 12)
  );

  decipher.setAuthTag(decode('authTag', 16));

  return Buffer.concat([
    decipher.update(decode('encryptedText')),
    decipher.final(),
  ]).toString('utf8');
}
return { encrypt: encryptText, decrypt: decryptRoom };
}
module.exports = { createTextCipher };
