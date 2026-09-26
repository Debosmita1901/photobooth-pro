type Props = {
  value: number | "smile" | null;
};

export default function Countdown({ value }: Props) {
  if (value === null) return null;

  return (
    <div className="pointer-events-none absolute inset-0 grid place-items-center bg-black/15">
      <span
        key={String(value)}
        className="animate-pop select-none font-display text-8xl font-medium text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.5)] sm:text-9xl"
      >
        {value === "smile" ? <span className="text-5xl italic sm:text-6xl">Smile</span> : value}
      </span>
    </div>
  );
}
