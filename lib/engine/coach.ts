import { Chess, type Color, type PieceSymbol, type Square } from "chess.js";
import { evaluatePositionCp, scoreMoves } from "./search";
import { materialBalance } from "./evaluate";

const PIECE_NAME: Record<PieceSymbol, string> = {
  p: "pawn",
  n: "knight",
  b: "bishop",
  r: "rook",
  q: "queen",
  k: "king",
};

const PIECE_RANK: Record<PieceSymbol, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 99,
};

export type MoveQuality =
  | "best"
  | "good"
  | "inaccuracy"
  | "mistake"
  | "blunder";

export interface PositionReport {
  /** Centipawns from White's perspective. */
  evalCp: number;
  headline: string;
  points: string[];
  bestMoveSan: string | null;
}

export interface MoveReport {
  quality: MoveQuality;
  label: string;
  headline: string;
  points: string[];
  bestMoveSan: string | null;
  evalCpAfter: number;
}

function other(color: Color): Color {
  return color === "w" ? "b" : "w";
}

function sideName(color: Color): string {
  return color === "w" ? "White" : "Black";
}

/** Pieces of `color` that are attacked by the opponent and undefended. */
function hangingPieces(
  game: Chess,
  color: Color
): { square: Square; type: PieceSymbol }[] {
  const opp = other(color);
  const out: { square: Square; type: PieceSymbol }[] = [];
  for (const row of game.board()) {
    for (const piece of row) {
      if (!piece || piece.color !== color || piece.type === "k") continue;
      const attacked = game.isAttacked(piece.square, opp);
      const defended = game.isAttacked(piece.square, color);
      if (attacked && !defended) {
        out.push({ square: piece.square, type: piece.type });
      }
    }
  }
  // Most valuable first — that's what matters most.
  return out.sort((a, b) => PIECE_RANK[b.type] - PIECE_RANK[a.type]);
}

/** Describe the material situation in plain words, or null if roughly even. */
function materialPhrase(game: Chess): string | null {
  const counts: Record<Color, Record<PieceSymbol, number>> = {
    w: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 },
    b: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 },
  };
  for (const row of game.board()) {
    for (const piece of row) {
      if (piece) counts[piece.color][piece.type] += 1;
    }
  }

  const order: PieceSymbol[] = ["q", "r", "b", "n", "p"];
  const leaderIsWhite = materialBalance(game) > 0;
  const leader: Color = leaderIsWhite ? "w" : "b";
  const trailer = other(leader);

  const gains: string[] = [];
  for (const t of order) {
    const diff = counts[leader][t] - counts[trailer][t];
    if (diff > 0) {
      const name = PIECE_NAME[t];
      gains.push(diff === 1 ? `a ${name}` : `${diff} ${name}s`);
    }
  }
  if (gains.length === 0) return null;

  const list =
    gains.length === 1
      ? gains[0]
      : gains.slice(0, -1).join(", ") + " and " + gains[gains.length - 1];
  return `${sideName(leader)} is up ${list}`;
}

/** Turn a White-perspective centipawn score into an assessment phrase. */
function assessmentPhrase(cp: number): string {
  const abs = Math.abs(cp);
  if (abs < 40) return "The position is roughly balanced.";
  const side = cp > 0 ? "White" : "Black";
  if (abs < 120) return `${side} stands a touch better.`;
  if (abs < 320) return `${side} has a clear advantage.`;
  if (abs < 800) return `${side} is winning.`;
  return `${side} has a decisive, game-ending advantage.`;
}

function qualityFromLoss(loss: number): { quality: MoveQuality; label: string } {
  if (loss <= 20) return { quality: "best", label: "Best move" };
  if (loss <= 60) return { quality: "good", label: "A good move" };
  if (loss <= 150) return { quality: "inaccuracy", label: "Inaccuracy" };
  if (loss <= 350) return { quality: "mistake", label: "Mistake" };
  return { quality: "blunder", label: "Blunder" };
}

/**
 * A grounded, plain-English read of the current position: who stands better,
 * the material count, any pieces hanging right now, and the engine's pick.
 */
export function analyzePosition(fen: string, depth = 2): PositionReport {
  const game = new Chess(fen);
  const points: string[] = [];

  if (game.isCheckmate()) {
    return {
      evalCp: game.turn() === "w" ? -100000 : 100000,
      headline: `Checkmate — ${sideName(other(game.turn()))} wins.`,
      points: ["There are no legal moves and the king is in check."],
      bestMoveSan: null,
    };
  }
  if (game.isStalemate()) {
    return {
      evalCp: 0,
      headline: "Stalemate — the game is drawn.",
      points: ["The side to move has no legal moves but is not in check."],
      bestMoveSan: null,
    };
  }
  if (game.isDraw()) {
    return {
      evalCp: 0,
      headline: "This position is a draw.",
      points: ["Insufficient material or the draw rules have been met."],
      bestMoveSan: null,
    };
  }

  const evalCp = evaluatePositionCp(game, depth);
  const toMove = game.turn();

  const material = materialPhrase(game);
  if (material) points.push(`${material}.`);

  if (game.isCheck()) {
    points.push(`${sideName(toMove)} is in check and must respond.`);
  }

  // Your hanging pieces (the side to move).
  const yourHanging = hangingPieces(game, toMove);
  if (yourHanging.length > 0) {
    const p = yourHanging[0];
    points.push(
      `Your ${PIECE_NAME[p.type]} on ${p.square} is undefended and under attack — tend to it.`
    );
  }

  // Opponent's hanging pieces you might grab.
  const theirHanging = hangingPieces(game, other(toMove));
  if (theirHanging.length > 0) {
    const p = theirHanging[0];
    points.push(
      `The ${sideName(other(toMove))} ${PIECE_NAME[p.type]} on ${p.square} is loose — look for a way to win it.`
    );
  }

  const ranked = scoreMoves(game, depth);
  const bestMoveSan = ranked[0]?.move.san ?? null;
  if (bestMoveSan) {
    points.push(`The engine likes ${bestMoveSan} here.`);
  }

  if (points.length === 0) {
    points.push("Nothing is hanging; it's a quiet, maneuvering position.");
  }

  return {
    evalCp,
    headline: assessmentPhrase(evalCp),
    points,
    bestMoveSan,
  };
}

/**
 * Evaluate a single move in human terms: was it sound, what did it cost, and
 * did it leave anything hanging. `fenBefore` is the position before the move.
 */
export function analyzeMove(
  fenBefore: string,
  move: { from: string; to: string; promotion?: string },
  depth = 2
): MoveReport | null {
  const before = new Chess(fenBefore);
  const mover = before.turn();

  const ranked = scoreMoves(before, depth);
  if (ranked.length === 0) return null;

  const played = ranked.find(
    (r) =>
      r.move.from === move.from &&
      r.move.to === move.to &&
      (r.move.promotion ?? "") === (move.promotion ?? "")
  );
  if (!played) return null;

  const bestScore = ranked[0].score;
  const loss = Math.max(0, bestScore - played.score);
  const { quality, label } = qualityFromLoss(loss);

  // Apply the move to inspect the resulting position.
  const after = new Chess(fenBefore);
  const result = after.move(move);
  const evalCpAfter = evaluatePositionCp(after, depth);

  const points: string[] = [];

  if (result.captured) {
    points.push(
      `Captures the ${PIECE_NAME[result.captured as PieceSymbol]} on ${result.to}.`
    );
  }
  if (after.isCheckmate()) {
    points.push("Checkmate. Game over.");
  } else if (after.isCheck()) {
    points.push(`Delivers check to the ${sideName(mover === "w" ? "b" : "w")} king.`);
  }

  // What did the move leave hanging for the mover? Compare to before.
  const hangingAfter = hangingPieces(after, mover);
  const movedPieceHanging = hangingAfter.find((h) => h.square === result.to);
  const otherHanging = hangingAfter.filter((h) => h.square !== result.to);

  if (movedPieceHanging) {
    points.push(
      `The ${PIECE_NAME[movedPieceHanging.type]} lands on ${result.to}, where it can be taken for free.`
    );
  }
  if (otherHanging.length > 0) {
    const h = otherHanging[0];
    points.push(
      `This leaves your ${PIECE_NAME[h.type]} on ${h.square} undefended.`
    );
  }

  const bestMoveSan = ranked[0].move.san;
  const playedBest = played === ranked[0];

  if (!playedBest && (quality === "mistake" || quality === "blunder")) {
    points.push(`${bestMoveSan} was stronger — it keeps the initiative without conceding material.`);
  } else if (!playedBest && quality === "inaccuracy") {
    points.push(`${bestMoveSan} was a touch more precise.`);
  }

  let headline: string;
  switch (quality) {
    case "best":
      headline = `${result.san} — the strongest move on the board.`;
      break;
    case "good":
      headline = `${result.san} is a sound, healthy move.`;
      break;
    case "inaccuracy":
      headline = `${result.san} is playable, but not the most accurate.`;
      break;
    case "mistake":
      headline = `${result.san} is a mistake that hands back some of your advantage.`;
      break;
    default:
      headline = `${result.san} is a serious blunder.`;
      break;
  }

  if (points.length === 0) {
    points.push("A clean developing move with no downside.");
  }

  return {
    quality,
    label,
    headline,
    points,
    bestMoveSan,
    evalCpAfter,
  };
}
