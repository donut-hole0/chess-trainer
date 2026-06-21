"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Chess } from "chess.js";
import { RotateCcw, Plus, Loader2, Crown, Flag } from "lucide-react";
import { ChessBoard } from "@/components/ChessBoard";
import { EvalBar } from "@/components/EvalBar";
import { MoveHistory } from "@/components/MoveHistory";
import { DifficultySelector } from "@/components/DifficultySelector";
import { Button, Panel, SectionLabel, Pill } from "@/components/ui";
import { useChessGame } from "@/lib/useChessGame";
import { getBotMove, PERSONALITIES, type BotLevel } from "@/lib/engine/bot";
import { evaluatePositionCp } from "@/lib/engine/search";

type PlayerColor = "white" | "black";

export default function PlayPage() {
  const { fen, history, status, makeMove, reset, undo } = useChessGame();
  const [playerColor, setPlayerColor] = useState<PlayerColor>("white");
  const [botLevel, setBotLevel] = useState<BotLevel>("club");
  const [thinking, setThinking] = useState(false);
  const [evalCp, setEvalCp] = useState(0);
  const [resigned, setResigned] = useState(false);

  const personality = PERSONALITIES[botLevel];
  const playerTurn = playerColor === "white" ? "w" : "b";
  const botColor = playerColor === "white" ? "b" : "w";
  const gameOver = status.isGameOver || resigned;

  const lastMove = history[history.length - 1];
  const highlight = useMemo(() => {
    if (!lastMove) return {};
    const tint = { background: "rgba(26, 82, 53, 0.18)" };
    return { [lastMove.from]: tint, [lastMove.to]: tint };
  }, [lastMove]);

  // Recompute the evaluation whenever the position changes. A fresh instance is
  // used so the search (which mutates via make/undo) never touches live state.
  useEffect(() => {
    let cancelled = false;
    const id = setTimeout(() => {
      try {
        const cp = evaluatePositionCp(new Chess(fen), 2);
        if (!cancelled) setEvalCp(cp);
      } catch {
        /* ignore transient invalid positions */
      }
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [fen]);

  // The bot replies whenever it is its turn.
  useEffect(() => {
    if (gameOver) return;
    if (status.turn !== botColor) return;

    setThinking(true);
    const id = setTimeout(() => {
      const clone = new Chess(fen);
      const move = getBotMove(clone, personality);
      if (move) {
        makeMove({ from: move.from, to: move.to, promotion: move.promotion });
      }
      setThinking(false);
    }, 450);

    return () => {
      clearTimeout(id);
      setThinking(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fen, status.turn, botColor, gameOver, personality]);

  const handleMove = useCallback(
    (from: string, to: string, promotion?: string) => {
      if (gameOver || status.turn !== playerTurn) return false;
      const result = makeMove({ from, to, promotion });
      return result !== null;
    },
    [gameOver, status.turn, playerTurn, makeMove]
  );

  function newGame(color: PlayerColor = playerColor) {
    setResigned(false);
    setPlayerColor(color);
    reset();
  }

  function takeback() {
    if (history.length === 0) return;
    // Undo back to the player's turn (their move plus the bot's reply).
    const plies = status.turn === playerTurn ? 2 : 1;
    undo(Math.min(plies, history.length));
    setResigned(false);
  }

  const interactive = !gameOver && status.turn === playerTurn && !thinking;

  // Outcome text for the result banner.
  const outcome = useMemo(() => {
    if (resigned) {
      return { title: "You resigned", detail: `${personality.name} takes the point.` };
    }
    if (status.isCheckmate) {
      const playerWon = status.turn === botColor;
      return playerWon
        ? { title: "Checkmate — you win", detail: `You outplayed ${personality.name}.` }
        : { title: "Checkmate", detail: `${personality.name} found the finish.` };
    }
    if (status.isStalemate) return { title: "Stalemate", detail: "A draw by stalemate." };
    if (status.isDraw) return { title: "Draw", detail: "Neither side can force a win." };
    return null;
  }, [resigned, status, botColor, personality.name]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-terracotta">
          The Arena
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          Play the Bot
        </h1>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        {/* Board + evaluation */}
        <div className="flex min-w-0 items-stretch gap-3">
          <EvalBar cp={evalCp} orientation={playerColor} />
          <div className="min-w-0 flex-1">
            <ChessBoard
              position={fen}
              onMove={handleMove}
              orientation={playerColor}
              interactive={interactive}
              highlightSquares={highlight}
            />
          </div>
        </div>

        {/* Side panel */}
        <aside className="flex flex-col gap-5">
          {/* Status */}
          <Panel className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <SectionLabel>Now playing</SectionLabel>
                <p className="mt-1 font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
                  You{" "}
                  <span className="text-slate-400">vs</span> {personality.name}
                </p>
              </div>
              <span className="text-3xl" aria-hidden>
                {personality.glyph}
              </span>
            </div>

            <div className="mt-3 flex items-center gap-2 border-t border-slate-200 pt-3 dark:border-slate-800">
              {gameOver ? (
                <Pill tone="terracotta">Game over</Pill>
              ) : thinking ? (
                <span className="inline-flex items-center gap-2 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {personality.name} is thinking…
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <span
                    className={[
                      "inline-block h-2.5 w-2.5 border border-slate-900 dark:border-slate-100",
                      status.turn === "w" ? "bg-parchment" : "bg-charcoal",
                    ].join(" ")}
                  />
                  {status.turn === playerTurn ? "Your move" : "Bot to move"}
                  {status.isCheck && (
                    <span className="font-semibold text-terracotta">· Check</span>
                  )}
                </span>
              )}
            </div>
          </Panel>

          {/* Result banner */}
          {outcome && (
            <Panel className="border-slate-900 p-4 dark:border-slate-100">
              <div className="flex items-start gap-3">
                <Crown className="mt-0.5 h-5 w-5 text-terracotta" />
                <div>
                  <p className="font-display text-xl font-semibold text-slate-900 dark:text-slate-100">
                    {outcome.title}
                  </p>
                  <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
                    {outcome.detail}
                  </p>
                </div>
              </div>
            </Panel>
          )}

          {/* Opponent selection */}
          <div>
            <SectionLabel>Choose your opponent</SectionLabel>
            <div className="mt-2">
              <DifficultySelector value={botLevel} onChange={setBotLevel} />
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <Button variant="primary" className="flex-1" onClick={() => newGame()}>
                <Plus className="h-4 w-4" />
                New game
              </Button>
              <Button
                variant="ghost"
                onClick={takeback}
                disabled={history.length === 0 || thinking}
                title="Take back your last move"
              >
                <RotateCcw className="h-4 w-4" />
                Takeback
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-slate-500">
                Play as
              </span>
              <div className="flex border border-slate-300 dark:border-slate-700">
                {(["white", "black"] as PlayerColor[]).map((c) => (
                  <button
                    key={c}
                    onClick={() => newGame(c)}
                    className={[
                      "px-3 py-1.5 text-sm font-medium capitalize transition-colors focus-hard",
                      playerColor === c
                        ? "bg-slate-900 text-parchment dark:bg-slate-100 dark:text-charcoal"
                        : "text-slate-600 hover:bg-slate-900/5 dark:text-slate-300",
                    ].join(" ")}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setResigned(true)}
                disabled={gameOver || history.length === 0}
                className="ml-auto inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-terracotta disabled:opacity-40"
                title="Resign the game"
              >
                <Flag className="h-4 w-4" />
                Resign
              </button>
            </div>
          </div>

          {/* Move history */}
          <div>
            <SectionLabel>Moves</SectionLabel>
            <Panel className="mt-2">
              <MoveHistory history={history} className="max-h-56" />
            </Panel>
          </div>
        </aside>
      </div>
    </div>
  );
}
