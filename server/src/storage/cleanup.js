function createCleanupRunner(cleanup, { defer = setImmediate, cancel = clearImmediate } = {}) {
  let pending;
  let disposed = false;
  function run() {
    if (disposed || pending !== undefined) return;
    if (cleanup().hasMore) {
      pending = defer(() => { pending = undefined; run(); });
      pending?.unref?.();
    }
  }
  return { run, dispose() { disposed = true; if (pending !== undefined) cancel(pending); pending = undefined; } };
}
module.exports = { createCleanupRunner };
