import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';

vi.mock('qrcode', () => ({ default: { toDataURL: async () => 'data:image/png;base64,fixture' } }));
const metadata = { roomId: 'ABCDEF123456', charCount: 7, createdAt: '2026-10-28T00:00:00Z', updatedAt: '2026-10-28T00:00:00Z', expiresAt: '2026-10-28T01:00:00Z' };
afterEach(() => vi.unstubAllGlobals());

describe('rendered room behavior', () => {
  it('creates a room from the editor and displays sharing controls', async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, status: 201, json: async () => metadata });
    vi.stubGlobal('fetch', fetch);
    const user = userEvent.setup(); render(<App />);
    await user.type(screen.getByLabelText('Text to share'), 'fixture');
    await user.click(screen.getByRole('button', { name: 'Create room' }));
    await screen.findByText(metadata.roomId, { selector: 'code' });
    expect(JSON.parse(fetch.mock.calls[0][1].body).text).toBe('fixture');
    expect(window.location.search).toBe(`?room=${metadata.roomId}`);
    expect(screen.getByRole('button', { name: 'Update room' })).toBeTruthy();
  });
  it('loads an initial query room into the editor', async () => {
    window.history.replaceState(null, '', `?room=${metadata.roomId}`);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ ...metadata, text: 'received fixture' }) }));
    render(<App />);
    await waitFor(() => expect(screen.getByLabelText('Text to share').value).toBe('received fixture'));
  });
});
