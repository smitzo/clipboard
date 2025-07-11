const { randomUUID } = require('node:crypto');
const { performance } = require('node:perf_hooks');

function requestDiagnostics(logger) {
  return (req, res, next) => {
    const requestId = randomUUID(); const started = performance.now(); let reported = false;
    res.set('X-Request-ID', requestId);
    function report() {
      if (reported) return;
      reported = true;
      const event = { requestId,
        method: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'OPTIONS'].includes(req.method) ? req.method : 'OTHER',
        route: typeof req.route?.path === 'string' ? req.route.path : 'unmatched',
        status: res.writableFinished ? res.statusCode : 499,
        durationMs: Math.round((performance.now() - started) * 100) / 100,
        code: res.locals.errorCode || null };
      try { logger(event); } catch { /* Logging cannot prevent a response or shutdown. */ }
    }
    res.once('finish', report); res.once('close', report);
    next();
  };
}
module.exports = { requestDiagnostics };
