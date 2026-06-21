"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import dynamic from "next/dynamic";
import { Chess } from "chess.js";
import {
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  FlipVertical2,
  Copy,
  Check,
  RefreshCw,
  MessageSquareText,
  Sparkles,
  LayoutGrid,
} from "lucide-react";
import { ChessBoard } from "@/components/ChessBoard";
import { EvalBar } from "@/components/EvalBar";
import { CloudImporter } from "@/components/analysis/CloudImporter";
import { Button, Panel, SectionLabel, Pill } from "@/components/ui";
import { evaluateLine } from "@/lib/engine/search";
import { heatmapStyles } from "@/lib/engine/heatmap";
import { pgnToLine, type ImportedGame } from "@/lib/games";
import {
  analyzePosition,
  analyzeMove,
  type PositionReport,
  type MoveReport,
  type MoveQuality,
} from "@/lib/engine/coach";

const EvalGraph = dynamic(
  () => import("@/components/EvalGraph").then((m) => m.EvalGraph),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-[180px] place-items-center text-xs text-slate-400">
        Plotting…
      </div>
    ),
  }
);

const EXAMPLES: { label: string; fen: string }[] = [
  {
    label: "Italian Game",
    fen: "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 4 3",
  },
  {
    label: "Loose queen",
    fen: "rnb1kbnr/ppp1pppp/8/8/3q4/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 1",
  },
];

const QUALITY_TONE: Record<MoveQuality, "forest" | "neutral" | "terracotta"> = {
  best: "forest",
  good: "forest",
  inaccuracy: "neutral",
  mistake: "terracotta",
  blunder: "terracotta",
};

interface NodeMeta {
  san: string;
  from: string;
  to: string;
  promotion?: string;
  color: "w" | "b";
  moveNumber: number;
}

export default function AnalysisPage() {
  const [startFen, setStartFen] = useState<string | undefined>(undefined);
  const [line, setLine] = useState<string[]>([]);
  const [ply, setPly] = useState(0);
  const [orientation, setOrientation] = useState<"white" | "black">("white");
  const [heatmap, setHeatmap] = useState(false);
  const [evals, setEvals] = useState<number[]>([0]);

  const [input, setInput] = useState("");
  const [ioError, setIoError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [report, setReport] = useState<{
    position: PositionReport;
    move: MoveReport | null;
  } | null>(null);

  // Replay the line once to derive every node's FEN and move metadata.
  const { fens, meta } = useMemo(() => {
    const g = startFen ? new Chess(startFen) : new Chess();
    const fensOut = [g.fen()];
    const metaOut: NodeMeta[] = [];
    for (const san of line) {
      const color = g.turn();
      const moveNumber = g.moveNumber();
      let m;
      try {
        m = g.move(san);
      } catch {
        break;
      }
      metaOut.push({
        san: m.san,
        from: m.from,
        to: m.to,
        promotion: m.promotion,
        color,
        moveNumber,
      });
      fensOut.push(g.fen());
    }
    return { fens: fensOut, meta: metaOut };
  }, [startFen, line]);

  const safePly = Math.min(ply, fens.length - 1);
  const fen = fens[safePly];
  const lastMove = safePly > 0 ? meta[safePly - 1] : null;
  const evalCp = evals[Math.min(safePly, evals.length - 1)] ?? 0;
  const total = line.length;

  // Recompute the evaluation curve in the background whenever the line changes.
  useEffect(() => {
    let cancelled = false;
    const id = setTimeout(() => {
      try {
        const e = evaluateLine(line, startFen, 2);
        if (!cancelled) setEvals(e);
      } catch {
        /* ignore transient invalid lines */
      }
    }, 60);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [line, startFen]);

  // A new position invalidates the previous coaching read.
  useEffect(() => {
    setReport(null);
  }, [fen]);

  const highlight = useMemo(() => {
    const base: Record<string, CSSProperties> = heatmap ? heatmapStyles(fen) : {};
    if (lastMove) {
      const tint: CSSProperties = { background: "rgba(26, 82, 53, 0.16)" };
      return { ...base, [lastMove.from]: tint, [lastMove.to]: tint };
    }
    return base;
  }, [heatmap, fen, lastMove]);

  const graphMoves = useMemo(
    () => meta.map((m) => ({ san: m.san, moveNumber: m.moveNumber, color: m.color })),
    [meta]
  );

  function handleMove(from: string, to: string, promotion?: string): boolean {
    const g = new Chess(fen);
    let mv;
    try {
      mv = g.move({ from, to, promotion });
    } catch {
      return false;
    }
    if (!mv) return false;
    setLine((prev) => [...prev.slice(0, safePly), mv.san]);
    setPly(safePly + 1);
    return true;
  }

  function askCoach() {
    try {
      const position = analyzePosition(fen, 2);
      let move: MoveReport | null = null;
      if (safePly > 0) {
        const before = fens[safePly - 1];
        const m = meta[safePly - 1];
        if (m) move = analyzeMove(before, { from: m.from, to: m.to, promotion: m.promotion }, 2);
      }
      setReport({ position, move });
    } catch {
      setReport(null);
    }
  }

  function loadPosition() {
    const text = input.trim();
    if (!text) return;
    const asLine = pgnToLine(text);
    if (asLine) {
      setStartFen(asLine.startFen);
      setLine(asLine.sans);
      setPly(asLine.sans.length);
      setIoError(null);
      return;
    }
    try {
      const g = new Chess(text);
      setStartFen(g.fen());
      setLine([]);
      setPly(0);
      setIoError(null);
      return;
    } catch {
      setIoError("Couldn't read that as a FEN or PGN.");
    }
  }

  function loadExample(fenStr: string) {
    try {
      const g = new Chess(fenStr);
      setStartFen(g.fen());
      setLine([]);
      setPly(0);
      setInput(fenStr);
      setIoError(null);
    } catch {
      /* ignore */
    }
  }

  function loadGame(game: ImportedGame) {
    const parsed = pgnToLine(game.pgn);
    if (!parsed) return;
    setStartFen(parsed.startFen);
    setLine(parsed.sans);
    setPly(parsed.sans.length);
    setInput("");
    setIoError(null);
  }

  function startOver() {
    setStartFen(undefined);
    setLine([]);
    setPly(0);
    setReport(null);
    setIoError(null);
  }

  async function copyFen() {
    try {
      await navigator.clipboard.writeText(fen);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard may be unavailable */
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-terracotta">
          Analysis Suite
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          Analysis Board
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-500">
          Play out ideas, import your games, and read the evaluation curve. Click
          the graph to scrub through the game; toggle the heatmap to see who
          controls the board.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Board column */}
        <div className="min-w-0">
          <div className="flex items-stretch gap-3">
            <EvalBar cp={evalCp} orientation={orientation} />
            <div className="min-w-0 flex-1">
              <ChessBoard
                position={fen}
                onMove={handleMove}
                orientation={orientation}
                interactive
                highlightSquares={highlight}
              />
            </div>
          </div>

          {/* Controls */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <div className="flex items-center">
              <Button variant="ghost" onClick={() => setPly(0)} disabled={safePly === 0} title="Start">
                <SkipBack className="h-4 w-4" />
              </Button>
              <Button variant="ghost" onClick={() => setPly(safePly - 1)} disabled={safePly === 0} title="Previous">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" onClick={() => setPly(safePly + 1)} disabled={safePly >= total} title="Next">
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="ghost" onClick={() => setPly(total)} disabled={safePly >= total} title="End">
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>
            <Button
              variant={heatmap ? "primary" : "ghost"}
              onClick={() => setHeatmap((h) => !h)}
              title="Toggle board-dominance heatmap"
            >
              <LayoutGrid className="h-4 w-4" />
              Heatmap
            </Button>
            <Button variant="ghost" onClick={() => setOrientation((o) => (o === "white" ? "black" : "white"))}>
              <FlipVertical2 className="h-4 w-4" />
              Flip
            </Button>
            <Button variant="ghost" onClick={copyFen}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy FEN"}
            </Button>
            <Button variant="ghost" onClick={startOver}>
              <RefreshCw className="h-4 w-4" />
              Reset
            </Button>
          </div>

          {heatmap && (
            <p className="mt-2 flex items-center gap-3 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block h-3 w-3" style={{ background: "rgba(26,82,53,0.5)" }} />
                White controls
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block h-3 w-3" style={{ background: "rgba(200,90,50,0.5)" }} />
                Black controls
              </span>
            </p>
          )}

          {/* Evaluation graph */}
          <Panel className="mt-4 p-3">
            <div className="mb-1 flex items-center justify-between">
              <SectionLabel>Evaluation over time</SectionLabel>
              <span className="text-[0.7rem] text-slate-400">click to scrub</span>
            </div>
            <EvalGraph
              evals={evals}
              selected={safePly}
              onSelect={setPly}
              moves={graphMoves}
              height={180}
            />
          </Panel>
        </div>

        {/* Side panel */}
        <aside className="flex flex-col gap-5">
          {/* Coach */}
          <Panel className="p-4">
            <div className="flex items-center justify-between">
              <SectionLabel>The Coach</SectionLabel>
              <Button variant="primary" onClick={askCoach}>
                <MessageSquareText className="h-4 w-4" />
                Ask the coach
              </Button>
            </div>

            {report ? (
              <div className="mt-4 space-y-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-terracotta" />
                    <p className="font-display text-lg font-semibold leading-snug text-slate-900 dark:text-slate-100">
                      {report.position.headline}
                    </p>
                  </div>
                  <ul className="mt-2 space-y-1.5">
                    {report.position.points.map((pt, i) => (
                      <li key={i} className="flex gap-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                        <span className="mt-2 h-1 w-1 shrink-0 bg-terracotta" />
                        {pt}
                      </li>
                    ))}
                  </ul>
                </div>

                {report.move && (
                  <div className="border-t border-slate-200 pt-3 dark:border-slate-800">
                    <div className="mb-1.5">
                      <Pill tone={QUALITY_TONE[report.move.quality]}>{report.move.label}</Pill>
                    </div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                      {report.move.headline}
                    </p>
                    <ul className="mt-2 space-y-1.5">
                      {report.move.points.map((pt, i) => (
                        <li key={i} className="flex gap-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                          <span className="mt-2 h-1 w-1 shrink-0 bg-slate-400" />
                          {pt}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p className="mt-3 text-sm italic leading-relaxed text-slate-400">
                Move to any position — by playing, scrubbing the graph, or loading a
                game — then ask for a read in plain English.
              </p>
            )}
          </Panel>

          {/* Cloud importer */}
          <Panel className="p-4">
            <CloudImporter onLoad={loadGame} />
          </Panel>

          {/* Load FEN / PGN */}
          <div>
            <SectionLabel>Load a position</SectionLabel>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={3}
              spellCheck={false}
              placeholder="Paste a FEN or PGN…"
              className="mt-2 w-full resize-none border border-slate-300 bg-transparent px-3 py-2 font-mono text-xs text-slate-800 outline-none focus:border-slate-900 dark:border-slate-700 dark:text-slate-200 dark:focus:border-slate-300"
            />
            {ioError && <p className="mt-1 text-xs text-terracotta">{ioError}</p>}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Button variant="secondary" onClick={loadPosition}>
                Load
              </Button>
              {EXAMPLES.map((ex) => (
                <button
                  key={ex.label}
                  onClick={() => loadExample(ex.fen)}
                  className="border border-slate-300 px-2.5 py-1 text-xs text-slate-600 transition-colors hover:border-slate-900 hover:text-slate-900 focus-hard dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-300"
                >
                  {ex.label}
                </button>
              ))}
            </div>
          </div>

          {/* Move list */}
          <div>
            <SectionLabel>Moves</SectionLabel>
            <Panel className="mt-2 max-h-56 overflow-y-auto">
              <MoveList meta={meta} ply={safePly} onSelect={setPly} />
            </Panel>
          </div>
        </aside>
      </div>
    </div>
  );
}

function MoveList({
  meta,
  ply,
  onSelect,
}: {
  meta: NodeMeta[];
  ply: number;
  onSelect: (p: number) => void;
}) {
  if (meta.length === 0) {
    return (
      <p className="px-3 py-4 text-sm italic text-slate-400">
        No moves yet. Play on the board or load a game.
      </p>
    );
  }
  const rows: { no: number; w?: { i: number; san: string }; b?: { i: number; san: string } }[] = [];
  meta.forEach((m, i) => {
    const idx = Math.floor(i / 2);
    if (!rows[idx]) rows[idx] = { no: m.moveNumber };
    const cell = { i: i + 1, san: m.san };
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
                  "px-2 py-1 text-left transition-colors",
                  active
                    ? "bg-forest/15 font-semibold text-slate-900 dark:text-slate-100"
                    : "text-slate-700 hover:bg-slate-900/5 dark:text-slate-300 dark:hover:bg-slate-100/5",
                ].join(" ")}
              >
                {cell.san}
              </button>
            );
          })}
        </li>
      ))}
    </ol>
  );
}
