import { QUALITY_META, type ReviewQuality } from "@/lib/engine/review";

// Muted, editorial accents — a deep teal for brilliancies, ochre for slips,
// terracotta for errors. No neon, in keeping with the studio palette.
export const QUALITY_COLOR: Record<ReviewQuality, string> = {
  brilliant: "#0E7C86",
  great: "#1A5235",
  best: "#2F7D52",
  good: "#64748B",
  inaccuracy: "#A16207",
  mistake: "#C85A32",
  blunder: "#9A3412",
};

const STRONG = new Set<ReviewQuality>(["brilliant", "great", "blunder"]);

export function MoveBadge({
  quality,
  showLabel = false,
  className = "",
}: {
  quality: ReviewQuality;
  showLabel?: boolean;
  className?: string;
}) {
  const meta = QUALITY_META[quality];
  const color = QUALITY_COLOR[quality];
  const glyph = meta.symbol || meta.label[0];

  return (
    <span
      className={["inline-flex items-center gap-1.5", className].join(" ")}
      title={meta.label}
    >
      <span
        className="inline-flex h-5 min-w-[1.25rem] items-center justify-center border px-1 text-[0.65rem] font-bold leading-none"
        style={{
          color,
          borderColor: color,
          backgroundColor: `${color}14`,
          fontWeight: STRONG.has(quality) ? 800 : 700,
        }}
      >
        {glyph}
      </span>
      {showLabel && (
        <span
          className="text-xs font-semibold"
          style={{ color }}
        >
          {meta.label}
        </span>
      )}
    </span>
  );
}
