import { Clipboard, ArrowUpRight } from "lucide-react";

function Navbar() {
  return (
    <header className="h-20 border-t-[3px] border-t-[#24765c] border-b border-b-[#e5ebe7] bg-white max-[760px]:h-[68px]">
      <a
        href="#main-content"
        className="absolute -top-[70px] left-4 z-50 bg-white p-3 focus:top-3"
      >
        Skip to clipboard
      </a>
      <nav
        className="mx-[8%] flex h-full w-4/5 items-center justify-between"
        aria-label="Main navigation"
      >
        <a
          href="/"
          className="flex items-center gap-2.5 text-[26px] font-[750] tracking-[-0.8px] max-[760px]:text-xl"
        >
          <span className="grid size-[37px] place-items-center rounded-[11px] bg-[#24765c] text-white">
            <Clipboard size={21} />
          </span>
          Clipboard<span className="-ml-[9px] text-[#24765c]">.</span>
        </a>
        <div className="flex items-center gap-[30px] text-base font-[550] text-[#64736b] [&_a:hover]:text-[#226c54] max-[760px]:gap-4 max-[520px]:[&>a:first-child]:hidden">
          <a href="#how-it-works">How it works</a>
          <a
            href="https://github.com/smitzo/clipboard"
            className="flex items-center gap-1.5 rounded-[10px] border border-[#dce5df] bg-white px-3.5 py-[9px]"
          >
            GitHub <ArrowUpRight size={15} />
          </a>
        </div>
      </nav>
    </header>
  );
}
export default Navbar;
