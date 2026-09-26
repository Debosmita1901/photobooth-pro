export type StickerCategory = {
  label: string;
  emojis: string[];
};

export const stickerCategories: StickerCategory[] = [
  { label: "Hearts", emojis: ["♡", "💗", "💕", "💘", "🖤", "🤍"] },
  { label: "Stars", emojis: ["⭐", "✨", "🌟", "✦", "💫", "⚡"] },
  { label: "Flowers", emojis: ["🌸", "🌷", "🌼", "🌺", "🌹", "🍀"] },
  { label: "Party", emojis: ["🎀", "🎉", "🥂", "🎁", "🎈", "💌"] },
  { label: "Sky", emojis: ["☁️", "🦋", "🌈", "🍓", "🌙", "☀️"] },
  { label: "Faces", emojis: ["😎", "🥰", "😜", "🐻", "🐰", "🐱"] },
];

/** Small original line-art doodles, on-brand with the strawberry/gingham
 * palette — an alternative to emoji for a more "designed" graphic look. */
export type GraphicId = "star4" | "heartLine" | "bolt" | "smiley" | "crown" | "cat" | "paw" | "bow" | "sparkleHeart" | "strawberry";

export type GraphicSticker = {
  id: GraphicId;
  label: string;
  svg: string; // raw <svg> markup, viewBox 0 0 64 64
};

export const graphicStickers: GraphicSticker[] = [
  {
    id: "star4",
    label: "sparkle",
    svg: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <path d="M32 4 C34 22 42 30 60 32 C42 34 34 42 32 60 C30 42 22 34 4 32 C22 30 30 22 32 4 Z" fill="#111"/>
      <path d="M52 6 C52.6 11 55 13.4 60 14 C55 14.6 52.6 17 52 22 C51.4 17 49 14.6 44 14 C49 13.4 51.4 11 52 6 Z" fill="#111"/>
    </svg>`,
  },
  {
    id: "heartLine",
    label: "heart outline",
    svg: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <path d="M32 54 C10 38 6 22 16 14 C23 9 30 13 32 19 C34 13 41 9 48 14 C58 22 54 38 32 54 Z" fill="none" stroke="#111" stroke-width="3.5" stroke-linejoin="round"/>
    </svg>`,
  },
  {
    id: "bolt",
    label: "bolt",
    svg: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <path d="M36 4 L12 36 H30 L26 60 L52 26 H34 Z" fill="#f5c518" stroke="#111" stroke-width="3" stroke-linejoin="round"/>
    </svg>`,
  },
  {
    id: "smiley",
    label: "smiley",
    svg: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="27" fill="#f5c518" stroke="#111" stroke-width="3"/>
      <ellipse cx="23" cy="26" rx="3" ry="5" fill="#111"/>
      <ellipse cx="41" cy="26" rx="3" ry="5" fill="#111"/>
      <path d="M18 37 Q32 52 46 37" fill="none" stroke="#111" stroke-width="3.5" stroke-linecap="round"/>
    </svg>`,
  },
  {
    id: "crown",
    label: "crown",
    svg: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 48 L6 18 L22 32 L32 12 L42 32 L58 18 L56 48 Z" fill="#e9c77b" stroke="#111" stroke-width="3" stroke-linejoin="round"/>
      <rect x="8" y="48" width="48" height="7" rx="2" fill="#111"/>
    </svg>`,
  },
  {
    id: "cat",
    label: "kitty",
    svg: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 20 L22 6 L28 20 Z" fill="#f7c6cc" stroke="#b3242f" stroke-width="2" stroke-linejoin="round"/>
      <path d="M48 20 L42 6 L36 20 Z" fill="#f7c6cc" stroke="#b3242f" stroke-width="2" stroke-linejoin="round"/>
      <circle cx="32" cy="34" r="20" fill="#fffaf3" stroke="#b3242f" stroke-width="2"/>
      <circle cx="24" cy="32" r="2.3" fill="#b3242f"/>
      <circle cx="40" cy="32" r="2.3" fill="#b3242f"/>
      <path d="M30 39 Q32 41 34 39" stroke="#b3242f" stroke-width="2" fill="none" stroke-linecap="round"/>
      <path d="M6 30 L18 33 M6 39 L18 37 M58 30 L46 33 M58 39 L46 37" stroke="#b3242f" stroke-width="1.4" stroke-linecap="round"/>
    </svg>`,
  },
  {
    id: "paw",
    label: "paw",
    svg: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="32" cy="42" rx="17" ry="13" fill="#b3242f"/>
      <ellipse cx="13" cy="22" rx="7" ry="8.5" fill="#b3242f"/>
      <ellipse cx="27" cy="14" rx="7.5" ry="9" fill="#b3242f"/>
      <ellipse cx="41" cy="14" rx="7.5" ry="9" fill="#b3242f"/>
      <ellipse cx="55" cy="22" rx="7" ry="8.5" fill="#b3242f"/>
    </svg>`,
  },
  {
    id: "bow",
    label: "bow",
    svg: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <path d="M32 32 L8 14 Q3 26 14 32 Q3 38 8 50 Z" fill="#e2414f"/>
      <path d="M32 32 L56 14 Q61 26 50 32 Q61 38 56 50 Z" fill="#e2414f"/>
      <circle cx="32" cy="32" r="6.5" fill="#b3242f"/>
    </svg>`,
  },
  {
    id: "sparkleHeart",
    label: "sparkle",
    svg: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <path d="M32 52 C8 34 8 12 23 10 C29 9 32 17 32 17 C32 17 35 9 41 10 C56 12 56 34 32 52 Z" fill="#e2414f"/>
      <path d="M50 8 L52.5 15 L59 17.5 L52.5 20 L50 27 L47.5 20 L41 17.5 L47.5 15 Z" fill="#f6ead0"/>
    </svg>`,
  },
  {
    id: "strawberry",
    label: "berry",
    svg: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 26 Q32 15 50 26 Q52 46 32 59 Q12 46 14 26 Z" fill="#e2414f"/>
      <path d="M22 15 L26 24 M32 11 L32 22 M42 15 L38 24" stroke="#5a8a45" stroke-width="3" stroke-linecap="round"/>
      <circle cx="24" cy="32" r="1.6" fill="#f6ead0"/>
      <circle cx="34" cy="28" r="1.6" fill="#f6ead0"/>
      <circle cx="43" cy="34" r="1.6" fill="#f6ead0"/>
      <circle cx="26" cy="43" r="1.6" fill="#f6ead0"/>
      <circle cx="38" cy="45" r="1.6" fill="#f6ead0"/>
    </svg>`,
  },
];

export const getGraphic = (id: GraphicId): GraphicSticker =>
  graphicStickers.find((g) => g.id === id) ?? graphicStickers[0];

/** A sticker placed on the photo strip. Position is stored as a 0–1 fraction
 * of the strip's width/height so it scales cleanly to any export size.
 * Either `emoji` or `graphicId` is set, never both. */
export type PlacedSticker = {
  id: string;
  emoji: string;
  graphicId?: GraphicId;
  x: number;
  y: number;
  rotation: number;
  scale: number;
};

function baseSticker(x: number, y: number) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    x,
    y,
    rotation: Math.round((Math.random() - 0.5) * 30),
    scale: 1,
  };
}

export const makeSticker = (emoji: string, x = 0.5, y = 0.5): PlacedSticker => ({
  ...baseSticker(x, y),
  emoji,
});

export const makeGraphicSticker = (graphicId: GraphicId, x = 0.5, y = 0.5): PlacedSticker => ({
  ...baseSticker(x, y),
  emoji: "",
  graphicId,
});
