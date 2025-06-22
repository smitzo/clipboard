const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createTextCipher } = require('../src/security/cipher');
test('authenticated encryption preserves Unicode and rejects tampering', () => {
 const cipher = createTextCipher('generic-test-secret');
 const first = cipher.encrypt('α 🚲\n'); const second = cipher.encrypt('α 🚲\n');
 assert.notEqual(first.iv, second.iv); assert.equal(cipher.decrypt(first), 'α 🚲\n');
 assert.throws(() => cipher.decrypt({ ...first, authTag: Buffer.alloc(16).toString('base64') }));
});
