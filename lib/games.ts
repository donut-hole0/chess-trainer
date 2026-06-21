import { Chess } from "chess.js";
import { readStore, writeStore } from "./storage";

export type GameSource = "lichess" | "chesscom" | "manual";

export interface ImportedGame {
  id: string;
  source: GameSource;
  white: string;
  black: string;
  result: string;
  date: string;
  pgn: string;
}

const KEY = "games";
const MAX_STORED = 60;

export function readGames(): ImportedGame[] {
  return readStore<ImportedGame[]>(KEY, []);
}

/** Merge new games in (newest first), de-duplicating by PGN, capped in size. */
export function addGames(games: ImportedGame[]): ImportedGame[] {
  const existing = readGames();
  const seen = new Set(existing.map((g) => g.pgn));
  const fresh = games.filter((g) => !seen.has(g.pgn));
  const next = [...fresh, ...existing].slice(0, MAX_STORED);
  writeStore(KEY, next);
  return next;
}

export function clearGames(): void {
  writeStore(KEY, []);
}

/** Split a multi-game PGN export into individual game strings. */
export function splitPgns(text: string): string[] {
  return text
    .split(/\n\n(?=\[Event\b)/i)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function toImportedGame(pgn: string, source: GameSource): ImportedGame | null {
  let white = "White";
  let black = "Black";
  let result = "*";
  let date = "";
  try {
    const c = new Chess();
    c.loadPgn(pgn);
    if (c.history().length === 0) return null;
    const h = c.header();
    white = h.White || white;
    black = h.Black || black;
    result = h.Result || result;
    date = h.UTCDate || h.Date || "";
  } catch {
    return null;
  }
  return {
    id: `${source}-${Math.random().toString(36).slice(2, 9)}`,
    source,
    white,
    black,
    result,
    date,
    pgn,
  };
}

/** Convert a PGN into a SAN line plus an optional non-standard start FEN. */
export function pgnToLine(
  pgn: string
): { sans: string[]; startFen?: string } | null {
  try {
    const c = new Chess();
    c.loadPgn(pgn);
    const sans = c.history();
    if (sans.length === 0) return null;
    const h = c.header();
    return { sans, startFen: h.FEN || h.Fen || undefined };
  } catch {
    return null;
  }
}

/** Recent games for a Lichess user, newest first. Runs against the public API. */
export async function fetchLichessGames(
  username: string,
  max = 10
): Promise<ImportedGame[]> {
  const user = username.trim();
  if (!user) throw new Error("Enter a Lichess username.");
  const res = await fetch(
    `https://lichess.org/api/games/user/${encodeURIComponent(user)}?max=${max}`,
    { headers: { Accept: "application/x-chess-pgn" } }
  );
  if (res.status === 404) throw new Error(`No Lichess user “${user}”.`);
  if (!res.ok) throw new Error(`Lichess request failed (${res.status}).`);
  const text = await res.text();
  const games = splitPgns(text)
    .map((p) => toImportedGame(p, "lichess"))
    .filter((g): g is ImportedGame => g !== null);
  if (games.length === 0) throw new Error("No games found for that user.");
  return games;
}

/** Recent games for a Chess.com user, newest first. Uses the public archives. */
export async function fetchChessComGames(
  username: string,
  max = 10
): Promise<ImportedGame[]> {
  const user = username.trim().toLowerCase();
  if (!user) throw new Error("Enter a Chess.com username.");
  const archRes = await fetch(
    `https://api.chess.com/pub/player/${encodeURIComponent(user)}/games/archives`
  );
  if (archRes.status === 404) throw new Error(`No Chess.com user “${user}”.`);
  if (!archRes.ok) throw new Error(`Chess.com request failed (${archRes.status}).`);
  const { archives } = (await archRes.json()) as { archives?: string[] };
  if (!archives || archives.length === 0)
    throw new Error("That user has no archived games.");

  const lastUrl = archives[archives.length - 1];
  const gamesRes = await fetch(lastUrl);
  if (!gamesRes.ok) throw new Error(`Chess.com request failed (${gamesRes.status}).`);
  const data = (await gamesRes.json()) as { games?: { pgn?: string }[] };
  const list = (data.games ?? [])
    .filter((g) => typeof g.pgn === "string")
    .slice(-max)
    .reverse();
  const games = list
    .map((g) => toImportedGame(g.pgn as string, "chesscom"))
    .filter((g): g is ImportedGame => g !== null);
  if (games.length === 0) throw new Error("No playable games in the latest archive.");
  return games;
}
