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
  act(() => result.current.editor.setClipboardText('save fixture'));
  let read; let save;
  act(() => { read = result.current.join.fetchRoom('ABCDEF123456'); });
  act(() => { save = result.current.editor.saveClipboard(); result.current.editor.saveClipboard(); });
  expect(create).toHaveBeenCalledTimes(1);
  await act(async () => { reading.resolve(fixtureRoom()); await read; });
  expect(result.current.editor.loading).toBe('create');
  expect(result.current.editor.clipboardText).toBe('save fixture');
  await act(async () => { saving.resolve(fixtureRoom('ZYXWVU654321', 'save fixture')); await save; });
  expect(result.current.editor.loading).toBe('');
  expect(result.current.editor.room.roomId).toBe('ZYXWVU654321');
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
