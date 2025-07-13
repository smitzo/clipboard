const http = require('node:http');
const { createCleanupRunner } = require('./storage/cleanup');
async function startServer({ app, port = 5000, host, intervalMs = 300000, schedule = setInterval, cancel = clearInterval }) {
 const server = http.createServer(app);
 await new Promise((resolve, reject) => {
  server.once('error', reject); server.listen(port, host, resolve);
 });
 const cleanup = createCleanupRunner(app.locals.cleanupExpiredRooms);
 const timer = schedule(cleanup.run, intervalMs); timer.unref?.();
 app.locals.health.markReady();
 let stopping;
 function stop() {
  if (!stopping) {
   cancel(timer);
   app.locals.health.beginDrain();
   cleanup.dispose();
   stopping = new Promise((resolve, reject) => server.close(error => {
    app.locals.dispose();
    error ? reject(error) : resolve();
   }));
   server.closeIdleConnections();
  }
  return stopping;
 }
 return { server, stop };
}
module.exports = { startServer };
