const { spawn } = require('node:child_process');
const net = require('node:net');
const { setTimeout: pause } = require('node:timers/promises');
const path = require('node:path');

async function startApi(overrides = {}, { instrument = false } = {}) {
  const reservation = net.createServer();
  await new Promise((resolve, reject) => {
    reservation.once('error', reject);
    reservation.listen(0, '127.0.0.1', resolve);
  });
  const port = reservation.address().port;
  await new Promise(resolve => reservation.close(resolve));
  const child = spawn(process.execPath, [...(instrument ? ['--require', path.resolve(__dirname, 'telemetry.cjs')] : []), 'server.js'], {
    cwd: path.resolve(__dirname, '../..'), stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
    env: { ...process.env, PORT: String(port), CLIENT_URL: 'http://localhost:5173',
      CORS_ORIGIN: 'http://localhost:5173', CLIPBOARD_SECRET: 'generic-test-secret-never-for-real-data',
      MAX_TEXT_CHARS: '20000', DEFAULT_TTL_MINUTES: '60', MAX_TTL_MINUTES: '1440', ...overrides },
  });
  const exited = new Promise(resolve => child.once('exit', resolve));
  let metrics = null;
  child.on('message', message => { if (message?.type === 'benchmark') metrics = message; });
  child.stdout.resume(); child.stderr.resume();
  const origin = `http://127.0.0.1:${port}`;
  async function request(route, { method = 'GET', body, headers = {} } = {}) {
    const response = await fetch(`${origin}/api${route}`, {
      method, headers: { ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...headers },
      body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(5000),
    });
    const text = await response.text();
    let data;
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }
    return { status: response.status, headers: response.headers, data };
  }
  async function stop() {
    if (child.exitCode !== null || child.signalCode !== null) return;
    child.kill('SIGTERM');
    const timeout = setTimeout(() => child.kill('SIGKILL'), 2000);
    timeout.unref();
    await exited;
    clearTimeout(timeout);
  }
  try {
    for (let attempt = 0; attempt < 100; attempt++) {
      if (child.exitCode !== null) throw new Error('API process exited before readiness');
      try { if ((await request('/health')).status === 200) return { origin, request, stop, child, get metrics() { return metrics; } }; }
      catch { /* The listener may not have started yet. */ }
      await pause(25);
    }
    throw new Error('API readiness timeout');
  } catch (error) { await stop(); throw error; }
}
module.exports = { startApi };
