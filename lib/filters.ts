import type { CSSProperties } from "react";

/** Photo looks. Each look is a CSS filter string (used for live previews) plus
 * optional finishing effects. The same CSS string is compiled into a colour
 * matrix and applied pixel-by-pixel on export, so results are identical on
 * every browser — including iOS Safari, which ignores canvas `ctx.filter`. */

export type FilterId =
  | "original" | "vivid" | "soft" | "warm" | "cool" | "golden" | "matte" | "highkey"
  | "portra" | "fuji" | "vintage" | "faded" | "sepia" | "lomo" | "cinema" | "polar"
  | "bw" | "noir" | "silver" | "selenium"
  | "pink" | "dreamy" | "cute" | "dusk";

export type FilterGroup = "natural" | "film" | "mono" | "mood";

export type FilterFx = {
  vignette?: number; // 0–1 edge darkening
  grain?: number; // 0–1 film grain
  tint?: string; // rgba() colour laid over with soft-light
};

export type FilterDef = {
  id: FilterId;
  label: string;
  group: FilterGroup;
  css: string;
  fx?: FilterFx;
};

export const filterGroups: { id: FilterGroup; label: string }[] = [
  { id: "natural", label: "Natural" },
  { id: "film", label: "Film" },
  { id: "mono", label: "Mono" },
  { id: "mood", label: "Mood" },
];

export const filters: FilterDef[] = [
  // natural
  { id: "original", label: "Original", group: "natural", css: "none" },
  { id: "vivid", label: "Vivid", group: "natural", css: "saturate(1.35) contrast(1.08) brightness(1.02)" },
  { id: "soft", label: "Soft", group: "natural", css: "brightness(1.06) contrast(0.92) saturate(0.9)" },
  { id: "warm", label: "Warm", group: "natural", css: "sepia(0.2) saturate(1.25) brightness(1.04) hue-rotate(-6deg)" },
  { id: "cool", label: "Cool", group: "natural", css: "saturate(1.05) hue-rotate(12deg) brightness(1.02) contrast(1.04)" },
  { id: "golden", label: "Golden", group: "natural", css: "sepia(0.28) saturate(1.4) brightness(1.06) contrast(1.02)", fx: { tint: "rgba(255,170,60,0.18)" } },
  { id: "matte", label: "Matte", group: "natural", css: "contrast(0.82) brightness(1.08) saturate(0.85)" },
  { id: "highkey", label: "High Key", group: "natural", css: "brightness(1.22) contrast(0.9) saturate(0.95)" },
  // film
  { id: "portra", label: "Portra", group: "film", css: "sepia(0.12) saturate(1.1) contrast(0.95) brightness(1.05)", fx: { grain: 0.18, tint: "rgba(255,190,150,0.12)" } },
  { id: "fuji", label: "Fuji", group: "film", css: "saturate(1.15) contrast(1.08) hue-rotate(6deg)", fx: { grain: 0.18, tint: "rgba(80,160,140,0.12)" } },
  { id: "vintage", label: "Vintage", group: "film", css: "sepia(0.4) contrast(1.1) brightness(0.95) saturate(0.75)", fx: { grain: 0.25, vignette: 0.35 } },
  { id: "faded", label: "Faded", group: "film", css: "brightness(1.18) contrast(0.78) saturate(0.5) sepia(0.12)", fx: { grain: 0.15 } },
  { id: "sepia", label: "Sepia", group: "film", css: "sepia(0.75) contrast(1.08) brightness(0.92) saturate(0.6)", fx: { grain: 0.22, vignette: 0.3 } },
  { id: "lomo", label: "Lomo", group: "film", css: "saturate(1.5) contrast(1.25) brightness(0.98)", fx: { vignette: 0.6, grain: 0.12 } },
  { id: "cinema", label: "Cinema", group: "film", css: "contrast(1.15) saturate(0.9) brightness(0.96)", fx: { tint: "rgba(0,110,130,0.2)", vignette: 0.3 } },
  { id: "polar", label: "Polar", group: "film", css: "saturate(0.8) hue-rotate(18deg) brightness(1.08) contrast(1.05)", fx: { tint: "rgba(120,170,230,0.15)" } },
  // mono
  { id: "bw", label: "B&W", group: "mono", css: "grayscale(1) contrast(1.12)" },
  { id: "noir", label: "Noir", group: "mono", css: "grayscale(1) contrast(1.55) brightness(0.9)", fx: { vignette: 0.55, grain: 0.2 } },
  { id: "silver", label: "Silver", group: "mono", css: "grayscale(1) contrast(0.9) brightness(1.12)", fx: { grain: 0.15 } },
  { id: "selenium", label: "Selenium", group: "mono", css: "grayscale(1) sepia(0.3) contrast(1.2) hue-rotate(-20deg)", fx: { vignette: 0.25 } },
  // mood
  { id: "pink", label: "Rosé", group: "mood", css: "saturate(1.35) hue-rotate(-10deg) brightness(1.08) contrast(1.02)", fx: { tint: "rgba(255,120,160,0.14)" } },
  { id: "dreamy", label: "Dreamy", group: "mood", css: "brightness(1.12) contrast(0.86) saturate(1.1)", fx: { tint: "rgba(200,170,255,0.14)" } },
  { id: "cute", label: "Candy", group: "mood", css: "saturate(1.35) brightness(1.08) contrast(1.05) hue-rotate(-4deg)" },
  { id: "dusk", label: "Dusk", group: "mood", css: "saturate(1.2) contrast(1.1) brightness(0.94) hue-rotate(-14deg)", fx: { tint: "rgba(120,60,160,0.18)", vignette: 0.35 } },
];

export const getFilter = (id: FilterId): FilterDef =>
  filters.find((f) => f.id === id) ?? filters[0];

/* ---------- colour-matrix engine (Filter Effects spec math) ---------- */

/** 3×4 affine colour matrix, row-major: [r0 r1 r2 offset, g…, b…], offsets in 0–255. */
type Matrix = number[];
const IDENTITY: Matrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0];

function mul(a: Matrix, b: Matrix): Matrix {
  // returns a ∘ b (apply b first, then a)
  const out: Matrix = new Array(12);
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      out[r * 4 + c] = a[r * 4] * b[c] + a[r * 4 + 1] * b[4 + c] + a[r * 4 + 2] * b[8 + c];
    }
    out[r * 4 + 3] = a[r * 4] * b[3] + a[r * 4 + 1] * b[7] + a[r * 4 + 2] * b[11] + a[r * 4 + 3];
  }
  return out;
}

function stepMatrix(fn: string, v: number): Matrix {
  switch (fn) {
    case "brightness":
      return [v, 0, 0, 0, 0, v, 0, 0, 0, 0, v, 0];
    case "contrast": {
      const o = (0.5 - 0.5 * v) * 255;
      return [v, 0, 0, o, 0, v, 0, o, 0, 0, v, o];
    }
    case "saturate":
      return [
        0.213 + 0.787 * v, 0.715 - 0.715 * v, 0.072 - 0.072 * v, 0,
        0.213 - 0.213 * v, 0.715 + 0.285 * v, 0.072 - 0.072 * v, 0,
        0.213 - 0.213 * v, 0.715 - 0.715 * v, 0.072 + 0.928 * v, 0,
      ];
    case "grayscale": {
      const a = 1 - Math.min(1, v);
      return [
        0.2126 + 0.7874 * a, 0.7152 - 0.7152 * a, 0.0722 - 0.0722 * a, 0,
        0.2126 - 0.2126 * a, 0.7152 + 0.2848 * a, 0.0722 - 0.0722 * a, 0,
        0.2126 - 0.2126 * a, 0.7152 - 0.7152 * a, 0.0722 + 0.9278 * a, 0,
      ];
    }
    case "sepia": {
      const a = 1 - Math.min(1, v);
      return [
        0.393 + 0.607 * a, 0.769 - 0.769 * a, 0.189 - 0.189 * a, 0,
        0.349 - 0.349 * a, 0.686 + 0.314 * a, 0.168 - 0.168 * a, 0,
        0.272 - 0.272 * a, 0.534 - 0.534 * a, 0.131 + 0.869 * a, 0,
      ];
    }
    case "hue-rotate": {
      const r = (v * Math.PI) / 180;
      const c = Math.cos(r);
      const s = Math.sin(r);
      return [
        0.213 + c * 0.787 - s * 0.213, 0.715 - c * 0.715 - s * 0.715, 0.072 - c * 0.072 + s * 0.928, 0,
        0.213 - c * 0.213 + s * 0.143, 0.715 + c * 0.285 + s * 0.14, 0.072 - c * 0.072 - s * 0.283, 0,
        0.213 - c * 0.213 - s * 0.787, 0.715 - c * 0.715 + s * 0.715, 0.072 + c * 0.928 + s * 0.072, 0,
      ];
    }
    default:
      return IDENTITY;
  }
}

const matrixCache = new Map<string, Matrix | null>();

/** Compiles a CSS filter string into one matrix (null = no-op). */
export function compileCss(css: string): Matrix | null {
  if (matrixCache.has(css)) return matrixCache.get(css)!;
  let m: Matrix | null = null;
  const re = /([a-z-]+)\(\s*(-?[\d.]+)(deg)?\s*\)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(css))) {
    m = mul(stepMatrix(match[1], parseFloat(match[2])), m ?? IDENTITY);
  }
  matrixCache.set(css, m);
  return m;
}

let grainTile: HTMLCanvasElement | null = null;
function getGrainTile(): HTMLCanvasElement {
  if (grainTile) return grainTile;
  const c = document.createElement("canvas");
  c.width = c.height = 160;
  const g = c.getContext("2d")!;
  const img = g.createImageData(160, 160);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 128 + (Math.random() - 0.5) * 255;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  grainTile = c;
  return c;
}

/** Applies a look (colour matrix + effects) to the whole of a canvas, in place. */
export function applyLook(canvas: HTMLCanvasElement, def: FilterDef) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const { width: w, height: h } = canvas;

  const m = compileCss(def.css);
  if (m) {
    const img = ctx.getImageData(0, 0, w, h);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i], g = d[i + 1], b = d[i + 2];
      d[i] = m[0] * r + m[1] * g + m[2] * b + m[3];
      d[i + 1] = m[4] * r + m[5] * g + m[6] * b + m[7];
      d[i + 2] = m[8] * r + m[9] * g + m[10] * b + m[11];
    }
    ctx.putImageData(img, 0, 0); // Uint8ClampedArray clamps for us
  }

  const fx = def.fx;
  if (!fx) return;
  ctx.save();
  if (fx.tint) {
    ctx.globalCompositeOperation = "soft-light";
    ctx.fillStyle = fx.tint;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = "source-over";
  }
  if (fx.grain) {
    ctx.globalCompositeOperation = "overlay";
    ctx.globalAlpha = fx.grain * 0.6;
    ctx.fillStyle = ctx.createPattern(getGrainTile(), "repeat")!;
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }
  if (fx.vignette) {
    const grad = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.hypot(w, h) / 2);
    grad.addColorStop(0, "rgba(0,0,0,0)");
    grad.addColorStop(1, `rgba(0,0,0,${fx.vignette})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }
  ctx.restore();
}

/** CSS overlay layers that approximate a look's effects over a live <video>/<img>. */
export function fxOverlays(fx?: FilterFx): CSSProperties[] {
  const out: CSSProperties[] = [];
  if (fx?.tint) out.push({ background: fx.tint, mixBlendMode: "soft-light" });
  if (fx?.vignette) out.push({ background: `radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,${fx.vignette}) 100%)` });
  return out;
}
