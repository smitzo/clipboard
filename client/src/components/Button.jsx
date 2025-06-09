import { Loader2 } from 'lucide-react'

const variants = {
  primary: 'bg-slate-950 text-white hover:bg-slate-800 focus:ring-slate-300',
  secondary:
    'border border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50 focus:ring-slate-200',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-200',
}

function Button({
  children,
  className = '',
  disabled = false,
  icon: Icon,
  loading = false,
  type = 'submit',
  variant = 'primary',
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    >
      {loading ? <Loader2 size={17} className="animate-spin" /> : Icon ? <Icon size={17} /> : null}
      <span>{children}</span>
    </button>
  )
}

export default Button
