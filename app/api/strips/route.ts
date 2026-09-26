import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/auth";
import { createStrip, parseStripForm } from "@/lib/server/strips";

/** Save a new strip to the signed-in user's history. */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });

  const parsed = await parseStripForm(req);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const strip = await createStrip(user.id, parsed.data);
  return NextResponse.json({ id: strip.id, updatedAt: strip.updatedAt }, { status: 201 });
}
