"use client";

import { useEffect, useRef } from "react";
import type { Move } from "chess.js";

interface MoveHistoryProps {
  history: Move[];
  className?: string;
}

export function MoveHistory({ history, className = "" }: MoveHistoryProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Keep the latest move in view.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [history.length]);

  // Group plies into full moves: [white, black].
  const rows: { no: number; white?: Move; black?: Move }[] = [];
  for (let i = 0; i < history.length; i += 2) {
    rows.push({
      no: i / 2 + 1,
      white: history[i],
      black: history[i + 1],
    });
  }

  return (
    <div
      ref={scrollRef}
      className={`overflow-y-auto font-mono text-sm ${className}`}
    >
      {rows.length === 0 ? (
        <p className="px-3 py-4 font-sans text-sm italic text-slate-400">
          No moves yet. White to start.
        </p>
      ) : (
        <ol>
          {rows.map((row, rowIdx) => {
            const lastRow = rowIdx === rows.length - 1;
            return (
              <li
                key={row.no}
                className="grid grid-cols-[2.5rem_1fr_1fr] items-stretch border-b border-slate-200 last:border-b-0 dark:border-slate-800"
              >
                <span className="flex items-center bg-slate-900/[0.03] px-2 py-1.5 text-xs text-slate-400 dark:bg-slate-100/[0.03]">
                  {row.no}.
                </span>
                <span
                  className={[
                    "px-2 py-1.5",
                    lastRow && !row.black
                      ? "bg-forest/10 font-semibold text-forest dark:text-emerald-400"
                      : "text-slate-800 dark:text-slate-200",
                  ].join(" ")}
                >
                  {row.white?.san ?? ""}
                </span>
                <span
                  className={[
                    "px-2 py-1.5",
                    lastRow && row.black
                      ? "bg-forest/10 font-semibold text-forest dark:text-emerald-400"
                      : "text-slate-800 dark:text-slate-200",
                  ].join(" ")}
                >
                  {row.black?.san ?? ""}
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
