import { Pool, types, type QueryResultRow } from "pg";

/*
 * PostgreSQL (Supabase) connection pool. Configure with DATABASE_URL.
 * The schema (users, sessions, strips) is managed in Supabase, not created here.
 */

// BIGINT (int8) columns hold millisecond timestamps, which are well within
// Number.MAX_SAFE_INTEGER — return them as numbers instead of pg's default strings.
const typeParsers = {
  getTypeParser: ((oid: number, format?: "text" | "binary") =>
    oid === types.builtins.INT8 ? (v: string) => Number(v) : types.getTypeParser(oid, format)) as typeof types.getTypeParser,
};

function createPool(): Pool {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error("DATABASE_URL is not set.");

  const url = new URL(raw);
  const isLocal = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  // sslmode in the URL would override the ssl option below, so it's handled here instead.
  url.searchParams.delete("sslmode");

  const ca = process.env.DATABASE_CA_CERT;
  return new Pool({
    connectionString: url.toString(),
    // Supabase requires TLS. Its certificates aren't in Node's default trust store,
    // so verify against DATABASE_CA_CERT when provided, otherwise encrypt without verifying.
    ssl: isLocal ? undefined : ca ? { ca, rejectUnauthorized: true } : { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    types: typeParsers,
  });
}

// Keep one pool alive across Next.js dev hot-reloads.
const globalForDb = globalThis as unknown as { __photoboothPool?: Pool };

export function getPool(): Pool {
  if (!globalForDb.__photoboothPool) {
    const pool = createPool();
    // An idle client erroring (e.g. the server closed it) must not crash the process.
    pool.on("error", (err) => console.error("[db] idle client error:", err.message));
    globalForDb.__photoboothPool = pool;
  }
  return globalForDb.__photoboothPool;
}

/** Runs a parameterized query ($1, $2, …). Never interpolate user input into `text`. */
export async function query<T extends QueryResultRow = QueryResultRow>(text: string, params: unknown[] = []) {
  return getPool().query<T>(text, params);
}

/** PostgreSQL unique_violation. */
export const PG_UNIQUE_VIOLATION = "23505";
