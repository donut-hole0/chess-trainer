"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface EvalGraphMove {
  san: string;
  moveNumber: number;
  color: "w" | "b";
}

interface EvalGraphProps {
  /** White-perspective centipawns at each node; index 0 is the start position. */
  evals: number[];
  /** Currently selected node index (0 = start). */
  selected: number;
  onSelect: (node: number) => void;
  /** Optional SAN per move so the tooltip can name the position. */
  moves?: EvalGraphMove[];
  height?: number;
}

function clampPawns(cp: number): number {
  if (cp >= 100000) return 10;
  if (cp <= -100000) return -10;
  return Math.max(-10, Math.min(10, cp / 100));
}

interface Datum {
  node: number;
  pawns: number;
  label: string;
}

function TooltipCard({ active, payload }: {
  active?: boolean;
  payload?: { payload: Datum }[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  const d = payload[0].payload;
  const p = d.pawns;
  const sign = p > 0 ? "+" : p < 0 ? "−" : "";
  return (
    <div className="border border-slate-900 bg-parchment px-2.5 py-1.5 text-xs shadow-hard-sm dark:border-slate-100 dark:bg-charcoal">
      <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
        {d.label}
      </span>
      <span className="ml-2 font-mono tabular-nums text-slate-500">
        {sign}
        {Math.abs(p).toFixed(1)}
      </span>
    </div>
  );
}

/**
 * En Croissant-style evaluation curve. The X-axis is move number, the Y-axis is
 * the engine's score in pawns. Clicking anywhere on the plot snaps the caller's
 * board to that node — the chart is a scrubber, not just a picture.
 */
export function EvalGraph({
  evals,
  selected,
  onSelect,
  moves,
  height = 180,
}: EvalGraphProps) {
  const data = useMemo<Datum[]>(() => {
    return evals.map((cp, node) => {
      let label = "Start";
      if (node >= 1 && moves && moves[node - 1]) {
        const m = moves[node - 1];
        const dots = m.color === "w" ? "." : "...";
        label = `${m.moveNumber}${dots} ${m.san}`;
      } else if (node >= 1) {
        label = `Move ${node}`;
      }
      return { node, pawns: clampPawns(cp), label };
    });
  }, [evals, moves]);

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 6, right: 8, bottom: 0, left: -22 }}
          onClick={(state: { activeTooltipIndex?: number | string | null }) => {
            const idx = Number(state?.activeTooltipIndex);
            if (Number.isInteger(idx)) onSelect(idx);
          }}
          style={{ cursor: "pointer" }}
        >
          <defs>
            <linearGradient id="evalFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1A5235" stopOpacity={0.35} />
              <stop offset="50%" stopColor="#1A5235" stopOpacity={0.06} />
              <stop offset="50%" stopColor="#C85A32" stopOpacity={0.06} />
              <stop offset="100%" stopColor="#C85A32" stopOpacity={0.28} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="currentColor" strokeOpacity={0.08} vertical={false} />
          <XAxis
            dataKey="node"
            tick={{ fontSize: 10, fill: "currentColor", opacity: 0.5 }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            tickFormatter={(v: number) => (v === 0 ? "" : String(Math.ceil(v / 2)))}
          />
          <YAxis
            domain={[-10, 10]}
            ticks={[-10, -5, 0, 5, 10]}
            tick={{ fontSize: 10, fill: "currentColor", opacity: 0.5 }}
            tickLine={false}
            axisLine={false}
            width={34}
          />
          <ReferenceLine y={0} stroke="currentColor" strokeOpacity={0.25} />
          <ReferenceLine
            x={selected}
            stroke="#C85A32"
            strokeWidth={1.5}
            strokeDasharray="3 3"
          />
          <Tooltip content={<TooltipCard />} cursor={{ stroke: "currentColor", strokeOpacity: 0.2 }} />
          <Area
            type="monotone"
            dataKey="pawns"
            stroke="#1A5235"
            strokeWidth={2}
            fill="url(#evalFill)"
            dot={false}
            activeDot={{ r: 4, fill: "#C85A32", stroke: "none" }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
