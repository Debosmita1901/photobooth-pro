/** Frame styles (the card the photos sit on) and strip layouts. */

export type FrameId = "classic" | "black" | "film" | "polaroid" | "gallery" | "minimal" | "rounded";
export type LayoutId = "strip" | "grid";
export type CaptionStyle = "serif" | "italic" | "mono";

export type FrameDef = {
  id: FrameId;
  label: string;
  /** Card colour; null means photos sit directly on the backdrop. */
  card: string | null;
  ink: string | null; // caption colour; null = pick from backdrop brightness
  muted: string | null;
  radius: number; // card corner radius
  photoRadius: number;
  margin: number; // backdrop visible around the card
  pad: number; // card padding around the photos
  gap: number; // space between photos
  footer: number; // caption area height (includes bottom padding)
  caption: CaptionStyle;
  shadow: boolean;
  sprockets?: boolean; // 35mm film perforations
  keyline?: { color: string; width: number; offset: number }; // matted gallery line
};

export const frames: FrameDef[] = [
  { id: "classic", label: "Classic", card: "#ffffff", ink: "#111111", muted: "#8a8a8a", radius: 6, photoRadius: 2, margin: 36, pad: 32, gap: 24, footer: 150, caption: "serif", shadow: true },
  { id: "black", label: "Black", card: "#0d0d0d", ink: "#f4f2ee", muted: "#8d8d8d", radius: 6, photoRadius: 2, margin: 36, pad: 32, gap: 24, footer: 150, caption: "serif", shadow: true },
  { id: "film", label: "35mm", card: "#0b0b0b", ink: "#e9c77b", muted: "#9a8558", radius: 0, photoRadius: 4, margin: 0, pad: 76, gap: 40, footer: 120, caption: "mono", shadow: false, sprockets: true },
  { id: "polaroid", label: "Instant", card: "#fbfaf6", ink: "#222222", muted: "#8a8680", radius: 3, photoRadius: 0, margin: 36, pad: 30, gap: 30, footer: 220, caption: "italic", shadow: true },
  { id: "gallery", label: "Gallery", card: "#ffffff", ink: "#111111", muted: "#7a7a7a", radius: 0, photoRadius: 0, margin: 36, pad: 60, gap: 48, footer: 170, caption: "serif", shadow: true, keyline: { color: "#111111", width: 2, offset: 12 } },
  { id: "minimal", label: "Minimal", card: null, ink: null, muted: null, radius: 0, photoRadius: 0, margin: 0, pad: 28, gap: 14, footer: 130, caption: "serif", shadow: false },
  { id: "rounded", label: "Rounded", card: "#fffaf3", ink: "#b3242f", muted: "#c9707a", radius: 28, photoRadius: 18, margin: 14, pad: 14, gap: 20, footer: 110, caption: "italic", shadow: true },
];

export const layouts: { id: LayoutId; label: string }[] = [
  { id: "strip", label: "Strip" },
  { id: "grid", label: "Grid" },
];

export const getFrame = (id: FrameId): FrameDef => frames.find((f) => f.id === id) ?? frames[0];
