import QRCode from 'qrcode';

export function createSharingAdapters({ clipboard, qr = QRCode, documentImpl = document } = {}) {
  return {
    async copy(value) {
      const target = clipboard === undefined ? navigator.clipboard : clipboard;
      if (!target?.writeText) throw new Error('Clipboard access is unavailable. Select and copy the text manually.');
      await target.writeText(value);
    },
    qr: link => qr.toDataURL(link, { margin: 1, width: 220, color: { dark: '#111827', light: '#ffffff' } }),
    downloadQr(dataUrl, roomId) {
      if (!dataUrl?.startsWith('data:image/png;base64,') || !roomId) throw new Error('QR code is unavailable.');
      const anchor = documentImpl.createElement('a');
      anchor.href = dataUrl; anchor.download = `${roomId}-qr.png`; anchor.click();
    },
  };
}

export const sharing = createSharingAdapters();
