# little photo booth ♡

A cute photo-strip maker built with Next.js. Take 4 photos with your camera **or upload your own**, decorate the strip with backgrounds, stickers and a caption, and keep every strip in your personal history.

## Features

- **Accounts** – sign up / log in with email + password. Every user only ever sees their own strips.
- **Camera booth** – countdown, 4 shots, live filters.
- **Upload your own photos** – pick 1–4 images from your device (drag & drop works too), reorder them, choose a filter.
- **Editor** – backgrounds, emoji stickers, caption.
- **History** – every strip you save (or download) is stored; open, re-download or delete them at `/history`.

## Getting started

```bash
npm install
npm run dev
```

Set `DATABASE_URL` in `.env.local` first (see below), then open http://localhost:3000, create an account, and you're in. The `users`, `sessions` and `strips` tables must already exist in the database (Supabase).

### Configuration

| Variable           | Required | Purpose                                                                 |
| ------------------ | -------- | ----------------------------------------------------------------------- |
| `DATABASE_URL`     | yes      | PostgreSQL connection string (Supabase). Keep it in `.env.local` only.  |
| `DATABASE_CA_CERT` | no       | PEM CA certificate; when set, the server's TLS certificate is verified. |

## How it works

| Area | Where |
| --- | --- |
| PostgreSQL connection pool | `lib/server/db.ts` |
| Passwords (scrypt), sessions, login rate-limit | `lib/server/auth.ts`, `lib/server/rateLimit.ts` |
| Strip storage + validation | `lib/server/strips.ts` |
| API routes | `app/api/auth/*`, `app/api/strips/*` |
| Pages | `app/page.tsx` (booth), `app/login`, `app/signup`, `app/history` |
| Upload processing (resize, EXIF rotation) | `lib/upload.ts`, `components/UploadScreen.tsx` |

- Passwords are hashed with Node's built-in `scrypt`. Sessions are random tokens in an `httpOnly`, `SameSite=Lax` cookie (30 days); only a SHA-256 hash of each token is stored server-side.
- Each saved strip stores the final rendered PNG plus a small JPEG thumbnail as `BYTEA` in PostgreSQL. Images are served through `/api/strips/:id/image`, which checks ownership on every request.
- Saving again from the same editor session updates that history entry instead of creating a duplicate.

## Deploying

Data lives in Supabase PostgreSQL, so any Node host works — set `DATABASE_URL` in the host's environment. On serverless hosts use Supabase's pooled connection string.

The login rate-limiter is in-memory, so it resets on restart and isn't shared between multiple server instances.

Note: in production the session cookie is marked `Secure`, so run behind HTTPS (Chrome/Firefox also accept it on `http://localhost`, Safari doesn't).
