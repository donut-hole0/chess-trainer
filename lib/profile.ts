"use client";

import { useCallback } from "react";
import { useLocalStorage } from "./storage";

export interface Profile {
  elo: number;
  gamesPlayed: number;
  puzzlesSolved: number;
  /** Best Puzzle Rush score (solves in three minutes). */
  bestRush: number;
  /** Longest Puzzle Streak (consecutive solves without a miss). */
  bestStreak: number;
  /** Highest game-review accuracy the player has recorded, as a percentage. */
  bestAccuracy: number;
}

export const DEFAULT_PROFILE: Profile = {
  elo: 1200,
  gamesPlayed: 0,
  puzzlesSolved: 0,
  bestRush: 0,
  bestStreak: 0,
  bestAccuracy: 0,
};

/**
 * The player's persistent profile. Elo defaults to 1200 — the canonical
 * starting rating — and the recorders below let any module bump a stat without
 * knowing how the profile is stored.
 */
export function useProfile() {
  const [profile, setProfile] = useLocalStorage<Profile>(
    "profile",
    DEFAULT_PROFILE
  );

  const setElo = useCallback(
    (elo: number) => setProfile((p) => ({ ...p, elo: Math.round(elo) })),
    [setProfile]
  );

  const recordPuzzleSolved = useCallback(
    () => setProfile((p) => ({ ...p, puzzlesSolved: p.puzzlesSolved + 1 })),
    [setProfile]
  );

  const recordRush = useCallback(
    (score: number) =>
      setProfile((p) => ({ ...p, bestRush: Math.max(p.bestRush, score) })),
    [setProfile]
  );

  const recordStreak = useCallback(
    (streak: number) =>
      setProfile((p) => ({ ...p, bestStreak: Math.max(p.bestStreak, streak) })),
    [setProfile]
  );

  const recordAccuracy = useCallback(
    (accuracy: number) =>
      setProfile((p) => ({
        ...p,
        bestAccuracy: Math.max(p.bestAccuracy, Math.round(accuracy * 10) / 10),
      })),
    [setProfile]
  );

  return {
    profile,
    setProfile,
    setElo,
    recordPuzzleSolved,
    recordRush,
    recordStreak,
    recordAccuracy,
  };
}
