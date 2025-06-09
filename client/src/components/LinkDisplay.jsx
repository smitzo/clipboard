import { Copy, Link, QrCode } from 'lucide-react'
import Button from './Button'

function LinkDisplay({ copied, onCopy, qrCode, room, roomLink }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">Share</p>
          <h2 className="mt-1 text-sm font-black text-slate-950">Room details</h2>
        </div>
        <QrCode size={20} className="text-cyan-700" />
      </div>

      <div className="mt-4 flex items-center justify-between gap-2 rounded-lg bg-slate-50 p-3">
        <code className="min-w-0 break-all text-sm font-black tracking-wide text-slate-950">
          {room?.roomId || 'Create a room'}
        </code>
        <Button
          type="button"
          variant="secondary"
          icon={Copy}
          disabled={!room?.roomId}
          onClick={() => onCopy(room.roomId, 'room ID')}
          className="h-9 px-3"
        >
          {copied === 'room ID' ? 'Copied' : 'ID'}
        </Button>
      </div>

      <div className="mt-4 grid place-items-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3">
        {qrCode ? (
          <img src={qrCode} alt={`QR code for room ${room.roomId}`} className="h-36 w-36" />
        ) : (
          <div className="grid h-36 w-36 place-items-center rounded-lg bg-white text-center text-sm font-medium text-slate-400">
            QR appears here
          </div>
        )}
      </div>

      <button
        type="button"
        disabled={!roomLink}
        onClick={() => onCopy(roomLink, 'link')}
        className="mt-3 flex min-h-10 w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-left text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Link size={16} className="shrink-0 text-slate-400" />
        <span className="min-w-0 break-all">
          {roomLink || 'Create a room to generate a link'}
        </span>
      </button>
    </section>
  )
}

export default LinkDisplay
