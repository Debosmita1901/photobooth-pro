import { getBackground, paintBackground, type BackgroundId } from "./backgrounds";
import { applyLook, getFilter, type FilterId } from "./filters";
import { getFrame, type FrameDef, type FrameId, type LayoutId } from "./frames";
import { getGraphic, type GraphicId, type PlacedSticker } from "./stickers";

export type StripOptions = {
  photos: string[]; // data URLs (camera shots are already mirrored, never pre-filtered)
  filter: FilterId;
  background: BackgroundId;
  frame: FrameId;
  layout: LayoutId;
  caption: string;
  date: string; // pre-formatted date line, "" to hide
  stickers: PlacedSticker[];
};

export type RenderResult = { dataUrl: string; width: number; height: number };

export const CELL_W = 640;
export const CELL_H = 480;
/** Sticker size as a fraction of the strip's shorter side (shared with the DOM preview). */
export const STICKER_FRAC = 0.085;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

const graphicImageCache = new Map<GraphicId, Promise<HTMLImageElement>>();
function loadGraphic(id: GraphicId): Promise<HTMLImageElement> {
  let cached = graphicImageCache.get(id);
  if (!cached) {
    cached = loadImage(`data:image/svg+xml;utf8,${encodeURIComponent(getGraphic(id).svg)}`);
    graphicImageCache.set(id, cached);
  }
  return cached;
}

/** Cover-fits a photo into a 4:3 cell and applies the look. Cached per photo + look,
 * so changing frame/caption/stickers re-renders instantly. */
const cellCache = new Map<string, Promise<HTMLCanvasElement>>();
function processedCell(src: string, filter: FilterId): Promise<HTMLCanvasElement> {
  const key = `${filter}|${src.length}|${src.slice(-64)}`;
  let hit = cellCache.get(key);
  if (!hit) {
    hit = loadImage(src).then((img) => {
      const c = document.createElement("canvas");
      c.width = CELL_W;
      c.height = CELL_H;
      const ctx = c.getContext("2d")!;
      const scale = Math.max(CELL_W / img.width, CELL_H / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      ctx.drawImage(img, (CELL_W - dw) / 2, (CELL_H - dh) / 2, dw, dh);
      applyLook(c, getFilter(filter));
      return c;
    });
    if (cellCache.size > 40) cellCache.clear();
    cellCache.set(key, hit);
  }
  return hit;
}

type Geometry = {
  w: number;
  h: number;
  card: { x: number; y: number; w: number; h: number };
  cells: { x: number; y: number }[];
  footerY: number; // top of caption area
};

export function stripGeometry(count: number, frame: FrameDef, layout: LayoutId): Geometry {
  const n = Math.max(1, count);
  const cols = layout === "grid" && n > 1 ? 2 : 1;
  const rows = Math.ceil(n / cols);
  const innerW = cols * CELL_W + (cols - 1) * frame.gap;
  const innerH = rows * CELL_H + (rows - 1) * frame.gap;
  const card = { x: frame.margin, y: frame.margin, w: frame.pad * 2 + innerW, h: frame.pad + innerH + frame.footer };
  const cells = Array.from({ length: n }, (_, i) => {
    const r = Math.floor(i / cols);
    let c = i % cols;
    let x = card.x + frame.pad + c * (CELL_W + frame.gap);
    // centre a lone photo on the last row of a grid
    if (cols === 2 && i === n - 1 && n % 2 === 1) {
      c = 0;
      x = card.x + frame.pad + (innerW - CELL_W) / 2;
    }
    return { x, y: card.y + frame.pad + r * (CELL_H + frame.gap) };
  });
  return {
    w: card.w + frame.margin * 2,
    h: card.h + frame.margin * 2,
    card,
    cells,
    footerY: card.y + frame.pad + innerH,
  };
}

function luminance(hex: string): number {
  const m = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(m.slice(i, i + 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Resolves a next/font CSS variable to its font-family list for canvas text. */
function fontFamily(cssVar: string, fallback: string): string {
  if (typeof document === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim();
  return v ? `${v}, ${fallback}` : fallback;
}

/** Renders the finished strip and returns it as an image. `preview` renders a
 * smaller JPEG for the live editor preview; the default is a full-size PNG. */
export async function renderPhotoStrip(opts: StripOptions, preview = false): Promise<RenderResult> {
  const { photos, filter, background, caption, date, stickers, layout } = opts;
  const frame = getFrame(opts.frame);
  const g = stripGeometry(photos.length, frame, layout);
  const scale = preview ? 0.5 : 1;

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(g.w * scale);
  canvas.height = Math.round(g.h * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.scale(scale, scale);

  const bgBase = getBackground(background).base;
  paintBackground(ctx, background, g.w, g.h);

  // card
  if (frame.card) {
    ctx.save();
    if (frame.shadow) {
      ctx.shadowColor = "rgba(0,0,0,0.22)";
      ctx.shadowBlur = 28;
      ctx.shadowOffsetY = 10;
    }
    roundRect(ctx, g.card.x, g.card.y, g.card.w, g.card.h, frame.radius);
    ctx.fillStyle = frame.card;
    ctx.fill();
    ctx.restore();
  }

  if (frame.sprockets) drawSprockets(ctx, g, frame, bgBase);

  // photos
  const cells = await Promise.all(photos.map((p) => processedCell(p, filter)));
  cells.forEach((cell, i) => {
    const { x, y } = g.cells[i];
    if (frame.keyline) {
      const k = frame.keyline;
      ctx.save();
      ctx.strokeStyle = k.color;
      ctx.lineWidth = k.width;
      ctx.strokeRect(x - k.offset, y - k.offset, CELL_W + k.offset * 2, CELL_H + k.offset * 2);
      ctx.restore();
    }
    ctx.save();
    roundRect(ctx, x, y, CELL_W, CELL_H, frame.photoRadius);
    ctx.clip();
    ctx.drawImage(cell, x, y, CELL_W, CELL_H);
    ctx.restore();
    if (frame.sprockets) {
      ctx.save();
      ctx.fillStyle = frame.muted!;
      ctx.font = `600 18px ui-monospace, "SF Mono", Menlo, monospace`;
      ctx.textBaseline = "top";
      ctx.fillText(`${String(i + 1).padStart(2, "0")}A`, x, y + CELL_H + 10);
      ctx.restore();
    }
  });

  // caption + date
  const onDark = frame.card ? luminance(frame.card) < 0.4 : luminance(bgBase) < 0.4;
  const ink = frame.ink ?? (onDark ? "#f4f2ee" : "#111111");
  const muted = frame.muted ?? (onDark ? "rgba(244,242,238,0.6)" : "rgba(17,17,17,0.55)");
  const text = caption.trim();
  const lines: { text: string; font: string; color: string }[] = [];
  const display = fontFamily("--font-fraunces", "Georgia, 'Times New Roman', serif");
  const sans = fontFamily("--font-inter", "system-ui, sans-serif");
  const mono = `ui-monospace, "SF Mono", Menlo, monospace`;
  if (text) {
    const font =
      frame.caption === "mono" ? `600 30px ${mono}` :
      frame.caption === "italic" ? `italic 400 44px ${display}` :
      `500 40px ${display}`;
    lines.push({ text: frame.caption === "mono" ? text.toUpperCase() : text, font, color: ink });
  }
  if (date) {
    lines.push({ text: date.toUpperCase(), font: `600 20px ${frame.caption === "mono" ? mono : sans}`, color: muted });
  }
  if (lines.length) {
    if (typeof document !== "undefined" && document.fonts) {
      await Promise.all(lines.map((l) => document.fonts.load(l.font, l.text).catch(() => null)));
    }
    const footerBottom = g.card.y + g.card.h;
    const centerY = (g.footerY + footerBottom) / 2 + (frame.sprockets ? 10 : 4);
    const lineH = lines.map((l) => (l.font.includes("20px") ? 30 : 54));
    let y = centerY - lineH.reduce((a, b) => a + b, 0) / 2;
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    lines.forEach((l, i) => {
      ctx.font = l.font;
      ctx.fillStyle = l.color;
      if ("letterSpacing" in ctx && l.font.includes("20px")) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "4px";
      ctx.fillText(l.text, g.w / 2, y + lineH[i] / 2, g.card.w - frame.pad * 2);
      y += lineH[i];
    });
    ctx.restore();
  }

  // stickers
  const graphicIds = Array.from(new Set(stickers.map((s) => s.graphicId).filter(Boolean))) as GraphicId[];
  const graphicImgs = new Map<GraphicId, HTMLImageElement>();
  await Promise.all(graphicIds.map(async (id) => graphicImgs.set(id, await loadGraphic(id))));
  const size = STICKER_FRAC * Math.min(g.w, g.h);
  stickers.forEach((s) => {
    ctx.save();
    ctx.translate(s.x * g.w, s.y * g.h);
    ctx.rotate((s.rotation * Math.PI) / 180);
    ctx.scale(s.scale, s.scale);
    if (s.graphicId) {
      const img = graphicImgs.get(s.graphicId);
      if (img) ctx.drawImage(img, -size / 2, -size / 2, size, size);
    } else {
      ctx.font = `${size * 0.9}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(s.emoji, 0, 0);
    }
    ctx.restore();
  });

  const dataUrl = preview ? canvas.toDataURL("image/jpeg", 0.85) : canvas.toDataURL("image/png");
  return { dataUrl, width: g.w, height: g.h };
}

function drawSprockets(ctx: CanvasRenderingContext2D, g: Geometry, frame: FrameDef, holeColor: string) {
  const holeW = 22;
  const holeH = 30;
  const step = 56;
  const inset = (frame.pad - holeW) / 2;
  ctx.save();
  ctx.fillStyle = holeColor;
  for (let y = g.card.y + 20; y + holeH < g.card.y + g.card.h - 10; y += step) {
    roundRect(ctx, g.card.x + inset, y, holeW, holeH, 4);
    ctx.fill();
    roundRect(ctx, g.card.x + g.card.w - inset - holeW, y, holeW, holeH, 4);
    ctx.fill();
  }
  ctx.restore();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  if (rr <= 0) {
    ctx.rect(x, y, w, h);
    return;
  }
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/** Shrinks a rendered strip to a small JPEG for the history grid. */
export async function makeThumbnail(dataUrl: string, width = 360): Promise<string> {
  const img = await loadImage(dataUrl);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = Math.round((img.height * width) / img.width);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.fillStyle = "#ffffff"; // JPEG has no transparency
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.82);
}

export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  return (await fetch(dataUrl)).blob();
}
