export type BackgroundId =
  | "white" | "ink" | "stone" | "kraft" | "sage" | "navy" | "grid"
  | "cream" | "blush" | "berry" | "gingham" | "stripes" | "dots" | "hearts" | "paws";

export type BackgroundDef = {
  id: BackgroundId;
  label: string;
  swatch: string;
  base: string; // solid base color used for canvas fill
};

export const backgrounds: BackgroundDef[] = [
  { id: "white", label: "White", swatch: "#ffffff", base: "#ffffff" },
  { id: "ink", label: "Ink", swatch: "#111111", base: "#111111" },
  { id: "stone", label: "Stone", swatch: "#d9d5ce", base: "#d9d5ce" },
  { id: "kraft", label: "Kraft", swatch: "#c9a77c", base: "#c9a77c" },
  { id: "sage", label: "Sage", swatch: "#a8b5a0", base: "#a8b5a0" },
  { id: "navy", label: "Navy", swatch: "#1f2a44", base: "#1f2a44" },
  { id: "grid", label: "Grid", swatch: "linear-gradient(#0000001f 1px,transparent 1px) 0 0/12px 12px, linear-gradient(90deg,#0000001f 1px,transparent 1px) 0 0/12px 12px, #f7f6f2", base: "#f7f6f2" },
  { id: "cream", label: "Cream", swatch: "#f6ead0", base: "#f6ead0" },
  { id: "blush", label: "Blush", swatch: "#f7c6cc", base: "#f7c6cc" },
  { id: "berry", label: "Berry", swatch: "#b3242f", base: "#b3242f" },
  { id: "gingham", label: "Gingham", swatch: "repeating-linear-gradient(90deg,#e2414f66 0 10px,transparent 10px 20px)", base: "#fdf3ea" },
  { id: "stripes", label: "Stripes", swatch: "repeating-linear-gradient(45deg,#f7c6cc 0 8px,#f6ead0 8px 16px)", base: "#f6ead0" },
  { id: "dots", label: "Dots", swatch: "radial-gradient(#e2414f 2px, transparent 2px) 0 0/12px 12px, #f6ead0", base: "#f6ead0" },
  { id: "hearts", label: "Hearts", swatch: "radial-gradient(circle at 35% 35%, #e2414f 0 5px, transparent 6px) 0 0/22px 22px, #fdf3ea", base: "#fdf3ea" },
  { id: "paws", label: "Paws", swatch: "radial-gradient(#b3242f 3px, transparent 3px) 0 0/18px 18px, #f7c6cc", base: "#f7c6cc" },
];

export const getBackground = (id: BackgroundId): BackgroundDef =>
  backgrounds.find((b) => b.id === id) ?? backgrounds[0];

/** Paints a background preset onto a canvas 2D context. */
export function paintBackground(
  ctx: CanvasRenderingContext2D,
  id: BackgroundId,
  w: number,
  h: number
) {
  const bg = getBackground(id);
  ctx.save();
  ctx.fillStyle = bg.base;
  ctx.fillRect(0, 0, w, h);

  if (id === "grid") {
    ctx.strokeStyle = "rgba(0,0,0,0.12)";
    ctx.lineWidth = 1;
    const step = w / 24;
    ctx.beginPath();
    for (let x = 0; x <= w; x += step) { ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, h); }
    for (let y = 0; y <= h; y += step) { ctx.moveTo(0, y + 0.5); ctx.lineTo(w, y + 0.5); }
    ctx.stroke();
  } else if (id === "gingham") {
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = "#e2414f";
    const step = w / 18;
    for (let x = 0; x < w; x += step * 2) ctx.fillRect(x, 0, step, h);
    for (let y = 0; y < h; y += step * 2) ctx.fillRect(0, y, w, step);
    ctx.globalAlpha = 1;
  } else if (id === "stripes") {
    ctx.fillStyle = "#f7c6cc";
    const step = w / 10;
    for (let i = -h; i < w + h; i += step * 2) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + step, 0);
      ctx.lineTo(i + step - h, h);
      ctx.lineTo(i - h, h);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  } else if (id === "dots") {
    ctx.fillStyle = "#e2414f";
    const step = Math.max(14, w / 14);
    for (let y = step / 2; y < h; y += step) {
      for (let x = step / 2; x < w; x += step) {
        ctx.beginPath();
        ctx.arc(x, y, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (id === "hearts") {
    ctx.fillStyle = "#e2414f";
    ctx.globalAlpha = 0.55;
    const step = Math.max(30, w / 12);
    for (let y = step / 2; y < h; y += step) {
      for (let x = step / 2; x < w; x += step) {
        drawHeart(ctx, x, y, step * 0.24);
      }
    }
    ctx.globalAlpha = 1;
  } else if (id === "paws") {
    ctx.fillStyle = "#b3242f";
    ctx.globalAlpha = 0.5;
    const step = Math.max(36, w / 9);
    for (let y = step / 2; y < h; y += step) {
      for (let x = step / 2; x < w; x += step) {
        drawPaw(ctx, x, y, step * 0.15);
      }
    }
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

function drawHeart(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(cx, cy + r * 0.7);
  ctx.bezierCurveTo(cx - r * 1.4, cy - r * 0.5, cx - r * 0.5, cy - r * 1.6, cx, cy - r * 0.4);
  ctx.bezierCurveTo(cx + r * 0.5, cy - r * 1.6, cx + r * 1.4, cy - r * 0.5, cx, cy + r * 0.7);
  ctx.closePath();
  ctx.fill();
}

function drawPaw(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  ctx.ellipse(cx, cy + r * 0.6, r * 1.1, r * 0.85, 0, 0, Math.PI * 2);
  ctx.fill();
  [-1.3, -0.45, 0.45, 1.3].forEach((ox) => {
    ctx.beginPath();
    ctx.ellipse(cx + ox * r * 0.7, cy - r * 0.9, r * 0.4, r * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
  });
}
