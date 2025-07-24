import { useEffect, useRef } from 'react';
import Button from './Button';

export default function RoomSwitchPrompt({ pending, onStay, onDiscard }) {
  const dialog = useRef(null);
  useEffect(() => {
    if (!pending) return;
    const node = dialog.current;
    if (node.showModal) node.showModal(); else node.setAttribute('open', '');
    return () => { if (node.open && node.close) node.close(); };
  }, [pending]);
  if (!pending) return null;
  return <dialog ref={dialog} aria-labelledby="switch-heading" aria-describedby="switch-description"
    onCancel={event => { event.preventDefault(); onStay(); }} className="m-auto max-w-[min(90vw,28rem)] rounded-2xl border border-[#dfe6e1] p-6 shadow-xl backdrop:bg-black/30">
    <h2 id="switch-heading">Keep your unsaved text?</h2>
    <p id="switch-description" className="my-4">Joining this room replaces your current draft. Stay here to keep editing, or discard the draft and join.</p>
    <div className="flex flex-wrap gap-3"><Button onClick={onStay}>Stay here</Button><Button variant="secondary" onClick={onDiscard}>Discard and join</Button></div>
  </dialog>;
}
