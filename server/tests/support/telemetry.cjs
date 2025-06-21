// Benchmark-only preload: never loaded by the production entry point.
const { monitorEventLoopDelay } = require('node:perf_hooks');
const delay = monitorEventLoopDelay({ resolution: 10 });
delay.enable();
setInterval(() => {
  process.send?.({ type: 'benchmark', rss: process.memoryUsage().rss,
    heapUsed: process.memoryUsage().heapUsed, eventLoopP95Ms: delay.percentile(95) / 1e6 });
}, 100).unref();
