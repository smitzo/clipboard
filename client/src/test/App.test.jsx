import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';

vi.mock('qrcode', () => ({ default: { toDataURL: async () => 'data:image/png;base64,fixture' } }));
const metadata = { roomId: 'ABCDEF123456', charCount: 7, createdAt: '2026-10-28T00:00:00Z', updatedAt: '2026-10-28T00:00:00Z', expiresAt: '2026-10-28T01:00:00Z' };
afterEach(() => vi.unstubAllGlobals());

describe('rendered room behavior', () => {
  it('creates a room from the editor and displays sharing controls', async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, status: 201, text: async () => JSON.stringify(metadata) });
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
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => JSON.stringify({ ...metadata, charCount: 16, text: 'received fixture' }) }));
    render(<App />);
    await waitFor(() => expect(screen.getByLabelText('Text to share').value).toBe('received fixture'));
  });
  it('retains the draft and roomless controls when creation fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ code: 'CAPACITY_EXCEEDED', message: 'Try again shortly.' }), { status: 503 })));
    const user = userEvent.setup(); render(<App />);
    await user.type(screen.getByLabelText('Text to share'), 'preserved fixture');
    await user.click(screen.getByRole('button', { name: 'Create room' }));
    await screen.findByRole('alert');
    expect(screen.getByLabelText('Text to share').value).toBe('preserved fixture');
    expect(screen.getByRole('button', { name: 'Create room' }).disabled).toBe(false);
    expect(screen.queryByRole('button', { name: 'Delete room' })).toBeNull();
  });
  it('keeps exact draft text separate from the last confirmed save', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => new Response(JSON.stringify(metadata), { status: 201 })));
    const user = userEvent.setup(); render(<App />);
    await user.type(screen.getByLabelText('Text to share'), 'fixture{Enter} ');
    await user.click(screen.getByRole('button', { name: 'Create room' }));
    await screen.findByText('Text matches the last confirmed save.');
    expect(screen.getByLabelText('Text to share').value).toBe('fixture\n ');
    await user.type(screen.getByLabelText('Text to share'), 'new edit');
    expect(screen.getByText('Changes are saved when you update the room.')).toBeTruthy();
  });
});
