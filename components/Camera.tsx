"use client";

import { useEffect, useRef, useState } from "react";
import { useCamera, type Facing } from "@/lib/camera";
import { fxOverlays, getFilter, type FilterId } from "@/lib/filters";
import { btnGhost, btnPrimary, chip, eyebrow } from "@/lib/ui";
import Countdown from "./Countdown";
import FilterSelector from "./FilterSelector";
import TopBar from "./TopBar";

type Props = {
  onComplete: (photos: string[], filter: FilterId) => void;
  onBack: () => void;
};

const SHOTS = 4;
const TIMERS = [3, 5, 10] as const;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function Camera({ onComplete, onBack }: Props) {
  const [facing, setFacing] = useState<Facing>("user");
  const { videoRef, status, errorMessage, capture } = useCamera(facing);
  const [filterId, setFilterId] = useState<FilterId>("original");
  const [timer, setTimer] = useState<(typeof TIMERS)[number]>(3);
  const [showGrid, setShowGrid] = useState(false);
  const [countdown, setCountdown] = useState<number | "smile" | null>(null);
  const [shots, setShots] = useState<string[]>([]);
  const [flash, setFlash] = useState(false);
  const [running, setRunning] = useState(false);
  const cancelRef = useRef(false);
  const runningRef = useRef(false);

  const look = getFilter(filterId);
  const mirror = facing === "user";

  async function runSession() {
    if (runningRef.current || status !== "ready") return;
    runningRef.current = true;
    setRunning(true);
    cancelRef.current = false;
    const taken: string[] = [];
    setShots([]);

    for (let i = 0; i < SHOTS; i++) {
      for (let n = timer; n >= 1; n--) {
        if (cancelRef.current) break;
        setCountdown(n);
        await sleep(i === 0 || n > 3 ? 800 : 650);
      }
      if (cancelRef.current) break;
      setCountdown("smile");
      await sleep(250);
      const shot = capture(mirror);
      if (shot) taken.push(shot);
      setShots([...taken]);
      setFlash(true);
      await sleep(180);
      setFlash(false);
      await sleep(450);
    }

    setCountdown(null);
    runningRef.current = false;
    setRunning(false);
    if (!cancelRef.current && taken.length) onComplete(taken, filterId);
  }

  function cancel() {
    cancelRef.current = true;
  }

  // Space / Enter starts the session on laptops
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.code === "Space" || e.key === "Enter") && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault();
        void runSession();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="flex min-h-dvh flex-col">
      <TopBar
        left={<button onClick={onBack} className={btnGhost}>← Back</button>}
        title="Camera"
        right={<span className="text-sm font-medium tabular-nums text-muted">{shots.length}/{SHOTS}</span>}
      />

      <main className="mx-auto grid w-full max-w-6xl flex-1 gap-5 px-4 py-4 sm:px-6 sm:py-6 lg:grid-cols-[1fr_340px] lg:gap-8">
        {/* viewfinder */}
        <section className="min-w-0">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-black shadow-[0_20px_50px_-20px_rgba(0,0,0,0.5)]">
            <video
              ref={videoRef}
              muted
              playsInline
              autoPlay
              className={`h-full w-full object-cover ${mirror ? "-scale-x-100" : ""}`}
              style={{ filter: look.css }}
            />
            {fxOverlays(look.fx).map((st, i) => (
              <div key={i} className="pointer-events-none absolute inset-0" style={st} />
            ))}

            {showGrid && (
              <div aria-hidden className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
                {Array.from({ length: 9 }, (_, i) => (
                  <div key={i} className="border-[0.5px] border-white/25" />
                ))}
              </div>
            )}

            {running && (
              <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-black/55 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                <span className="animate-rec h-2 w-2 rounded-full bg-accent" />
                Shot {Math.min(shots.length + 1, SHOTS)} of {SHOTS}
              </div>
            )}

            <Countdown value={countdown} />
            {flash && <div className="absolute inset-0 animate-flash bg-white" />}

            {status === "requesting" && (
              <div className="absolute inset-0 grid place-items-center bg-black/80 text-sm text-white/80">
                Waiting for camera access…
              </div>
            )}
            {(status === "denied" || status === "unavailable") && (
              <div className="absolute inset-0 grid place-items-center bg-black/90 p-6 text-center text-sm text-white">
                {errorMessage}
              </div>
            )}
          </div>

          {/* taken shots */}
          <div className="mt-3 grid grid-cols-4 gap-2">
            {Array.from({ length: SHOTS }, (_, i) => (
              <div key={i} className="relative aspect-[4/3] overflow-hidden rounded-lg border border-line bg-surface">
                {shots[i] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={shots[i]} alt={`shot ${i + 1}`} className="h-full w-full object-cover" style={{ filter: look.css }} />
                ) : (
                  <span className="grid h-full place-items-center text-xs font-medium text-muted/60">{i + 1}</span>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* controls */}
        <aside className="flex min-w-0 flex-col gap-5 pb-24 lg:pb-0">
          <div>
            <p className={`${eyebrow} mb-2`}>Look</p>
            <FilterSelector active={filterId} onSelect={setFilterId} />
          </div>

          <div>
            <p className={`${eyebrow} mb-2`}>Timer</p>
            <div className="flex gap-2">
              {TIMERS.map((t) => (
                <button key={t} onClick={() => setTimer(t)} disabled={running} className={chip(timer === t)}>
                  {t}s
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={() => setShowGrid((v) => !v)} className={chip(showGrid)}>Grid</button>
            <button
              onClick={() => setFacing((f) => (f === "user" ? "environment" : "user"))}
              disabled={running}
              className={chip(false)}
            >
              Flip camera
            </button>
          </div>

          <div className="safe-bottom fixed inset-x-0 bottom-0 z-20 border-t border-line bg-paper/90 px-4 pt-3 backdrop-blur-md lg:static lg:mt-auto lg:border-0 lg:bg-transparent lg:p-0">
            {running ? (
              <button onClick={cancel} className={`${btnPrimary} w-full bg-accent hover:bg-accent/85`}>
                Stop session
              </button>
            ) : (
              <button onClick={runSession} disabled={status !== "ready"} className={`${btnPrimary} w-full`}>
                <span className="h-3 w-3 rounded-full bg-accent" /> Start · {SHOTS} shots
              </button>
            )}
            <p className="mt-2 hidden text-center text-xs text-muted lg:block">Press Space to start</p>
          </div>
        </aside>
      </main>
    </div>
  );
}
