import { performance } from 'node:perf_hooks';
import { mkdir, writeFile } from 'node:fs/promises';
import { setTimeout as pause } from 'node:timers/promises';
import os from 'node:os';
import fixture from '../server/tests/support/process.cjs';

const results = [];
for (const length of [128, 20000]) {
  const api = await fixture.startApi({}, { instrument: true });
  try {
    const timings = { create: [], read: [], update: [], delete: [] };
    const rooms = [];
    const timed = async (operation, route, options) => {
      const start = performance.now();
      const response = await api.request(route, options);
      timings[operation].push(performance.now() - start);
      if (response.status >= 400) throw new Error(`${operation}: unexpected ${response.status}`);
      return response.data;
    };
    for (let group = 0; group < 5; group++) {
      rooms.push(...await Promise.all(Array.from({ length: 4 }, () => timed('create', '/rooms', { method: 'POST', body: { text: 'x'.repeat(length) } }))));
    }
    for (const operation of ['read', 'update', 'delete']) {
      for (let offset = 0; offset < rooms.length; offset += 4) {
        await Promise.all(rooms.slice(offset, offset + 4).map(room => timed(operation, `/rooms/${room.roomId}`,
          operation === 'read' ? {} : operation === 'update' ? { method: 'PUT', body: { text: 'y'.repeat(length) } } : { method: 'DELETE' })));
      }
    }
    await pause(150);
    const routes = Object.fromEntries(Object.entries(timings).map(([key, values]) => {
      values.sort((a, b) => a - b);
      return [key, { samples: values.length, p50Ms: values[Math.floor(values.length * .5)], p95Ms: values[Math.ceil(values.length * .95) - 1] }];
    }));
    results.push({ codeUnits: length, concurrency: 4, routes, metrics: api.metrics });
  } finally { await api.stop(); }
}
const report = { runtime: process.version, platform: process.platform, cpu: os.cpus()[0]?.model, results };
await mkdir('artifacts/performance', { recursive: true });
await writeFile('artifacts/performance/api.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
