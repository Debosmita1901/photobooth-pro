"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { submitAuth } from "@/lib/api";
import { btnPrimary, input as inputCls } from "@/lib/ui";
import { Brand } from "./TopBar";

type Props = { mode: "login" | "signup" };

const labelCls = "mb-1.5 block text-sm font-medium text-ink";

export default function AuthForm({ mode }: Props) {
  const router = useRouter();
  const isSignup = mode === "signup";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await submitAuth(mode, { name: isSignup ? name : undefined, email, password });
      router.replace("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-dvh lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-ink p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <span className="font-display text-xl font-semibold tracking-tight">Photobooth Studio</span>
        <div>
          <p className="font-display text-5xl font-medium leading-[1.05] tracking-tight">
            Every frame,<br /><span className="italic text-white/60">worth keeping.</span>
          </p>
          <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-white/60">
            Timed camera sessions, 24 film looks and professional borders. Your strips are saved to your account.
          </p>
        </div>
        <div aria-hidden className="absolute -right-16 top-24 flex rotate-12 flex-col gap-3 bg-[#1c1c1c] p-4 opacity-80">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-28 w-40" style={{ background: `linear-gradient(135deg,#2a2a2a,#${["5a5a5a", "444", "6b6b6b", "3a3a3a"][i]})` }} />
          ))}
        </div>
        <p className="text-xs text-white/40">© {new Date().getFullYear()} Photobooth Studio</p>
      </aside>

      <section className="flex flex-col px-5 py-6 sm:px-10">
        <div className="lg:hidden"><Brand /></div>
        <div className="m-auto w-full max-w-sm py-10">
          <h1 className="font-display text-3xl font-medium tracking-tight">
            {isSignup ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mt-2 text-[15px] text-muted">
            {isSignup ? "Keep every strip you make, on any device." : "Log in to open the booth and your strips."}
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {isSignup && (
              <div>
                <label htmlFor="name" className={labelCls}>Name</label>
                <input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={30}
                  required
                  autoComplete="name"
                  placeholder="Your name"
                  className={inputCls}
                />
              </div>
            )}
            <div>
              <label htmlFor="email" className={labelCls}>Email</label>
              <input
                id="email"
                type="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="password" className={labelCls}>Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={isSignup ? 8 : undefined}
                maxLength={128}
                autoComplete={isSignup ? "new-password" : "current-password"}
                placeholder={isSignup ? "At least 8 characters" : "••••••••"}
                className={inputCls}
              />
            </div>

            <p role="alert" aria-live="polite" className="min-h-5 text-sm font-medium text-accent">
              {error}
            </p>

            <button type="submit" disabled={busy} className={`${btnPrimary} w-full`}>
              {busy ? "Please wait…" : isSignup ? "Create account" : "Log in"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            {isSignup ? "Already have an account? " : "New here? "}
            <Link href={isSignup ? "/login" : "/signup"} className="font-semibold text-ink underline underline-offset-4">
              {isSignup ? "Log in" : "Create an account"}
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
