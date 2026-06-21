import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-forest text-parchment border-slate-900 hover:bg-forest-hover dark:border-slate-100",
  secondary:
    "bg-terracotta text-parchment border-slate-900 hover:bg-terracotta-hover dark:border-slate-100",
  ghost:
    "bg-transparent text-slate-800 border-slate-300 hover:border-slate-900 hover:bg-slate-900/5 dark:text-slate-200 dark:border-slate-700 dark:hover:border-slate-100 dark:hover:bg-slate-100/5",
  danger:
    "bg-transparent text-terracotta border-terracotta hover:bg-terracotta hover:text-parchment",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({
  variant = "ghost",
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={[
        "inline-flex items-center justify-center gap-2 border px-4 py-2 text-sm font-medium",
        "transition-colors focus-hard disabled:cursor-not-allowed disabled:opacity-40",
        VARIANTS[variant],
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}

export function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "border border-slate-300 bg-white/60 dark:border-slate-800 dark:bg-white/[0.02]",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
      {children}
    </h2>
  );
}

export function Pill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "forest" | "terracotta";
}) {
  const tones = {
    neutral:
      "border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-300",
    forest: "border-forest text-forest dark:border-emerald-500 dark:text-emerald-400",
    terracotta: "border-terracotta text-terracotta",
  };
  return (
    <span
      className={[
        "inline-flex items-center border px-2 py-0.5 text-[0.7rem] font-medium uppercase tracking-wider",
        tones[tone],
      ].join(" ")}
    >
      {children}
    </span>
  );
}
