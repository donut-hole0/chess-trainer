"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Chessboard } from "react-chessboard";
import { Chess, type Square } from "chess.js";

export interface ChessBoardProps {
  /** Current position as a FEN string (controlled by the parent). */
  position: string;
  /**
   * Attempt a move. The parent owns the real game state and returns true if the
   * move was legal and accepted, false otherwise.
   */
  onMove?: (from: string, to: string, promotion?: string) => boolean;
  orientation?: "white" | "black";
  /** When false the board is display-only. */
  interactive?: boolean;
  /** Extra square styles layered in from the parent (hint, last move, etc.). */
  highlightSquares?: Record<string, CSSProperties>;
}

const LIGHT_SQUARE = "#E8E4D9";
const DARK_SQUARE = "#4F6F5E";

const SELECTED_STYLE: CSSProperties = {
  background: "rgba(200, 90, 50, 0.40)",
};

const CHECK_STYLE: CSSProperties = {
  background: "rgba(200, 90, 50, 0.55)",
};

function moveDot(isCapture: boolean): CSSProperties {
  return {
    background: isCapture
      ? "radial-gradient(circle, rgba(26,82,53,0.45) 78%, transparent 80%)"
      : "radial-gradient(circle, rgba(26,82,53,0.45) 22%, transparent 24%)",
    borderRadius: isCapture ? "0" : "50%",
  };
}

function safeGame(fen: string): Chess | null {
  try {
    return new Chess(fen);
  } catch {
    return null;
  }
}

/** Square of the side-to-move's king when it is in check, else null. */
function checkedKingSquare(game: Chess): Square | null {
  if (!game.isCheck()) return null;
  const turn = game.turn();
  for (const row of game.board()) {
    for (const piece of row) {
      if (piece && piece.type === "k" && piece.color === turn) {
        return piece.square;
      }
    }
  }
  return null;
}

export function ChessBoard({
  position,
  onMove,
  orientation = "white",
  interactive = true,
  highlightSquares,
}: ChessBoardProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(480);
  const [mounted, setMounted] = useState(false);

  const [selected, setSelected] = useState<Square | null>(null);
  const [options, setOptions] = useState<Record<string, CSSProperties>>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0].contentRect.width;
      if (w > 0) setWidth(Math.floor(w));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Clear any selection when the position changes underneath us.
  useEffect(() => {
    setSelected(null);
    setOptions({});
  }, [position]);

  const checkSquare = useMemo(() => {
    const g = safeGame(position);
    return g ? checkedKingSquare(g) : null;
  }, [position]);

  function showMoveOptions(square: Square): boolean {
    const g = safeGame(position);
    if (!g) return false;
    const moves = g.moves({ square, verbose: true });
    if (moves.length === 0) return false;

    const styles: Record<string, CSSProperties> = {};
    for (const m of moves) {
      styles[m.to] = moveDot(Boolean(m.captured) || m.flags.includes("e"));
    }
    styles[square] = SELECTED_STYLE;
    setOptions(styles);
    return true;
  }

  function attempt(from: Square, to: Square): boolean {
    if (!onMove) return false;
    const g = safeGame(position);
    if (!g) return false;
    // Auto-promote to a queen — the most common choice.
    const isPromotion = g
      .moves({ square: from, verbose: true })
      .some((m) => m.to === to && m.promotion);
    return onMove(from, to, isPromotion ? "q" : undefined);
  }

  function handleSquareClick(square: string) {
    if (!interactive) return;
    const sq = square as Square;

    if (selected) {
      if (sq === selected) {
        setSelected(null);
        setOptions({});
        return;
      }
      const accepted = attempt(selected, sq);
      if (accepted) {
        setSelected(null);
        setOptions({});
        return;
      }
      // Not a legal move — try selecting the clicked piece instead.
      const reselected = showMoveOptions(sq);
      setSelected(reselected ? sq : null);
      if (!reselected) setOptions({});
      return;
    }

    if (showMoveOptions(sq)) setSelected(sq);
  }

  function handlePieceDrop(from: string, to: string): boolean {
    if (!interactive) return false;
    const accepted = attempt(from as Square, to as Square);
    setSelected(null);
    setOptions({});
    return accepted;
  }

  const customSquareStyles = useMemo(() => {
    const base: Record<string, CSSProperties> = {};
    if (checkSquare) base[checkSquare] = CHECK_STYLE;
    return { ...base, ...(highlightSquares ?? {}), ...options };
  }, [checkSquare, highlightSquares, options]);

  return (
    <div ref={wrapRef} className="w-full">
      <div className="border-2 border-slate-900 shadow-hard dark:border-slate-100">
        {mounted ? (
          <Chessboard
            position={position}
            boardWidth={width}
            onSquareClick={handleSquareClick}
            onPieceDrop={handlePieceDrop}
            boardOrientation={orientation}
            arePiecesDraggable={interactive}
            customSquareStyles={customSquareStyles}
            customLightSquareStyle={{ backgroundColor: LIGHT_SQUARE }}
            customDarkSquareStyle={{ backgroundColor: DARK_SQUARE }}
            customBoardStyle={{ borderRadius: 0 }}
            animationDuration={180}
            id="gambit-board"
          />
        ) : (
          // Placeholder keeps layout stable until the client mounts the board.
          <div
            className="grid place-items-center bg-[#E8E4D9] text-slate-500"
            style={{ width: "100%", aspectRatio: "1 / 1" }}
          >
            <span className="text-3xl">♞</span>
          </div>
        )}
      </div>
    </div>
  );
}
