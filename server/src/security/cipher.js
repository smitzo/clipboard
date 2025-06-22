const crypto = require('node:crypto');
function createTextCipher(secret) {
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
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    encryptionKey,
    Buffer.from(room.iv, 'base64')
  );

  decipher.setAuthTag(Buffer.from(room.authTag, 'base64'));

  return Buffer.concat([
    decipher.update(Buffer.from(room.encryptedText, 'base64')),
    decipher.final(),
  ]).toString('utf8');
}
return { encrypt: encryptText, decrypt: decryptRoom };
}
module.exports = { createTextCipher };
