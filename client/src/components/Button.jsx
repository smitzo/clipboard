import { Loader2 } from "lucide-react";

const variants = {
  primary:
    "border-transparent bg-[#24765c] text-white shadow-[0_2px_3px_#1d5e4715] enabled:hover:bg-[#1b614a]",
  secondary:
    "border-[#dfe6e1] bg-white text-[#4b6054] enabled:hover:border-[#a8bdb0] enabled:hover:bg-[#f5f8f6]",
  danger:
    "border-transparent bg-white text-[#ac4b46] enabled:hover:bg-[#fff2f0]",
};

function Button({
  children,
  className = "",
  disabled = false,
  icon: Icon,
  loading = false,
  type = "button",
  variant = "primary",
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex min-h-[46px] items-center justify-center gap-2 rounded-lg border px-[15px] py-2.5 text-base font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-45 max-[520px]:min-h-11 ${variants[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 size={17} className="animate-spin" />
      ) : Icon ? (
        <Icon size={17} aria-hidden="true" />
      ) : null}
      <span>{children}</span>
    </button>
  );
}
export default Button;
