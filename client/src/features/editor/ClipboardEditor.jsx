import { Check, Clock3, Copy, Pencil, ArrowRight, FileText, Trash2 } from 'lucide-react';
import Button from '../../components/Button';

const TTL_OPTIONS = [
  { label: '15 min', value: 15 }, { label: '1 hour', value: 60 },
  { label: '6 hours', value: 360 }, { label: '24 hours', value: 1440 },
];

export default function ClipboardEditor({ room, clipboardText, setClipboardText, isDirty, ttlMinutes, setTtlMinutes, isBusy, loading, saveClipboard, copied, copyValue, deleteRoom }) {
  return (
<section
            id="create"
            className="rounded-2xl border border-[#e0e7e2] bg-white shadow-[0_3px_8px_#1c403804] overflow-hidden border-t-[3px] border-t-[#24765c]"
            aria-labelledby="editor-heading"
          >
            <div className="flex items-center justify-between gap-3.5 border-b border-[#edf0ee] bg-[linear-gradient(110deg,#f0f8f3,#fff_75%)] p-6 [&_p]:mt-1 [&_p]:text-base max-[960px]:items-start max-[960px]:px-[18px] max-[520px]:flex-wrap max-[520px]:px-4 max-[520px]:py-5 max-[520px]:[&_p]:max-w-[200px]">
              <div className="flex items-center gap-3">
                <span className="grid size-[46px] place-items-center rounded-[10px] border border-[#cce2d4] bg-[#e2f0e8] text-[#4e7666] max-[960px]:hidden">
                  <FileText size={21} />
                </span>
                <div>
                  <h2 id="editor-heading">Your clipboard</h2>
                  <p>
                    {room
                      ? "Edit your text, then save your changes."
                      : "A little space for whatever you need to send."}
                  </p>
                </div>
              </div>
              <span
                className={`flex items-center gap-1.5 rounded-[20px] px-[9px] py-[5px] text-sm whitespace-nowrap ${room ? "bg-[#edf7f1] text-[#24765c]" : "bg-[#f3f5f4] text-[#6a7771]"}`}
              >
                <span
                  className={`size-[5px] rounded-full ${room ? "bg-[#24765c]" : "bg-[#8a958f]"}`}
                />
                {room ? "Room created" : "Draft"}
              </span>
            </div>
            <div className="px-6 pt-6 pb-4 max-[960px]:px-[18px] max-[520px]:px-4 max-[520px]:pt-[18px] max-[520px]:pb-3.5">
              <label htmlFor="clipboard-text" className="sr-only">
                Text to share
              </label>
              <textarea
                id="clipboard-text"
                className="block min-h-[305px] w-full resize-y rounded-xl border-2 border-[#5a9d80] bg-[linear-gradient(135deg,#f4faf6,#fff_60%)] p-[18px] text-xl leading-[1.8] text-[#283a31] shadow-[inset_0_1px_4px_#24765c0a] transition-[border-color,box-shadow] placeholder:text-[#8a9690] hover:border-[#347e5f] focus-visible:border-[#24765c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#24765c] focus-visible:shadow-[0_0_0_5px_#24765c14] min-[1440px]:min-h-[340px] max-[760px]:min-h-[270px]"
                value={clipboardText}
                onChange={(event) => setClipboardText(event.target.value)}
                placeholder="Paste or type your text here…"
                spellCheck="false"
                aria-describedby="editor-hint"
              />
              <div className="mt-4 flex justify-between gap-3 text-sm text-[#75827a] [&>span:last-child]:whitespace-nowrap max-[960px]:flex-col max-[960px]:gap-1 min-[521px]:max-[760px]:flex-row">
                <span id="editor-hint">
                  {room
                    ? (isDirty ? "Changes are saved when you update the room." : "Text matches the last confirmed save.")
                    : "Your text is shared only after you create a room."}
                </span>
                <span>{clipboardText.length.toLocaleString()} characters</span>
              </div>
            </div>
            <div className="flex items-center gap-3 border-y border-[#edf0ee] bg-[#fafcfb] px-6 py-4 [&_label]:flex [&_label]:items-center [&_label]:gap-[7px] [&_label]:text-base [&_label]:text-[#617269] [&_select]:rounded-[7px] [&_select]:border [&_select]:border-[#dce4de] [&_select]:bg-white [&_select]:py-[7px] [&_select]:pr-[26px] [&_select]:pl-2.5 [&_select]:text-base [&_select]:text-[#344c3f] max-[520px]:flex-wrap max-[520px]:gap-2.5 max-[520px]:px-4 max-[520px]:py-3.5">
              <label htmlFor="room-expiry">
                <Clock3 size={16} />{" "}
                {room ? "Room expiry" : "Room expires after"}
              </label>
              {room ? (
                <span className="text-base">
                  {new Date(room.expiresAt).toLocaleString([], {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              ) : (
                <select
                  id="room-expiry"
                  value={ttlMinutes}
                  onChange={(event) =>
                    setTtlMinutes(Number(event.target.value))
                  }
                  disabled={Boolean(room) || isBusy}
                >
                  {TTL_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-5 max-[960px]:px-[18px] max-[520px]:p-4">
              <div className="grid grid-cols-2 gap-3 max-[520px]:w-full max-[520px]:grid-cols-1">
                <Button
                  type="button"
                  icon={room ? Pencil : ArrowRight}
                  loading={loading === "create" || loading === "update"}
                  disabled={isBusy}
                  onClick={saveClipboard}
                >
                  {room ? "Update room" : "Create room"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  icon={copied === "text" ? Check : Copy}
                  disabled={!clipboardText}
                  onClick={() => copyValue(clipboardText, "text")}
                >
                  {copied === "text" ? "Copied!" : "Copy text"}
                </Button>
              </div>
              {room && (
                <Button
                  type="button"
                  variant="danger"
                  icon={Trash2}
                  loading={loading === "delete"}
                  disabled={isBusy}
                  onClick={deleteRoom}
                >
                  Delete room
                </Button>
              )}
            </div>
          </section>
  );
}
