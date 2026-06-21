"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Chess } from "chess.js";
import {
  CheckCircle2,
  XCircle,
  Eye,
  RotateCcw,
  Target,
  Trophy,
} from "lucide-react";
import { ChessBoard } from "@/components/ChessBoard";
import { Button, Panel, SectionLabel } from "@/components/ui";
import { useChessGame } from "@/lib/useChessGame";
import { colorChar, type OpeningNode, type Repertoire } from "@/lib/openings";

type Status = "active" | "complete";
type Feedback = "idle" | "correct" | "wrong";

export function MemoryDrill({ rep }: { rep: Repertoire }) {
  const { fen, history, makeMove, reset } = useChessGame();
  const userColor = colorChar(rep);

  const [book, setBook] = useState<OpeningNode[]>([]);
  const [status, setStatus] = useState<Status>("active");
  const [feedback, setFeedback] = useState<Feedback>("idle");
  const [revealed, setRevealed] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [streak, setStreak] = useState(0);

  const start = useCallback(() => {
    reset(rep.startFen);
    setBook(rep.line);
    setStatus("active");
    setFeedback("idle");
    setRevealed(false);
    setCorrect(0);
    setWrong(0);
    setStreak(0);
  }, [rep, reset]);

  // (Re)start whenever the chosen repertoire changes.
  useEffect(() => {
    start();
  }, [start]);

  const sideToMove = useMemo(() => {
    try {
      return new Chess(fen).turn();
    } catch {
      return "w" as const;
    }
  }, [fen]);

  const userToMove = sideToMove === userColor;

  // The computer answers with a book move whenever it is the opponent's turn.
  const bookRef = useRef(book);
  bookRef.current = book;
  useEffect(() => {
    if (status !== "active") return;
    if (book.length === 0) {
      setStatus("complete");
      return;
    }
    if (userToMove) return; // wait for the student

    const pick = book[Math.floor(Math.random() * book.length)];
    let from: string, to: string, promo: string | undefined;
    try {
      const clone = new Chess(fen);
      const m = clone.move(pick.san);
      from = m.from;
      to = m.to;
      promo = m.promotion;
    } catch {
      return;
    }
    const id = setTimeout(() => {
      makeMove({ from, to, promotion: promo });
      setBook(pick.children);
    }, 480);
    return () => clearTimeout(id);
  }, [fen, status, book, userToMove, makeMove]);

  function handleMove(from: string, to: string, promotion?: string): boolean {
    if (status !== "active" || !userToMove) return false;
    let mv;
    try {
      mv = new Chess(fen).move({ from, to, promotion });
    } catch {
      return false;
    }
    if (!mv) return false;

    const match = book.find((c) => c.san === mv.san);
    if (!match) {
      setFeedback("wrong");
      setWrong((w) => w + 1);
      setStreak(0);
      window.setTimeout(() => setFeedback("idle"), 500);
      return false; // reject — the piece snaps back
    }

    makeMove({ from, to, promotion });
    setBook(match.children);
    setFeedback("correct");
    setCorrect((c) => c + 1);
    setStreak((s) => s + 1);
    setRevealed(false);
    window.setTimeout(() => setFeedback("idle"), 500);
    return true;
  }

  function showBookMove() {
    if (status !== "active" || !userToMove || book.length === 0) return;
    const pick = book[0];
    try {
      const clone = new Chess(fen);
      const m = clone.move(pick.san);
      makeMove({ from: m.from, to: m.to, promotion: m.promotion });
      setBook(pick.children);
      setRevealed(true);
      setStreak(0);
    } catch {
      /* ignore */
    }
  }

  const lastMove = history[history.length - 1];
  const highlight = useMemo(() => {
    if (!lastMove) return {} as Record<string, CSSProperties>;
    const tint = { background: "rgba(26, 82, 53, 0.18)" };
    return { [lastMove.from]: tint, [lastMove.to]: tint };
  }, [lastMove]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      {/* Board */}
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
            orientation={rep.color}
            interactive={status === "active" && userToMove}
            highlightSquares={highlight}
          />
        </div>
        <p className="mt-3 text-center text-sm text-slate-500">
          You play{" "}
          <span className="font-semibold text-slate-700 dark:text-slate-200">
            {rep.color}
          </span>{" "}
          · {status === "complete" ? "line complete" : userToMove ? "your move" : "opponent to move"}
        </p>
      </div>

      {/* Side panel */}
      <aside className="flex flex-col gap-4">
        <Panel className="p-4">
          <SectionLabel>Memory Drill</SectionLabel>
          <h3 className="mt-1 font-display text-xl font-semibold text-slate-900 dark:text-slate-100">
            {rep.name}
          </h3>
          <div className="mt-3 grid grid-cols-3 gap-2 border-t border-slate-200 pt-3 text-center dark:border-slate-800">
            <Stat label="Correct" value={correct} tone="forest" />
            <Stat label="Missed" value={wrong} tone="terracotta" />
            <Stat label="Streak" value={streak} />
          </div>
        </Panel>

        {/* Feedback */}
        <div
          className="flex min-h-[3.25rem] items-center gap-2.5 border border-slate-300 px-4 dark:border-slate-800"
          aria-live="polite"
        >
          {status === "complete" ? (
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-forest dark:text-emerald-400">
              <Trophy className="h-4 w-4" />
              Line complete — well memorized.
            </span>
          ) : feedback === "wrong" ? (
            <span className="inline-flex items-center gap-2 text-sm font-medium text-terracotta">
              <XCircle className="h-4 w-4" />
              Not the book move — try again.
            </span>
          ) : feedback === "correct" ? (
            <span className="inline-flex items-center gap-2 text-sm font-medium text-forest dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              Book. Keep going.
            </span>
          ) : revealed ? (
            <span className="inline-flex items-center gap-2 text-sm text-slate-500">
              <Eye className="h-4 w-4" />
              Shown — play it back next time.
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 text-sm text-slate-500">
              <Target className="h-4 w-4" />
              {userToMove ? "Play the book move." : "Watch the reply…"}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Button
            variant="secondary"
            onClick={showBookMove}
            disabled={status !== "active" || !userToMove}
          >
            <Eye className="h-4 w-4" />
            Show book move
          </Button>
          <Button variant="ghost" onClick={start}>
            <RotateCcw className="h-4 w-4" />
            Restart drill
          </Button>
        </div>
      </aside>
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "forest" | "terracotta";
}) {
  const color =
    tone === "forest"
      ? "text-forest dark:text-emerald-400"
      : tone === "terracotta"
        ? "text-terracotta"
        : "text-slate-900 dark:text-slate-100";
  return (
    <div>
      <p className={`font-display text-2xl font-semibold tabular-nums ${color}`}>
        {value}
      </p>
      <p className="text-[0.65rem] uppercase tracking-wider text-slate-400">{label}</p>
    </div>
  );
}
