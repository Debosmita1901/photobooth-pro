"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { backgrounds, type BackgroundId } from "@/lib/backgrounds";
import { type FilterId } from "@/lib/filters";
import { frames, layouts, type FrameId, type LayoutId } from "@/lib/frames";
import { makeSticker, makeGraphicSticker, type GraphicId, type PlacedSticker } from "@/lib/stickers";
import { dataUrlToBlob, downloadDataUrl, makeThumbnail, renderPhotoStrip } from "@/lib/photoStrip";
import { ApiError, saveStrip } from "@/lib/api";
import { CAPTION_MAX, type StripSource } from "@/lib/stripTypes";
import { btnGhost, btnPrimary, btnSecondary, chip, eyebrow, input } from "@/lib/ui";
import FilterSelector from "./FilterSelector";
import PhotoStrip from "./PhotoStrip";
import StickerPicker from "./StickerPicker";
import TopBar from "./TopBar";

type Props = {
  photos: string[];
  filter: FilterId;
  source: StripSource;
  backLabel?: string;
  onRetake: () => void;
};

type Tab = "look" | "frame" | "backdrop" | "stickers" | "text";
const TABS: { id: Tab; label: string }[] = [
  { id: "look", label: "Look" },
  { id: "frame", label: "Frame" },
  { id: "backdrop", label: "Backdrop" },
  { id: "stickers", label: "Stickers" },
  { id: "text", label: "Text" },
];

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const formatDate = (d: Date) => `${String(d.getDate()).padStart(2, "0")} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
const fileStamp = (d: Date) =>
  `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}-${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}`;

/** Mini diagram of a frame style, drawn with CSS for the picker. */
function FrameSwatch({ id }: { id: FrameId }) {
  const f = frames.find((x) => x.id === id)!;
  const cardBg = f.card ?? "transparent";
  const photo = f.id === "black" || f.id === "film" ? "#6b6b6b" : "#bdbab4";
  return (
    <span className="grid h-16 w-full place-items-center rounded-lg bg-[#e9e6e0]">
      <span
        className="flex w-7 flex-col gap-[3px]"
        style={{
          background: cardBg,
          padding: f.sprockets ? "3px 6px" : f.id === "gallery" ? "4px" : f.id === "minimal" ? "0" : "3px",
          paddingBottom: f.id === "polaroid" ? "9px" : f.id === "minimal" ? "0" : "6px",
          borderRadius: f.id === "rounded" ? 5 : 1,
          boxShadow: f.shadow ? "0 2px 5px rgba(0,0,0,.2)" : undefined,
          backgroundImage: f.sprockets
            ? "radial-gradient(circle,#e9e6e0 0.8px,transparent 1px),radial-gradient(circle,#e9e6e0 0.8px,transparent 1px)"
            : undefined,
          backgroundSize: f.sprockets ? "3px 4px" : undefined,
          backgroundPosition: f.sprockets ? "1px 0, calc(100% - 1px) 0" : undefined,
          backgroundRepeat: f.sprockets ? "repeat-y" : undefined,
        }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="block aspect-[4/3] w-full"
            style={{
              background: photo,
              borderRadius: f.id === "rounded" ? 2 : 0,
              outline: f.keyline ? "0.5px solid #111" : undefined,
              outlineOffset: f.keyline ? 1 : undefined,
            }}
          />
        ))}
      </span>
    </span>
  );
}

export default function Editor({ photos, filter: initialFilter, source, backLabel = "← Retake", onRetake }: Props) {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterId>(initialFilter);
  const [frame, setFrame] = useState<FrameId>("classic");
  const [layout, setLayout] = useState<LayoutId>("strip");
  const [background, setBackground] = useState<BackgroundId>("stone");
  const [caption, setCaption] = useState("");
  const [showDate, setShowDate] = useState(true);
  const [today] = useState(() => formatDate(new Date()));
  const [stickers, setStickers] = useState<PlacedSticker[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("frame");
  const [busy, setBusy] = useState<"save" | "download" | "share" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [canShare] = useState(() => typeof navigator !== "undefined" && typeof navigator.canShare === "function");
  // Once saved, re-saving overwrites that same history entry instead of adding a duplicate.
  const [savedId, setSavedId] = useState<string | null>(null);
  const [savedSignature, setSavedSignature] = useState<string | null>(null);

  const options = { photos, filter, background, frame, layout, caption, date: showDate ? today : "" };
  const signature = JSON.stringify({ ...options, photos: photos.length, stickers });
  const isSaved = savedSignature === signature;
  const selected = stickers.find((s) => s.id === selectedId) ?? null;

  const randomSpot = () => [0.25 + Math.random() * 0.5, 0.2 + Math.random() * 0.6] as const;

  function addSticker(emoji: string) {
    const s = makeSticker(emoji, ...randomSpot());
    setStickers((prev) => [...prev, s]);
    setSelectedId(s.id);
  }

  function addGraphicSticker(id: GraphicId) {
    const s = makeGraphicSticker(id, ...randomSpot());
    setStickers((prev) => [...prev, s]);
    setSelectedId(s.id);
  }

  function updateSticker(id: string, patch: Partial<PlacedSticker>) {
    setStickers((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  function removeSticker(id: string) {
    setStickers((prev) => prev.filter((s) => s.id !== id));
    setSelectedId(null);
  }

  // Delete / Backspace removes the selected sticker on laptops
  useEffect(() => {
    if (!selectedId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === "Delete" || e.key === "Backspace") removeSticker(selectedId);
      if (e.key === "Escape") setSelectedId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId]);

  const render = () => renderPhotoStrip({ ...options, stickers });

  /** Saves the rendered strip to the user's history (creating it, or updating the one saved earlier). */
  async function persist(dataUrl: string) {
    const signatureAtSave = signature;
    const [image, thumb] = await Promise.all([
      dataUrlToBlob(dataUrl),
      makeThumbnail(dataUrl).then(dataUrlToBlob),
    ]);
    const payload = { image, thumb, caption, background, source };

    let result: { id: string };
    try {
      result = await saveStrip({ ...payload, id: savedId });
    } catch (err) {
      // The saved copy was deleted elsewhere (e.g. from the history page): save as a new one.
      if (savedId && err instanceof ApiError && err.status === 404) result = await saveStrip({ ...payload, id: null });
      else throw err;
    }
    setSavedId(result.id);
    setSavedSignature(signatureAtSave);
  }

  function handleFailure(err: unknown, fallback: string) {
    if (err instanceof ApiError && err.status === 401) {
      router.replace("/login");
      return;
    }
    setError(err instanceof ApiError ? err.message : fallback);
  }

  async function handleSave() {
    setBusy("save");
    setError(null);
    try {
      await persist((await render()).dataUrl);
    } catch (err) {
      handleFailure(err, "Couldn't save your strip. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  async function handleExport(mode: "download" | "share") {
    setBusy(mode);
    setError(null);
    try {
      const { dataUrl } = await render();
      const name = `photobooth-${fileStamp(new Date())}.png`;
      let shared = false;
      if (mode === "share") {
        const file = new File([await dataUrlToBlob(dataUrl)], name, { type: "image/png" });
        if (navigator.canShare?.({ files: [file] })) {
          try {
            await navigator.share({ files: [file], title: caption || "Photo strip" });
            shared = true;
          } catch (e) {
            if (e instanceof DOMException && e.name === "AbortError") return; // user closed the share sheet
          }
        }
      }
      if (!shared) downloadDataUrl(dataUrl, name);
      // Every strip you export also ends up in your history.
      if (!isSaved) {
        try {
          await persist(dataUrl);
        } catch (err) {
          handleFailure(err, "Exported, but couldn't save it to your strips.");
        }
      }
    } catch {
      setError("Couldn't create the image. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  const stickerTools = selected && (
    <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-line bg-surface p-1.5">
      <span className="px-2 text-xs font-semibold text-muted">Sticker</span>
      <button className={chip(false)} onClick={() => updateSticker(selected.id, { scale: Math.max(0.4, +(selected.scale - 0.15).toFixed(2)) })} aria-label="smaller">−</button>
      <button className={chip(false)} onClick={() => updateSticker(selected.id, { scale: Math.min(3, +(selected.scale + 0.15).toFixed(2)) })} aria-label="larger">+</button>
      <button className={chip(false)} onClick={() => updateSticker(selected.id, { rotation: selected.rotation - 15 })} aria-label="rotate left">↺</button>
      <button className={chip(false)} onClick={() => updateSticker(selected.id, { rotation: selected.rotation + 15 })} aria-label="rotate right">↻</button>
      <button className={`${chip(false)} text-accent`} onClick={() => removeSticker(selected.id)}>Delete</button>
    </div>
  );

  return (
    <div className="flex min-h-dvh flex-col">
      <TopBar
        left={<button onClick={onRetake} className={btnGhost}>{backLabel}</button>}
        title="Editor"
        right={
          <Link
            href="/history"
            onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
              // Leaving mid-edit would throw the strip away, so make sure that's intended.
              if (!isSaved && !window.confirm("This strip isn't saved yet. Leave without saving?")) e.preventDefault();
            }}
            className={btnGhost}
          >
            My strips
          </Link>
        }
      />

      <main className="mx-auto grid w-full max-w-6xl flex-1 gap-5 px-4 py-4 sm:px-6 sm:py-6 lg:grid-cols-[1fr_400px] lg:gap-10">
        {/* preview */}
        <section className="min-w-0 lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-3xl bg-[#e9e6e0] p-4 [--strip-max-h:58dvh] sm:p-8 lg:[--strip-max-h:calc(100dvh_-_11rem)]">
            <PhotoStrip
              options={options}
              stickers={stickers}
              maxHeight="var(--strip-max-h)"
              selectedId={selectedId}
              onSelect={setSelectedId}
              onStickerMove={(id, x, y) => updateSticker(id, { x, y })}
            />
          </div>
          {stickerTools && <div className="mt-3 lg:hidden">{stickerTools}</div>}
        </section>

        {/* controls */}
        <section className="min-w-0 pb-28 lg:pb-0">
          <div role="tablist" className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto border-b border-line px-4 sm:mx-0 sm:px-0">
            {TABS.map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={`relative shrink-0 px-3 pb-3 pt-1 text-sm font-semibold transition ${
                  tab === t.id ? "text-ink" : "text-muted hover:text-ink"
                }`}
              >
                {t.label}
                {tab === t.id && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-ink" />}
              </button>
            ))}
          </div>

          <div className="min-h-[220px] py-5">
            {tab === "look" && (
              <div>
                <FilterSelector active={filter} onSelect={setFilter} previewSrc={photos[0]} />
                <p className="mt-3 text-xs text-muted">Looks are applied non-destructively — switch any time.</p>
              </div>
            )}

            {tab === "frame" && (
              <div className="space-y-5">
                <div>
                  <p className={`${eyebrow} mb-2`}>Layout</p>
                  <div className="flex gap-2">
                    {layouts.map((l) => (
                      <button key={l.id} onClick={() => setLayout(l.id)} className={chip(layout === l.id)} disabled={photos.length < 2 && l.id === "grid"}>
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className={`${eyebrow} mb-2`}>Border</p>
                  <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-3">
                    {frames.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setFrame(f.id)}
                        aria-pressed={frame === f.id}
                        className={`rounded-xl p-1.5 text-left transition ${
                          frame === f.id ? "bg-surface ring-2 ring-ink" : "bg-surface ring-1 ring-line hover:ring-ink/40"
                        }`}
                      >
                        <FrameSwatch id={f.id} />
                        <span className="mt-1.5 block px-0.5 text-xs font-semibold">{f.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {tab === "backdrop" && (
              <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-5 lg:grid-cols-4">
                {backgrounds.map((b) => (
                  <button key={b.id} onClick={() => setBackground(b.id)} aria-pressed={background === b.id} className="text-left">
                    <span
                      className={`block h-14 rounded-xl transition ${
                        background === b.id ? "ring-2 ring-ink ring-offset-2 ring-offset-paper" : "ring-1 ring-line"
                      }`}
                      style={{ background: b.swatch }}
                    />
                    <span className={`mt-1 block text-[11px] font-medium ${background === b.id ? "text-ink" : "text-muted"}`}>{b.label}</span>
                  </button>
                ))}
              </div>
            )}

            {tab === "stickers" && (
              <div className="space-y-4">
                {stickerTools && <div className="hidden lg:block">{stickerTools}</div>}
                <StickerPicker onPick={addSticker} onPickGraphic={addGraphicSticker} />
                {stickers.length > 0 && (
                  <button onClick={() => { setStickers([]); setSelectedId(null); }} className={btnGhost}>
                    Remove all stickers
                  </button>
                )}
              </div>
            )}

            {tab === "text" && (
              <div className="space-y-5">
                <div>
                  <label htmlFor="caption" className={`${eyebrow} mb-2 block`}>Caption</label>
                  <input
                    id="caption"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value.slice(0, CAPTION_MAX))}
                    placeholder="Friday night"
                    className={input}
                  />
                  <p className="mt-1 text-right text-[11px] tabular-nums text-muted">{caption.length}/{CAPTION_MAX}</p>
                </div>
                <label className="flex cursor-pointer items-center justify-between rounded-xl border border-line bg-surface px-4 py-3">
                  <span>
                    <span className="block text-sm font-semibold">Date stamp</span>
                    <span className="block text-xs text-muted">{today}</span>
                  </span>
                  <input type="checkbox" checked={showDate} onChange={(e) => setShowDate(e.target.checked)} className="peer sr-only" />
                  <span className="relative h-6 w-11 rounded-full bg-line transition peer-checked:bg-ink after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-5" />
                </label>
              </div>
            )}
          </div>

          {/* actions */}
          <div className="safe-bottom fixed inset-x-0 bottom-0 z-20 border-t border-line bg-paper/90 px-4 pt-3 backdrop-blur-md lg:static lg:border-0 lg:bg-transparent lg:p-0">
            <div className="flex gap-2 lg:flex-col">
              <button onClick={handleSave} disabled={busy !== null} className={`${btnPrimary} flex-1`}>
                {busy === "save" ? "Saving…" : isSaved ? "Saved ✓" : "Save"}
              </button>
              <div className="flex flex-1 gap-2">
                <button onClick={() => handleExport("download")} disabled={busy !== null} className={`${btnSecondary} flex-1 px-4`}>
                  {busy === "download" ? "Preparing…" : "Download"}
                </button>
                {canShare && (
                  <button onClick={() => handleExport("share")} disabled={busy !== null} className={`${btnSecondary} flex-1 px-4 lg:hidden`}>
                    {busy === "share" ? "…" : "Share"}
                  </button>
                )}
              </div>
            </div>
            <p role="status" aria-live="polite" className="min-h-5 pt-1.5 text-center text-xs font-medium text-muted">
              {error ? (
                <span className="text-accent">{error}</span>
              ) : isSaved ? (
                <>
                  Saved to your strips ·{" "}
                  <Link href="/history" className="font-semibold text-ink underline underline-offset-2">View</Link>
                </>
              ) : (
                <span className="hidden lg:inline">Tap a sticker to select · drag to move</span>
              )}
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
