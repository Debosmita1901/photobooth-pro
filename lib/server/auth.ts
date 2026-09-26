import crypto from "node:crypto";
import { cookies } from "next/headers";
import { query } from "./db";

export const SESSION_COOKIE = "pb_session";
const SESSION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export type SessionUser = { id: string; email: string; name: string };

/* ───────────── passwords (scrypt, built into Node — no native deps) ───────────── */

function scryptAsync(password: string, salt: Buffer, keyLen: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, keyLen, (err, key) => (err ? reject(err) : resolve(key)));
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16);
  const key = await scryptAsync(password, salt, 64);
  return `scrypt:${salt.toString("base64")}:${key.toString("base64")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, saltB64, keyB64] = stored.split(":");
  if (scheme !== "scrypt" || !saltB64 || !keyB64) return false;
  const expected = Buffer.from(keyB64, "base64");
  const actual = await scryptAsync(password, Buffer.from(saltB64, "base64"), expected.length);
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

/** Verifying against this when an email is unknown keeps "no such user" and
 * "wrong password" responses equally slow. */
let dummyHash: Promise<string> | null = null;
export function verifyAgainstDummy(password: string): Promise<boolean> {
  dummyHash ??= hashPassword("not-a-real-password");
  return dummyHash.then((h) => verifyPassword(password, h));
}

/* ───────────── input validation ───────────── */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  return email.length <= 254 && EMAIL_RE.test(email) ? email : null;
}

export function validatePassword(value: unknown): string | null {
  if (typeof value !== "string" || value.length < 8) return "Password must be at least 8 characters.";
  if (value.length > 128) return "Password must be 128 characters or fewer.";
  return null;
}

export function normalizeName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const name = value.trim().replace(/\s+/g, " ");
  return name.length >= 1 && name.length <= 30 ? name : null;
}

/* ───────────── sessions ───────────── */

const hashToken = (token: string) => crypto.createHash("sha256").update(token).digest("hex");

/** Creates a session row and sets the cookie. Only a hash of the token is stored,
 * so a leaked database can't be used to impersonate anyone. */
export async function startSession(userId: string) {
  const token = crypto.randomBytes(32).toString("base64url");
  const now = Date.now();
  const expiresAt = now + SESSION_MS;

  await query("DELETE FROM sessions WHERE expires_at < $1", [now]);
  await query("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1, $2, $3)", [
    hashToken(token),
    userId,
    expiresAt,
  ]);

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(expiresAt),
  });
}

export async function endSession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await query("DELETE FROM sessions WHERE token_hash = $1", [hashToken(token)]);
  jar.delete(SESSION_COOKIE);
}

/** The signed-in user for the current request, or null. Safe to call from
 * server components and route handlers. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const { rows } = await query<SessionUser>(
    `SELECT u.id, u.email, u.name
       FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = $1 AND s.expires_at > $2`,
    [hashToken(token), Date.now()]
  );

  return rows[0] ?? null;
}
