// Discovery + validation for puzzle data. Run with: node scripts/build-puzzles.mjs
// For each candidate position it finds a forced mate-in-1 (or validates a given
// line), so the shipped puzzles are guaranteed legal and correct.
import { Chess } from "chess.js";

// Candidate positions believed to contain a mate in 1.
const mate1Candidates = [
  { id: "back-rank-rook", fen: "6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1", theme: "Back-rank mate" },
  { id: "king-and-rook", fen: "5k2/8/5K2/8/8/8/8/7R w - - 0 1", theme: "King-and-rook mate" },
  { id: "smothered", fen: "6rk/6pp/7N/8/8/8/8/6K1 w - - 0 1", theme: "Smothered mate" },
  { id: "two-rooks", fen: "4k3/R7/1R6/8/8/8/8/6K1 w - - 0 1", theme: "Ladder mate" },
  { id: "corner-queen", fen: "7k/5Q2/6K1/8/8/8/8/8 w - - 0 1", theme: "Queen mate" },
  { id: "queen-shoulder", fen: "6k1/8/6K1/8/8/8/8/1Q6 w - - 0 1", theme: "Queen-and-king mate" },
  { id: "queen-back-rank", fen: "7k/6pp/8/8/8/8/8/4Q2K w - - 0 1", theme: "Back-rank mate" },
  { id: "back-rank-black", fen: "3r2k1/5ppp/8/8/8/8/5PPP/6K1 b - - 0 1", theme: "Back-rank mate" },
];

function findMateInOne(fen) {
  const game = new Chess(fen);
  const found = [];
  for (const m of game.moves({ verbose: true })) {
    game.move(m);
    if (game.isCheckmate()) found.push(m.san);
    game.undo();
  }
  return found;
}

console.log("=== MATE IN 1 ===");
const mateResults = [];
for (const c of mate1Candidates) {
  let mates = [];
  let legal = true;
  try {
    mates = findMateInOne(c.fen);
  } catch (e) {
    legal = false;
    console.log(`${c.id}: INVALID FEN (${e.message})`);
    continue;
  }
  if (mates.length === 0) {
    console.log(`${c.id}: NO MATE FOUND`);
  } else {
    console.log(`${c.id}: ${mates.join(", ")}`);
    mateResults.push({ ...c, solution: [mates[0]] });
  }
}

console.log(`\nValidated ${mateResults.length} mate-in-1 puzzles.`);
