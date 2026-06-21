import { Chess } from "chess.js";
import { readStore, writeStore } from "./storage";

export interface OpeningNode {
  /** SAN move that reaches this node from its parent position. */
  san: string;
  comment?: string;
  children: OpeningNode[];
}

export interface Repertoire {
  id: string;
  name: string;
  /** The side the student trains and plays in the drill. */
  color: "white" | "black";
  eco?: string;
  description: string;
  /** First moves from the initial position (the root's children). */
  line: OpeningNode[];
  /** Set when the repertoire is a single saved position rather than a line. */
  startFen?: string;
  custom?: boolean;
}

// Concise node builder keeps the trees readable.
function n(san: string, children: OpeningNode[] = [], comment?: string): OpeningNode {
  return { san, children, comment };
}

const RUY_LOPEZ: Repertoire = {
  id: "ruy-lopez",
  name: "The Ruy Lopez",
  color: "white",
  eco: "C60–C99",
  description:
    "The Spanish Game — 1.e4 e5 2.Nf3 Nc6 3.Bb5. Quiet pressure on e5 that builds into a deep positional squeeze. Covers the Morphy, Berlin, and Steinitz defenses.",
  line: [
    n("e4", [
      n("e5", [
        n("Nf3", [
          n("Nc6", [
            n("Bb5", [
              n(
                "a6",
                [
                  n("Ba4", [
                    n("Nf6", [
                      n("O-O", [
                        n("Be7", [
                          n("Re1", [
                            n("b5", [
                              n("Bb3", [
                                n("d6", [
                                  n("c3", [
                                    n("O-O", [], "The Closed Ruy — the main tabiya."),
                                  ]),
                                ]),
                              ]),
                            ]),
                          ]),
                        ]),
                      ]),
                    ]),
                  ]),
                ],
                "The Morphy Defense — by far the most common."
              ),
              n(
                "Nf6",
                [
                  n("O-O", [
                    n("Nxe4", [
                      n("d4", [
                        n("Nd6", [
                          n("Bxc6", [
                            n("dxc6", [
                              n("dxe5", [
                                n("Nf5", [
                                  n("Qxd8+", [
                                    n("Kxd8", [], "The Berlin endgame."),
                                  ]),
                                ]),
                              ]),
                            ]),
                          ]),
                        ]),
                      ]),
                    ]),
                  ]),
                ],
                "The Berlin Defense — Kramnik's wall."
              ),
              n(
                "d6",
                [
                  n("d4", [
                    n("exd4", [n("Nxd4", [], "The Steinitz Defense.")]),
                  ]),
                ],
                "The Steinitz Defense."
              ),
            ], "The Ruy Lopez (Spanish)."),
          ]),
        ]),
      ]),
    ]),
  ],
};

const CARO_KANN: Repertoire = {
  id: "caro-kann",
  name: "The Caro-Kann Defense",
  color: "black",
  eco: "B10–B19",
  description:
    "A rock-solid answer to 1.e4 — 1...c6 followed by ...d5. Black builds a sound structure and untangles smoothly. Covers the Classical, Advance, and Exchange variations.",
  line: [
    n("e4", [
      n("c6", [
        n("d4", [
          n("d5", [
            n(
              "Nc3",
              [
                n("dxe4", [
                  n("Nxe4", [
                    n("Bf5", [
                      n("Ng3", [
                        n("Bg6", [
                          n("h4", [
                            n("h6", [
                              n("Nf3", [
                                n("Nd7", [], "Classical Caro-Kann main line."),
                              ]),
                            ]),
                          ]),
                        ]),
                      ]),
                    ]),
                  ]),
                ]),
              ],
              "The Classical variation."
            ),
            n(
              "e5",
              [
                n("Bf5", [
                  n("Nf3", [
                    n("e6", [
                      n("Be2", [
                        n("c5", [], "Advance variation — strike at the base."),
                      ]),
                    ]),
                  ]),
                ]),
              ],
              "The Advance variation."
            ),
            n(
              "exd5",
              [
                n("cxd5", [
                  n("Bd3", [
                    n("Nc6", [
                      n("c3", [n("Nf6", [], "Exchange variation.")]),
                    ]),
                  ]),
                ]),
              ],
              "The Exchange variation."
            ),
          ]),
        ]),
      ]),
    ]),
  ],
};

export const MASTER_REPERTOIRES: Repertoire[] = [RUY_LOPEZ, CARO_KANN];

export function colorChar(r: Repertoire): "w" | "b" {
  return r.color === "white" ? "w" : "b";
}

/** The SAN sequence for a path of child-indices from the root. */
export function sansForPath(rep: Repertoire, path: number[]): string[] {
  const sans: string[] = [];
  let children = rep.line;
  for (const idx of path) {
    const node = children[idx];
    if (!node) break;
    sans.push(node.san);
    children = node.children;
  }
  return sans;
}

/** Build a FEN by replaying SAN moves from the standard start (or startFen). */
export function fenForSans(sans: string[], startFen?: string): string {
  const game = startFen ? new Chess(startFen) : new Chess();
  for (const san of sans) {
    try {
      game.move(san);
    } catch {
      break;
    }
  }
  return game.fen();
}

/** Parse a PGN into a single linear repertoire line (mainline only). */
export function buildLineFromPgn(pgn: string): OpeningNode[] | null {
  const game = new Chess();
  try {
    game.loadPgn(pgn);
  } catch {
    return null;
  }
  const sans = game.history();
  if (sans.length === 0) return null;
  // Fold the flat list into a single nested chain.
  let head: OpeningNode | null = null;
  for (let i = sans.length - 1; i >= 0; i--) {
    head = n(sans[i], head ? [head] : []);
  }
  return head ? [head] : null;
}

// --- Custom repertoires (localStorage) ---

const CUSTOM_KEY = "repertoires";

export function readCustomRepertoires(): Repertoire[] {
  return readStore<Repertoire[]>(CUSTOM_KEY, []);
}

export function saveCustomRepertoire(rep: Repertoire): void {
  const all = readCustomRepertoires();
  const next = [...all.filter((r) => r.id !== rep.id), rep];
  writeStore(CUSTOM_KEY, next);
}

export function deleteCustomRepertoire(id: string): void {
  writeStore(
    CUSTOM_KEY,
    readCustomRepertoires().filter((r) => r.id !== id)
  );
}

/**
 * Create a custom repertoire from pasted PGN or FEN. PGN becomes a drillable
 * line; a bare FEN becomes a saved position to explore.
 */
export function createCustomRepertoire(
  name: string,
  color: "white" | "black",
  text: string
): Repertoire | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const id = `custom-${Date.now().toString(36)}`;

  const line = buildLineFromPgn(trimmed);
  if (line) {
    return {
      id,
      name: name.trim() || "Custom line",
      color,
      description: "A custom line you imported.",
      line,
      custom: true,
    };
  }

  // Fall back to treating the text as a FEN.
  try {
    const game = new Chess(trimmed);
    return {
      id,
      name: name.trim() || "Custom position",
      color,
      description: "A custom position you saved.",
      line: [],
      startFen: game.fen(),
      custom: true,
    };
  } catch {
    return null;
  }
}
