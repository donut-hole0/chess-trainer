import { Chess, type PieceSymbol, type Color, type Square } from "chess.js";
import { PIECE_VALUE } from "./evaluate";

// chess.js doesn't export the `board()` return shape, so name it locally.
type Board = ({ square: Square; type: PieceSymbol; color: Color } | null)[][];

// chess.js `board()` is indexed [row][col] with row 0 = rank 8, col 0 = file a.
const FILES = "abcdefgh";

function toSquare(r: number, c: number): Square {
  return `${FILES[c]}${8 - r}` as Square;
}

const KNIGHT_D = [
  [-2, -1], [-2, 1], [-1, -2], [-1, 2],
  [1, -2], [1, 2], [2, -1], [2, 1],
];
const KING_D = [
  [-1, -1], [-1, 0], [-1, 1], [0, -1],
  [0, 1], [1, -1], [1, 0], [1, 1],
];
const BISHOP_D = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
const ROOK_D = [[-1, 0], [1, 0], [0, -1], [0, 1]];

export interface Control {
  /** Number of White pieces bearing on the square (attack or defense). */
  w: number;
  /** Number of Black pieces bearing on the square. */
  b: number;
}

/** True if all squares strictly between (r,c) and (tr,tc) on a line are empty. */
function pathClear(
  board: Board,
  r: number,
  c: number,
  tr: number,
  tc: number
): boolean {
  const dr = Math.sign(tr - r);
  const dc = Math.sign(tc - c);
  let nr = r + dr;
  let nc = c + dc;
  while (nr !== tr || nc !== tc) {
    if (board[nr][nc]) return false;
    nr += dr;
    nc += dc;
  }
  return true;
}

/** Does the piece at (r,c) bear on the target square (tr,tc)? */
function pieceAttacks(
  board: Board,
  r: number,
  c: number,
  type: PieceSymbol,
  color: Color,
  tr: number,
  tc: number
): boolean {
  const dr = tr - r;
  const dc = tc - c;
  if (dr === 0 && dc === 0) return false;
  switch (type) {
    case "p": {
      const fwd = color === "w" ? -1 : 1;
      return dr === fwd && Math.abs(dc) === 1;
    }
    case "n":
      return KNIGHT_D.some(([a, b]) => a === dr && b === dc);
    case "k":
      return KING_D.some(([a, b]) => a === dr && b === dc);
    case "b":
      return (
        Math.abs(dr) === Math.abs(dc) && pathClear(board, r, c, tr, tc)
      );
    case "r":
      return (dr === 0 || dc === 0) && pathClear(board, r, c, tr, tc);
    case "q":
      return (
        (Math.abs(dr) === Math.abs(dc) || dr === 0 || dc === 0) &&
        pathClear(board, r, c, tr, tc)
      );
    default:
      return false;
  }
}

/**
 * Every square's "control" count — how many pieces of each color bear on it,
 * counting both attacks on enemy pieces and defense of friendly ones. This is
 * what the board-dominance heatmap renders.
 */
export function controlMap(game: Chess): Record<string, Control> {
  const board = game.board();
  const map: Record<string, Control> = {};

  const bump = (r: number, c: number, color: Color) => {
    if (r < 0 || r > 7 || c < 0 || c > 7) return;
    const key = toSquare(r, c);
    if (!map[key]) map[key] = { w: 0, b: 0 };
    if (color === "w") map[key].w += 1;
    else map[key].b += 1;
  };

  const ray = (
    r: number,
    c: number,
    color: Color,
    dirs: number[][]
  ) => {
    for (const [dr, dc] of dirs) {
      let nr = r + dr;
      let nc = c + dc;
      while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
        bump(nr, nc, color);
        if (board[nr][nc]) break; // the blocker square is controlled; stop past it
        nr += dr;
        nc += dc;
      }
    }
  };

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p) continue;
      switch (p.type) {
        case "p": {
          const dr = p.color === "w" ? -1 : 1;
          bump(r + dr, c - 1, p.color);
          bump(r + dr, c + 1, p.color);
          break;
        }
        case "n":
          for (const [dr, dc] of KNIGHT_D) bump(r + dr, c + dc, p.color);
          break;
        case "k":
          for (const [dr, dc] of KING_D) bump(r + dr, c + dc, p.color);
          break;
        case "b":
          ray(r, c, p.color, BISHOP_D);
          break;
        case "r":
          ray(r, c, p.color, ROOK_D);
          break;
        case "q":
          ray(r, c, p.color, [...BISHOP_D, ...ROOK_D]);
          break;
      }
    }
  }
  return map;
}

export interface Attacker {
  square: Square;
  type: PieceSymbol;
  value: number;
}

/**
 * Pieces of `color` that attack `target`, least-valuable first — the input a
 * lightweight static-exchange check needs to judge sacrifices.
 */
export function attackersOf(
  game: Chess,
  target: Square,
  color: Color
): Attacker[] {
  const board = game.board();
  const tc = FILES.indexOf(target[0]);
  const tr = 8 - Number(target[1]);
  const out: Attacker[] = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p || p.color !== color) continue;
      if (pieceAttacks(board, r, c, p.type, p.color, tr, tc)) {
        out.push({ square: toSquare(r, c), type: p.type, value: PIECE_VALUE[p.type] });
      }
    }
  }
  return out.sort((a, b) => a.value - b.value);
}
