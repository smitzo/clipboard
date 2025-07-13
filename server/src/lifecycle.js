const http = require('node:http');
const { createCleanupRunner } = require('./storage/cleanup');
async function startServer({ app, port = 5000, host, intervalMs = 300000, schedule = setInterval, cancel = clearInterval, drainTimeoutMs = app.locals.config.shutdownTimeoutMs }) {
 const timeout = app.locals.config.requestTimeoutMs;
 const server = http.createServer({ requestTimeout: timeout, headersTimeout: Math.min(timeout, 15000), connectionsCheckingInterval: Math.min(timeout, 1000) }, app);
 const sockets = new Set();
 let draining = false;
 server.on('connection', socket => { sockets.add(socket); socket.once('close', () => sockets.delete(socket)); });
 server.on('request', (req, res) => { res.once('finish', () => { if (draining) req.socket.end(); }); });
 try {
  await new Promise((resolve, reject) => {
   server.once('error', reject); server.listen(port, host, () => { server.removeListener('error', reject); resolve(); });
  });
 } catch (error) { app.locals.dispose(); throw error; }
 const cleanup = createCleanupRunner(app.locals.cleanupExpiredRooms);
 let timer;
 try { timer = schedule(cleanup.run, intervalMs); timer.unref?.(); }
 catch (error) { cleanup.dispose(); await new Promise(resolve => server.close(resolve)); app.locals.dispose(); throw error; }
 app.locals.health.markReady();
 let stopping;
 function stop() {
  if (!stopping) {
   draining = true;
   cancel(timer);
   app.locals.health.beginDrain();
   cleanup.dispose();
   stopping = new Promise((resolve, reject) => {
    const deadline = setTimeout(() => { for (const socket of sockets) socket.destroy(); }, drainTimeoutMs);
    deadline.unref();
    server.close(error => {
     clearTimeout(deadline); app.locals.dispose();
     error ? reject(error) : resolve();
    });
   });
   server.closeIdleConnections();
  }
  return stopping;
 }
 return { server, stop };
}
module.exports = { startServer };
