import { stickerCategories, graphicStickers, type GraphicId } from "@/lib/stickers";
import { eyebrow } from "@/lib/ui";

type Props = {
  onPick: (emoji: string) => void;
  onPickGraphic: (id: GraphicId) => void;
};

const tile =
  "grid h-11 w-11 place-items-center rounded-xl border border-line bg-surface transition hover:-translate-y-0.5 hover:border-ink/40 active:translate-y-0";

export default function StickerPicker({ onPick, onPickGraphic }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <p className={`${eyebrow} mb-2`}>Graphics</p>
        <div className="flex flex-wrap gap-2">
          {graphicStickers.map((g) => (
            <button
              key={g.id}
              onClick={() => onPickGraphic(g.id)}
              aria-label={g.label}
              className={`${tile} p-1.5 [&>svg]:h-full [&>svg]:w-full`}
              dangerouslySetInnerHTML={{ __html: g.svg }}
            />
          ))}
        </div>
      </div>
      {stickerCategories.map((cat) => (
        <div key={cat.label}>
          <p className={`${eyebrow} mb-2`}>{cat.label}</p>
          <div className="flex flex-wrap gap-2">
            {cat.emojis.map((e) => (
              <button key={e} onClick={() => onPick(e)} className={`${tile} text-xl`}>
                {e}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
