import { Copy, Link, QrCode } from 'lucide-react'
import Button from './Button'

function LinkDisplay({ copied, onCopy, qrCode, room, roomLink }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">Share</p>
          <h2 className="mt-1 text-lg font-semibold">Room access</h2>
        </div>
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-cyan-50 text-cyan-700">
          <QrCode size={21} />
        </span>
      </div>

      <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Room ID</p>
        <div className="mt-2 flex items-center justify-between gap-2">
          <code className="min-w-0 break-all rounded-md bg-white px-3 py-2 text-sm font-black tracking-wider text-slate-950">
            {room?.roomId || 'Create a room'}
          </code>
          <Button
            type="button"
            variant="secondary"
            icon={Copy}
            disabled={!room?.roomId}
            onClick={() => onCopy(room.roomId, 'room ID')}
          >
            {copied === 'room ID' ? 'Copied' : 'Copy'}
          </Button>
        </div>
      </div>

      <div className="mt-4 grid place-items-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
        {qrCode ? (
          <img src={qrCode} alt={`QR code for room ${room.roomId}`} className="h-48 w-48" />
        ) : (
          <div className="grid h-48 w-48 place-items-center rounded-lg bg-white text-center text-sm font-medium text-slate-400">
            QR appears here
          </div>
        )}
      </div>

      <div className="mt-4 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Share link</p>
        <button
          type="button"
          disabled={!roomLink}
          onClick={() => onCopy(roomLink, 'link')}
          className="flex min-h-12 w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-left text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Link size={17} className="shrink-0 text-slate-400" />
          <span className="min-w-0 break-all">{roomLink || 'Create a room to generate a link'}</span>
        </button>
      </div>
    </section>
  )
}

export default LinkDisplay
