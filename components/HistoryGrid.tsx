"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApiError, deleteStrip } from "@/lib/api";
import type { StripSummary } from "@/lib/stripTypes";
import { btnGhost, btnPrimary, eyebrow } from "@/lib/ui";
import TopBar from "./TopBar";

type Props = { userName: string; initialStrips: StripSummary[] };

const imageUrl = (s: StripSummary, variant: "thumb" | "full", download = false) =>
  `/api/strips/${s.id}/image?variant=${variant}&v=${s.updatedAt}${download ? "&download=1" : ""}`;

const formatDate = (ms: number) =>
  new Date(ms).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

const actionCls =
  "inline-flex h-10 items-center rounded-full bg-white px-4 text-sm font-semibold text-ink transition hover:bg-white/85 disabled:opacity-60";

export default function HistoryGrid({ userName, initialStrips }: Props) {
  const router = useRouter();
  const [strips, setStrips] = useState(initialStrips);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const viewing = strips.find((s) => s.id === viewingId) ?? null;

  useEffect(() => {
    if (!viewingId) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setViewingId(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewingId]);

  async function handleDelete(strip: StripSummary) {
    if (!window.confirm("Delete this strip? This can't be undone.")) return;
    setDeletingId(strip.id);
    setError(null);
    try {
      await deleteStrip(strip.id);
      setStrips((prev) => prev.filter((s) => s.id !== strip.id));
      setViewingId((cur) => (cur === strip.id ? null : cur));
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.replace("/login");
        return;
      }
      if (err instanceof ApiError && err.status === 404) {
        setStrips((prev) => prev.filter((s) => s.id !== strip.id)); // already gone
      } else {
        setError("Couldn't delete that strip. Please try again.");
      }
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="min-h-dvh">
      <TopBar right={<Link href="/" className={btnGhost}>← Booth</Link>} />

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className={eyebrow}>Archive</p>
            <h1 className="mt-2 font-display text-3xl font-medium tracking-tight sm:text-4xl">{userName}&apos;s strips</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted">{strips.length} {strips.length === 1 ? "strip" : "strips"}</span>
            <Link href="/" className={`${btnPrimary} h-10 px-5 text-sm`}>New strip</Link>
          </div>
        </div>

        <p role="alert" className="min-h-5 pt-2 text-sm font-medium text-accent">
          {error}
        </p>

        {strips.length === 0 ? (
          <div className="mt-6 grid place-items-center rounded-3xl border border-dashed border-line py-20 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-ink text-white" aria-hidden>
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="6" width="18" height="14" rx="2.5" />
                <circle cx="12" cy="13" r="3.5" />
              </svg>
            </span>
            <p className="mt-4 font-display text-2xl">No strips yet</p>
            <p className="mt-1 text-sm text-muted">Everything you save or download shows up here.</p>
            <Link href="/" className={`${btnPrimary} mt-6`}>Make your first strip</Link>
          </div>
        ) : (
          <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {strips.map((s) => (
              <li key={s.id}>
                <button
                  onClick={() => setViewingId(s.id)}
                  className="grid aspect-[3/4] w-full place-items-center overflow-hidden rounded-2xl bg-[#e9e6e0] p-3 transition hover:-translate-y-1 hover:shadow-[0_16px_30px_-14px_rgba(0,0,0,0.35)]"
                  aria-label={`open strip${s.caption ? `: ${s.caption}` : ""}`}
                >
                  <img
                    src={imageUrl(s, "thumb")}
                    alt={s.caption || "photo strip"}
                    loading="lazy"
                    className="max-h-full max-w-full object-contain shadow-md"
                  />
                </button>
                <p className="mt-2.5 truncate text-sm font-semibold">{s.caption || "Untitled"}</p>
                <p className="text-xs text-muted">
                  {s.source === "upload" ? "Upload" : "Camera"} ·{" "}
                  <time dateTime={new Date(s.createdAt).toISOString()} suppressHydrationWarning>
                    {formatDate(s.createdAt)}
                  </time>
                </p>
              </li>
            ))}
          </ul>
        )}
      </main>

      {viewing && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="strip preview"
          onClick={() => setViewingId(null)}
          className="fixed inset-0 z-50 grid place-items-center bg-black/85 p-4 backdrop-blur-sm"
        >
          <div onClick={(e) => e.stopPropagation()} className="flex max-h-full flex-col items-center gap-4">
            <img
              src={imageUrl(viewing, "full")}
              alt={viewing.caption || "photo strip"}
              className="max-h-[80dvh] w-auto max-w-full object-contain shadow-2xl"
            />
            <div className="flex flex-wrap items-center justify-center gap-2">
              <a href={imageUrl(viewing, "full", true)} download className={actionCls}>
                Download
              </a>
              <button
                onClick={() => handleDelete(viewing)}
                disabled={deletingId === viewing.id}
                className={`${actionCls} text-accent`}
              >
                {deletingId === viewing.id ? "Deleting…" : "Delete"}
              </button>
              <button onClick={() => setViewingId(null)} className={`${actionCls} bg-white/15 text-white hover:bg-white/25`}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
