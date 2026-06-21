"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Chess } from "chess.js";
import {
  Lightbulb,
  Eye,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Target,
} from "lucide-react";
import { ChessBoard } from "@/components/ChessBoard";
import { Button, Panel, SectionLabel, Pill } from "@/components/ui";
import { useChessGame } from "@/lib/useChessGame";
import { PUZZLES } from "@/lib/puzzles";

type Feedback = "idle" | "correct" | "wrong";

const HINT_STYLE: CSSProperties = {
  boxShadow: "inset 0 0 0 4px rgba(200, 90, 50, 0.9)",
};
const SOLVED_STYLE: CSSProperties = {
  background: "rgba(26, 82, 53, 0.35)",
};

export default function PuzzlesPage() {
  const [index, setIndex] = useState(0);
  const puzzle = PUZZLES[index];

  const { fen, makeMove, loadFen } = useChessGame(puzzle.fen);
  const [solved, setSolved] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [hint, setHint] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>("idle");
  const [solvedIds, setSolvedIds] = useState<Set<string>>(new Set());

  const sideToMove = puzzle.fen.split(" ")[1] === "b" ? "black" : "white";

  // Resolve the canonical solution move to from/to for hints and reveal.
  const solutionMove = useMemo(() => {
    try {
      const g = new Chess(puzzle.fen);
      return g.move(puzzle.solution[0]);
    } catch {
      return null;
    }
  }, [puzzle]);

  // Load a fresh copy of the puzzle whenever we switch to it.
  useEffect(() => {
    loadFen(puzzle.fen);
    setSolved(false);
    setRevealed(false);
    setHint(false);
    setFeedback("idle");
  }, [puzzle.fen, loadFen]);

  function evaluateMove(
    from: string,
    to: string,
    promotion?: string
  ): Feedback | "illegal" {
    const g = new Chess(puzzle.fen);
    let mv;
    try {
      mv = g.move({ from, to, promotion });
    } catch {
      return "illegal";
    }
    if (!mv) return "illegal";
    const ok =
      puzzle.goal === "mate"
        ? g.isCheckmate()
        : mv.san === puzzle.solution[0];
    return ok ? "correct" : "wrong";
  }

  function handleMove(from: string, to: string, promotion?: string): boolean {
    if (solved) return false;
    const verdict = evaluateMove(from, to, promotion);

    if (verdict === "correct") {
      makeMove({ from, to, promotion });
      setSolved(true);
      setHint(false);
      setFeedback("correct");
      setSolvedIds((prev) => new Set(prev).add(puzzle.id));
      window.setTimeout(() => setFeedback("idle"), 800);
      return true;
    }

    if (verdict === "wrong") {
      // Legal but not the solution — shake and let them retry.
      setFeedback("wrong");
      window.setTimeout(() => setFeedback("idle"), 500);
    }
    return false;
  }

  function showSolution() {
    if (solved || !solutionMove) return;
    makeMove({
      from: solutionMove.from,
      to: solutionMove.to,
      promotion: solutionMove.promotion,
    });
    setSolved(true);
    setRevealed(true);
    setHint(false);
  }

  function resetPuzzle() {
    loadFen(puzzle.fen);
    setSolved(false);
    setRevealed(false);
    setHint(false);
    setFeedback("idle");
  }

  function go(delta: number) {
    setIndex((i) => (i + delta + PUZZLES.length) % PUZZLES.length);
  }

  const highlight: Record<string, CSSProperties> = {};
  if (hint && !solved && solutionMove) {
    highlight[solutionMove.from] = HINT_STYLE;
  }
  if (solved && solutionMove) {
    highlight[solutionMove.from] = SOLVED_STYLE;
    highlight[solutionMove.to] = SOLVED_STYLE;
  }

  const solvedCount = solvedIds.size;

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-terracotta">
            Tactics
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Puzzle Trainer
          </h1>
        </div>
        <p className="text-sm text-slate-500">
          Solved{" "}
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {solvedCount}
          </span>{" "}
          of {PUZZLES.length}
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        {/* Board with feedback animation */}
        <div className="min-w-0">
          <div
            className={[
              feedback === "wrong" ? "animate-shake" : "",
              feedback === "correct" ? "animate-flash-correct" : "",
            ].join(" ")}
          >
            <ChessBoard
              position={fen}
              onMove={handleMove}
              orientation={sideToMove}
              interactive={!solved}
              highlightSquares={highlight}
            />
          </div>
          <p className="mt-3 text-center text-sm text-slate-500">
            {sideToMove === "white" ? "White" : "Black"} to move ·{" "}
            <span className="capitalize">{puzzle.theme}</span>
          </p>
        </div>

        {/* Side panel */}
        <aside className="flex flex-col gap-5">
          <Panel className="p-4">
            <div className="flex items-center justify-between gap-2">
              <SectionLabel>
                Puzzle {index + 1} of {PUZZLES.length}
              </SectionLabel>
              <div className="flex items-center gap-1.5">
                <Pill>{puzzle.difficulty}</Pill>
                {solvedIds.has(puzzle.id) && (
                  <Pill tone="forest">Solved</Pill>
                )}
              </div>
            </div>
            <h2 className="mt-2 font-display text-2xl font-semibold text-slate-900 dark:text-slate-100">
              {puzzle.title}
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              {puzzle.prompt}
            </p>
          </Panel>

          {/* Feedback line */}
          <div
            className="flex min-h-[3rem] items-center gap-2.5 border border-slate-300 px-4 dark:border-slate-800"
            aria-live="polite"
          >
            {solved ? (
              revealed ? (
                <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                  <Eye className="h-4 w-4" />
                  Solution: <span className="font-mono">{puzzle.solution[0]}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-forest dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  Checkmate — beautifully done.
                </span>
              )
            ) : feedback === "wrong" ? (
              <span className="inline-flex items-center gap-2 text-sm font-medium text-terracotta">
                <XCircle className="h-4 w-4" />
                Not the one — look again.
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 text-sm text-slate-500">
                <Target className="h-4 w-4" />
                Find the move. {hint && "The marked piece delivers it."}
              </span>
            )}
          </div>

          {/* Tools */}
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setHint(true)}
                disabled={solved || hint}
              >
                <Lightbulb className="h-4 w-4" />
                Need a hint?
              </Button>
              <Button variant="ghost" onClick={resetPuzzle} title="Reset puzzle">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            <Button
              variant="ghost"
              onClick={showSolution}
              disabled={solved}
            >
              <Eye className="h-4 w-4" />
              Show solution
            </Button>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between border-t border-slate-200 pt-4 dark:border-slate-800">
            <Button variant="ghost" onClick={() => go(-1)}>
              <ChevronLeft className="h-4 w-4" />
              Prev
            </Button>
            <div className="flex flex-wrap justify-center gap-1.5">
              {PUZZLES.map((p, i) => (
                <button
                  key={p.id}
                  onClick={() => setIndex(i)}
                  aria-label={`Go to puzzle ${i + 1}`}
                  className={[
                    "h-2.5 w-2.5 border transition-colors",
                    i === index
                      ? "border-slate-900 bg-slate-900 dark:border-slate-100 dark:bg-slate-100"
                      : solvedIds.has(p.id)
                        ? "border-forest bg-forest"
                        : "border-slate-400 bg-transparent hover:bg-slate-300",
                  ].join(" ")}
                />
              ))}
            </div>
            <Button variant="primary" onClick={() => go(1)}>
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
