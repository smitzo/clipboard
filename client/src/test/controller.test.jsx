import { afterEach, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { api } from '../api';
import { useRoomController } from '../useRoomController';
import { StrictMode } from 'react';

vi.mock('qrcode', () => ({ default: { toDataURL: async () => 'data:image/png;base64,fixture' } }));
export const fixtureRoom = (roomId = 'ABCDEF123456', text = 'fixture', revision = 1) => ({ roomId, text, revision, charCount: text.length, createdAt: '2026-10-28T00:00:00Z', updatedAt: '2026-10-28T00:00:00Z', expiresAt: '2026-10-28T01:00:00Z' });
const deferred = () => { let resolve; let reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
afterEach(() => vi.restoreAllMocks());

it('aborts superseded reads and ignores their late success or failure', async () => {
  const first = deferred(); const second = deferred();
  const read = vi.spyOn(api, 'read').mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
  const { result } = renderHook(() => useRoomController());
  let a; let b;
  act(() => { a = result.current.join.fetchRoom('ABCDEF123456'); });
  act(() => { b = result.current.join.fetchRoom('ZYXWVU654321'); });
  expect(read.mock.calls[0][1].signal.aborted).toBe(true);
  await act(async () => { second.resolve(fixtureRoom('ZYXWVU654321', 'latest')); await b; });
  await act(async () => { first.reject(new Error('stale error')); await a; });
  expect(result.current.editor.clipboardText).toBe('latest');
  expect(result.current.editor.room.roomId).toBe('ZYXWVU654321');
  expect(result.current.feedback.status.type).toBe('success');
});

it('deduplicates query, automatic and explicit joins including StrictMode effect replay', async () => {
  const pending = deferred(); const read = vi.spyOn(api, 'read').mockReturnValue(pending.promise);
  window.history.replaceState(null, '', '?room=ABCDEF123456');
  const { result } = renderHook(() => useRoomController(), { wrapper: StrictMode });
  await act(async () => { await Promise.resolve(); });
  let manual;
  act(() => { manual = result.current.join.fetchRoom('ABCDEF123456'); });
  expect(read).toHaveBeenCalledTimes(1);
  await act(async () => { pending.resolve(fixtureRoom()); await manual; });
  expect(result.current.editor.clipboardText).toBe('fixture');
  expect(read).toHaveBeenCalledTimes(1);
});
