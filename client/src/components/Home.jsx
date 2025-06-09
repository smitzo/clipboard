import { ArrowRightLeft, Check, FileText } from "lucide-react";

function Home() {
  return (
    <section className="flex items-center justify-between gap-7 pt-9 pb-[30px] min-[1440px]:pt-10 max-[760px]:pb-[26px]">
      <div className="[&_h1]:mb-3.5 [&_h1]:text-[clamp(34px,3.4vw,54px)] [&_h1]:font-[650] [&_h1]:leading-[1.2] [&_h1]:tracking-[-1.5px] [&>p:last-child]:text-lg [&>p:last-child]:leading-[1.7] max-[760px]:[&_h1]:max-w-[420px] max-[760px]:[&_h1]:tracking-[-1px] max-[520px]:[&_h1]:text-[34px]">
        <p className="mb-3 text-[13px] font-[750] tracking-[2px] text-[#28775c]">
          COPY. CONNECT. CONTINUE.
        </p>
        <h1>Your text, wherever you need it.</h1>
        <p>
          Move notes, links, and ideas between devices with a temporary room.
          <br className="max-[760px]:hidden" /> Paste your text, create a room,
          and share in seconds.
        </p>
      </div>
      <div
        className="relative mr-10 h-[145px] w-[260px] shrink-0 text-[#24765c] max-[1100px]:mr-2.5 max-[1100px]:w-[235px] max-[1100px]:scale-[0.85] max-[960px]:hidden"
        aria-hidden="true"
      >
        <div className="absolute top-2 left-0 h-[115px] w-[185px] -rotate-5 rounded-[14px] border-2 border-[#8eb69f] bg-white/72 p-5 shadow-[0_12px_30px_#2d705314] after:absolute after:-right-2.5 after:-bottom-2.5 after:-left-2.5 after:h-2 after:rounded-b-lg after:bg-[#8eb69f] after:content-['']">
          <FileText size={24} />
          <span className="mt-2.5 block h-[5px] w-4/5 rounded bg-[#cee1d5]" />
          <span className="mt-2.5 block h-[5px] w-4/5 rounded bg-[#cee1d5] !w-[52%]" />
        </div>
        <div className="absolute right-0 bottom-0 grid h-[108px] w-[68px] rotate-[8deg] place-items-center rounded-[13px] border-2 border-[#559477] bg-[#f8fcf9] shadow-[0_10px_20px_#2d705314]">
          <Check size={26} />
        </div>
        <span className="absolute top-0 right-2.5 grid size-9 place-items-center rounded-full bg-[#24765c] text-white shadow-[0_0_0_7px_#e2f0e7]">
          <ArrowRightLeft size={19} />
        </span>
      </div>
    </section>
  );
}
export default Home;
