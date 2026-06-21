"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { Timer, Flame, Play, RotateCcw, Trophy, Heart, Zap } from "lucide-react";
import { ChessBoard } from "@/components/ChessBoard";
import { Button, Panel, SectionLabel } from "@/components/ui";
import { useChessGame } from "@/lib/useChessGame";
import { checkPuzzleMove, puzzleQueue, puzzleSide, type Puzzle } from "@/lib/puzzles";
import { useProfile } from "@/lib/profile";

type Mode = "rush" | "streak";
type Status = "idle" | "playing" | "over";

const RUSH_SECONDS = 180;
const RUSH_STRIKES = 3;

function fmt(s: number): string {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export function PuzzleRush() {
  const { profile, recordRush, recordStreak, recordPuzzleSolved } = useProfile();
  const [mode, setMode] = useState<Mode>("rush");
  const [status, setStatus] = useState<Status>("idle");
  const [queue, setQueue] = useState<Puzzle[]>([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [strikes, setStrikes] = useState(0);
  const [timeLeft, setTimeLeft] = useState(RUSH_SECONDS);
  const [flash, setFlash] = useState<"idle" | "correct" | "wrong">("idle");

  const { fen, makeMove, loadFen } = useChessGame();
  const finishedRef = useRef(false);

  const current = status === "playing" ? queue[index] : null;

  const finish = useCallback(
    (finalScore: number) => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      setStatus("over");
      if (mode === "rush") recordRush(finalScore);
      else recordStreak(finalScore);
    },
    [mode, recordRush, recordStreak]
  );

  function start() {
    finishedRef.current = false;
    setQueue(puzzleQueue(400));
    setIndex(0);
    setScore(0);
    setStrikes(0);
    setTimeLeft(RUSH_SECONDS);
    setFlash("idle");
    setStatus("playing");
  }

  // Load the current puzzle onto the board.
  useEffect(() => {
    if (current) loadFen(current.fen);
  }, [current, loadFen]);

  // Rush countdown.
  useEffect(() => {
    if (status !== "playing" || mode !== "rush") return;
    if (timeLeft <= 0) {
      finish(score);
      return;
    }
    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [status, mode, timeLeft, score, finish]);

  function handleMove(from: string, to: string, promotion?: string): boolean {
    if (!current || status !== "playing") return false;
    const verdict = checkPuzzleMove(current, from, to, promotion);

    if (verdict === "correct") {
      makeMove({ from, to, promotion });
      const next = score + 1;
      setScore(next);
      recordPuzzleSolved();
      setFlash("correct");
      window.setTimeout(() => {
        setFlash("idle");
        setIndex((i) => i + 1);
      }, 260);
      return true;
    }

    if (verdict === "wrong") {
      setFlash("wrong");
      window.setTimeout(() => setFlash("idle"), 360);
      if (mode === "streak") {
        finish(score);
      } else {
        const s = strikes + 1;
        setStrikes(s);
        if (s >= RUSH_STRIKES) finish(score);
        else window.setTimeout(() => setIndex((i) => i + 1), 360);
      }
    }
    return false;
  }

  const side = current ? puzzleSide(current) : "white";
  const best = mode === "rush" ? profile.bestRush : profile.bestStreak;
  const highlight: Record<string, CSSProperties> = {};

  return (
    <Panel className="flex flex-col p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-terracotta" />
          <SectionLabel>High-Stakes Puzzles</SectionLabel>
        </div>
        {/* Mode toggle */}
        <div className="flex border border-slate-300 dark:border-slate-700">
          {(["rush", "streak"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setStatus("idle");
                finishedRef.current = false;
              }}
              className={[
                "inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold capitalize transition-colors focus-hard",
                mode === m
                  ? "bg-slate-900 text-parchment dark:bg-slate-100 dark:text-charcoal"
                  : "text-slate-600 hover:bg-slate-900/5 dark:text-slate-300",
              ].join(" ")}
            >
              {m === "rush" ? <Timer className="h-3.5 w-3.5" /> : <Flame className="h-3.5 w-3.5" />}
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Stat row */}
      <div className="mt-3 grid grid-cols-3 gap-2 border-y border-slate-200 py-2.5 text-center dark:border-slate-800">
        <Stat label="Solved" value={status === "idle" ? "—" : String(score)} />
        {mode === "rush" ? (
          <Stat
            label="Time"
            value={status === "idle" ? fmt(RUSH_SECONDS) : fmt(Math.max(0, timeLeft))}
            tone={status === "playing" && timeLeft <= 20 ? "warn" : "default"}
          />
        ) : (
          <Stat label="Streak" value={status === "idle" ? "—" : String(score)} />
        )}
        <Stat label="Best" value={String(best)} />
      </div>

      {/* Strikes (rush only) */}
      {mode === "rush" && status === "playing" && (
        <div className="mt-2 flex items-center justify-center gap-1.5">
          {Array.from({ length: RUSH_STRIKES }).map((_, i) => (
            <Heart
              key={i}
              className={[
                "h-4 w-4",
                i < RUSH_STRIKES - strikes
                  ? "fill-terracotta text-terracotta"
                  : "text-slate-300 dark:text-slate-700",
              ].join(" ")}
            />
          ))}
        </div>
      )}

      {/* Board / overlay */}
      <div className="relative mt-3">
        <div
          className={[
            flash === "wrong" ? "animate-shake" : "",
            flash === "correct" ? "animate-flash-correct" : "",
          ].join(" ")}
        >
          <ChessBoard
            position={fen}
            onMove={handleMove}
            orientation={side}
            interactive={status === "playing"}
            highlightSquares={highlight}
          />
        </div>

        {status !== "playing" && (
          <div className="absolute inset-0 grid place-items-center bg-parchment/85 backdrop-blur-[1px] dark:bg-charcoal/85">
            <div className="px-6 text-center">
              {status === "over" ? (
                <>
                  <Trophy className="mx-auto h-7 w-7 text-terracotta" />
                  <p className="mt-2 font-display text-3xl font-semibold text-slate-900 dark:text-slate-100">
                    {score} solved
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {score >= best && score > 0
                      ? "A new personal best."
                      : `Your best is ${best}.`}
                  </p>
                  <Button variant="primary" className="mt-4" onClick={start}>
                    <RotateCcw className="h-4 w-4" />
                    Go again
                  </Button>
                </>
              ) : (
                <>
                  <p className="font-display text-xl font-semibold text-slate-900 dark:text-slate-100">
                    {mode === "rush" ? "Puzzle Rush" : "Puzzle Streak"}
                  </p>
                  <p className="mx-auto mt-1 max-w-[15rem] text-sm text-slate-500">
                    {mode === "rush"
                      ? "Solve as many as you can in three minutes. Three misses ends it."
                      : "Keep solving. One wrong move ends the run."}
                  </p>
                  <Button variant="primary" className="mt-4" onClick={start}>
                    <Play className="h-4 w-4" />
                    Start
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {current && status === "playing" && (
        <p className="mt-3 text-center text-sm text-slate-500">
          {side === "white" ? "White" : "Black"} to move · find mate in one
        </p>
      )}
    </Panel>
  );
}

function Stat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "warn";
}) {
  return (
    <div>
      <p
        className={[
          "font-display text-2xl font-semibold tabular-nums",
          tone === "warn" ? "text-terracotta" : "text-slate-900 dark:text-slate-100",
        ].join(" ")}
      >
        {value}
      </p>
      <p className="text-[0.65rem] uppercase tracking-wider text-slate-400">{label}</p>
    </div>
  );
}
