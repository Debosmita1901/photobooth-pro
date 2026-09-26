import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/auth";
import { getStripImage } from "@/lib/server/strips";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/strips/:id/image?variant=thumb|full[&download=1]
 * Only the owner can fetch a strip's image. */
export async function GET(req: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });

  const { id } = await params;
  const url = new URL(req.url);
  const variant = url.searchParams.get("variant") === "thumb" ? "thumb" : "full";

  const img = await getStripImage(user.id, id, variant);
  if (!img) return NextResponse.json({ error: "Strip not found." }, { status: 404 });

  const headers: Record<string, string> = {
    "Content-Type": img.mime,
    // Clients add ?v=<updatedAt>, so a given URL never changes content.
    "Cache-Control": "private, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
  };
  if (url.searchParams.get("download") === "1") {
    const day = new Date(img.createdAt).toISOString().slice(0, 10);
    headers["Content-Disposition"] = `attachment; filename="photo-strip-${day}.png"`;
  }

  // new Uint8Array(...) copies the Buffer into a plain ArrayBuffer-backed view, which is what BodyInit wants.
  return new Response(new Uint8Array(img.data), { headers });
}
