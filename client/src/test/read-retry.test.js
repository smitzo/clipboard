import { expect, it } from 'vitest';
import { readRetryDelay } from '../read-retry';

it('read retry delays use bounded seconds/date hints and exclude terminal failures', () => {
  expect(readRetryDelay({ status: 429, retryAfter: '2' })).toBe(2000);
  expect(readRetryDelay({ status: 503, retryAfter: '99999999' })).toBe(30000);
  expect(readRetryDelay({ status: 503, retryAfter: 'Thu, 29 Oct 2026 10:00:05 GMT' }, Date.parse('2026-10-29T10:00:00Z'))).toBe(5000);
  expect(readRetryDelay({ code: 'NETWORK_ERROR' })).toBe(1000);
  expect(readRetryDelay({ status: 404 })).toBeNull();
  expect(readRetryDelay({ status: 412 })).toBeNull();
});
