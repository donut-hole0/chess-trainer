import { Chess, type Move, type PieceSymbol, type Square } from "chess.js";
import { scoreMoves } from "./search";
import { PIECE_VALUE } from "./evaluate";
import { attackersOf } from "./attacks";

export type ReviewQuality =
  | "brilliant"
  | "great"
  | "best"
  | "good"
  | "inaccuracy"
  | "mistake"
  | "blunder";

export const QUALITY_META: Record<
  ReviewQuality,
  { symbol: string; label: string }
> = {
  brilliant: { symbol: "!!", label: "Brilliant" },
  great: { symbol: "!", label: "Great" },
  best: { symbol: "✓", label: "Best" },
  good: { symbol: "", label: "Good" },
  inaccuracy: { symbol: "?!", label: "Inaccuracy" },
  mistake: { symbol: "?", label: "Mistake" },
  blunder: { symbol: "??", label: "Blunder" },
};

export interface ReviewedMove {
  ply: number; // 1-based
  moveNumber: number; // full move number
  color: "w" | "b";
  san: string;
  from: string;
  to: string;
  fenBefore: string;
  fenAfter: string;
  /** White-perspective centipawns after the move. */
  evalAfter: number;
  bestSan: string;
  quality: ReviewQuality;
  /** Centipawns lost vs. the engine's choice, from the mover's perspective. */
  cpLoss: number;
  /** Win-probability points surrendered by the move. */
  winDrop: number;
}

export interface GameReview {
  moves: ReviewedMove[];
  whiteAccuracy: number;
  blackAccuracy: number;
  /** White-perspective evals at every node, length = plies + 1 (index 0 = start). */
  evals: number[];
  summary: string;
  white: string;
  black: string;
  result: string;
}

/** Lichess win-probability model: centipawns (one side's view) → win %. */
function winPercent(cp: number): number {
  const w = 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * cp)) - 1);
  return Math.max(0, Math.min(100, w));
}

/** Chess.com-style per-move accuracy from the win-probability drop. */
function moveAccuracy(winBefore: number, winAfter: number): number {
  const drop = Math.max(0, winBefore - winAfter);
  const acc = 103.1668 * Math.exp(-0.04354 * drop) - 3.1669;
  return Math.max(0, Math.min(100, acc));
}

function mean(xs: number[]): number {
  if (xs.length === 0) return 100;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function sideName(c: "w" | "b"): string {
  return c === "w" ? "White" : "Black";
}

/**
 * Does this move hand the opponent a real material capture on the landing
 * square — i.e. is it a genuine sacrifice rather than a safe developing move?
 */
function isSacrifice(fenBefore: string, move: Move): boolean {
  const after = new Chess(fenBefore);
  let res: Move;
  try {
    res = after.move({ from: move.from, to: move.to, promotion: move.promotion });
  } catch {
    return false;
  }
  if (!res) return false;
  const movedVal = PIECE_VALUE[res.piece];
  const opp = res.color === "w" ? "b" : "w";
  const target = res.to as Square;
  const attackers = attackersOf(after, target, opp);
  if (attackers.length === 0) return false;
  const defenders = attackersOf(after, target, res.color);
  const capturedVal = res.captured ? PIECE_VALUE[res.captured as PieceSymbol] : 0;
  const exposed = movedVal - capturedVal; // material put at risk
  const winsExchange = defenders.length === 0 || attackers[0].value < movedVal;
  return winsExchange && exposed >= 150;
}

/**
 * Replay a game and grade every move: accuracy per side, a move-by-move quality
 * badge, the evaluation curve, and a plain-English summary of the turning
 * points. `depth` is the search depth used to score each position.
 */
export function reviewGame(pgn: string, depth = 2): GameReview | null {
  const parser = new Chess();
  try {
    parser.loadPgn(pgn);
  } catch {
    return null;
  }

  const headers = parser.header();
  const verbose = parser.history({ verbose: true }) as Move[];
  if (verbose.length === 0) return null;

  const startFen = headers.FEN || headers.Fen;
  const game = startFen ? new Chess(startFen) : new Chess();

  const moves: ReviewedMove[] = [];
  const evals: number[] = [];
  const whiteAcc: number[] = [];
  const blackAcc: number[] = [];

  for (let i = 0; i < verbose.length; i++) {
    const mv = verbose[i];
    const fenBefore = game.fen();
    const mover = game.turn();

    const ranked = scoreMoves(game, depth);
    const best = ranked[0];
    const second = ranked[1];
    const played =
      ranked.find(
        (r) =>
          r.move.from === mv.from &&
          r.move.to === mv.to &&
          (r.move.promotion ?? "") === (mv.promotion ?? "")
      ) ?? best;

    const bestScore = best.score; // mover perspective
    const playedScore = played.score;
    const secondScore = second?.score ?? bestScore;

    if (i === 0) evals.push(mover === "w" ? bestScore : -bestScore);

    // Commit the move and read the resulting position.
    game.move({ from: mv.from, to: mv.to, promotion: mv.promotion });
    const fenAfter = game.fen();
    const evalAfterWhite = mover === "w" ? playedScore : -playedScore;
    evals.push(evalAfterWhite);

    const winBefore = winPercent(bestScore);
    const winAfter = winPercent(playedScore);
    const winDrop = Math.max(0, winBefore - winAfter);
    const cpLoss = Math.max(0, bestScore - playedScore);

    const isBest = played === best;
    const moverOk = playedScore >= -60;
    const brilliant = winDrop < 4 && moverOk && isSacrifice(fenBefore, mv);
    const great =
      !brilliant &&
      isBest &&
      bestScore - secondScore >= 130 &&
      winDrop < 3;

    let quality: ReviewQuality;
    if (brilliant) quality = "brilliant";
    else if (great) quality = "great";
    else if (winDrop < 2) quality = "best";
    else if (winDrop < 5) quality = "good";
    else if (winDrop < 10) quality = "inaccuracy";
    else if (winDrop < 20) quality = "mistake";
    else quality = "blunder";

    (mover === "w" ? whiteAcc : blackAcc).push(
      moveAccuracy(winBefore, winAfter)
    );

    moves.push({
      ply: i + 1,
      moveNumber: Math.floor(i / 2) + 1,
      color: mover,
      san: mv.san,
      from: mv.from,
      to: mv.to,
      fenBefore,
      fenAfter,
      evalAfter: evalAfterWhite,
      bestSan: best.move.san,
      quality,
      cpLoss,
      winDrop,
    });
  }

  const whiteAccuracy = Math.round(mean(whiteAcc) * 10) / 10;
  const blackAccuracy = Math.round(mean(blackAcc) * 10) / 10;

  return {
    moves,
    whiteAccuracy,
    blackAccuracy,
    evals,
    summary: buildSummary(moves, whiteAccuracy, blackAccuracy, evals),
    white: headers.White || "White",
    black: headers.Black || "Black",
    result: headers.Result || resultFromFen(game),
  };
}

function resultFromFen(game: Chess): string {
  if (game.isCheckmate()) return game.turn() === "w" ? "0-1" : "1-0";
  if (game.isDraw() || game.isStalemate()) return "1/2-1/2";
  return "*";
}

/** Compose a short, grounded read of how the game went. */
function buildSummary(
  moves: ReviewedMove[],
  whiteAcc: number,
  blackAcc: number,
  evals: number[]
): string {
  const parts: string[] = [];

  const sharper = whiteAcc >= blackAcc ? "White" : "Black";
  const gap = Math.abs(whiteAcc - blackAcc);
  if (gap < 3) {
    parts.push(
      `A closely-matched game — both sides played with comparable precision (${whiteAcc}% vs ${blackAcc}%).`
    );
  } else {
    parts.push(
      `${sharper} was the more accurate side (${Math.max(whiteAcc, blackAcc)}% to ${Math.min(whiteAcc, blackAcc)}%).`
    );
  }

  // The single most damaging move decides the turning point.
  const worst = [...moves]
    .filter((m) => m.quality === "blunder" || m.quality === "mistake")
    .sort((a, b) => b.winDrop - a.winDrop)[0];

  if (worst) {
    const tag = worst.quality === "blunder" ? "a blunder" : "a costly slip";
    parts.push(
      `The game turned on move ${worst.moveNumber} — ${sideName(worst.color)}'s ${worst.san} was ${tag}; ${worst.bestSan} was the move.`
    );
  } else {
    parts.push(
      "Neither side handed over a decisive advantage — it stayed a genuine fight throughout."
    );
  }

  // Closing read from the final evaluation.
  const final = evals[evals.length - 1];
  const abs = Math.abs(final);
  if (abs >= 100000) {
    parts.push(`${final > 0 ? "White" : "Black"} finished with mate.`);
  } else if (abs < 60) {
    parts.push("By the end the position had levelled out.");
  } else {
    const side = final > 0 ? "White" : "Black";
    parts.push(`The final position favored ${side} by about ${(abs / 100).toFixed(1)} pawns.`);
  }

  return parts.join(" ");
}

// A couple of complete games so Game Review always has something to chew on.
export const SAMPLE_GAMES: { label: string; pgn: string }[] = [
  {
    label: "Morphy — Opera Game (1858)",
    pgn: `[White "Paul Morphy"]
[Black "Duke / Count"]
[Result "1-0"]

1. e4 e5 2. Nf3 d6 3. d4 Bg4 4. dxe5 Bxf3 5. Qxf3 dxe5 6. Bc4 Nf6 7. Qb3 Qe7 8. Nc3 c6 9. Bg5 b5 10. Nxb5 cxb5 11. Bxb5+ Nbd7 12. O-O-O Rd8 13. Rxd7 Rxd7 14. Rd1 Qe6 15. Bxd7+ Nxd7 16. Qb8+ Nxb8 17. Rd8# 1-0`,
  },
  {
    label: "Scholar's Mate (trap)",
    pgn: `[White "Trap"]
[Black "Victim"]
[Result "1-0"]

1. e4 e5 2. Bc4 Nc6 3. Qh5 Nf6 4. Qxf7# 1-0`,
  },
];
