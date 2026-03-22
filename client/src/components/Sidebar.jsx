const steps = [
  {
    title: 'Paste text',
    text: 'Use the big clipboard box. It expands and scrolls for longer notes.',
  },
  {
    title: 'Create room',
    text: 'Click Create room to get a private room ID and QR code.',
  },
  {
    title: 'Share and open',
    text: 'Send the link, scan QR, or enter the room ID on another device.',
  },
]

function Sidebar() {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <h2 className="text-sm font-black uppercase tracking-wide text-slate-900">Steps</h2>

      <div className="mt-3 space-y-3">
        {steps.map((step, index) => (
          <div key={step.title} className="flex gap-3">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-100 text-xs font-black text-emerald-800">
              {index + 1}
            </span>
            <div>
              <p className="text-sm font-bold text-slate-950">{step.title}</p>
              <p className="mt-0.5 text-sm leading-5 text-slate-600">{step.text}</p>
            </div>
          </div>
        ))}
      </div>

      <details className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm">
        <summary className="cursor-pointer font-bold text-slate-800">Security note</summary>
        <p className="mt-2 leading-5 text-slate-600">
          Rooms are temporary, encrypted in server memory, rate-limited, and not publicly listed.
        </p>
      </details>

      <p className="mt-2 rounded-lg bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-800">
        Image pasting is coming soon.
      </p>
    </section>
  )
}

export default Sidebar
