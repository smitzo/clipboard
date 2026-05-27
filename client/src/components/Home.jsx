import { QrCode, ShieldCheck, Smartphone } from 'lucide-react'

function Home() {
  return (
    <section
      id="create"
      className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
    >
      <div className="grid gap-0 lg:grid-cols-[1fr_320px]">
        <div className="p-6 sm:p-8">
          <p className="text-sm font-bold uppercase tracking-wide text-emerald-700">
            Online clipboard
          </p>
          <h1 className="mt-3 max-w-3xl text-3xl font-black leading-tight text-slate-950 sm:text-5xl">
            Move text between devices with a private room ID.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
            Paste text once, share the generated room ID or QR code, and open it on any device
            before the room expires.
          </p>

          <div className="mt-6 grid gap-3 text-sm font-semibold text-slate-700 sm:grid-cols-3">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-600" />
              Encrypted in memory
            </div>
            <div className="flex items-center gap-2">
              <QrCode size={18} className="text-cyan-600" />
              QR access
            </div>
            <div className="flex items-center gap-2">
              <Smartphone size={18} className="text-violet-600" />
              Phone friendly
            </div>
          </div>
        </div>

        <div className="flex min-h-[220px] items-center justify-center bg-[#12343b] p-6">
          <div className="grid h-44 w-44 place-items-center rounded-lg bg-white shadow-xl">
            <div className="grid h-32 w-32 grid-cols-4 gap-2">
              {Array.from({ length: 16 }).map((_, index) => (
                <span
                  key={index}
                  className={`rounded-sm ${
                    [0, 1, 4, 5, 10, 11, 14].includes(index)
                      ? 'bg-slate-950'
                      : index % 3 === 0
                        ? 'bg-emerald-500'
                        : 'bg-slate-200'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Home
