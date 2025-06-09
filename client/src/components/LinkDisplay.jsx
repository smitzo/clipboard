import { Check, Copy, Download, Link, QrCode } from "lucide-react";
import Button from "./Button";
function LinkDisplay({ copied, onCopy, onDownload, qrCode, room, roomLink }) {
  return (
    <section
      className="rounded-2xl border border-[#e0e7e2] bg-white shadow-[0_3px_8px_#1c403804] bg-[linear-gradient(150deg,#fff_65%,#edf6f0)] p-[23px] [&>p]:mt-[5px] [&>p]:text-base max-[960px]:p-5"
      aria-labelledby="share-heading"
    >
      <div className="flex items-center justify-between [&_svg]:text-[#799185]">
        <h2 id="share-heading">Share your room</h2>
        <Link size={18} />
      </div>
      {room ? (
        <>
          <p>One link. Any device.</p>
          <div className="mt-5 flex items-center justify-between gap-2 rounded-[9px] bg-[#f6f9f7] p-3 [&>div]:min-w-0 [&_code]:text-base [&_code]:[overflow-wrap:anywhere] [&_button]:p-2 [&_button]:text-sm">
            <div>
              <span className="mb-[5px] block text-xs tracking-[1px] text-[#728578]">
                ROOM ID
              </span>
              <code>{room.roomId}</code>
            </div>
            <Button
              variant="secondary"
              icon={copied === "room ID" ? Check : Copy}
              onClick={() => onCopy(room.roomId, "room ID")}
              aria-label="Copy room ID"
            >
              {copied === "room ID" ? "Copied" : "Copy"}
            </Button>
          </div>
          <div className="my-[22px] flex flex-col items-center gap-2.5 [&_span]:text-sm [&_span]:text-[#76867c]">
            {qrCode ? (
              <img
                src={qrCode}
                alt={`Scan to open room ${room.roomId}`}
                width="164"
                height="164"
              />
            ) : (
              <p role="status">Generating QR code…</p>
            )}
            <span>Scan to open on another device</span>
          </div>
          <Button
            icon={copied === "link" ? Check : Link}
            onClick={() => onCopy(roomLink, "link")}
            className="w-full"
          >
            {copied === "link" ? "Link copied!" : "Copy room link"}
          </Button>
          <Button
            variant="secondary"
            icon={Download}
            disabled={!qrCode}
            onClick={onDownload}
            className="w-full mt-2"
          >
            Download QR code
          </Button>
          {room.expiresAt && (
            <p className="!mt-3.5 text-center !text-[13px]">
              Expires{" "}
              {new Date(room.expiresAt).toLocaleString([], {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          )}
        </>
      ) : (
        <div className="px-1.5 pt-7 pb-1.5 text-center [&_h3]:mb-2 [&_p]:text-base [&_p]:leading-[1.7] max-[520px]:px-3 max-[520px]:pt-6 max-[520px]:pb-2">
          <span className="mx-auto mb-5 grid size-[76px] place-items-center rounded-[20px] border border-[#e3ece6] bg-[#f0f5f2] text-[#6a9380]">
            <QrCode size={38} strokeWidth={1.4} />
          </span>
          <h3>A connection starts here</h3>
          <p>Create a room to get your sharing link, room ID, and QR code.</p>
          <span className="mt-6 block text-[13px] tracking-[0.3px] text-[#7b8b80]">
            Ready when you are
          </span>
        </div>
      )}
    </section>
  );
}
export default LinkDisplay;
