import { useCallback, useRef, useState } from "react";
import { Chess, type Move } from "chess.js";

export interface MoveInput {
  from: string;
  to: string;
  promotion?: string;
}

export interface GameStatus {
  isGameOver: boolean;
  isCheck: boolean;
  isCheckmate: boolean;
  isDraw: boolean;
  isStalemate: boolean;
  turn: "w" | "b";
  /** Human-readable outcome when the game is over, otherwise null. */
  result: string | null;
}

function computeStatus(game: Chess): GameStatus {
  const turn = game.turn();
  const isCheckmate = game.isCheckmate();
  const isStalemate = game.isStalemate();
  const isDraw = game.isDraw();

  let result: string | null = null;
  if (isCheckmate) {
    result = `${turn === "w" ? "Black" : "White"} wins by checkmate`;
  } else if (isStalemate) {
    result = "Draw by stalemate";
  } else if (isDraw) {
    result = "Draw";
  }

  return {
    isGameOver: game.isGameOver(),
    isCheck: game.isCheck(),
    isCheckmate,
    isDraw,
    isStalemate,
    turn,
    result,
  };
}

function createGame(fen?: string): Chess {
  if (!fen) return new Chess();
  try {
    return new Chess(fen);
  } catch {
    return new Chess();
  }
}

/**
 * The base Chess wrapper. The mutable `chess.js` instance lives in a ref so it
 * survives re-renders without being recreated, and every mutation flows through
 * `sync()` which snapshots derived state (FEN, history, status) into React
 * state. Components read the snapshots; they never mutate the instance directly.
 */
export function useChessGame(initialFen?: string) {
  const gameRef = useRef<Chess | null>(null);
  if (gameRef.current === null) {
    gameRef.current = createGame(initialFen);
  }

  const [fen, setFen] = useState<string>(() => gameRef.current!.fen());
  const [history, setHistory] = useState<Move[]>([]);
  const [status, setStatus] = useState<GameStatus>(() =>
    computeStatus(gameRef.current!)
  );

  const sync = useCallback(() => {
    const game = gameRef.current!;
    setFen(game.fen());
    setHistory(game.history({ verbose: true }) as Move[]);
    setStatus(computeStatus(game));
  }, []);

  const makeMove = useCallback(
    (move: MoveInput): Move | null => {
      try {
        const result = gameRef.current!.move(move);
        sync();
        return result;
      } catch {
        // chess.js throws on illegal moves; treat as a rejected move.
        return null;
      }
    },
    [sync]
  );

  const undo = useCallback(
    (count = 1) => {
      for (let i = 0; i < count; i++) gameRef.current!.undo();
      sync();
    },
    [sync]
  );

  const reset = useCallback(
    (nextFen?: string) => {
      gameRef.current = createGame(nextFen);
      sync();
    },
    [sync]
  );

  const loadFen = useCallback(
    (nextFen: string): boolean => {
      try {
        gameRef.current = new Chess(nextFen);
        sync();
        return true;
      } catch {
        return false;
      }
    },
    [sync]
  );

  const loadPgn = useCallback(
    (pgn: string): boolean => {
      try {
        const next = new Chess();
        next.loadPgn(pgn);
        gameRef.current = next;
        sync();
        return true;
      } catch {
        return false;
      }
    },
    [sync]
  );

  return {
    game: gameRef.current,
    fen,
    history,
    status,
    makeMove,
    undo,
    reset,
    loadFen,
    loadPgn,
    sync,
  };
}
