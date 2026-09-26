"use client";

import { useEffect, useRef, useState } from "react";
import { getFrame } from "@/lib/frames";
import { renderPhotoStrip, stripGeometry, STICKER_FRAC, type StripOptions } from "@/lib/photoStrip";
import { getGraphic, type PlacedSticker } from "@/lib/stickers";

type Props = {
  options: Omit<StripOptions, "stickers">;
  stickers: PlacedSticker[];
  /** CSS length the preview must fit within vertically. */
  maxHeight?: string;
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  onStickerMove?: (id: string, x: number, y: number) => void;
};

/** Live, pixel-accurate preview: the strip is rendered by the same canvas code as
 * the export, and stickers are layered on top so they can be dragged. */
export default function PhotoStrip({ options, stickers, maxHeight = "70dvh", selectedId, onSelect, onStickerMove }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [rendering, setRendering] = useState(true);
  const key = JSON.stringify(options);

  const g = stripGeometry(options.photos.length, getFrame(options.frame), options.layout);
  const ratio = g.w / g.h;
  const stickerPct = ((STICKER_FRAC * Math.min(g.w, g.h)) / g.w) * 100;

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(() => {
      setRendering(true);
      renderPhotoStrip({ ...options, stickers: [] }, true)
        .then((r) => !cancelled && setSrc(r.dataUrl))
        .catch(() => {})
        .finally(() => !cancelled && setRendering(false));
    }, 60);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  function handlePointerDown(e: React.PointerEvent<HTMLButtonElement>, id: string) {
    e.stopPropagation();
    onSelect?.(id);
    if (!onStickerMove) return;
    const moveSticker = onStickerMove;
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    function onMove(ev: PointerEvent) {
      const box = containerRef.current?.getBoundingClientRect();
      if (!box) return;
      const x = Math.min(1, Math.max(0, (ev.clientX - box.left) / box.width));
      const y = Math.min(1, Math.max(0, (ev.clientY - box.top) / box.height));
      moveSticker(id, x, y);
    }
    function onUp() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  }

  return (
    <div
      ref={containerRef}
      onPointerDown={() => onSelect?.(null)}
      className="@container relative mx-auto select-none overflow-hidden rounded-sm bg-black/5 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.45)]"
      style={{ aspectRatio: `${g.w} / ${g.h}`, width: `min(100%, calc(${maxHeight} * ${ratio}))` }}
    >
      {src && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt="strip preview"
          draggable={false}
          className={`absolute inset-0 h-full w-full transition-opacity ${rendering ? "opacity-80" : "opacity-100"}`}
        />
      )}
      {!src && <div className="absolute inset-0 animate-pulse bg-black/10" />}

      {stickers.map((s) => {
        const selected = s.id === selectedId;
        return (
          <button
            key={s.id}
            onPointerDown={(e) => handlePointerDown(e, s.id)}
            className={`absolute grid cursor-grab place-items-center leading-none active:cursor-grabbing [&>svg]:h-full [&>svg]:w-full ${
              selected ? "rounded-md outline-2 outline-offset-2 outline-dashed outline-sky-500" : ""
            }`}
            style={{
              left: `${s.x * 100}%`,
              top: `${s.y * 100}%`,
              width: `${stickerPct}%`,
              aspectRatio: "1",
              fontSize: `${stickerPct * 0.9}cqw`,
              transform: `translate(-50%, -50%) rotate(${s.rotation}deg) scale(${s.scale})`,
              touchAction: "none",
            }}
            aria-label="sticker — drag to move, tap to select"
            {...(s.graphicId
              ? { dangerouslySetInnerHTML: { __html: getGraphic(s.graphicId).svg } }
              : { children: s.emoji })}
          />
        );
      })}
    </div>
  );
}
