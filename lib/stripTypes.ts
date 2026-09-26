/** Types/constants shared by the browser and the server. No server-only imports here. */

export const STRIP_SOURCES = ["camera", "upload"] as const;
export type StripSource = (typeof STRIP_SOURCES)[number];

export const CAPTION_MAX = 40;

/** A saved strip as shown in the history list (image bytes are fetched separately). */
export type StripSummary = {
  id: string;
  caption: string;
  background: string;
  source: StripSource;
  createdAt: number; // unix ms
  updatedAt: number; // unix ms
};
