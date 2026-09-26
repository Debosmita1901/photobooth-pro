import { NextResponse } from "next/server";
import { query } from "@/lib/server/db";
import { normalizeEmail, startSession, verifyAgainstDummy, verifyPassword } from "@/lib/server/auth";
import { clearAttempts, clientIp, recordAttempt, retryAfterSeconds } from "@/lib/server/rateLimit";

const fail = (error: string, status: number, headers?: HeadersInit) =>
  NextResponse.json({ error }, { status, headers });

const MAX_FAILURES = 8;
const WINDOW_MS = 15 * 60 * 1000;

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return fail("Invalid request.", 400);
  }

  const email = normalizeEmail(body.email);
  const password = typeof body.password === "string" ? body.password : "";
  if (!email || !password || password.length > 128) return fail("Incorrect email or password.", 401);

  const limitKey = `login:${clientIp(req)}:${email}`;
  const wait = retryAfterSeconds(limitKey, MAX_FAILURES);
  if (wait) return fail("Too many attempts. Please wait a bit and try again.", 429, { "Retry-After": String(wait) });

  const { rows } = await query<{ id: string; email: string; name: string; password_hash: string }>(
    "SELECT id, email, name, password_hash FROM users WHERE email = $1",
    [email]
  );
  const user = rows[0];

  const valid = user ? await verifyPassword(password, user.password_hash) : await verifyAgainstDummy(password);
  if (!user || !valid) {
    recordAttempt(limitKey, WINDOW_MS);
    return fail("Incorrect email or password.", 401);
  }

  clearAttempts(limitKey);
  await startSession(user.id);
  return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name } });
}
