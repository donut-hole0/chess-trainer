import { Chess, type Move } from "chess.js";
import { scoreMoves } from "./search";

export type BotLevel = "novice" | "club" | "master";

export interface BotPersonality {
  id: BotLevel;
  name: string;
  elo: number;
  glyph: string;
  tagline: string;
  blurb: string;
  /** Search depth in plies. */
  depth: number;
  /** Probability of deliberately choosing from the weaker pool of moves. */
  mistakeRate: number;
  /**
   * Centipawn tolerance: among moves within this margin of the best, the bot
   * chooses at random, which produces natural, human-like variety.
   */
  tolerance: number;
}

export const PERSONALITIES: Record<BotLevel, BotPersonality> = {
  novice: {
    id: "novice",
    name: "The Novice",
    elo: 400,
    glyph: "♙",
    tagline: "Learning the ropes",
    blurb:
      "Plays on instinct — grabs material when it can and often forgets about defense.",
    depth: 1,
    mistakeRate: 0.5,
    tolerance: 170,
  },
  club: {
    id: "club",
    name: "The Club Player",
    elo: 1200,
    glyph: "♘",
    tagline: "Solid and steady",
    blurb:
      "Sound fundamentals. Punishes loose pieces and obvious blunders, but misses deeper tactics.",
    depth: 2,
    mistakeRate: 0.1,
    tolerance: 40,
  },
  master: {
    id: "master",
    name: "The Master",
    elo: 2000,
    glyph: "♕",
    tagline: "Sharp and unforgiving",
    blurb:
      "Calculates several moves ahead and rarely hands you a free gift. Bring your best.",
    depth: 3,
    mistakeRate: 0.02,
    tolerance: 10,
  },
};

export const PERSONALITY_LIST: BotPersonality[] = [
  PERSONALITIES.novice,
  PERSONALITIES.club,
  PERSONALITIES.master,
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Choose the bot's reply for the current position. Strength is shaped by search
 * depth, an occasional dip into weaker moves, and a tolerance window that lets
 * the bot vary between roughly-equal moves so it never feels robotic.
 */
export function getBotMove(game: Chess, p: BotPersonality): Move | null {
  if (game.isGameOver()) return null;

  const ranked = scoreMoves(game, p.depth);
  if (ranked.length === 0) return null;
  if (ranked.length === 1) return ranked[0].move;

  // Occasionally play a deliberately weaker move (more often for the Novice).
  if (Math.random() < p.mistakeRate) {
    const weakerHalf = ranked.slice(Math.max(1, Math.floor(ranked.length / 2)));
    return pick(weakerHalf.length ? weakerHalf : ranked).move;
  }

  // Otherwise pick at random among moves close to the best.
  const best = ranked[0].score;
  const pool = ranked.filter((r) => best - r.score <= p.tolerance);
  return pick(pool.length ? pool : [ranked[0]]).move;
}
