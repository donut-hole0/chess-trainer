"use client";

import { PERSONALITY_LIST, type BotLevel } from "@/lib/engine/bot";

interface DifficultySelectorProps {
  value: BotLevel;
  onChange: (level: BotLevel) => void;
  disabled?: boolean;
}

export function DifficultySelector({
  value,
  onChange,
  disabled = false,
}: DifficultySelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      {PERSONALITY_LIST.map((p) => {
        const active = p.id === value;
        return (
          <button
            key={p.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(p.id as BotLevel)}
            className={[
              "group flex items-start gap-3 border p-3 text-left transition-colors focus-hard disabled:cursor-not-allowed disabled:opacity-50",
              active
                ? "border-slate-900 bg-forest text-parchment dark:border-slate-100"
                : "border-slate-300 hover:border-slate-900 dark:border-slate-700 dark:hover:border-slate-400",
            ].join(" ")}
          >
            <span
              className={[
                "mt-0.5 text-2xl leading-none",
                active ? "text-parchment" : "text-slate-700 dark:text-slate-300",
              ].join(" ")}
              aria-hidden
            >
              {p.glyph}
            </span>
            <span className="flex-1">
              <span className="flex items-baseline justify-between gap-2">
                <span className="font-display text-base font-semibold">
                  {p.name}
                </span>
                <span
                  className={[
                    "shrink-0 text-xs font-semibold tabular-nums",
                    active ? "text-parchment/80" : "text-slate-500",
                  ].join(" ")}
                >
                  {p.elo} Elo
                </span>
              </span>
              <span
                className={[
                  "mt-0.5 block text-xs leading-snug",
                  active ? "text-parchment/85" : "text-slate-500 dark:text-slate-400",
                ].join(" ")}
              >
                {p.blurb}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
