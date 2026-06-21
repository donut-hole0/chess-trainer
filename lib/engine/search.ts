import { Chess, type Move, type PieceSymbol } from "chess.js";
import { evaluateBoard, MATE_SCORE, PIECE_VALUE } from "./evaluate";

export interface ScoredMove {
  move: Move;
  /** Score in centipawns from the perspective of the side that played `move`. */
  score: number;
}

// Most-Valuable-Victim / Least-Valuable-Aggressor style ordering so that
// alpha-beta prunes aggressively. Captures and promotions are searched first.
function moveOrderKey(m: Move): number {
  let key = 0;
  if (m.captured) {
    key += 10 * PIECE_VALUE[m.captured as PieceSymbol] - PIECE_VALUE[m.piece];
  }
  if (m.promotion) key += PIECE_VALUE[m.promotion as PieceSymbol];
  if (m.san.includes("+")) key += 50;
  return key;
}

function orderedMoves(game: Chess): Move[] {
  return (game.moves({ verbose: true }) as Move[]).sort(
    (a, b) => moveOrderKey(b) - moveOrderKey(a)
  );
}

/**
 * Negamax with alpha-beta pruning. Returns a score relative to the side to move
 * (higher is better for that side). Mutates `game` via make/undo, leaving it
 * unchanged on return.
 */
function negamax(
  game: Chess,
  depth: number,
  alpha: number,
  beta: number,
  color: number,
  ply: number
): number {
  if (game.isCheckmate()) {
    // Side to move is mated. Prefer faster mates by subtracting ply.
    return -(MATE_SCORE - ply);
  }
  if (game.isDraw() || game.isStalemate() || game.isThreefoldRepetition()) {
    return 0;
  }
  if (depth === 0) {
    return color * evaluateBoard(game);
  }

  let best = -Infinity;
  for (const move of orderedMoves(game)) {
    game.move(move);
    const value = -negamax(game, depth - 1, -beta, -alpha, -color, ply + 1);
    game.undo();
    if (value > best) best = value;
    if (best > alpha) alpha = best;
    if (alpha >= beta) break; // beta cutoff
  }
  return best;
}

/**
 * Score every legal move from the current position to the given search depth.
 * Returned list is sorted best-first from the moving side's perspective.
 */
export function scoreMoves(game: Chess, depth: number): ScoredMove[] {
  const color = game.turn() === "w" ? 1 : -1;
  const results: ScoredMove[] = [];

  for (const move of orderedMoves(game)) {
    game.move(move);
    const score = -negamax(
      game,
      depth - 1,
      -Infinity,
      Infinity,
      -color,
      1
    );
    game.undo();
    results.push({ move, score });
  }

  results.sort((a, b) => b.score - a.score);
  return results;
}

/** The single best move for the side to move, or null if the game is over. */
export function searchBestMove(game: Chess, depth: number): ScoredMove | null {
  if (game.isGameOver()) return null;
  const ranked = scoreMoves(game, depth);
  return ranked[0] ?? null;
}

/**
 * Evaluate a position in centipawns from White's perspective using a shallow
 * search (so tactics one or two plies deep are reflected). Positive favors
 * White. Used by the evaluation bar and the coach.
 */
export function evaluatePositionCp(game: Chess, depth = 2): number {
  if (game.isCheckmate()) {
    return game.turn() === "w" ? -MATE_SCORE : MATE_SCORE;
  }
  if (game.isDraw() || game.isStalemate() || game.isThreefoldRepetition()) {
    return 0;
  }
  const ranked = scoreMoves(game, depth);
  if (ranked.length === 0) return 0;
  const bestForMover = ranked[0].score;
  return game.turn() === "w" ? bestForMover : -bestForMover;
}
