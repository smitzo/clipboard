import { ShieldCheck } from "lucide-react";
const steps = [
  {
    title: "Make it yours",
    color: "bg-[#dceee3] text-[#4a8068]",
    text: "Paste a note, a link, or a snippet into the clipboard.",
  },
  {
    title: "Create a room",
    color: "bg-[#e3ecf7] text-[#466489]",
    text: "Choose an expiry time and get a unique sharing link.",
  },
  {
    title: "Pick up anywhere",
    color: "bg-[#f6ecd8] text-[#87682c]",
    text: "Open the link or scan the QR code on another device.",
  },
];
function Sidebar() {
  return (
    <section
      id="how-it-works"
      className="mt-10 pt-1 [&>h2]:mb-5 [&>h2]:text-lg max-[760px]:mt-[30px]"
      aria-labelledby="steps-heading"
    >
      <h2 id="steps-heading">Three steps. Zero friction.</h2>
      <div className="grid grid-cols-3 gap-8 max-[960px]:gap-[18px] max-[760px]:grid-cols-1 max-[760px]:gap-5">
        {steps.map((step, index) => (
          <div
            className="flex items-start gap-3 rounded-[14px] border border-[#dfe8e2] bg-white/72 p-[22px] [&_p]:mt-[5px] [&_p]:text-base max-[760px]:p-[18px]"
            key={step.title}
          >
            <span className={`grid h-10 min-w-10 place-items-center rounded-lg text-sm font-semibold ${step.color}`}>
              0{index + 1}
            </span>
            <div>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </div>
          </div>
        ))}
      </div>
      <details
        id="security"
        className="group mt-6 text-base text-[#607769] [&_p]:mt-2.5 [&_p]:max-w-[700px]"
      >
        <summary className="flex w-fit cursor-pointer items-center gap-2 after:ml-1 after:content-['+'] group-open:after:content-['−']">
          <ShieldCheck size={17} /> A note on privacy
        </summary>
        <p>
          Rooms are temporary and not publicly listed. Anyone with the room ID
          or link can access the text. Text is encrypted in server memory and
          removed when the room expires.
        </p>
      </details>
    </section>
  );
}
export default Sidebar;
