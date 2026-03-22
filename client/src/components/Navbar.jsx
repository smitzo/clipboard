import { Clipboard, FolderGit, ShieldCheck } from 'lucide-react'

const links = [
  { label: 'Create', href: '#create' },
  { label: 'Security', href: '#security' },
  { label: 'Docs', href: 'https://github.com/smitzo/clipboard' },
]

function Navbar() {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <a href="/" className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-slate-950 text-white">
            <Clipboard size={21} />
          </span>
          <span className="min-w-0">
            <span className="block text-base font-black leading-tight">Clipboard</span>
            <span className="block text-xs font-medium text-slate-500">Secure room sharing</span>
          </span>
        </a>

        <div className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="rounded-md px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
            >
              {link.label}
            </a>
          ))}
        </div>

        <a
          href="https://github.com/smitzo/clipboard"
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
        >
          <FolderGit size={17} />
          <span className="hidden sm:inline">GitHub</span>
        </a>
      </nav>

      <div className="border-t border-slate-100 bg-slate-50">
        <div className="mx-auto flex h-9 w-full max-w-7xl items-center gap-2 px-4 text-xs font-semibold text-slate-600 sm:px-6 lg:px-8">
          <ShieldCheck size={15} className="text-emerald-600" />
          No account, no public room list, auto-expiring clipboard text.
        </div>
      </div>
    </header>
  )
}

export default Navbar
