import { spawnSync } from 'node:child_process';

for (const args of [
  ['--prefix', 'server', 'test'],
  ['--prefix', 'client', 'run', 'lint'],
  ['--prefix', 'client', 'run', 'build'],
]) {
  const result = spawnSync('npm', args, { stdio: 'inherit' });
  if (result.error || result.status !== 0) process.exit(result.status || 1);
}
