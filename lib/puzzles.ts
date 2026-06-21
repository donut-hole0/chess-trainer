// Tactics puzzles. Every position and solution here is verified legal and
// correct by scripts/build-puzzles.mjs (run against chess.js). All current
// puzzles are mate-in-one across a spread of classic mating motifs.

import { Chess } from "chess.js";

export type PuzzleGoal = "mate";

export interface Puzzle {
  id: string;
  title: string;
  /** Starting position. The side to move is the solver. */
  fen: string;
  /** Canonical solution line in SAN (used for hints and "show solution"). */
  solution: string[];
  theme: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  /** Win condition. For "mate", any move that delivers checkmate solves it. */
  goal: PuzzleGoal;
  prompt: string;
}

export const PUZZLES: Puzzle[] = [
  {
    id: "back-rank-rook",
    title: "The Back Rank",
    fen: "6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1",
    solution: ["Rd8#"],
    theme: "Back-rank mate",
    difficulty: "Beginner",
    goal: "mate",
    prompt: "White to move. The enemy king is hemmed in by its own pawns — find mate in one.",
  },
  {
    id: "king-and-rook",
    title: "Driven to the Edge",
    fen: "5k2/8/5K2/8/8/8/8/7R w - - 0 1",
    solution: ["Rh8#"],
    theme: "King-and-rook mate",
    difficulty: "Beginner",
    goal: "mate",
    prompt: "White to move. With the kings facing off, the rook lands the blow. Mate in one.",
  },
  {
    id: "two-rooks",
    title: "The Rook Ladder",
    fen: "4k3/R7/1R6/8/8/8/8/6K1 w - - 0 1",
    solution: ["Rb8#"],
    theme: "Ladder mate",
    difficulty: "Beginner",
    goal: "mate",
    prompt: "White to move. Two rooks weave a net around the king. Mate in one.",
  },
  {
    id: "queen-back-rank",
    title: "Queen on the Eighth",
    fen: "7k/6pp/8/8/8/8/8/4Q2K w - - 0 1",
    solution: ["Qe8#"],
    theme: "Back-rank mate",
    difficulty: "Beginner",
    goal: "mate",
    prompt: "White to move and mate down the open back rank.",
  },
  {
    id: "back-rank-black",
    title: "Black Strikes Back",
    fen: "3r2k1/5ppp/8/8/8/8/5PPP/6K1 b - - 0 1",
    solution: ["Rd1#"],
    theme: "Back-rank mate",
    difficulty: "Beginner",
    goal: "mate",
    prompt: "Black to move. White neglected its back rank. Punish it — mate in one.",
  },
  {
    id: "corner-queen",
    title: "Cornered",
    fen: "7k/5Q2/6K1/8/8/8/8/8 w - - 0 1",
    solution: ["Qg7#"],
    theme: "Queen mate",
    difficulty: "Intermediate",
    goal: "mate",
    prompt: "White to move. The king is in the corner and the queen is supported. Finish it.",
  },
  {
    id: "queen-shoulder",
    title: "Shoulder to Shoulder",
    fen: "6k1/8/6K1/8/8/8/8/1Q6 w - - 0 1",
    solution: ["Qb8#"],
    theme: "Queen-and-king mate",
    difficulty: "Intermediate",
    goal: "mate",
    prompt: "White to move. The king cuts off the escape; the queen delivers. Mate in one.",
  },
  {
    id: "smothered",
    title: "Smothered",
    fen: "6rk/6pp/7N/8/8/8/8/6K1 w - - 0 1",
    solution: ["Nf7#"],
    theme: "Smothered mate",
    difficulty: "Intermediate",
    goal: "mate",
    prompt: "White to move. The king has boxed itself in behind its own pieces. Mate in one.",
  },
];

/** "white" | "black" — which side the solver plays in a puzzle. */
export function puzzleSide(p: Puzzle): "white" | "black" {
  return p.fen.split(" ")[1] === "b" ? "black" : "white";
}

/**
 * Judge a candidate move against a puzzle. "illegal" means it wasn't even a
 * legal move; "wrong" means legal but not the solution; "correct" solves it.
 */
export function checkPuzzleMove(
  p: Puzzle,
  from: string,
  to: string,
  promotion?: string
): "correct" | "wrong" | "illegal" {
  const g = new Chess(p.fen);
  let mv;
  try {
    mv = g.move({ from, to, promotion });
  } catch {
    return "illegal";
  }
  if (!mv) return "illegal";
  const ok = p.goal === "mate" ? g.isCheckmate() : mv.san === p.solution[0];
  return ok ? "correct" : "wrong";
}

/** Deterministic puzzle of the day, stable for a given calendar date. */
export function dailyPuzzle(date = new Date()): Puzzle {
  const dayIndex = Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000
  );
  return PUZZLES[dayIndex % PUZZLES.length];
}

/** A reshuffled, repeating queue of puzzles for the timed/streak modes. */
export function puzzleQueue(length: number, seed = Date.now()): Puzzle[] {
  const pool = [...PUZZLES];
  // Fisher-Yates with a tiny seeded PRNG so a run is reproducible if needed.
  let s = seed % 2147483647;
  const rand = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const out: Puzzle[] = [];
  for (let i = 0; i < length; i++) out.push(pool[i % pool.length]);
  return out;
}
