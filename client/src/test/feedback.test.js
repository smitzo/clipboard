import { afterEach, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useFeedback } from '../useFeedback';

afterEach(() => vi.useRealTimers());

it('latest copy owns feedback and timers are cancelled on replacement and unmount', async () => {
  vi.useFakeTimers(); const finish = [];
  const copy = vi.fn(() => new Promise(resolve => finish.push(resolve)));
  const { result, unmount } = renderHook(() => useFeedback({ copy }));
  let first; let second;
  act(() => { first = result.current.copyValue('first', 'text'); second = result.current.copyValue('second', 'link'); });
  await act(async () => { finish[1](); await second; }); expect(result.current.copied).toBe('link');
  await act(async () => { finish[0](); await first; }); expect(result.current.copied).toBe('link');
  act(() => vi.advanceTimersByTime(1800)); expect(result.current.copied).toBe('');
  act(() => result.current.setStatus({ type: 'success', message: 'first' }));
  act(() => vi.advanceTimersByTime(3000));
  act(() => result.current.setStatus({ type: 'success', message: 'replacement' }));
  act(() => vi.advanceTimersByTime(300)); expect(result.current.status.message).toBe('replacement');
  unmount(); expect(vi.getTimerCount()).toBe(0);
});

it('rejected copies produce one controlled announcement', async () => {
  const { result } = renderHook(() => useFeedback({ copy: vi.fn().mockRejectedValue(new Error('denied')) }));
  await act(async () => result.current.copyValue('fixture', 'text'));
  expect(result.current.status.type).toBe('error'); expect(result.current.copied).toBe('');
});
