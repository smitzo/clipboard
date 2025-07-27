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

it('popstate reconciles room and query state while cancelled dirty navigation restores the active URL', async () => {
  vi.spyOn(api, 'read').mockImplementation(async id => fixtureRoom(id, id === 'ABCDEF123456' ? 'first' : 'second'));
  window.history.replaceState({ fixture: true }, '', '/?mode=keep#editor');
  const { result } = renderHook(() => useRoomController());
  await act(async () => result.current.join.fetchRoom('ABCDEF123456'));
  expect(window.location.search).toBe('?mode=keep&room=ABCDEF123456');
  expect(window.history.state).toEqual({ fixture: true });
  act(() => result.current.editor.setClipboardText('dirty'));
  act(() => { window.history.pushState(null, '', '/?mode=keep&room=ZYXWVU654321#editor'); window.dispatchEvent(new PopStateEvent('popstate')); });
  expect(result.current.switchPrompt.pending).toBeTruthy();
  act(() => result.current.switchPrompt.onStay());
  expect(window.location.search).toBe('?mode=keep&room=ABCDEF123456');
  expect(result.current.editor.clipboardText).toBe('dirty');
  act(() => { window.history.pushState(null, '', '/?mode=keep&room=ZYXWVU654321#editor'); window.dispatchEvent(new PopStateEvent('popstate')); });
  await act(async () => result.current.switchPrompt.onDiscard());
  expect(result.current.editor.clipboardText).toBe('second'); expect(window.location.hash).toBe('#editor');
  await act(async () => { window.history.pushState(null, '', '/?mode=keep#editor'); window.dispatchEvent(new PopStateEvent('popstate')); });
  expect(result.current.editor.room).toBeNull(); expect(result.current.editor.clipboardText).toBe('');
});

it('conflicts retain the draft and require a deliberate latest-revision read before reapplying', async () => {
  const read = vi.spyOn(api, 'read').mockResolvedValueOnce(fixtureRoom()).mockResolvedValueOnce(fixtureRoom('ABCDEF123456', 'remote', 3));
  const update = vi.spyOn(api, 'update').mockRejectedValueOnce(Object.assign(new Error('Room changed.'), { status: 412 })).mockResolvedValueOnce(fixtureRoom('ABCDEF123456', 'local', 4));
  const { result } = renderHook(() => useRoomController());
  await act(async () => result.current.join.fetchRoom('ABCDEF123456'));
  act(() => result.current.editor.setClipboardText('local'));
  await act(async () => result.current.editor.saveClipboard());
  expect(result.current.editor.clipboardText).toBe('local'); expect(result.current.editor.conflict).toBeTruthy();
  expect(update.mock.calls[0][2].revision).toBe(1);
  await act(async () => result.current.editor.reapplyConflict());
  expect(read).toHaveBeenCalledTimes(2); expect(update).toHaveBeenCalledTimes(1);
  expect(result.current.editor.room.revision).toBe(3); expect(result.current.editor.clipboardText).toBe('local');
  await act(async () => result.current.editor.saveClipboard());
  expect(update.mock.calls[1][2].revision).toBe(3); expect(result.current.editor.conflict).toBeNull();
});

it('delayed create and update confirm their submitted snapshots while preserving later typing', async () => {
  const creating = deferred(); const updating = deferred();
  const create = vi.spyOn(api, 'create').mockReturnValue(creating.promise);
  const update = vi.spyOn(api, 'update').mockReturnValue(updating.promise);
  const { result } = renderHook(() => useRoomController());
  act(() => result.current.editor.setClipboardText('created snapshot'));
  let creation;
  act(() => { creation = result.current.editor.saveClipboard(); });
  act(() => result.current.editor.setClipboardText('typing during create'));
  await act(async () => { creating.resolve(fixtureRoom('ABCDEF123456', 'created snapshot')); await creation; });
  expect(create.mock.calls[0][0]).toBe('created snapshot');
  expect(result.current.editor.clipboardText).toBe('typing during create');
  expect(result.current.editor.isDirty).toBe(true);
  let saving;
  act(() => { saving = result.current.editor.saveClipboard(); });
  act(() => result.current.editor.setClipboardText('typing during update'));
  await act(async () => { updating.resolve(fixtureRoom('ABCDEF123456', 'typing during create', 2)); await saving; });
  expect(update.mock.calls[0][1]).toBe('typing during create');
  expect(result.current.editor.clipboardText).toBe('typing during update');
  expect(result.current.editor.isDirty).toBe(true);
});

it('stale read finally cannot clear a newer mutation and rapid duplicate saves are not replayed', async () => {
  const reading = deferred(); const saving = deferred();
  vi.spyOn(api, 'read').mockReturnValue(reading.promise);
  const create = vi.spyOn(api, 'create').mockReturnValue(saving.promise);
  const { result } = renderHook(() => useRoomController());
  let read; let save;
  act(() => { read = result.current.join.fetchRoom('ABCDEF123456'); });
  act(() => result.current.editor.setClipboardText('save fixture'));
  act(() => { save = result.current.editor.saveClipboard(); result.current.editor.saveClipboard(); });
  expect(create).toHaveBeenCalledTimes(1);
  await act(async () => { reading.resolve(fixtureRoom()); await read; });
  expect(result.current.editor.loading).toBe('create');
  expect(result.current.editor.clipboardText).toBe('save fixture');
  await act(async () => { saving.resolve(fixtureRoom('ZYXWVU654321', 'save fixture')); await save; });
  expect(result.current.editor.loading).toBe('');
  expect(result.current.editor.room.roomId).toBe('ZYXWVU654321');
});

it('dirty room switching offers stay or discard before any replacement request', async () => {
  const read = vi.spyOn(api, 'read').mockResolvedValue(fixtureRoom('ZYXWVU654321', 'received'));
  const { result } = renderHook(() => useRoomController());
  act(() => result.current.editor.setClipboardText('unsaved draft'));
  act(() => { result.current.join.fetchRoom('ZYXWVU654321'); });
  expect(read).not.toHaveBeenCalled(); expect(result.current.switchPrompt.pending).toBeTruthy();
  act(() => result.current.switchPrompt.onStay());
  expect(result.current.editor.clipboardText).toBe('unsaved draft'); expect(result.current.editor.room).toBeNull();
  act(() => { result.current.join.fetchRoom('ZYXWVU654321'); });
  await act(async () => result.current.switchPrompt.onDiscard());
  expect(result.current.editor.clipboardText).toBe('received'); expect(read).toHaveBeenCalledTimes(1);
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
