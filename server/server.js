require('dotenv').config();
const { createApp } = require('./src/app');
const { loadConfig } = require('./src/config');
const { startServer } = require('./src/lifecycle');
async function main() {
 const config = loadConfig();
 const lifecycle = await startServer({ app: createApp({ config }), port: config.port });
 console.log(`Clipboard API running on http://localhost:${lifecycle.server.address().port}`);
 process.once('SIGTERM', () => lifecycle.stop().catch(() => { process.exitCode = 1; }));
 process.once('SIGINT', () => lifecycle.stop().catch(() => { process.exitCode = 1; }));
}
main().catch(() => { console.error('API startup failed.'); process.exitCode = 1; });
