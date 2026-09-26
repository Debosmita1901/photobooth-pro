import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { PG_UNIQUE_VIOLATION, query } from "@/lib/server/db";
import { hashPassword, normalizeEmail, normalizeName, startSession, validatePassword } from "@/lib/server/auth";
import { clientIp, recordAttempt, retryAfterSeconds } from "@/lib/server/rateLimit";

const fail = (error: string, status: number, headers?: HeadersInit) =>
  NextResponse.json({ error }, { status, headers });

export async function POST(req: Request) {
  const limitKey = `register:${clientIp(req)}`;
  const wait = retryAfterSeconds(limitKey, 10);
  if (wait) return fail("Too many sign-ups from here. Please try again later.", 429, { "Retry-After": String(wait) });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return fail("Invalid request.", 400);
  }

  const name = normalizeName(body.name);
  const email = normalizeEmail(body.email);
  if (!name) return fail("Please enter a name (up to 30 characters).", 400);
  if (!email) return fail("Please enter a valid email address.", 400);
  const passwordError = validatePassword(body.password);
  if (passwordError) return fail(passwordError, 400);

  recordAttempt(limitKey, 60 * 60 * 1000);

  if ((await query("SELECT 1 FROM users WHERE email = $1", [email])).rowCount) {
    return fail("An account with that email already exists.", 409);
  }

  const id = crypto.randomUUID();
  try {
    await query("INSERT INTO users (id, email, name, password_hash, created_at) VALUES ($1, $2, $3, $4, $5)", [
      id,
      email,
      name,
      await hashPassword(body.password as string),
      Date.now(),
    ]);
  } catch (err) {
    // Two sign-ups racing for the same email: a UNIQUE index on users.email wins.
    if ((err as { code?: string }).code === PG_UNIQUE_VIOLATION) {
      return fail("An account with that email already exists.", 409);
    }
    throw err;
  }

  await startSession(id);
  return NextResponse.json({ user: { id, email, name } }, { status: 201 });
}
