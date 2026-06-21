// Tactics puzzles. Every position and solution here is verified legal and
// correct by scripts/build-puzzles.mjs (run against chess.js). All current
// puzzles are mate-in-one across a spread of classic mating motifs.

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
