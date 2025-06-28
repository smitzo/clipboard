const http = require('node:http');
async function startServer({ app, port = 5000, host, intervalMs = 300000, schedule = setInterval, cancel = clearInterval }) {
 const server = http.createServer(app);
 await new Promise((resolve, reject) => {
  server.once('error', reject); server.listen(port, host, resolve);
 });
 const timer = schedule(app.locals.cleanupExpiredRooms, intervalMs); timer.unref?.();
 let stopping;
 function stop() {
  if (!stopping) {
   cancel(timer);
   stopping = new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
   server.closeIdleConnections();
  }
  return stopping;
 }
 return { server, stop };
}
module.exports = { startServer };
