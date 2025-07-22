import { Check } from 'lucide-react';

export default function Feedback({ status, copied }) {
  return (
<div
        className="fixed bottom-6 left-1/2 z-40 grid w-max max-w-[calc(100%-32px)] -translate-x-1/2 gap-2"
        aria-live="polite"
        aria-atomic="true"
      >
        {status.message && (
          <div
            role={status.type === "error" ? "alert" : "status"}
            className={`flex items-center gap-2 rounded-[10px] border px-5 py-3.5 text-base shadow-[0_5px_24px_#183c3020] ${status.type === "error" ? "border-[#f1c7c0] bg-[#fff4f2] text-[#a33429]" : "border-[#c4e3d2] bg-[#f1fbf5] text-[#21583d]"}`}
          >
            {status.message}
          </div>
        )}
        {copied && (
          <div className="flex items-center gap-2 rounded-[10px] border px-5 py-3.5 text-base shadow-[0_5px_24px_#183c3020] border-[#c4e3d2] bg-[#f1fbf5] text-[#21583d]">
            <Check size={17} />
            Copied {copied}
          </div>
        )}
      </div>
  );
}
