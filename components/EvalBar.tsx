"use client";

import type { CSSProperties } from "react";
import { MATE_SCORE } from "@/lib/engine/evaluate";

interface EvalBarProps {
  /** Centipawns from White's perspective. Positive favors White. */
  cp: number;
  orientation?: "white" | "black";
}

function isMate(cp: number): boolean {
  return Math.abs(cp) >= MATE_SCORE - 1000;
}

/** Logistic map from centipawns to White's share of the bar (0..1). */
function whiteShare(cp: number): number {
  if (isMate(cp)) return cp > 0 ? 1 : 0;
  const clamped = Math.max(-1500, Math.min(1500, cp));
  return 1 / (1 + Math.pow(10, -clamped / 400));
}

function label(cp: number): string {
  if (isMate(cp)) return "M";
  const pawns = cp / 100;
  const sign = pawns > 0 ? "+" : pawns < 0 ? "−" : "";
  return `${sign}${Math.abs(pawns).toFixed(1)}`;
}

export function EvalBar({ cp, orientation = "white" }: EvalBarProps) {
  const share = whiteShare(cp);
  const whitePct = Math.round(share * 100);
  const whiteOnBottom = orientation === "white";
  const whiteLeads = cp >= 0;

  const fillStyle: CSSProperties = { height: `${whitePct}%` };
  if (whiteOnBottom) fillStyle.bottom = 0;
  else fillStyle.top = 0;

  return (
    <div className="flex h-full flex-col items-center gap-2">
      <div
        className="relative h-full w-7 overflow-hidden border-2 border-slate-900 dark:border-slate-100"
        role="img"
        aria-label={`Evaluation ${label(cp)} for ${whiteLeads ? "White" : "Black"}`}
      >
        {/* Black fills the full track; the white segment is drawn on top. */}
        <div className="absolute inset-0 bg-charcoal" />
        <div
          className="absolute inset-x-0 bg-parchment transition-[height] duration-300 ease-out"
          style={fillStyle}
        />
        {/* Midpoint marker */}
        <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-slate-500/50" />
        {/* Eval readout sits at the leader's end of the bar. */}
        <span
          className={[
            "absolute inset-x-0 text-center text-[0.6rem] font-bold tabular-nums",
            whiteLeads
              ? "bottom-1 text-slate-900"
              : "top-1 text-parchment",
          ].join(" ")}
        >
          {label(cp)}
        </span>
      </div>
    </div>
  );
}
