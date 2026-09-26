import crypto from "node:crypto";
import { backgrounds } from "@/lib/backgrounds";
import { CAPTION_MAX, STRIP_SOURCES, type StripSource, type StripSummary } from "@/lib/stripTypes";
import { query } from "./db";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_THUMB_BYTES = 1024 * 1024;

export type StripInput = {
  caption: string;
  background: string;
  source: StripSource;
  image: Buffer;
  thumb: Buffer;
};

type Parsed = { ok: true; data: StripInput } | { ok: false; error: string };

const isBlob = (v: unknown): v is Blob =>
  typeof v === "object" && v !== null && typeof (v as Blob).arrayBuffer === "function";

const hasPngSignature = (b: Buffer) =>
  b.length > 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
const hasJpegSignature = (b: Buffer) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;

/** Reads and validates the multipart body sent by the editor's save button. */
export async function parseStripForm(req: Request): Promise<Parsed> {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return { ok: false, error: "Invalid upload." };
  }

  const imageField = form.get("image");
  const thumbField = form.get("thumb");
  if (!isBlob(imageField) || !isBlob(thumbField)) return { ok: false, error: "Missing strip image." };

  const image = Buffer.from(await imageField.arrayBuffer());
  const thumb = Buffer.from(await thumbField.arrayBuffer());
  if (image.length > MAX_IMAGE_BYTES || thumb.length > MAX_THUMB_BYTES) {
    return { ok: false, error: "That strip image is too large." };
  }
  if (!hasPngSignature(image) || !hasJpegSignature(thumb)) {
    return { ok: false, error: "Strip image is not a valid PNG/JPEG." };
  }

  const background = String(form.get("background") ?? "");
  if (!backgrounds.some((b) => b.id === background)) return { ok: false, error: "Unknown background." };

  const source = String(form.get("source") ?? "");
  if (!(STRIP_SOURCES as readonly string[]).includes(source)) return { ok: false, error: "Unknown source." };

  const caption = String(form.get("caption") ?? "").trim().slice(0, CAPTION_MAX);

  return { ok: true, data: { caption, background, source: source as StripSource, image, thumb } };
}

type SummaryRow = {
  id: string;
  caption: string;
  background: string;
  source: StripSource;
  created_at: number;
  updated_at: number;
};

const toSummary = (r: SummaryRow): StripSummary => ({
  id: r.id,
  caption: r.caption,
  background: r.background,
  source: r.source,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

/** Newest first. Deliberately doesn't select the image blobs. */
export async function listStrips(userId: string): Promise<StripSummary[]> {
  const { rows } = await query<SummaryRow>(
    `SELECT id, caption, background, source, created_at, updated_at
       FROM strips WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
  return rows.map(toSummary);
}

export async function createStrip(userId: string, s: StripInput): Promise<StripSummary> {
  const id = crypto.randomUUID();
  const now = Date.now();
  await query(
    `INSERT INTO strips (id, user_id, caption, background, source, image, thumb, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [id, userId, s.caption, s.background, s.source, s.image, s.thumb, now, now]
  );
  return { id, caption: s.caption, background: s.background, source: s.source, createdAt: now, updatedAt: now };
}

/** Returns the new updatedAt, or null if the strip doesn't exist / isn't the user's. */
export async function updateStrip(userId: string, id: string, s: StripInput): Promise<number | null> {
  const now = Date.now();
  const res = await query(
    `UPDATE strips SET caption = $1, background = $2, source = $3, image = $4, thumb = $5, updated_at = $6
      WHERE id = $7 AND user_id = $8`,
    [s.caption, s.background, s.source, s.image, s.thumb, now, id, userId]
  );
  return (res.rowCount ?? 0) > 0 ? now : null;
}

export async function deleteStrip(userId: string, id: string): Promise<boolean> {
  const res = await query("DELETE FROM strips WHERE id = $1 AND user_id = $2", [id, userId]);
  return (res.rowCount ?? 0) > 0;
}

// Fixed column choices — the column name is never taken from user input.
const IMAGE_SQL = {
  full: "SELECT image AS data, created_at FROM strips WHERE id = $1 AND user_id = $2",
  thumb: "SELECT thumb AS data, created_at FROM strips WHERE id = $1 AND user_id = $2",
} as const;

export async function getStripImage(
  userId: string,
  id: string,
  variant: "full" | "thumb"
): Promise<{ data: Buffer; mime: string; createdAt: number } | null> {
  const { rows } = await query<{ data: Buffer | Uint8Array | string; created_at: number }>(IMAGE_SQL[variant], [id, userId]);
  const row = rows[0];
  if (!row) return null;
  return { data: toBuffer(row.data), mime: variant === "thumb" ? "image/jpeg" : "image/png", createdAt: row.created_at };
}

/** pg decodes BYTEA to a Buffer; the fallback handles a raw "\\x…" hex string just in case. */
function toBuffer(v: Buffer | Uint8Array | string): Buffer {
  if (Buffer.isBuffer(v)) return v;
  if (typeof v === "string") return Buffer.from(v.startsWith("\\x") ? v.slice(2) : v, "hex");
  return Buffer.from(v.buffer, v.byteOffset, v.byteLength);
}
