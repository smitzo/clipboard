export const initialRoomState = { room: null, savedText: '', loading: '', phase: 'draft' };

export function roomReducer(state, action) {
  switch (action.type) {
    case 'begin': return { ...state, loading: action.operation };
    case 'settled': return { ...state, loading: '' };
    case 'confirmed': return { ...state, room: action.room, savedText: action.text, phase: 'active' };
    case 'deleted': return { ...state, room: null, savedText: '', phase: 'deleted' };
    default: return state;
  }
}
