export const ROOM_ID_PATTERN = /^[A-Za-z0-9]{8,32}$/;

export function normalizeRoomInput(value) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (ROOM_ID_PATTERN.test(trimmed)) return trimmed;
  try {
    const url = new URL(trimmed);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return '';
    const values = url.searchParams.getAll('room');
    return values.length === 1 && ROOM_ID_PATTERN.test(values[0]) ? values[0] : '';
  } catch { return ''; }
}

export function roomIdFromLocation(href) {
  try {
    const url = new URL(href); const values = url.searchParams.getAll('room');
    return values.length === 1 && ROOM_ID_PATTERN.test(values[0]) ? values[0] : '';
  } catch { return ''; }
}

export function withRoomId(href, id) {
  const url = new URL(href);
  if (id && !ROOM_ID_PATTERN.test(id)) throw new Error('Room ID is invalid.');
  url.searchParams.delete('room');
  if (id) url.searchParams.set('room', id);
  return url;
}

export function roomLink(href, id) {
  const url = new URL(href); url.search = ''; url.hash = '';
  return withRoomId(url.href, id).href;
}
