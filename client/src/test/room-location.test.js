import { expect, it } from 'vitest';
import { normalizeRoomInput, roomIdFromLocation, withRoomId, roomLink } from '../room-location';

it('parses IDs and encoded query links without rendering or navigation side effects', () => {
  const id = 'ABCDEF123456';
  expect(normalizeRoomInput(` ${id} `)).toBe(id);
  expect(normalizeRoomInput(`https://clipboard.invalid/path?room=%41BCDEF123456`)).toBe(id);
  for (const value of ['partial', `https://clipboard.invalid/${id}`, 'https://clipboard.invalid/?room=short', 'javascript:alert(1)', `https://user:password@clipboard.invalid/?room=${id}`, `https://clipboard.invalid/?room=${id}&room=${id}`, 'https://clipboard.invalid/?room=%ZZABCDEFGH']) expect(normalizeRoomInput(value)).toBe('');
  expect(roomIdFromLocation(`https://clipboard.invalid/app?mode=1&room=${id}#editor`)).toBe(id);
  expect(withRoomId('https://clipboard.invalid/app?mode=1#editor', id).href).toBe(`https://clipboard.invalid/app?mode=1&room=${id}#editor`);
  expect(withRoomId(`https://clipboard.invalid/app?mode=1&room=${id}#editor`, null).href).toBe('https://clipboard.invalid/app?mode=1#editor');
  expect(roomLink('https://clipboard.invalid/app?private=1#private', id)).toBe(`https://clipboard.invalid/app?room=${id}`);
});
