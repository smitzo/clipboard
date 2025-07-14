import { expect, it } from 'vitest';
import { resolveApiUrl } from '../config';

it('normalizes API paths and validates configured and default runtime URLs', () => {
  expect(resolveApiUrl(undefined)).toBe('http://localhost:5000/api');
  expect(resolveApiUrl(undefined, { development: false, origin: 'https://clipboard.invalid' })).toBe('https://clipboard.invalid/api');
  expect(resolveApiUrl('https://api.invalid/prefix/api///')).toBe('https://api.invalid/prefix/api');
  for (const value of ['/api', 'invalid', 'ftp://api.invalid', 'https://user:secret@api.invalid/api', 'https://api.invalid/api?q=1', 'https://api.invalid/api#hash']) expect(() => resolveApiUrl(value)).toThrow();
  expect(() => resolveApiUrl('http://api.invalid/api', { origin: 'https://clipboard.invalid' })).toThrow(/HTTPS/);
});
