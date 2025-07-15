import { expect, it, vi } from 'vitest';
import { createApi } from '../api';

const room = { roomId: 'ABCDEF123456', revision: 1, charCount: 7, createdAt: '2026-10-28T00:00:00Z', updatedAt: '2026-10-28T00:00:00Z', expiresAt: '2026-10-28T01:00:00Z' };
const response = (data, status = 200, headers) => new Response(data === undefined ? null : JSON.stringify(data), { status, headers });

it('validates room responses, tolerates extra fields and handles empty deletion', async () => {
  const fetchImpl = vi.fn().mockResolvedValueOnce(response({ ...room, extra: true }, 201))
    .mockResolvedValueOnce(response({ ...room, text: 'fixture' }))
    .mockResolvedValueOnce(response(undefined, 204));
  const api = createApi({ fetchImpl });
  expect((await api.create('fixture', 60)).extra).toBe(true);
  expect((await api.read(room.roomId)).text).toBe('fixture');
  await expect(api.remove(room.roomId)).resolves.toBeUndefined();
  expect(JSON.parse(fetchImpl.mock.calls[0][1].body)).toEqual({ text: 'fixture', ttlMinutes: 60 });
});

it('classifies non-JSON failures, retry hints and malformed success contracts without echoing content', async () => {
  const fetchImpl = vi.fn().mockResolvedValueOnce(new Response('<private page>', { status: 502 }))
    .mockResolvedValueOnce(response({ code: 'RATE_LIMITED', message: 'Slow down.' }, 429, { 'Retry-After': '2' }))
    .mockResolvedValueOnce(response({ ...room, text: 'wrong length' }))
    .mockResolvedValueOnce(response({ ...room, expiresAt: 'invalid' }))
    .mockResolvedValueOnce(new Response('not json'));
  const api = createApi({ fetchImpl });
  await expect(api.read(room.roomId)).rejects.toMatchObject({ status: 502, code: 'REQUEST_FAILED' });
  await expect(api.read(room.roomId)).rejects.toMatchObject({ status: 429, code: 'RATE_LIMITED', retryAfter: '2' });
  for (let i = 0; i < 3; i++) await expect(api.read(room.roomId)).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
});
