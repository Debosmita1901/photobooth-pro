/** Shared Tailwind class strings so every screen uses the same controls. */

export const btnPrimary =
  "inline-flex h-12 items-center justify-center gap-2 rounded-full bg-ink px-6 text-[15px] font-semibold text-white transition hover:bg-black/80 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40";

export const btnSecondary =
  "inline-flex h-12 items-center justify-center gap-2 rounded-full border border-line bg-surface px-6 text-[15px] font-semibold text-ink transition hover:border-ink/40 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40";

export const btnGhost =
  "inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-muted transition hover:bg-black/5 hover:text-ink";

export const card =
  "rounded-3xl border border-line bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.04),0_16px_40px_-12px_rgba(0,0,0,0.12)]";

export const eyebrow = "text-[11px] font-semibold uppercase tracking-[0.16em] text-muted";

export const input =
  "h-12 w-full rounded-xl border border-line bg-surface px-3.5 text-[15px] text-ink outline-none transition placeholder:text-muted/60 focus:border-ink focus:ring-4 focus:ring-black/5";

export const chip = (active: boolean) =>
  `inline-flex h-9 shrink-0 items-center rounded-full border px-4 text-sm font-medium transition ${
    active ? "border-ink bg-ink text-white" : "border-line bg-surface text-ink hover:border-ink/40"
  }`;
