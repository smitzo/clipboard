const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { loadConfig } = require('../src/config');

test('configuration rejects invalid limits and inconsistent lifetimes without values in errors', () => {
  for (const config of [
    { PORT: '-1' }, { PORT: '65536' }, { PORT: 'NaN' }, { PORT: '' },
    { MAX_TEXT_CHARS: 'Infinity' }, { MAX_TEXT_CHARS: '1.5' },
    { MIN_TTL_MINUTES: '10', DEFAULT_TTL_MINUTES: '5' },
    { MIN_TTL_MINUTES: '20', MAX_TTL_MINUTES: '10' },
    { DEFAULT_TTL_MINUTES: '2000' }, { NODE_ENV: 'production' },
    { NODE_ENV: 'production', CLIPBOARD_SECRET: 'secret-value' },
  ]) {
    assert.throws(() => loadConfig(config), error => {
      assert.match(error.message, /^Invalid configuration: [A-Z_]+\.$/);
      assert.ok(!error.message.includes('secret-value'));
      return true;
    });
  }
  assert.equal(loadConfig({ PORT: '0' }).port, 0);
  assert.equal(loadConfig({ NODE_ENV: 'production', CLIPBOARD_SECRET: 's'.repeat(32) }).secret.length, 32);
});

test('bad process configuration exits before announcing a listener', () => {
  const process = spawnSync(global.process.execPath, ['server.js'], {
    cwd: require('node:path').resolve(__dirname, '..'),
    env: { ...global.process.env, PORT: 'invalid' }, encoding: 'utf8', timeout: 5000,
  });
  assert.equal(process.status, 1);
  assert.ok(!process.stdout.includes('running'));
  assert.match(process.stderr, /API startup failed/);
});
