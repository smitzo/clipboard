import { useCallback, useEffect, useMemo, useState } from 'react'
import QRCode from 'qrcode'
import {
  Check,
  Clipboard,
  Clock3,
  Copy,
  Download,
  KeyRound,
  Link,
  Loader2,
  LockKeyhole,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
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

function formatDate(value) {
  if (!value) return 'Not created yet'

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function getErrorMessage(error) {
  return error?.message || 'Something went wrong. Please try again.'
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
  const [loadedText, setLoadedText] = useState('')
  const [qrCode, setQrCode] = useState('')
  const [status, setStatus] = useState({ type: 'idle', message: '' })
  const [loading, setLoading] = useState('')
  const [copied, setCopied] = useState('')

  const roomLink = useMemo(() => {
    if (!room?.roomId) return ''

    return `${window.location.origin}${window.location.pathname}?room=${room.roomId}`
  }, [room?.roomId])

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

  async function copyValue(value, label) {
    if (!value) return

    await navigator.clipboard.writeText(value)
    setCopied(label)
    setTimeout(() => setCopied(''), 1800)
  }

  async function createRoom(event) {
    event.preventDefault()
    setLoading('create')
    setStatus({ type: 'idle', message: '' })

    try {
      const createdRoom = await request('/rooms', {
        method: 'POST',
        body: JSON.stringify({ text: clipboardText, ttlMinutes }),
      })

      setRoom(createdRoom)
      setLoadedText(clipboardText.trimEnd())
      setJoinRoomId(createdRoom.roomId)
      setStatus({ type: 'success', message: 'Room created. Share the ID or scan the QR.' })
      window.history.replaceState(null, '', `?room=${createdRoom.roomId}`)
    } catch (error) {
      setStatus({ type: 'error', message: getErrorMessage(error) })
    } finally {
      setLoading('')
    }
  }

  const fetchRoom = useCallback(async (roomId) => {
    const normalizedRoomId = roomId.trim()

    if (!normalizedRoomId) {
      setStatus({ type: 'error', message: 'Enter a room ID first.' })
      return
    }

    setLoading('join')
    setStatus({ type: 'idle', message: '' })

    try {
      const fetchedRoom = await request(`/rooms/${encodeURIComponent(normalizedRoomId)}`)

      setRoom(fetchedRoom)
      setLoadedText(fetchedRoom.text)
      setClipboardText(fetchedRoom.text)
      setJoinRoomId(fetchedRoom.roomId)
      setStatus({ type: 'success', message: 'Room loaded. You can copy or update the text.' })
      window.history.replaceState(null, '', `?room=${fetchedRoom.roomId}`)
    } catch (error) {
      setStatus({ type: 'error', message: getErrorMessage(error) })
    } finally {
      setLoading('')
    }
  }, [])

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
        body: JSON.stringify({ text: loadedText }),
      })

      setRoom(updatedRoom)
      setClipboardText(loadedText)
      setStatus({ type: 'success', message: 'Room text updated.' })
    } catch (error) {
      setStatus({ type: 'error', message: getErrorMessage(error) })
    } finally {
      setLoading('')
    }
  }

  async function deleteRoom() {
    if (!room?.roomId) return

    setLoading('delete')
    setStatus({ type: 'idle', message: '' })

    try {
      await request(`/rooms/${encodeURIComponent(room.roomId)}`, { method: 'DELETE' })
      setRoom(null)
      setLoadedText('')
      setJoinRoomId('')
      setQrCode('')
      setStatus({ type: 'success', message: 'Room deleted from the server.' })
      window.history.replaceState(null, '', window.location.pathname)
    } catch (error) {
      setStatus({ type: 'error', message: getErrorMessage(error) })
    } finally {
      setLoading('')
    }
  }

  const isBusy = Boolean(loading)

  return (
    <div className="min-h-screen bg-[#f7f8fb] text-slate-950">
      <Navbar />

      <main className="mx-auto grid w-full max-w-7xl gap-6 px-4 pb-10 pt-4 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8">
        <section className="space-y-6">
          <Home />

          <div className="grid gap-5 xl:grid-cols-[1fr_0.86fr]">
            <form
              onSubmit={createRoom}
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                    Create room
                  </p>
                  <h2 className="mt-1 text-xl font-semibold">Paste text to share</h2>
                </div>

                <label className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700">
                  <Clock3 size={16} />
                  <select
                    value={ttlMinutes}
                    onChange={(event) => setTtlMinutes(Number(event.target.value))}
                    className="bg-transparent outline-none"
                    aria-label="Room expiry"
                  >
                    {TTL_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <textarea
                value={clipboardText}
                onChange={(event) => setClipboardText(event.target.value)}
                placeholder="Paste notes, commands, links, OTP-safe temporary text, or anything you need on another device."
                className="min-h-[260px] w-full resize-y rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
              />

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-slate-500">{clipboardText.length} characters</p>
                <Button icon={Plus} loading={loading === 'create'} disabled={isBusy}>
                  Create secure room
                </Button>
              </div>
            </form>

            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">
                  Join room
                </p>
                <h2 className="mt-1 text-xl font-semibold">Open from another device</h2>
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <KeyRound
                    size={18}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    value={joinRoomId}
                    onChange={(event) => setJoinRoomId(event.target.value)}
                    placeholder="Enter room ID"
                    className="h-12 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm font-semibold tracking-wide outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100"
                  />
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  icon={Search}
                  loading={loading === 'join'}
                  disabled={isBusy}
                  onClick={() => fetchRoom(joinRoomId)}
                >
                  Join
                </Button>
              </div>

              <div className="mt-5 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
                <textarea
                  value={loadedText}
                  onChange={(event) => setLoadedText(event.target.value)}
                  placeholder="Joined room text appears here."
                  className="min-h-[180px] w-full resize-y bg-transparent text-sm leading-6 text-slate-900 outline-none"
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    icon={Copy}
                    disabled={!loadedText}
                    onClick={() => copyValue(loadedText, 'text')}
                  >
                    {copied === 'text' ? 'Copied' : 'Copy text'}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    icon={Pencil}
                    loading={loading === 'update'}
                    disabled={!room?.roomId || isBusy}
                    onClick={updateRoom}
                  >
                    Update
                  </Button>
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
            </div>
          </div>

          {status.message && (
            <div
              className={`rounded-lg border px-4 py-3 text-sm font-medium ${
                status.type === 'error'
                  ? 'border-red-200 bg-red-50 text-red-800'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-800'
              }`}
            >
              {status.message}
            </div>
          )}
        </section>

        <aside className="space-y-5">
          <LinkDisplay
            room={room}
            roomLink={roomLink}
            qrCode={qrCode}
            copied={copied}
            onCopy={copyValue}
          />

          <Sidebar
            items={[
              { icon: ShieldCheck, label: 'Encrypted server memory', value: 'AES-256-GCM' },
              { icon: LockKeyhole, label: 'Room discovery', value: 'No public listing' },
              { icon: RefreshCw, label: 'Auto expiry', value: room ? formatDate(room.expiresAt) : 'Up to 24 hours' },
              { icon: Clipboard, label: 'Current room', value: room?.roomId || 'None yet' },
            ]}
          />

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold">Quick actions</h3>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="secondary"
                icon={Link}
                disabled={!roomLink}
                onClick={() => copyValue(roomLink, 'link')}
              >
                {copied === 'link' ? 'Copied' : 'Link'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                icon={Download}
                disabled={!qrCode}
                onClick={() => {
                  const anchor = document.createElement('a')
                  anchor.href = qrCode
                  anchor.download = `${room?.roomId || 'clipboard-room'}-qr.png`
                  anchor.click()
                }}
              >
                QR
              </Button>
            </div>
          </div>
        </aside>
      </main>

      {loading && (
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
