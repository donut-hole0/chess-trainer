"use client";

import { useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import { CalendarDays, CheckCircle2, XCircle, Target, ArrowRight } from "lucide-react";
import { ChessBoard } from "@/components/ChessBoard";
import { Panel, SectionLabel, Pill } from "@/components/ui";
import { useChessGame } from "@/lib/useChessGame";
import { dailyPuzzle, checkPuzzleMove, puzzleSide, type Puzzle } from "@/lib/puzzles";
import { useProfile } from "@/lib/profile";

type Feedback = "idle" | "correct" | "wrong";

const SOLVED_STYLE: CSSProperties = { background: "rgba(26, 82, 53, 0.35)" };

export function DailyPuzzle() {
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const { recordPuzzleSolved } = useProfile();
  const { fen, makeMove, loadFen } = useChessGame();
  const [solved, setSolved] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>("idle");

  // Choose the day's puzzle after mount to keep SSR output stable.
  useEffect(() => {
    setPuzzle(dailyPuzzle());
  }, []);

  useEffect(() => {
    if (puzzle) loadFen(puzzle.fen);
  }, [puzzle, loadFen]);

  function handleMove(from: string, to: string, promotion?: string): boolean {
    if (!puzzle || solved) return false;
    const verdict = checkPuzzleMove(puzzle, from, to, promotion);
    if (verdict === "correct") {
      makeMove({ from, to, promotion });
      setSolved(true);
      setFeedback("correct");
      recordPuzzleSolved();
      window.setTimeout(() => setFeedback("idle"), 800);
      return true;
    }
    if (verdict === "wrong") {
      setFeedback("wrong");
      window.setTimeout(() => setFeedback("idle"), 500);
    }
    return false;
  }

  const side = puzzle ? puzzleSide(puzzle) : "white";
  const highlight: Record<string, CSSProperties> = {};

  return (
    <Panel className="flex flex-col p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-terracotta" />
          <SectionLabel>Daily Puzzle</SectionLabel>
        </div>
        {puzzle && <Pill>{puzzle.difficulty}</Pill>}
      </div>

      <div
        className={[
          "mt-3 w-full",
          feedback === "wrong" ? "animate-shake" : "",
          feedback === "correct" ? "animate-flash-correct" : "",
        ].join(" ")}
      >
        <ChessBoard
          position={fen}
          onMove={handleMove}
          orientation={side}
          interactive={!solved && !!puzzle}
          highlightSquares={highlight}
        />
      </div>

      <div className="mt-3 flex min-h-[2.5rem] items-center gap-2 text-sm" aria-live="polite">
        {solved ? (
          <span className="inline-flex items-center gap-2 font-semibold text-forest dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
            Solved — nicely seen.
          </span>
        ) : feedback === "wrong" ? (
          <span className="inline-flex items-center gap-2 font-medium text-terracotta">
            <XCircle className="h-4 w-4" />
            Not quite — look again.
          </span>
        ) : (
          <span className="inline-flex items-center gap-2 text-slate-500">
            <Target className="h-4 w-4" />
            {puzzle ? `${side === "white" ? "White" : "Black"} to move — mate in one.` : "Loading…"}
          </span>
        )}
      </div>

      <Link
        href="/puzzles"
        className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-slate-900 hover:gap-2.5 dark:text-slate-100"
      >
        More tactics
        <ArrowRight className="h-4 w-4 transition-all" />
      </Link>
    </Panel>
  );
}
