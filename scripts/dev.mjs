import { spawn } from 'node:child_process';

const processes = [];
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  process.exitCode = code;
  for (const child of processes) child.kill('SIGTERM');
  const deadline = setTimeout(() => {
    for (const child of processes) child.kill('SIGKILL');
  }, 5000);
  deadline.unref();
}
for (const directory of ['server', 'client']) {
  // Spawn Node directly so signals do not leave an npm parent/child orphan.
  const entry = directory === 'server' ? ['--watch', 'server.js'] : ['node_modules/vite/bin/vite.js'];
  const child = spawn(process.execPath, entry, {
    cwd: new URL(`../${directory}/`, import.meta.url),
    stdio: 'inherit',
    env: process.env,
  });
  processes.push(child);
  child.on('error', () => stop(1));
  child.on('exit', (code, signal) => {
    if (!stopping) stop(signal ? 1 : code || 0);
  });
}
process.once('SIGINT', () => stop());
process.once('SIGTERM', () => stop());
