import { Clipboard } from 'lucide-react'

function Home() {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-start gap-2.5">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-950 text-white">
          <Clipboard size={16} />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
            Online clipboard
          </p>
          <h1 className="mt-1 text-sm font-black leading-snug text-slate-950">
            Move text between devices with a private room ID.
          </h1>
          <p className="mt-1.5 text-sm leading-5 text-slate-600">
            Paste text once, share the generated room ID or QR code, and open it on any device
            before the room expires.
          </p>
        </div>
      </div>
    </section>
  )
}

export default Home
