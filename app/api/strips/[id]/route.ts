import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/auth";
import { deleteStrip, parseStripForm, updateStrip } from "@/lib/server/strips";

type Ctx = { params: Promise<{ id: string }> };

const unauthorized = () => NextResponse.json({ error: "Please sign in again." }, { status: 401 });
const notFound = () => NextResponse.json({ error: "Strip not found." }, { status: 404 });

/** Replace a saved strip (the editor re-saves the same strip after further edits). */
export async function PUT(req: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const parsed = await parseStripForm(req);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const updatedAt = await updateStrip(user.id, id, parsed.data);
  return updatedAt === null ? notFound() : NextResponse.json({ id, updatedAt });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const { id } = await params;
  return (await deleteStrip(user.id, id)) ? NextResponse.json({ ok: true }) : notFound();
}
