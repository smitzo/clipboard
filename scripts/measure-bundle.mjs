import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';

const assets = await readdir('client/dist/assets');
const sizes = [];
for (const name of assets.filter(name => /\.(js|css)$/.test(name))) {
  const bytes = await readFile(`client/dist/assets/${name}`);
  sizes.push({ name, bytes: bytes.length, gzipBytes: gzipSync(bytes).length });
}
const report = { runtime: process.version, assets: sizes };
await mkdir('artifacts/performance', { recursive: true });
await writeFile('artifacts/performance/bundle.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
