"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  ChevronLeft,
  ChevronRight,
  SkipBack,
  SkipForward,
  Loader2,
  Sparkles,
  ScrollText,
} from "lucide-react";
import { ChessBoard } from "@/components/ChessBoard";
import { MoveBadge, QUALITY_COLOR } from "@/components/MoveBadge";
import { Button, Panel, SectionLabel } from "@/components/ui";
import {
  reviewGame,
  SAMPLE_GAMES,
  QUALITY_META,
  type GameReview as Review,
  type ReviewQuality,
} from "@/lib/engine/review";
import { useProfile } from "@/lib/profile";

const EvalGraph = dynamic(
  () => import("@/components/EvalGraph").then((m) => m.EvalGraph),
  { ssr: false, loading: () => <GraphSkeleton /> }
);

function GraphSkeleton() {
  return (
    <div className="grid h-[180px] place-items-center text-xs text-slate-400">
      Plotting evaluation…
    </div>
  );
}

const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

// The badge tallies Chess.com shows beside each player.
const COUNTED: ReviewQuality[] = [
  "brilliant",
  "great",
  "best",
  "good",
  "inaccuracy",
  "mistake",
  "blunder",
];

function accuracyTone(acc: number): string {
  if (acc >= 90) return "#1A5235";
  if (acc >= 75) return "#2F7D52";
  if (acc >= 60) return "#A16207";
  return "#C85A32";
}

export function GameReview() {
  const { recordAccuracy } = useProfile();
  const [input, setInput] = useState("");
  const [review, setReview] = useState<Review | null>(null);
  const [ply, setPly] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fenAt = useMemo(() => {
    if (!review || review.moves.length === 0) return START_FEN;
    if (ply === 0) return review.moves[0].fenBefore;
    return review.moves[ply - 1].fenAfter;
  }, [review, ply]);

  const counts = useMemo(() => {
    const base = { w: emptyCounts(), b: emptyCounts() };
    if (!review) return base;
    for (const m of review.moves) base[m.color][m.quality] += 1;
    return base;
  }, [review]);

  function runReview(pgn: string) {
    const text = pgn.trim();
    if (!text) {
      setError("Paste a PGN first, or pick one of the sample games.");
      return;
    }
    setLoading(true);
    setError(null);
    // Defer the heavy synchronous analysis one tick so the spinner can paint.
    setTimeout(() => {
      const result = reviewGame(text, 2);
      if (!result) {
        setError("Couldn't read that as a PGN.");
        setReview(null);
      } else {
        setReview(result);
        setPly(result.moves.length);
        recordAccuracy(Math.max(result.whiteAccuracy, result.blackAccuracy));
      }
      setLoading(false);
    }, 30);
  }

  const lastMove =
    review && ply > 0 ? review.moves[ply - 1] : null;
  const highlight = useMemo(() => {
    if (!lastMove) return {};
    const tint = { background: "rgba(26, 82, 53, 0.18)" };
    return { [lastMove.from]: tint, [lastMove.to]: tint };
  }, [lastMove]);

  const total = review ? review.moves.length : 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      {/* Input + board */}
      <div className="flex flex-col gap-4">
        {!review && (
          <Panel className="p-4">
            <SectionLabel>Review a game</SectionLabel>
            <p className="mt-1.5 text-sm text-slate-500">
              Paste a PGN and the coach grades every move — accuracy, brilliancies,
              and the moment it slipped away.
            </p>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={5}
              spellCheck={false}
              placeholder="Paste PGN here…"
              className="mt-3 w-full resize-none border border-slate-300 bg-transparent px-3 py-2 font-mono text-xs text-slate-800 outline-none focus:border-slate-900 dark:border-slate-700 dark:text-slate-200 dark:focus:border-slate-300"
            />
            {error && <p className="mt-1 text-xs text-terracotta">{error}</p>}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button
                variant="primary"
                onClick={() => runReview(input)}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Review game
              </Button>
              <span className="text-xs text-slate-400">or try</span>
              {SAMPLE_GAMES.map((g) => (
                <button
                  key={g.label}
                  onClick={() => {
                    setInput(g.pgn);
                    runReview(g.pgn);
                  }}
                  disabled={loading}
                  className="border border-slate-300 px-2.5 py-1 text-xs text-slate-600 transition-colors hover:border-slate-900 hover:text-slate-900 focus-hard disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-300"
                >
                  {g.label}
                </button>
              ))}
            </div>
          </Panel>
        )}

        {review && (
          <>
            <ChessBoard
              position={fenAt}
              orientation="white"
              interactive={false}
              highlightSquares={highlight}
            />
            {/* Scrubber */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                <Button variant="ghost" onClick={() => setPly(0)} disabled={ply === 0} title="Start">
                  <SkipBack className="h-4 w-4" />
                </Button>
                <Button variant="ghost" onClick={() => setPly((p) => Math.max(0, p - 1))} disabled={ply === 0}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" onClick={() => setPly((p) => Math.min(total, p + 1))} disabled={ply === total}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="ghost" onClick={() => setPly(total)} disabled={ply === total} title="End">
                  <SkipForward className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {lastMove ? (
                  <>
                    <span className="font-mono text-slate-700 dark:text-slate-200">
                      {lastMove.moveNumber}
                      {lastMove.color === "w" ? "." : "..."} {lastMove.san}
                    </span>
                    <MoveBadge quality={lastMove.quality} />
                  </>
                ) : (
                  <span className="text-slate-400">Starting position</span>
                )}
              </div>
              <button
                onClick={() => {
                  setReview(null);
                  setPly(0);
                }}
                className="text-xs text-slate-500 underline-offset-2 hover:text-slate-900 hover:underline dark:hover:text-slate-100"
              >
                New review
              </button>
            </div>
          </>
        )}
      </div>

      {/* Report */}
      <div className="flex flex-col gap-4">
        {!review ? (
          <Panel className="grid min-h-[220px] place-items-center p-6 text-center">
            <p className="max-w-xs text-sm italic leading-relaxed text-slate-400">
              Your accuracy score, move-by-move badges, an evaluation graph, and a
              coach&apos;s summary will appear here.
            </p>
          </Panel>
        ) : (
          <>
            {/* Accuracy header */}
            <Panel className="p-4">
              <div className="grid grid-cols-2 divide-x divide-slate-200 dark:divide-slate-800">
                {(["white", "black"] as const).map((side) => {
                  const c = side === "white" ? "w" : "b";
                  const acc = side === "white" ? review.whiteAccuracy : review.blackAccuracy;
                  const name = side === "white" ? review.white : review.black;
                  return (
                    <div key={side} className="px-3 first:pl-0 last:pr-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={[
                            "inline-block h-3 w-3 border border-slate-900 dark:border-slate-100",
                            side === "white" ? "bg-parchment" : "bg-charcoal",
                          ].join(" ")}
                        />
                        <span className="truncate text-xs font-medium uppercase tracking-wider text-slate-500">
                          {name}
                        </span>
                      </div>
                      <p
                        className="mt-1 font-display text-4xl font-semibold tabular-nums"
                        style={{ color: accuracyTone(acc) }}
                      >
                        {acc.toFixed(1)}
                        <span className="text-lg">%</span>
                      </p>
                      <p className="text-[0.7rem] uppercase tracking-wider text-slate-400">
                        Accuracy
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {COUNTED.filter((q) => counts[c][q] > 0).map((q) => (
                          <span
                            key={q}
                            className="inline-flex items-center gap-1 text-[0.7rem] tabular-nums"
                            style={{ color: QUALITY_COLOR[q] }}
                            title={QUALITY_META[q].label}
                          >
                            <span className="font-bold">{counts[c][q]}</span>
                            {QUALITY_META[q].symbol || QUALITY_META[q].label}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Panel>

            {/* Eval graph */}
            <Panel className="p-3">
              <div className="mb-1 flex items-center justify-between">
                <SectionLabel>Evaluation</SectionLabel>
                <span className="text-[0.7rem] text-slate-400">click to scrub</span>
              </div>
              <EvalGraph
                evals={review.evals}
                selected={ply}
                onSelect={setPly}
                moves={review.moves}
                height={170}
              />
            </Panel>

            {/* Coach summary */}
            <Panel className="p-4">
              <div className="flex items-center gap-2">
                <ScrollText className="h-4 w-4 text-terracotta" />
                <SectionLabel>Coach&apos;s summary</SectionLabel>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {review.summary}
              </p>
            </Panel>

            {/* Move list */}
            <Panel className="max-h-64 overflow-y-auto">
              <MoveTable review={review} ply={ply} onSelect={setPly} />
            </Panel>
          </>
        )}
      </div>
    </div>
  );
}

function emptyCounts(): Record<ReviewQuality, number> {
  return {
    brilliant: 0,
    great: 0,
    best: 0,
    good: 0,
    inaccuracy: 0,
    mistake: 0,
    blunder: 0,
  };
}

function MoveTable({
  review,
  ply,
  onSelect,
}: {
  review: Review;
  ply: number;
  onSelect: (p: number) => void;
}) {
  const rows: { no: number; w?: { i: number; q: ReviewQuality; san: string }; b?: { i: number; q: ReviewQuality; san: string } }[] = [];
  review.moves.forEach((m, i) => {
    const idx = Math.floor(i / 2);
    if (!rows[idx]) rows[idx] = { no: idx + 1 };
    const cell = { i: i + 1, q: m.quality, san: m.san };
    if (m.color === "w") rows[idx].w = cell;
    else rows[idx].b = cell;
  });

  return (
    <ol className="font-mono text-sm">
      {rows.map((row) => (
        <li
          key={row.no}
          className="grid grid-cols-[2.5rem_1fr_1fr] items-stretch border-b border-slate-200 last:border-b-0 dark:border-slate-800"
        >
          <span className="flex items-center bg-slate-900/[0.03] px-2 py-1 text-xs text-slate-400 dark:bg-slate-100/[0.03]">
            {row.no}.
          </span>
          {(["w", "b"] as const).map((side) => {
            const cell = row[side];
            if (!cell) return <span key={side} className="px-2 py-1" />;
            const active = ply === cell.i;
            return (
              <button
                key={side}
                onClick={() => onSelect(cell.i)}
                className={[
                  "flex items-center justify-between gap-1 px-2 py-1 text-left transition-colors",
                  active
                    ? "bg-forest/15 font-semibold text-slate-900 dark:text-slate-100"
                    : "text-slate-700 hover:bg-slate-900/5 dark:text-slate-300 dark:hover:bg-slate-100/5",
                ].join(" ")}
              >
                <span>{cell.san}</span>
                <MoveBadge quality={cell.q} />
              </button>
            );
          })}
        </li>
      ))}
    </ol>
  );
}
