import Link from "next/link";
import { Swords, Puzzle, Microscope, ArrowRight } from "lucide-react";

const features = [
  {
    href: "/play",
    icon: Swords,
    kicker: "The Arena",
    title: "Play the Bot",
    body: "Face three tuned opponents — from a careless Novice to an unforgiving Master. A live evaluation bar reads the position as you go.",
  },
  {
    href: "/puzzles",
    icon: Puzzle,
    kicker: "Tactics",
    title: "Train Your Eye",
    body: "Sharpen your vision on a curated set of mating patterns. Correct moves glow green; missteps shake the board. Stuck? Ask for a hint.",
  },
  {
    href: "/analysis",
    icon: Microscope,
    kicker: "The Coach",
    title: "Analyze & Learn",
    body: "A sandbox for both sides. Paste a FEN or PGN, then ask the coach what's going on — in plain English, grounded in the position.",
  },
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-6">
      {/* Hero */}
      <section className="border-b border-slate-300 py-20 dark:border-slate-800 sm:py-28">
        <p className="mb-5 inline-flex items-center gap-2 border border-slate-300 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-slate-500 dark:border-slate-700">
          A Chess Studio
        </p>
        <h1 className="font-display text-5xl font-semibold leading-[1.05] tracking-tight text-slate-900 dark:text-slate-100 sm:text-7xl">
          Play deliberately.
          <br />
          <span className="italic">Study</span> beautifully.
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600 dark:text-slate-400">
          Gambit is a quiet place to play, train, and understand chess — no
          clutter, no noise. Just a board, an honest opponent, and a coach that
          speaks like a human.
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
          <Link
            href="/play"
            className="inline-flex items-center gap-2 border border-slate-900 bg-forest px-6 py-3 text-sm font-semibold text-parchment shadow-hard transition-colors hover:bg-forest-hover focus-hard dark:border-slate-100"
          >
            Start a game
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/puzzles"
            className="inline-flex items-center gap-2 border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-800 transition-colors hover:border-slate-900 focus-hard dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-100"
          >
            Solve a puzzle
          </Link>
        </div>
      </section>

      {/* Feature trio */}
      <section className="grid gap-px border-x border-b border-slate-300 bg-slate-300 dark:border-slate-800 dark:bg-slate-800 sm:grid-cols-3">
        {features.map((f) => {
          const Icon = f.icon;
          return (
            <Link
              key={f.href}
              href={f.href}
              className="group flex flex-col bg-parchment p-7 transition-colors hover:bg-white dark:bg-charcoal dark:hover:bg-white/[0.03]"
            >
              <span className="flex h-11 w-11 items-center justify-center border border-slate-900 text-slate-900 dark:border-slate-100 dark:text-slate-100">
                <Icon className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-terracotta">
                {f.kicker}
              </p>
              <h3 className="mt-1 font-display text-2xl font-semibold text-slate-900 dark:text-slate-100">
                {f.title}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                {f.body}
              </p>
              <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-slate-900 dark:text-slate-100">
                Enter
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          );
        })}
      </section>

      <section className="py-16">
        <blockquote className="mx-auto max-w-2xl text-center">
          <p className="font-display text-2xl italic leading-relaxed text-slate-700 dark:text-slate-300 sm:text-3xl">
            “Chess is the gymnasium of the mind.”
          </p>
          <footer className="mt-4 text-sm uppercase tracking-[0.2em] text-slate-500">
            — Attributed to Blaise Pascal
          </footer>
        </blockquote>
      </section>
    </div>
  );
}
