import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import {
  Check,
  Clock3,
  Copy,
  Pencil,
  ArrowRight,
  FileText,
  Trash2,
} from "lucide-react";
import Button from "./components/Button";
import Home from "./components/Home";
import LinkDisplay from "./components/LinkDisplay";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import { api } from "./api";

const TTL_OPTIONS = [
  { label: "15 min", value: 15 },
  { label: "1 hour", value: 60 },
  { label: "6 hours", value: 360 },
  { label: "24 hours", value: 1440 },
];
const ROOM_ID_PATTERN = /^[A-Za-z0-9]{8,32}$/;
const AUTO_JOIN_MIN_LENGTH = 12;

function getErrorMessage(error) {
  return error?.message || "Something went wrong. Please try again.";
}

function normalizeRoomInput(value) {
  const trimmedValue = value.trim();

  try {
    const url = new URL(trimmedValue);
    return url.searchParams.get("room") || trimmedValue;
  } catch {
    return trimmedValue;
  }
}

function App() {
  const [clipboardText, setClipboardText] = useState("");
  const [joinRoomId, setJoinRoomId] = useState("");
  const [ttlMinutes, setTtlMinutes] = useState(60);
  const [room, setRoom] = useState(null);
  const [qrCode, setQrCode] = useState("");
  const [status, setStatus] = useState({ type: "idle", message: "" });
  const [loading, setLoading] = useState("");
  const [copied, setCopied] = useState("");
  const lastFetchedRoomId = useRef("");
  const pendingRoomId = useRef("");

  const roomLink = useMemo(() => {
    if (!room?.roomId) return "";

    return `${window.location.origin}${window.location.pathname}?room=${room.roomId}`;
  }, [room?.roomId]);

  const isBusy = Boolean(loading);

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

      setRoom(createdRoom);
      setClipboardText(clipboardText.trimEnd());
      setJoinRoomId(createdRoom.roomId);
      setStatus({
        type: "success",
        message: "Room created. Share the ID, link, or QR code.",
      });
      window.history.replaceState(null, "", `?room=${createdRoom.roomId}`);
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
      setRoom(fetchedRoom);
      setClipboardText(fetchedRoom.text);
      setJoinRoomId(fetchedRoom.roomId);
      setStatus({
        type: "success",
        message: "Room loaded into the clipboard.",
      });
      window.history.replaceState(null, "", `?room=${fetchedRoom.roomId}`);
    } catch (error) {
      lastFetchedRoomId.current = "";
      setStatus({ type: "error", message: getErrorMessage(error) });
    } finally {
      pendingRoomId.current = "";
      setLoading("");
    }
  }, []);

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
    const roomIdFromUrl = new URLSearchParams(window.location.search).get(
      "room",
    );

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

      setRoom(updatedRoom);
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
      window.history.replaceState(null, "", window.location.pathname);
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
          <section
            id="create"
            className="rounded-2xl border border-[#e0e7e2] bg-white shadow-[0_3px_8px_#1c403804] overflow-hidden border-t-[3px] border-t-[#24765c]"
            aria-labelledby="editor-heading"
          >
            <div className="flex items-center justify-between gap-3.5 border-b border-[#edf0ee] bg-[linear-gradient(110deg,#f0f8f3,#fff_75%)] p-6 [&_p]:mt-1 [&_p]:text-base max-[960px]:items-start max-[960px]:px-[18px] max-[520px]:flex-wrap max-[520px]:px-4 max-[520px]:py-5 max-[520px]:[&_p]:max-w-[200px]">
              <div className="flex items-center gap-3">
                <span className="grid size-[46px] place-items-center rounded-[10px] border border-[#cce2d4] bg-[#e2f0e8] text-[#4e7666] max-[960px]:hidden">
                  <FileText size={21} />
                </span>
                <div>
                  <h2 id="editor-heading">Your clipboard</h2>
                  <p>
                    {room
                      ? "Edit your text, then save your changes."
                      : "A little space for whatever you need to send."}
                  </p>
                </div>
              </div>
              <span
                className={`flex items-center gap-1.5 rounded-[20px] px-[9px] py-[5px] text-sm whitespace-nowrap ${room ? "bg-[#edf7f1] text-[#24765c]" : "bg-[#f3f5f4] text-[#6a7771]"}`}
              >
                <span
                  className={`size-[5px] rounded-full ${room ? "bg-[#24765c]" : "bg-[#8a958f]"}`}
                />
                {room ? "Room created" : "Draft"}
              </span>
            </div>
            <div className="px-6 pt-6 pb-4 max-[960px]:px-[18px] max-[520px]:px-4 max-[520px]:pt-[18px] max-[520px]:pb-3.5">
              <label htmlFor="clipboard-text" className="sr-only">
                Text to share
              </label>
              <textarea
                id="clipboard-text"
                className="block min-h-[305px] w-full resize-y rounded-xl border-2 border-[#5a9d80] bg-[linear-gradient(135deg,#f4faf6,#fff_60%)] p-[18px] text-xl leading-[1.8] text-[#283a31] shadow-[inset_0_1px_4px_#24765c0a] transition-[border-color,box-shadow] placeholder:text-[#8a9690] hover:border-[#347e5f] focus-visible:border-[#24765c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#24765c] focus-visible:shadow-[0_0_0_5px_#24765c14] min-[1440px]:min-h-[340px] max-[760px]:min-h-[270px]"
                value={clipboardText}
                onChange={(event) => setClipboardText(event.target.value)}
                placeholder="Paste or type your text here…"
                spellCheck="false"
                aria-describedby="editor-hint"
              />
              <div className="mt-4 flex justify-between gap-3 text-sm text-[#75827a] [&>span:last-child]:whitespace-nowrap max-[960px]:flex-col max-[960px]:gap-1 min-[521px]:max-[760px]:flex-row">
                <span id="editor-hint">
                  {room
                    ? "Changes are saved when you update the room."
                    : "Your text is shared only after you create a room."}
                </span>
                <span>{clipboardText.length.toLocaleString()} characters</span>
              </div>
            </div>
            <div className="flex items-center gap-3 border-y border-[#edf0ee] bg-[#fafcfb] px-6 py-4 [&_label]:flex [&_label]:items-center [&_label]:gap-[7px] [&_label]:text-base [&_label]:text-[#617269] [&_select]:rounded-[7px] [&_select]:border [&_select]:border-[#dce4de] [&_select]:bg-white [&_select]:py-[7px] [&_select]:pr-[26px] [&_select]:pl-2.5 [&_select]:text-base [&_select]:text-[#344c3f] max-[520px]:flex-wrap max-[520px]:gap-2.5 max-[520px]:px-4 max-[520px]:py-3.5">
              <label htmlFor="room-expiry">
                <Clock3 size={16} />{" "}
                {room ? "Room expiry" : "Room expires after"}
              </label>
              {room ? (
                <span className="text-base">
                  {new Date(room.expiresAt).toLocaleString([], {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              ) : (
                <select
                  id="room-expiry"
                  value={ttlMinutes}
                  onChange={(event) =>
                    setTtlMinutes(Number(event.target.value))
                  }
                  disabled={Boolean(room) || isBusy}
                >
                  {TTL_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-5 max-[960px]:px-[18px] max-[520px]:p-4">
              <div className="grid grid-cols-2 gap-3 max-[520px]:w-full max-[520px]:grid-cols-1">
                <Button
                  type="button"
                  icon={room ? Pencil : ArrowRight}
                  loading={loading === "create" || loading === "update"}
                  disabled={isBusy}
                  onClick={saveClipboard}
                >
                  {room ? "Update room" : "Create room"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  icon={copied === "text" ? Check : Copy}
                  disabled={!clipboardText}
                  onClick={() => copyValue(clipboardText, "text")}
                >
                  {copied === "text" ? "Copied!" : "Copy text"}
                </Button>
              </div>
              {room && (
                <Button
                  type="button"
                  variant="danger"
                  icon={Trash2}
                  loading={loading === "delete"}
                  disabled={isBusy}
                  onClick={deleteRoom}
                >
                  Delete room
                </Button>
              )}
            </div>
          </section>
          <aside
            className="grid gap-5 min-[521px]:max-[760px]:grid-cols-2 max-[760px]:items-start max-[760px]:gap-4"
            aria-label="Join and share rooms"
          >
            <section
              className="rounded-2xl border border-[#e0e7e2] bg-white shadow-[0_3px_8px_#1c403804] p-[23px] [&>p]:mt-[5px] [&>p]:text-base [&_form]:mt-5 [&_label]:mb-2 [&_label]:block [&_label]:text-sm [&_label]:font-semibold [&_label]:text-[#566a5e] max-[960px]:p-5"
              aria-labelledby="join-heading"
            >
              <h2 id="join-heading">Have a room already?</h2>
              <p>Open shared text on this device.</p>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  fetchRoom(joinRoomId);
                }}
              >
                <label htmlFor="join-room">Room ID or link</label>
                <div className="flex gap-2 [&_input]:h-[46px] [&_input]:w-full [&_input]:min-w-0 [&_input]:rounded-lg [&_input]:border [&_input]:border-[#dfe6e1] [&_input]:bg-[#fafcfb] [&_input]:p-2.5 [&_input]:text-base [&_input]:placeholder:text-[#829086]">
                  <input
                    id="join-room"
                    value={joinRoomId}
                    onChange={(event) => setJoinRoomId(event.target.value)}
                    placeholder="Paste ID or room link"
                    autoComplete="off"
                    spellCheck="false"
                    disabled={isBusy}
                  />
                  <Button
                    type="submit"
                    variant="secondary"
                    loading={loading === "join"}
                    disabled={isBusy || !joinRoomId.trim()}
                  >
                    Join
                  </Button>
                </div>
              </form>
            </section>
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
