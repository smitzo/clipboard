import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { setTimeout as pause } from 'node:timers/promises';

const child = spawn(process.execPath, ['scripts/dev.mjs'], {
  stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, PORT: '15079' },
});
let output = '';
child.stdout.on('data', chunk => { output += chunk; });
child.stderr.on('data', chunk => { output += chunk; });
const exited = new Promise(resolve => child.once('exit', resolve));
try {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (child.exitCode !== null) throw new Error(`Development process exited: ${output}`);
    if (output.includes('15079') && output.includes('Local:')) break;
    await pause(100);
  }
  assert.match(output, /Local:/);
  assert.equal((await fetch('http://127.0.0.1:15079/api/health')).status, 200);
} finally {
  child.kill('SIGTERM');
  await exited;
}
await assert.rejects(fetch('http://127.0.0.1:15079/api/health'));
console.log('PASS: root developer command starts and stops both processes');
