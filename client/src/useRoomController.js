import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { api } from './api';
import { sharing } from './sharing';
import { useFeedback } from './useFeedback';
import { initialRoomState, roomReducer } from './room-state';
import { normalizeRoomInput, ROOM_ID_PATTERN, roomLink as buildRoomLink, roomIdFromLocation, withRoomId } from './room-location';

const AUTO_JOIN_MIN_LENGTH = 12;
const getErrorMessage = error => error?.message || 'Something went wrong. Please try again.';

export function useRoomController() {
  const [clipboardText, setClipboardText] = useState("");
  const [joinRoomId, setJoinRoomId] = useState("");
  const [ttlMinutes, setTtlMinutes] = useState(60);
  const [pendingSwitch, setPendingSwitch] = useState(null);
  const [conflict, setConflict] = useState(null);
  const [{ room, savedText, loading }, dispatch] = useReducer(roomReducer, initialRoomState);
  const setRoom = useCallback((room, text = '') => dispatch({ type: room ? 'confirmed' : 'deleted', room, text }), []);
  const [qrCode, setQrCode] = useState("");
  const { status, setStatus, copied, copyValue } = useFeedback();
  const lastFetchedRoomId = useRef("");
  const pendingRoomId = useRef("");
  const readTask = useRef(null);
  const suppressedAutoId = useRef('');
  const operation = useRef(null);
  const activeLocation = useRef(window.location.href);
  const replaceLocation = useCallback(id => {
    const url = withRoomId(window.location.href, id);
    window.history.replaceState(window.history.state, '', url); activeLocation.current = url.href;
  }, []);
  const beginOperation = useCallback(kind => {
    if (operation.current && operation.current.kind !== 'join') return null;
    operation.current?.controller.abort(); readTask.current = null; pendingRoomId.current = '';
    const task = { kind, controller: new AbortController() };
    operation.current = task; dispatch({ type: 'begin', operation: kind }); return task;
  }, []);
  const finishOperation = useCallback(task => {
    if (operation.current !== task) return;
    operation.current = null; dispatch({ type: 'settled' });
  }, []);
  useEffect(() => () => { operation.current?.controller.abort(); operation.current = null; readTask.current = null; }, []);

  const roomLink = useMemo(() => {
    if (!room?.roomId) return "";

    return buildRoomLink(window.location.href, room.roomId);
  }, [room?.roomId]);

  const isBusy = Boolean(loading);
  const isDirty = clipboardText !== savedText;
  const draftState = useRef(); draftState.current = { text: clipboardText, savedText, room };

  useEffect(() => {
    if (!roomLink) {
      setQrCode("");
      return;
    }

    sharing.qr(roomLink).then(setQrCode).catch(() => setStatus({ type: 'error', message: 'Could not generate the QR code. The room link still works.' }));
  }, [roomLink, setStatus]);

  async function createRoom() {
    const task = beginOperation('create'); if (!task) return;
    setStatus({ type: "idle", message: "" });

    try {
      const createdRoom = await api.create(clipboardText, ttlMinutes, { signal: task.controller.signal });
      if (operation.current !== task) return;

      setRoom(createdRoom, clipboardText);
      setConflict(null);
      setJoinRoomId(createdRoom.roomId);
      setStatus({
        type: "success",
        message: "Room created. Share the ID, link, or QR code.",
      });
      replaceLocation(createdRoom.roomId);
    } catch (error) {
      if (operation.current !== task) return;
      setStatus({ type: "error", message: getErrorMessage(error) });
    } finally {
      finishOperation(task);
    }
  }

  const fetchRoom = useCallback((roomId, options = {}) => {
    const normalizedRoomId = normalizeRoomInput(roomId);

    if (!normalizedRoomId) {
      if (!options.silent) {
        setStatus({ type: "error", message: "Enter a room ID first." });
      }
      return;
    }

    if (!ROOM_ID_PATTERN.test(normalizedRoomId)) {
      if (!options.silent) {
        setStatus({
          type: "error",
          message: "Room ID should be 8 to 32 letters or numbers.",
        });
      }
      return;
    }

    if (readTask.current?.id === normalizedRoomId) return readTask.current.promise;
    if (options.silent && (lastFetchedRoomId.current === normalizedRoomId || suppressedAutoId.current === normalizedRoomId)) return;
    if (!options.silent) suppressedAutoId.current = '';
    if (!options.allowDiscard && draftState.current.text !== draftState.current.savedText) {
      suppressedAutoId.current = normalizedRoomId;
      setPendingSwitch({ roomId: normalizedRoomId, options }); return;
    }

    const task = beginOperation('join'); if (!task) return;
    task.id = normalizedRoomId;
    task.startDraft = draftState.current.text;
    readTask.current = task;
    pendingRoomId.current = normalizedRoomId;
    if (!options.silent) {
      setStatus({ type: "idle", message: "" });
    }

    task.promise = (async () => {
    try {
      const fetchedRoom = await api.read(normalizedRoomId, { signal: task.controller.signal });
      if (readTask.current !== task) return;
      if (draftState.current.text !== task.startDraft) {
        suppressedAutoId.current = normalizedRoomId;
        setPendingSwitch({ roomId: normalizedRoomId, options }); return;
      }

      lastFetchedRoomId.current = normalizedRoomId;
      setRoom(fetchedRoom, fetchedRoom.text);
      setConflict(null);
      setClipboardText(fetchedRoom.text);
      setJoinRoomId(fetchedRoom.roomId);
      setStatus({
        type: "success",
        message: "Room loaded into the clipboard.",
      });
      replaceLocation(fetchedRoom.roomId);
    } catch (error) {
      if (readTask.current !== task || task.controller.signal.aborted) return;
      lastFetchedRoomId.current = "";
      setStatus({ type: "error", message: getErrorMessage(error) });
    } finally {
      if (readTask.current === task) {
        readTask.current = null;
        pendingRoomId.current = "";
        finishOperation(task);
      }
    }
    })();
    return task.promise;
  }, [setRoom, setStatus, beginOperation, finishOperation, replaceLocation]);

  useEffect(() => {
    const normalizedRoomId = normalizeRoomInput(joinRoomId);

    if (
      normalizedRoomId.length < AUTO_JOIN_MIN_LENGTH ||
      !ROOM_ID_PATTERN.test(normalizedRoomId) ||
      normalizedRoomId === room?.roomId
    ) {
      return undefined;
    }

    const timeout = setTimeout(() => {
      fetchRoom(normalizedRoomId, { silent: true });
    }, 650);

    return () => clearTimeout(timeout);
  }, [fetchRoom, joinRoomId, room?.roomId]);

  const resetLocalRoom = useCallback(() => {
    const task = operation.current;
    if (task?.kind === 'join') { task.controller.abort(); finishOperation(task); }
    readTask.current = null; pendingRoomId.current = ''; lastFetchedRoomId.current = '';
    setRoom(null); setClipboardText(''); setJoinRoomId(''); setQrCode(''); setConflict(null); replaceLocation(null);
  }, [finishOperation, replaceLocation, setRoom]);

  useEffect(() => {
    let active = true;
    function navigate(initial = false) {
      const target = new URL(window.location.href);
      const id = roomIdFromLocation(target.href);
      const returnUrl = activeLocation.current;
      if (target.searchParams.has('room') && !id) {
        setStatus({ type: 'error', message: 'This link does not contain a valid room ID.' });
        if (!initial) window.history.replaceState(window.history.state, '', returnUrl);
        return;
      }
      if (!initial && operation.current && operation.current.kind !== 'join') {
        window.history.replaceState(window.history.state, '', returnUrl);
        setStatus({ type: 'error', message: 'Wait for the current operation before switching rooms.' }); return;
      }
      if (id && id === draftState.current.room?.roomId) { activeLocation.current = target.href; return; }
      if (id) {
        setJoinRoomId(id); fetchRoom(id, { silent: initial, navigation: true, returnUrl });
      } else if (!initial) {
        if (draftState.current.text !== draftState.current.savedText) setPendingSwitch({ roomId: null, options: { navigation: true, returnUrl } });
        else resetLocalRoom();
      }
    }
    queueMicrotask(() => { if (active) navigate(true); });
    const popstate = () => navigate(false);
    window.addEventListener('popstate', popstate);
    return () => { active = false; window.removeEventListener('popstate', popstate); };
  }, [fetchRoom, resetLocalRoom, setStatus]);

  async function updateRoom() {
    if (!room?.roomId) {
      setStatus({
        type: "error",
        message: "Create or join a room before updating.",
      });
      return;
    }

    const task = beginOperation('update'); if (!task) return;
    setStatus({ type: "idle", message: "" });

    try {
      const updatedRoom = await api.update(room.roomId, clipboardText, { signal: task.controller.signal, revision: room.revision });
      if (operation.current !== task) return;

      setRoom(updatedRoom, clipboardText);
      setConflict(null);
      setStatus({ type: "success", message: "Room text updated." });
    } catch (error) {
      if (operation.current !== task) return;
      if (error.status === 412) setConflict({ roomId: room.roomId });
      setStatus({ type: "error", message: getErrorMessage(error) });
    } finally {
      finishOperation(task);
    }
  }

  async function saveClipboard() {
    if (room?.roomId) {
      await updateRoom();
      return;
    }

    await createRoom();
  }

  async function deleteRoom() {
    if (!room?.roomId) return;

    const task = beginOperation('delete'); if (!task) return;
    setStatus({ type: "idle", message: "" });

    try {
      await api.remove(room.roomId, { signal: task.controller.signal });
      if (operation.current !== task) return;
      setRoom(null);
      setConflict(null);
      setClipboardText("");
      setJoinRoomId("");
      setQrCode("");
      lastFetchedRoomId.current = "";
      pendingRoomId.current = "";
      setStatus({ type: "success", message: "Room deleted from the server." });
      replaceLocation(null);
    } catch (error) {
      if (operation.current !== task) return;
      setStatus({ type: "error", message: getErrorMessage(error) });
    } finally {
      finishOperation(task);
    }
  }

  function downloadQrCode() {
    if (!qrCode) return;

    sharing.downloadQr(qrCode, room?.roomId);
  }

  function cancelJoin() {
    suppressedAutoId.current = readTask.current?.id || normalizeRoomInput(joinRoomId);
    const task = readTask.current;
    task?.controller.abort(); readTask.current = null;
    pendingRoomId.current = ''; if (task) finishOperation(task);
    setStatus({ type: 'success', message: 'Join cancelled. Your draft is unchanged.' });
  }

  function stayWithDraft() {
    if (pendingSwitch?.options.navigation) window.history.replaceState(window.history.state, '', pendingSwitch.options.returnUrl);
    setPendingSwitch(null);
  }
  function discardAndJoin() {
    const target = pendingSwitch; setPendingSwitch(null);
    if (!target) return;
    if (!target.roomId) return resetLocalRoom();
    return fetchRoom(target.roomId, { ...target.options, silent: false, allowDiscard: true });
  }

  function reloadConflict() { if (conflict) return fetchRoom(conflict.roomId); }
  async function reapplyConflict() {
    if (!conflict) return;
    const task = beginOperation('rebase'); if (!task) return;
    try {
      const latest = await api.read(conflict.roomId, { signal: task.controller.signal });
      if (operation.current !== task) return;
      setRoom(latest, latest.text); setConflict(null);
      setStatus({ type: 'success', message: 'Latest revision loaded. Review your draft, then save to replace the server text.' });
    } catch (error) {
      if (operation.current === task) setStatus({ type: 'error', message: getErrorMessage(error) });
    } finally { finishOperation(task); }
  }

  return {
    editor: { room, clipboardText, setClipboardText, isDirty, ttlMinutes, setTtlMinutes, isBusy, loading, saveClipboard, copied, copyValue, deleteRoom, conflict, reloadConflict, reapplyConflict },
    join: { joinRoomId, setJoinRoomId, fetchRoom, cancelJoin, loading, isBusy },
    share: { room, roomLink, qrCode, copied, onCopy: copyValue, onDownload: downloadQrCode },
    feedback: { status, copied },
    switchPrompt: { pending: pendingSwitch, onStay: stayWithDraft, onDiscard: discardAndJoin },
  };
}
