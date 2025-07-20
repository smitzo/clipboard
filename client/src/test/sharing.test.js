import { expect, it, vi } from 'vitest';
import { createSharingAdapters } from '../sharing';

it('isolates copy, QR and download browser dependencies and preserves current link payload', async () => {
  const writeText = vi.fn().mockResolvedValue(); const toDataURL = vi.fn().mockResolvedValue('data:image/png;base64,fixture');
  const anchor = { click: vi.fn() };
  const adapters = createSharingAdapters({ clipboard: { writeText }, qr: { toDataURL }, documentImpl: { createElement: () => anchor } });
  await adapters.copy('fixture'); expect(writeText).toHaveBeenCalledWith('fixture');
  const link = 'https://clipboard.invalid/?room=ABCDEF123456';
  const image = await adapters.qr(link); expect(toDataURL.mock.calls[0][0]).toBe(link);
  adapters.downloadQr(image, 'ABCDEF123456'); expect(anchor.href).toBe(image);
  expect(anchor.download).toBe('ABCDEF123456-qr.png'); expect(anchor.click).toHaveBeenCalledOnce();
});

it('surfaces unsupported and denied browser operations as controlled rejections', async () => {
  const adapters = createSharingAdapters({ clipboard: null, qr: { toDataURL: vi.fn().mockRejectedValue(new Error('QR failure')) } });
  await expect(adapters.copy('fixture')).rejects.toThrow(/unavailable/);
  await expect(adapters.qr('fixture')).rejects.toThrow('QR failure');
  expect(() => adapters.downloadQr('', 'ABCDEF123456')).toThrow(/unavailable/);
  await expect(createSharingAdapters({ clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) } }).copy('fixture')).rejects.toThrow('denied');
});
