function createHealthState(dependencyReady) {
  let phase = 'initializing';
  return {
    markReady() { if (phase === 'initializing') phase = 'ready'; },
    beginDrain() { phase = 'draining'; },
    ready() { try { return phase === 'ready' && dependencyReady(); } catch { return false; } },
  };
}
module.exports = { createHealthState };
