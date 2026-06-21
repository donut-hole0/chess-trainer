import { Chess } from "chess.js";
import { controlMap } from "./attacks";

export interface HeatStyle {
  background: string;
}

/**
 * Board-dominance overlay: for each square, compare how many White vs. Black
 * pieces bear on it and tint toward the side in control. Emerald = White holds
 * the square, terracotta = Black, with opacity scaling by how lopsided it is.
 */
export function heatmapStyles(fen: string): Record<string, HeatStyle> {
  let game: Chess;
  try {
    game = new Chess(fen);
  } catch {
    return {};
  }
  const control = controlMap(game);
  const styles: Record<string, HeatStyle> = {};
  for (const [square, c] of Object.entries(control)) {
    const diff = c.w - c.b;
    if (diff === 0) continue;
    const mag = Math.min(3, Math.abs(diff));
    const alpha = 0.14 + mag * 0.12; // 0.26 … 0.50
    styles[square] = {
      background:
        diff > 0
          ? `rgba(26, 82, 53, ${alpha})`
          : `rgba(200, 90, 50, ${alpha})`,
    };
  }
  return styles;
}
