"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Chess } from "chess.js";
import {
  RotateCcw,
  RefreshCw,
  FlipVertical2,
  Copy,
  Check,
  MessageSquareText,
  Sparkles,
} from "lucide-react";
import { ChessBoard } from "@/components/ChessBoard";
import { EvalBar } from "@/components/EvalBar";
import { MoveHistory } from "@/components/MoveHistory";
import { Button, Panel, SectionLabel, Pill } from "@/components/ui";
import { useChessGame } from "@/lib/useChessGame";
import { evaluatePositionCp } from "@/lib/engine/search";
import {
  analyzePosition,
  analyzeMove,
  type PositionReport,
  type MoveReport,
  type MoveQuality,
} from "@/lib/engine/coach";

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

const LAST_MOVE_STYLE: CSSProperties = { background: "rgba(26, 82, 53, 0.16)" };

export default function AnalysisPage() {
  const { fen, history, status, makeMove, reset, undo, loadFen, loadPgn } =
    useChessGame();

  const [orientation, setOrientation] = useState<"white" | "black">("white");
  const [evalCp, setEvalCp] = useState(0);
  const [input, setInput] = useState("");
  const [ioError, setIoError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [lastContext, setLastContext] = useState<{
    fenBefore: string;
    move: { from: string; to: string; promotion?: string };
  } | null>(null);
  const [report, setReport] = useState<{
    position: PositionReport;
    move: MoveReport | null;
  } | null>(null);

  const lastMove = history[history.length - 1];
  const highlight = useMemo(() => {
    if (!lastMove) return {};
    return { [lastMove.from]: LAST_MOVE_STYLE, [lastMove.to]: LAST_MOVE_STYLE };
  }, [lastMove]);

  // Live evaluation for the bar.
  useEffect(() => {
    let cancelled = false;
    const id = setTimeout(() => {
      try {
        const cp = evaluatePositionCp(new Chess(fen), 2);
        if (!cancelled) setEvalCp(cp);
      } catch {
        /* ignore */
      }
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [fen]);

  // A new position invalidates any previous coaching.
  useEffect(() => {
    setReport(null);
  }, [fen]);

  function handleMove(from: string, to: string, promotion?: string): boolean {
    const fenBefore = fen;
    const result = makeMove({ from, to, promotion });
    if (result) {
      setLastContext({ fenBefore, move: { from, to, promotion } });
    }
    return result !== null;
  }

  function askCoach() {
    try {
      const position = analyzePosition(fen, 2);
      const move = lastContext
        ? analyzeMove(lastContext.fenBefore, lastContext.move, 2)
        : null;
      setReport({ position, move });
    } catch {
      setReport(null);
    }
  }

  function loadPosition() {
    const text = input.trim();
    if (!text) return;
    const looksFen =
      text.includes("/") &&
      !text.includes("[") &&
      !/\d+\s*\./.test(text) &&
      text.split(/\s+/).length >= 4;

    let ok = looksFen ? loadFen(text) : loadPgn(text);
    if (!ok) ok = looksFen ? loadPgn(text) : loadFen(text);

    setIoError(ok ? null : "Couldn't read that as a FEN or PGN.");
    if (ok) {
      setLastContext(null);
      setReport(null);
    }
  }

  function loadExample(fenStr: string) {
    if (loadFen(fenStr)) {
      setInput(fenStr);
      setIoError(null);
      setLastContext(null);
      setReport(null);
    }
  }

  function startOver() {
    reset();
    setLastContext(null);
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
          The Coach
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          Analysis Board
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-500">
          Play out ideas for both sides, or load a position. When you want a read
          on it, ask the coach — you&apos;ll get plain English, not jargon.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Board */}
        <div className="min-w-0">
          <div className="flex items-stretch gap-3">
            <EvalBar cp={evalCp} orientation={orientation} />
            <div className="min-w-0 flex-1">
              <ChessBoard
                position={fen}
                onMove={handleMove}
                orientation={orientation}
                interactive={!status.isGameOver}
                highlightSquares={highlight}
              />
            </div>
          </div>

          {/* Board controls */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button variant="ghost" onClick={() => undo(1)} disabled={history.length === 0}>
              <RotateCcw className="h-4 w-4" />
              Undo
            </Button>
            <Button variant="ghost" onClick={startOver}>
              <RefreshCw className="h-4 w-4" />
              Reset
            </Button>
            <Button
              variant="ghost"
              onClick={() =>
                setOrientation((o) => (o === "white" ? "black" : "white"))
              }
            >
              <FlipVertical2 className="h-4 w-4" />
              Flip
            </Button>
            <Button variant="ghost" onClick={copyFen}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy FEN"}
            </Button>
          </div>
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
                {/* Position read */}
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-terracotta" />
                    <p className="font-display text-lg font-semibold leading-snug text-slate-900 dark:text-slate-100">
                      {report.position.headline}
                    </p>
                  </div>
                  <ul className="mt-2 space-y-1.5">
                    {report.position.points.map((pt, i) => (
                      <li
                        key={i}
                        className="flex gap-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300"
                      >
                        <span className="mt-2 h-1 w-1 shrink-0 bg-terracotta" />
                        {pt}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Last move read */}
                {report.move && (
                  <div className="border-t border-slate-200 pt-3 dark:border-slate-800">
                    <div className="mb-1.5 flex items-center gap-2">
                      <Pill tone={QUALITY_TONE[report.move.quality]}>
                        {report.move.label}
                      </Pill>
                    </div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                      {report.move.headline}
                    </p>
                    <ul className="mt-2 space-y-1.5">
                      {report.move.points.map((pt, i) => (
                        <li
                          key={i}
                          className="flex gap-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300"
                        >
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
                Make a move or load a position, then ask for a read. The coach
                points out hanging pieces, who stands better, and what it would
                play.
              </p>
            )}
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
            {ioError && (
              <p className="mt-1 text-xs text-terracotta">{ioError}</p>
            )}
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

          {/* Move history */}
          <div>
            <SectionLabel>Moves</SectionLabel>
            <Panel className="mt-2">
              <MoveHistory history={history} className="max-h-48" />
            </Panel>
          </div>
        </aside>
      </div>
    </div>
  );
}
