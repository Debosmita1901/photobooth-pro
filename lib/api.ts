import type { StripSource } from "./stripTypes";

/** Thin wrappers around the app's API routes (browser only). */

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

async function failFrom(res: Response): Promise<ApiError> {
  let message = "Something went wrong. Please try again.";
  try {
    const data = await res.json();
    if (typeof data?.error === "string") message = data.error;
  } catch {
    /* non-JSON error body */
  }
  return new ApiError(message, res.status);
}

export type SaveStripInput = {
  /** Pass the id returned by a previous save to overwrite that strip instead of creating another. */
  id?: string | null;
  image: Blob; // PNG
  thumb: Blob; // JPEG
  caption: string;
  background: string;
  source: StripSource;
};

export async function saveStrip(input: SaveStripInput): Promise<{ id: string }> {
  const form = new FormData();
  form.append("image", input.image, "strip.png");
  form.append("thumb", input.thumb, "thumb.jpg");
  form.append("caption", input.caption);
  form.append("background", input.background);
  form.append("source", input.source);

  const res = await fetch(input.id ? `/api/strips/${input.id}` : "/api/strips", {
    method: input.id ? "PUT" : "POST",
    body: form,
  });
  if (!res.ok) throw await failFrom(res);
  const data = await res.json();
  return { id: data.id ?? input.id };
}

export async function deleteStrip(id: string): Promise<void> {
  const res = await fetch(`/api/strips/${id}`, { method: "DELETE" });
  if (!res.ok) throw await failFrom(res);
}

export async function logout(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST" });
}

export async function submitAuth(
  mode: "login" | "signup",
  payload: { name?: string; email: string; password: string }
): Promise<void> {
  const res = await fetch(mode === "login" ? "/api/auth/login" : "/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw await failFrom(res);
}
