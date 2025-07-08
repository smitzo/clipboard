const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createTextCipher } = require('../src/security/cipher');
test('authenticated encryption preserves Unicode and rejects tampering', () => {
 const cipher = createTextCipher('generic-test-secret');
 const first = cipher.encrypt('α 🚲\n'); const second = cipher.encrypt('α 🚲\n');
 assert.notEqual(first.iv, second.iv); assert.equal(cipher.decrypt(first), 'α 🚲\n');
 assert.throws(() => cipher.decrypt({ ...first, authTag: Buffer.alloc(16).toString('base64') }));
});

test('invalid IVs, tags, ciphertext and secrets fail closed', () => {
 for (const secret of ['', '  ', undefined, 123]) assert.throws(() => createTextCipher(secret));
 const cipher = createTextCipher('fixture'); const room = cipher.encrypt('fixture');
 for (const altered of [
  { iv: 'invalid' }, { iv: Buffer.alloc(16).toString('base64') },
  { authTag: Buffer.alloc(8).toString('base64') }, { encryptedText: '??' },
  { encryptedText: Buffer.from('tampered').toString('base64') },
 ]) assert.throws(() => cipher.decrypt({ ...room, ...altered }));
 assert.throws(() => require('../src/config').loadConfig({ CLIPBOARD_SECRET: '   ' }));
});
