import Link from "next/link";
import TopBar from "./TopBar";
import { btnGhost, eyebrow } from "@/lib/ui";

type Props = {
  name: string;
  onTakePhotos: () => void;
  onUpload: () => void;
  onLogout: () => void;
};

const sample = [
  "linear-gradient(135deg,#3a3a3a,#8d8d8d)",
  "linear-gradient(135deg,#6b6b6b,#1d1d1d)",
  "linear-gradient(135deg,#a3a3a3,#474747)",
  "linear-gradient(135deg,#2b2b2b,#7a7a7a)",
];

function OptionCard({ title, body, meta, icon, onClick }: { title: string; body: string; meta: string; icon: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group flex w-full items-center gap-4 rounded-2xl border border-line bg-surface p-4 text-left transition hover:border-ink/40 hover:shadow-[0_12px_30px_-12px_rgba(0,0,0,0.2)] active:scale-[0.99] sm:p-5"
    >
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-ink text-white">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[16px] font-semibold">{title}</span>
        <span className="mt-0.5 block text-sm text-muted">{body}</span>
      </span>
      <span className="hidden text-xs font-medium text-muted sm:block">{meta}</span>
      <span aria-hidden className="text-xl text-muted transition group-hover:translate-x-0.5 group-hover:text-ink">→</span>
    </button>
  );
}

export default function LandingScreen({ name, onTakePhotos, onUpload, onLogout }: Props) {
  return (
    <div className="min-h-dvh">
      <TopBar
        right={
          <>
            <Link href="/history" className={btnGhost}>My strips</Link>
            <button onClick={onLogout} className={btnGhost}>Log out</button>
          </>
        }
      />

      <main className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-10 sm:px-6 md:min-h-[calc(100dvh-3.5rem)] md:grid-cols-[1.1fr_1fr] md:py-0">
        <section>
          <p className={eyebrow}>Welcome back, {name}</p>
          <h2 className="mt-3 font-display text-[40px] font-medium leading-[1.05] tracking-tight sm:text-6xl">
            Your photobooth,<br />
            <span className="italic text-muted">studio grade.</span>
          </h2>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted">
            Four frames, 24 film looks, and professional borders — from black 35mm to gallery mat.
            Works on your phone and your laptop.
          </p>

          <div className="mt-8 grid max-w-lg gap-3">
            <OptionCard
              title="Start a camera session"
              body="Timed shots with a live look preview"
              meta="4 shots"
              onClick={onTakePhotos}
              icon={
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="3" y="6" width="18" height="14" rx="2.5" />
                  <circle cx="12" cy="13" r="3.5" />
                  <path d="M8 6l1.5-2h5L16 6" />
                </svg>
              }
            />
            <OptionCard
              title="Upload photos"
              body="Use up to four from your device"
              meta="JPG · PNG · WebP"
              onClick={onUpload}
              icon={
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M12 16V4m0 0l-4 4m4-4l4 4" />
                  <path d="M4 15v3a2 2 0 002 2h12a2 2 0 002-2v-3" />
                </svg>
              }
            />
          </div>
        </section>

        <section aria-hidden className="relative hidden justify-center md:flex">
          <div className="absolute inset-x-10 top-10 bottom-0 -z-10 rounded-[3rem] bg-gradient-to-b from-black/5 to-transparent" />
          <div className="w-[230px] -rotate-3 bg-[#0d0d0d] p-4 pb-3 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.5)]">
            <div className="flex flex-col gap-3">
              {sample.map((bg, i) => (
                <div key={i} className="aspect-[4/3] w-full" style={{ background: bg }} />
              ))}
            </div>
            <p className="mt-3 text-center font-display text-lg text-[#f4f2ee]">Friday night</p>
            <p className="text-center text-[9px] font-semibold tracking-[0.3em] text-[#8d8d8d]">25 SEP 2026</p>
          </div>
          <div className="-ml-16 mt-16 w-[200px] rotate-6 bg-white p-4 pb-12 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.35)]">
            <div className="aspect-[4/3] w-full" style={{ background: "linear-gradient(135deg,#c9a77c,#6b4f35)" }} />
            <div className="mt-3 aspect-[4/3] w-full" style={{ background: "linear-gradient(135deg,#a8b5a0,#3c4a3a)" }} />
          </div>
        </section>
      </main>
    </div>
  );
}
