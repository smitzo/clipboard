import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import QRCode from "qrcode";
import { Check } from 'lucide-react';
import ClipboardEditor from './features/editor/ClipboardEditor';
import JoinRoom from './features/join/JoinRoom';
import Home from "./components/Home";
import LinkDisplay from "./components/LinkDisplay";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import { api } from "./api";
import { normalizeRoomInput, ROOM_ID_PATTERN, roomLink as buildRoomLink, roomIdFromLocation, withRoomId } from "./room-location";
import { initialRoomState, roomReducer } from "./room-state";

const AUTO_JOIN_MIN_LENGTH = 12;

function getErrorMessage(error) {
  return error?.message || "Something went wrong. Please try again.";
}

function App() {
  const [clipboardText, setClipboardText] = useState("");
  const [joinRoomId, setJoinRoomId] = useState("");
  const [ttlMinutes, setTtlMinutes] = useState(60);
  const [{ room, savedText, loading }, dispatch] = useReducer(roomReducer, initialRoomState);
  const setRoom = useCallback((room, text = '') => dispatch({ type: room ? 'confirmed' : 'deleted', room, text }), []);
  const setLoading = useCallback(operation => dispatch({ type: operation ? 'begin' : 'settled', operation }), []);
  const [qrCode, setQrCode] = useState("");
  const [status, setStatus] = useState({ type: "idle", message: "" });
  const [copied, setCopied] = useState("");
  const lastFetchedRoomId = useRef("");
  const pendingRoomId = useRef("");

  const roomLink = useMemo(() => {
    if (!room?.roomId) return "";

    return buildRoomLink(window.location.href, room.roomId);
  }, [room?.roomId]);

  const isBusy = Boolean(loading);
  const isDirty = clipboardText !== savedText;

  useEffect(() => {
    if (!roomLink) {
      setQrCode("");
      return;
    }

    QRCode.toDataURL(roomLink, {
      margin: 1,
      width: 220,
      color: {
        dark: "#111827",
        light: "#ffffff",
      },
    }).then(setQrCode);
  }, [roomLink]);

  useEffect(() => {
    if (!status.message) return undefined;

    const timeout = setTimeout(() => {
      setStatus({ type: "idle", message: "" });
    }, 3200);

    return () => clearTimeout(timeout);
  }, [status.message]);

  async function copyValue(value, label) {
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      setTimeout(() => setCopied(""), 1800);
    } catch {
      setStatus({
        type: "error",
        message: "Could not copy. Please select and copy the text manually.",
      });
    }
  }

  async function createRoom() {
    setLoading("create");
    setStatus({ type: "idle", message: "" });

    try {
      const createdRoom = await api.create(clipboardText, ttlMinutes);

      setRoom(createdRoom, clipboardText);
      setJoinRoomId(createdRoom.roomId);
      setStatus({
        type: "success",
        message: "Room created. Share the ID, link, or QR code.",
      });
      window.history.replaceState(null, "", withRoomId(window.location.href, createdRoom.roomId));
    } catch (error) {
      setStatus({ type: "error", message: getErrorMessage(error) });
    } finally {
      setLoading("");
    }
  }

  const fetchRoom = useCallback(async (roomId, options = {}) => {
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

    if (
      options.silent &&
      (lastFetchedRoomId.current === normalizedRoomId ||
        pendingRoomId.current === normalizedRoomId)
    ) {
      return;
    }

    pendingRoomId.current = normalizedRoomId;
    setLoading("join");
    if (!options.silent) {
      setStatus({ type: "idle", message: "" });
    }

    try {
      const fetchedRoom = await api.read(normalizedRoomId);

      lastFetchedRoomId.current = normalizedRoomId;
      setRoom(fetchedRoom, fetchedRoom.text);
      setClipboardText(fetchedRoom.text);
      setJoinRoomId(fetchedRoom.roomId);
      setStatus({
        type: "success",
        message: "Room loaded into the clipboard.",
      });
      window.history.replaceState(null, "", withRoomId(window.location.href, fetchedRoom.roomId));
    } catch (error) {
      lastFetchedRoomId.current = "";
      setStatus({ type: "error", message: getErrorMessage(error) });
    } finally {
      pendingRoomId.current = "";
      setLoading("");
    }
  }, [setRoom, setLoading]);

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

  useEffect(() => {
    const roomIdFromUrl = roomIdFromLocation(window.location.href);

    if (roomIdFromUrl) {
      setJoinRoomId(roomIdFromUrl);
      fetchRoom(roomIdFromUrl);
    }
  }, [fetchRoom]);

  async function updateRoom() {
    if (!room?.roomId) {
      setStatus({
        type: "error",
        message: "Create or join a room before updating.",
      });
      return;
    }

    setLoading("update");
    setStatus({ type: "idle", message: "" });

    try {
      const updatedRoom = await api.update(room.roomId, clipboardText);

      setRoom(updatedRoom, clipboardText);
      setStatus({ type: "success", message: "Room text updated." });
    } catch (error) {
      setStatus({ type: "error", message: getErrorMessage(error) });
    } finally {
      setLoading("");
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

    setLoading("delete");
    setStatus({ type: "idle", message: "" });

    try {
      await api.remove(room.roomId);
      setRoom(null);
      setClipboardText("");
      setJoinRoomId("");
      setQrCode("");
      lastFetchedRoomId.current = "";
      pendingRoomId.current = "";
      setStatus({ type: "success", message: "Room deleted from the server." });
      window.history.replaceState(null, "", withRoomId(window.location.href, null));
    } catch (error) {
      setStatus({ type: "error", message: getErrorMessage(error) });
    } finally {
      setLoading("");
    }
  }

  function downloadQrCode() {
    if (!qrCode) return;

    const anchor = document.createElement("a");
    anchor.href = qrCode;
    anchor.download = `${room?.roomId || "clipboard-room"}-qr.png`;
    anchor.click();
  }

  return (
    <div className="min-h-screen bg-[#f6f8f7] bg-[radial-gradient(ellipse_at_90%_0%,#dceee5_0%,transparent_42%)]">
      <Navbar />
      <main id="main-content" className="mx-[8%] w-4/5">
        <Home />
        <div className="grid grid-cols-1 items-start gap-6 min-[1001px]:grid-cols-[minmax(0,1fr)_minmax(360px,28%)] max-[960px]:gap-[18px]">
          <ClipboardEditor room={room} clipboardText={clipboardText} setClipboardText={setClipboardText}
            isDirty={isDirty} ttlMinutes={ttlMinutes} setTtlMinutes={setTtlMinutes} isBusy={isBusy}
            loading={loading} saveClipboard={saveClipboard} copied={copied} copyValue={copyValue} deleteRoom={deleteRoom} />
          <aside
            className="grid gap-5 min-[521px]:max-[760px]:grid-cols-2 max-[760px]:items-start max-[760px]:gap-4"
            aria-label="Join and share rooms"
          >
            <JoinRoom joinRoomId={joinRoomId} setJoinRoomId={setJoinRoomId} fetchRoom={fetchRoom} loading={loading} isBusy={isBusy} />
            <LinkDisplay
              room={room}
              roomLink={roomLink}
              qrCode={qrCode}
              copied={copied}
              onCopy={copyValue}
              onDownload={downloadQrCode}
            />
          </aside>
        </div>
        <Sidebar />
        <footer className="mt-[30px] flex justify-between gap-3 border-t border-[#e0e7e2] pt-[22px] pb-[26px] text-sm text-[#7a8880] max-[760px]:flex-col max-[760px]:gap-1.5">
          <span>Clipboard · A simpler way to share text.</span>
          <span>Temporary rooms. No account needed.</span>
        </footer>
      </main>
      <div
        className="fixed bottom-6 left-1/2 z-40 grid w-max max-w-[calc(100%-32px)] -translate-x-1/2 gap-2"
        aria-live="polite"
        aria-atomic="true"
      >
        {status.message && (
          <div
            role={status.type === "error" ? "alert" : "status"}
            className={`flex items-center gap-2 rounded-[10px] border px-5 py-3.5 text-base shadow-[0_5px_24px_#183c3020] ${status.type === "error" ? "border-[#f1c7c0] bg-[#fff4f2] text-[#a33429]" : "border-[#c4e3d2] bg-[#f1fbf5] text-[#21583d]"}`}
          >
            {status.message}
          </div>
        )}
        {copied && (
          <div className="flex items-center gap-2 rounded-[10px] border px-5 py-3.5 text-base shadow-[0_5px_24px_#183c3020] border-[#c4e3d2] bg-[#f1fbf5] text-[#21583d]">
            <Check size={17} />
            Copied {copied}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
