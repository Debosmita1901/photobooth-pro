"use client";

import { useRef, useState } from "react";
import { fxOverlays, getFilter, type FilterId } from "@/lib/filters";
import { MAX_UPLOAD_PHOTOS, fileToPhotoDataUrl } from "@/lib/upload";
import { btnGhost, btnPrimary, eyebrow } from "@/lib/ui";
import FilterSelector from "./FilterSelector";
import TopBar from "./TopBar";

/* eslint-disable @next/next/no-img-element */

type Props = {
  initialPhotos?: string[];
  initialFilter?: FilterId;
  onComplete: (photos: string[], filter: FilterId) => void;
  onBack: () => void;
};

const iconBtn =
  "grid h-8 w-8 place-items-center rounded-full bg-black/60 text-xs font-bold text-white backdrop-blur transition hover:bg-black/80 disabled:opacity-30";

export default function UploadScreen({ initialPhotos = [], initialFilter = "original", onComplete, onBack }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [photos, setPhotos] = useState<string[]>(initialPhotos);
  const [filterId, setFilterId] = useState<FilterId>(initialFilter);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const look = getFilter(filterId);
  const full = photos.length >= MAX_UPLOAD_PHOTOS;

  async function addFiles(list: FileList | File[]) {
    const files = Array.from(list);
    if (!files.length) return;

    const room = MAX_UPLOAD_PHOTOS - photos.length;
    if (room <= 0) {
      setMessage(`A strip holds ${MAX_UPLOAD_PHOTOS} photos — remove one to add another.`);
      return;
    }

    setBusy(true);
    setMessage(null);
    const results = await Promise.allSettled(files.slice(0, room).map(fileToPhotoDataUrl));
    const added = results.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
    const firstError = results.find((r): r is PromiseRejectedResult => r.status === "rejected");

    setPhotos((prev) => [...prev, ...added].slice(0, MAX_UPLOAD_PHOTOS));
    if (firstError) {
      setMessage(firstError.reason instanceof Error ? firstError.reason.message : "Couldn't read that image.");
    } else if (files.length > room) {
      setMessage(`Only ${MAX_UPLOAD_PHOTOS} photos fit on a strip, so I kept the first ${room}.`);
    }
    setBusy(false);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) void addFiles(e.target.files);
    e.target.value = ""; // allow re-picking the same file later
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    void addFiles(e.dataTransfer.files);
  }

  function removePhoto(i: number) {
    setPhotos((prev) => prev.filter((_, idx) => idx !== i));
    setMessage(null);
  }

  function movePhoto(i: number, dir: -1 | 1) {
    setPhotos((prev) => {
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <TopBar
        left={<button onClick={onBack} className={btnGhost}>← Back</button>}
        title="Upload"
        right={<span className="text-sm font-medium tabular-nums text-muted">{photos.length}/{MAX_UPLOAD_PHOTOS}</span>}
      />

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={handleInputChange}
        aria-label="Choose photos from your device"
      />

      <main className="mx-auto grid w-full max-w-6xl flex-1 gap-5 px-4 py-4 sm:px-6 sm:py-6 lg:grid-cols-[1fr_340px] lg:gap-8">
        <section className="min-w-0">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`grid grid-cols-2 gap-2.5 rounded-2xl transition sm:gap-3 ${dragging ? "outline-2 outline-offset-4 outline-ink outline-dashed" : ""}`}
          >
            {Array.from({ length: MAX_UPLOAD_PHOTOS }, (_, i) => {
              const src = photos[i];
              if (!src) {
                return (
                  <button
                    key={i}
                    onClick={() => inputRef.current?.click()}
                    disabled={busy}
                    className="grid aspect-[4/3] place-items-center rounded-2xl border border-dashed border-ink/20 bg-surface text-muted transition hover:border-ink/50 hover:text-ink disabled:cursor-wait"
                  >
                    <span className="text-center text-xs font-medium">
                      <span className="mx-auto mb-1 grid h-9 w-9 place-items-center rounded-full border border-line text-lg">+</span>
                      {i === photos.length ? "Add photos" : `Photo ${i + 1}`}
                    </span>
                  </button>
                );
              }
              return (
                <div key={i} className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-black">
                  <img src={src} alt={`photo ${i + 1}`} className="h-full w-full object-cover" style={{ filter: look.css }} />
                  {fxOverlays(look.fx).map((st, k) => (
                    <span key={k} className="pointer-events-none absolute inset-0" style={st} />
                  ))}
                  <span className="absolute left-2 top-2 grid h-6 min-w-6 place-items-center rounded-full bg-black/60 px-1.5 text-[11px] font-semibold text-white backdrop-blur">
                    {i + 1}
                  </span>
                  <div className="absolute inset-x-2 bottom-2 flex items-center justify-between">
                    <div className="flex gap-1">
                      <button onClick={() => movePhoto(i, -1)} disabled={i === 0} className={iconBtn} aria-label={`move photo ${i + 1} earlier`}>
                        ←
                      </button>
                      <button onClick={() => movePhoto(i, 1)} disabled={i === photos.length - 1} className={iconBtn} aria-label={`move photo ${i + 1} later`}>
                        →
                      </button>
                    </div>
                    <button onClick={() => removePhoto(i)} className={iconBtn} aria-label={`remove photo ${i + 1}`}>
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="mt-3 text-center text-xs text-muted">
            {busy
              ? "Preparing your photos…"
              : full
              ? "Strip is full · reorder with the arrows"
              : "Tap a slot or drop photos here · centre-cropped to 4:3"}
          </p>
          <p role="status" aria-live="polite" className="min-h-5 text-center text-xs font-semibold text-accent">
            {message}
          </p>
        </section>

        <aside className="flex min-w-0 flex-col gap-5 pb-24 lg:pb-0">
          <div>
            <p className={`${eyebrow} mb-2`}>Look</p>
            <FilterSelector active={filterId} onSelect={setFilterId} previewSrc={photos[0]} />
            <p className="mt-2 text-xs text-muted">You can still change the look in the editor.</p>
          </div>

          <div className="safe-bottom fixed inset-x-0 bottom-0 z-20 border-t border-line bg-paper/90 px-4 pt-3 backdrop-blur-md lg:static lg:mt-auto lg:border-0 lg:bg-transparent lg:p-0">
            <button
              onClick={() => onComplete(photos, filterId)}
              disabled={photos.length === 0 || busy}
              className={`${btnPrimary} w-full`}
            >
              Continue to editor →
            </button>
          </div>
        </aside>
      </main>
    </div>
  );
}
