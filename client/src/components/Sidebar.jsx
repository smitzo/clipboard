function Sidebar({ items }) {
  return (
    <section id="security" className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Security</p>
        <h2 className="mt-1 text-lg font-semibold">How rooms stay private</h2>
      </div>

      <div className="mt-4 divide-y divide-slate-100">
        {items.map((item) => {
          const ItemIcon = item.icon

          return (
            <div key={item.label} className="flex gap-3 py-3 first:pt-0 last:pb-0">
              <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-700">
                <ItemIcon size={18} />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                <p className="mt-1 break-words text-sm text-slate-500">{item.value}</p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default Sidebar
