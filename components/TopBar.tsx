import Link from "next/link";

type Props = {
  left?: React.ReactNode;
  title?: string;
  right?: React.ReactNode;
};

/** Slim header used on every screen: brand/back on the left, title, actions on the right. */
export default function TopBar({ left, title, right }: Props) {
  return (
    <header className="sticky top-0 z-30 border-b border-line/80 bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center">{left ?? <Brand />}</div>
        {title && <h1 className="truncate text-center text-[15px] font-semibold tracking-tight">{title}</h1>}
        <div className="flex min-w-0 flex-1 items-center justify-end gap-1">{right}</div>
      </div>
    </header>
  );
}

export function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight">
      <span aria-hidden className="grid h-7 w-7 place-items-center rounded-lg bg-ink text-white">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="6" width="18" height="14" rx="2" />
          <circle cx="12" cy="13" r="3.5" />
          <path d="M8 6l1.5-2h5L16 6" />
        </svg>
      </span>
      <span className="hidden sm:inline">Photobooth</span>
    </Link>
  );
}
