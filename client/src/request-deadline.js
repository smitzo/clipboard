// Covers both fetch and response-body consumption with one owned signal/timer.
export async function withRequestDeadline(action, { signal, timeoutMs, errorFactory }) {
  const controller = new AbortController(); let timedOut = false;
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort, { once: true });
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
  try {
    if (signal?.aborted) controller.abort();
    if (controller.signal.aborted) throw new Error('aborted');
    return await action(controller.signal);
  } catch (error) {
    if (controller.signal.aborted) throw errorFactory(timedOut ? 'Request timed out. Check the room before repeating a save.' : 'Request cancelled.', timedOut ? 'TIMEOUT' : 'ABORTED');
    if (error.name === 'ApiError') throw error;
    throw errorFactory('Could not reach the server. Check your connection and try again.', 'NETWORK_ERROR');
  } finally { clearTimeout(timer); signal?.removeEventListener('abort', abort); }
}
