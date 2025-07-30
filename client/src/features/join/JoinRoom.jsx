import Button from '../../components/Button';

export default function JoinRoom({ joinRoomId, setJoinRoomId, fetchRoom, cancelJoin, retryJoin, readFailure, retryReady, loading, isBusy }) {
  return (
<section
              className="rounded-2xl border border-[#e0e7e2] bg-white shadow-[0_3px_8px_#1c403804] p-[23px] [&>p]:mt-[5px] [&>p]:text-base [&_form]:mt-5 [&_label]:mb-2 [&_label]:block [&_label]:text-sm [&_label]:font-semibold [&_label]:text-[#566a5e] max-[960px]:p-5"
              aria-labelledby="join-heading"
            >
              <h2 id="join-heading">Have a room already?</h2>
              <p>Open shared text on this device.</p>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  fetchRoom(joinRoomId);
                }}
              >
                <label htmlFor="join-room">Room ID or link</label>
                <div className="flex gap-2 [&_input]:h-[46px] [&_input]:w-full [&_input]:min-w-0 [&_input]:rounded-lg [&_input]:border [&_input]:border-[#dfe6e1] [&_input]:bg-[#fafcfb] [&_input]:p-2.5 [&_input]:text-base [&_input]:placeholder:text-[#829086]">
                  <input
                    id="join-room"
                    value={joinRoomId}
                    onChange={(event) => setJoinRoomId(event.target.value)}
                    placeholder="Paste ID or room link"
                    autoComplete="off"
                    spellCheck="false"
                    disabled={isBusy}
                  />
                  <Button
                    type="submit"
                    variant="secondary"
                    loading={loading === "join"}
                    disabled={isBusy || !joinRoomId.trim()}
                  >
                    Join
                  </Button>
                </div>
              </form>
              {loading === 'join' && <Button variant="secondary" onClick={cancelJoin}>Cancel join</Button>}
              {readFailure && <div className="mt-4">
                <p>{readFailure.message}</p>
                {!retryReady && <p>Please wait before retrying.</p>}
                <Button variant="secondary" disabled={isBusy || !retryReady} onClick={retryJoin}>Retry join</Button>
              </div>}
            </section>
  );
}
