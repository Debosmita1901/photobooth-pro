"use client";

import { useState } from "react";
import { filterGroups, filters, fxOverlays, type FilterGroup, type FilterId } from "@/lib/filters";

type Props = {
  active: FilterId;
  onSelect: (id: FilterId) => void;
  /** Photo used for the thumbnails; falls back to a neutral sample. */
  previewSrc?: string;
};

const SAMPLE = "linear-gradient(135deg,#e8c3a0 0%,#b86b4b 45%,#3d5a6c 100%)";

export default function FilterSelector({ active, onSelect, previewSrc }: Props) {
  const [group, setGroup] = useState<FilterGroup>(
    () => filters.find((f) => f.id === active)?.group ?? "natural"
  );
  const list = filters.filter((f) => f.group === group);

  return (
    <div>
      <div role="tablist" className="no-scrollbar mb-2 flex gap-1 overflow-x-auto">
        {filterGroups.map((g) => (
          <button
            key={g.id}
            role="tab"
            aria-selected={group === g.id}
            onClick={() => setGroup(g.id)}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition ${
              group === g.id ? "bg-ink text-white" : "text-muted hover:text-ink"
            }`}
          >
            {g.label}
          </button>
        ))}
      </div>
      <div className="no-scrollbar -mx-1 flex gap-2.5 overflow-x-auto px-1 py-1">
        {list.map((f) => {
          const on = active === f.id;
          return (
            <button
              key={f.id}
              onClick={() => onSelect(f.id)}
              aria-pressed={on}
              className="flex w-[68px] shrink-0 flex-col items-center gap-1.5"
            >
              <span
                className={`relative block h-[68px] w-[68px] overflow-hidden rounded-xl ring-offset-2 ring-offset-surface transition ${
                  on ? "ring-2 ring-ink" : "ring-1 ring-line"
                }`}
              >
                {previewSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewSrc} alt="" className="h-full w-full object-cover" style={{ filter: f.css }} />
                ) : (
                  <span className="block h-full w-full" style={{ background: SAMPLE, filter: f.css }} />
                )}
                {fxOverlays(f.fx).map((st, i) => (
                  <span key={i} className="absolute inset-0" style={st} />
                ))}
              </span>
              <span className={`text-[11px] font-medium ${on ? "text-ink" : "text-muted"}`}>{f.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
