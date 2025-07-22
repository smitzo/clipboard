import ClipboardEditor from './features/editor/ClipboardEditor';
import JoinRoom from './features/join/JoinRoom';
import Home from './components/Home';
import LinkDisplay from './components/LinkDisplay';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Feedback from './components/Feedback';
import { useRoomController } from './useRoomController';

function App() {
  const { editor, join, share, feedback } = useRoomController();
  return (
    <div className="min-h-screen bg-[#f6f8f7] bg-[radial-gradient(ellipse_at_90%_0%,#dceee5_0%,transparent_42%)]">
      <Navbar />
      <main id="main-content" className="mx-[8%] w-4/5">
        <Home />
        <div className="grid grid-cols-1 items-start gap-6 min-[1001px]:grid-cols-[minmax(0,1fr)_minmax(360px,28%)] max-[960px]:gap-[18px]">
          <ClipboardEditor {...editor} />
          <aside
            className="grid gap-5 min-[521px]:max-[760px]:grid-cols-2 max-[760px]:items-start max-[760px]:gap-4"
            aria-label="Join and share rooms"
          >
            <JoinRoom {...join} />
            <LinkDisplay {...share} />
          </aside>
        </div>
        <Sidebar />
        <footer className="mt-[30px] flex justify-between gap-3 border-t border-[#e0e7e2] pt-[22px] pb-[26px] text-sm text-[#7a8880] max-[760px]:flex-col max-[760px]:gap-1.5">
          <span>Clipboard · A simpler way to share text.</span>
          <span>Temporary rooms. No account needed.</span>
        </footer>
      </main>
      <Feedback {...feedback} />
    </div>
  );
}

export default App;
