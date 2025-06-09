import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import QRCode from 'qrcode'
import {
  Check,
  Clock3,
  Copy,
  Download,
  Link,
  Loader2,
  Pencil,
  Save,
  Search,
  Trash2,
} from 'lucide-react'
import Button from './components/Button'
import Home from './components/Home'
import LinkDisplay from './components/LinkDisplay'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const TTL_OPTIONS = [
  { label: '15 min', value: 15 },
  { label: '1 hour', value: 60 },
  { label: '6 hours', value: 360 },
  { label: '24 hours', value: 1440 },
]
const ROOM_ID_PATTERN = /^[A-Za-z0-9]{8,32}$/
const AUTO_JOIN_MIN_LENGTH = 12

function getErrorMessage(error) {
  return error?.message || 'Something went wrong. Please try again.'
}

function normalizeRoomInput(value) {
  const trimmedValue = value.trim()

  try {
    const url = new URL(trimmedValue)
    return url.searchParams.get('room') || trimmedValue
  } catch {
    return trimmedValue
  }
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })
  const data = response.status === 204 ? null : await response.json()

  if (!response.ok) {
    throw new Error(data?.message || 'Request failed.')
  }

  return data
}

function App() {
  const [clipboardText, setClipboardText] = useState('')
  const [joinRoomId, setJoinRoomId] = useState('')
  const [ttlMinutes, setTtlMinutes] = useState(60)
  const [room, setRoom] = useState(null)
  const [qrCode, setQrCode] = useState('')
  const [status, setStatus] = useState({ type: 'idle', message: '' })
  const [loading, setLoading] = useState('')
  const [copied, setCopied] = useState('')
  const lastFetchedRoomId = useRef('')
  const pendingRoomId = useRef('')

  const roomLink = useMemo(() => {
    if (!room?.roomId) return ''

    return `${window.location.origin}${window.location.pathname}?room=${room.roomId}`
  }, [room?.roomId])

  const activeRoomLabel = room?.roomId || 'No room yet'
  const isBusy = Boolean(loading)

  useEffect(() => {
    if (!roomLink) {
      setQrCode('')
      return
    }

    QRCode.toDataURL(roomLink, {
      margin: 1,
      width: 220,
      color: {
        dark: '#111827',
        light: '#ffffff',
      },
    }).then(setQrCode)
  }, [roomLink])

  useEffect(() => {
    if (!status.message) return undefined

    const timeout = setTimeout(() => {
      setStatus({ type: 'idle', message: '' })
    }, 3200)

    return () => clearTimeout(timeout)
  }, [status.message])

  async function copyValue(value, label) {
    if (!value) return

    await navigator.clipboard.writeText(value)
    setCopied(label)
    setTimeout(() => setCopied(''), 1800)
  }

  async function createRoom() {
    setLoading('create')
    setStatus({ type: 'idle', message: '' })

    try {
      const createdRoom = await request('/rooms', {
        method: 'POST',
        body: JSON.stringify({ text: clipboardText, ttlMinutes }),
      })

      setRoom(createdRoom)
      setClipboardText(clipboardText.trimEnd())
      setJoinRoomId(createdRoom.roomId)
      setStatus({ type: 'success', message: 'Room created. Share the ID, link, or QR code.' })
      window.history.replaceState(null, '', `?room=${createdRoom.roomId}`)
    } catch (error) {
      setStatus({ type: 'error', message: getErrorMessage(error) })
    } finally {
      setLoading('')
    }
  }

  const fetchRoom = useCallback(async (roomId, options = {}) => {
    const normalizedRoomId = normalizeRoomInput(roomId)

    if (!normalizedRoomId) {
      if (!options.silent) {
        setStatus({ type: 'error', message: 'Enter a room ID first.' })
      }
      return
    }

    if (!ROOM_ID_PATTERN.test(normalizedRoomId)) {
      if (!options.silent) {
        setStatus({ type: 'error', message: 'Room ID should be 8 to 32 letters or numbers.' })
      }
      return
    }

    if (
      options.silent &&
      (lastFetchedRoomId.current === normalizedRoomId || pendingRoomId.current === normalizedRoomId)
    ) {
      return
    }

    pendingRoomId.current = normalizedRoomId
    setLoading('join')
    if (!options.silent) {
      setStatus({ type: 'idle', message: '' })
    }

    try {
      const fetchedRoom = await request(`/rooms/${encodeURIComponent(normalizedRoomId)}`)

      lastFetchedRoomId.current = normalizedRoomId
      setRoom(fetchedRoom)
      setClipboardText(fetchedRoom.text)
      setJoinRoomId(fetchedRoom.roomId)
      setStatus({ type: 'success', message: 'Room loaded into the clipboard.' })
      window.history.replaceState(null, '', `?room=${fetchedRoom.roomId}`)
    } catch (error) {
      lastFetchedRoomId.current = ''
      setStatus({ type: 'error', message: getErrorMessage(error) })
    } finally {
      pendingRoomId.current = ''
      setLoading('')
    }
  }, [])

  useEffect(() => {
    const normalizedRoomId = normalizeRoomInput(joinRoomId)

    if (
      normalizedRoomId.length < AUTO_JOIN_MIN_LENGTH ||
      !ROOM_ID_PATTERN.test(normalizedRoomId) ||
      normalizedRoomId === room?.roomId
    ) {
      return undefined
    }

    const timeout = setTimeout(() => {
      fetchRoom(normalizedRoomId, { silent: true })
    }, 650)

    return () => clearTimeout(timeout)
  }, [fetchRoom, joinRoomId, room?.roomId])

  useEffect(() => {
    const roomIdFromUrl = new URLSearchParams(window.location.search).get('room')

    if (roomIdFromUrl) {
      setJoinRoomId(roomIdFromUrl)
      fetchRoom(roomIdFromUrl)
    }
  }, [fetchRoom])

  async function updateRoom() {
    if (!room?.roomId) {
      setStatus({ type: 'error', message: 'Create or join a room before updating.' })
      return
    }

    setLoading('update')
    setStatus({ type: 'idle', message: '' })

    try {
      const updatedRoom = await request(`/rooms/${encodeURIComponent(room.roomId)}`, {
        method: 'PUT',
        body: JSON.stringify({ text: clipboardText }),
      })

      setRoom(updatedRoom)
      setStatus({ type: 'success', message: 'Room text updated.' })
    } catch (error) {
      setStatus({ type: 'error', message: getErrorMessage(error) })
    } finally {
      setLoading('')
    }
  }

  async function saveClipboard() {
    if (room?.roomId) {
      await updateRoom()
      return
    }

    await createRoom()
  }

  async function deleteRoom() {
    if (!room?.roomId) return

    setLoading('delete')
    setStatus({ type: 'idle', message: '' })

    try {
      await request(`/rooms/${encodeURIComponent(room.roomId)}`, { method: 'DELETE' })
      setRoom(null)
      setClipboardText('')
      setJoinRoomId('')
      setQrCode('')
      lastFetchedRoomId.current = ''
      pendingRoomId.current = ''
      setStatus({ type: 'success', message: 'Room deleted from the server.' })
      window.history.replaceState(null, '', window.location.pathname)
    } catch (error) {
      setStatus({ type: 'error', message: getErrorMessage(error) })
    } finally {
      setLoading('')
    }
  }

  function downloadQrCode() {
    if (!qrCode) return

    const anchor = document.createElement('a')
    anchor.href = qrCode
    anchor.download = `${room?.roomId || 'clipboard-room'}-qr.png`
    anchor.click()
  }

  return (
    <div className="min-h-screen bg-[#f7f8fb] text-slate-950">
      <Navbar />

      <main className="mx-auto grid w-full max-w-7xl gap-5 px-4 pb-8 pt-4 sm:px-6 xl:grid-cols-[280px_minmax(0,1fr)_320px] lg:px-8">
        <aside className="space-y-4 xl:sticky xl:top-20 xl:self-start">
          <Home />
          <Sidebar />
        </aside>

        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-5">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                Main clipboard
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <code className="rounded-md bg-slate-100 px-2.5 py-1 text-sm font-black tracking-wide text-slate-900">
                  {activeRoomLabel}
                </code>
                <span className="text-xs font-medium text-slate-500">
                  {clipboardText.length} characters
                </span>
              </div>
            </div>

            <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
              <label className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700">
                <Clock3 size={16} />
                <select
                  value={ttlMinutes}
                  onChange={(event) => setTtlMinutes(Number(event.target.value))}
                  className="bg-transparent outline-none"
                  aria-label="Room expiry"
                  disabled={Boolean(room?.roomId)}
                >
                  {TTL_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="relative min-w-[220px] flex-1 sm:max-w-sm">
                {loading === 'join' ? (
                  <Loader2
                    size={17}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 animate-spin text-slate-400"
                  />
                ) : (
                  <Search
                    size={17}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                )}
                <input
                  value={joinRoomId}
                  onChange={(event) => setJoinRoomId(event.target.value)}
                  placeholder="Paste or enter room ID"
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm font-semibold tracking-wide outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                  aria-label="Room ID auto-join search"
                />
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-5">
            <textarea
              id="clipboard-text"
              value={clipboardText}
              onChange={(event) => setClipboardText(event.target.value)}
              placeholder="Paste your text here."
              className="min-h-[52vh] w-full resize-y overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-4 text-base leading-7 text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100 xl:min-h-[68vh]"
            />

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  icon={room?.roomId ? Pencil : Save}
                  loading={loading === 'create' || loading === 'update'}
                  disabled={isBusy}
                  onClick={saveClipboard}
                >
                  {room?.roomId ? 'Update room' : 'Create room'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  icon={Copy}
                  disabled={!clipboardText}
                  onClick={() => copyValue(clipboardText, 'text')}
                >
                  {copied === 'text' ? 'Copied' : 'Copy text'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  icon={Link}
                  disabled={!roomLink}
                  onClick={() => copyValue(roomLink, 'link')}
                >
                  Copy link
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  icon={Download}
                  disabled={!qrCode}
                  onClick={downloadQrCode}
                >
                  QR
                </Button>
              </div>

              <Button
                type="button"
                variant="danger"
                icon={Trash2}
                loading={loading === 'delete'}
                disabled={!room?.roomId || isBusy}
                onClick={deleteRoom}
              >
                Delete
              </Button>
            </div>
          </div>
        </section>

        <aside className="space-y-4 xl:sticky xl:top-20 xl:self-start">
          <LinkDisplay
            room={room}
            roomLink={roomLink}
            qrCode={qrCode}
            copied={copied}
            onCopy={copyValue}
          />
        </aside>

        {status.message && (
          <div
            className={`fixed right-4 top-20 z-30 max-w-sm rounded-lg border px-4 py-3 text-sm font-medium shadow-lg ${
              status.type === 'error'
                ? 'border-red-200 bg-red-50 text-red-800'
                : 'border-emerald-200 bg-emerald-50 text-emerald-800'
            }`}
          >
            {status.message}
          </div>
        )}
      </main>

      {loading && loading !== 'join' && (
        <div className="fixed bottom-4 right-4 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-lg">
          <Loader2 size={16} className="animate-spin" />
          Working
        </div>
      )}

      {copied && (
        <div className="fixed bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-lg">
          <Check size={16} />
          Copied {copied}
        </div>
      )}
    </div>
  )
}

export default App
