"use client";

import Link from "next/link";
import {
  Swords,
  BookOpen,
  Microscope,
  ArrowRight,
  TrendingUp,
  Target,
  Timer,
  Flame,
} from "lucide-react";
import { Panel, SectionLabel } from "@/components/ui";
import { DailyPuzzle } from "@/components/DailyPuzzle";
import { PuzzleRush } from "@/components/PuzzleRush";
import { GameReview } from "@/components/GameReview";
import { useProfile } from "@/lib/profile";

const QUICK = [
  {
    href: "/play",
    icon: Swords,
    kicker: "The Arena",
    title: "Play vs Bot",
    body: "Face a tuned opponent with a live evaluation bar.",
  },
  {
    href: "/openings",
    icon: BookOpen,
    kicker: "Repertoire",
    title: "Repertoire Drill",
    body: "Rehearse the Ruy Lopez and Caro-Kann to memory.",
  },
  {
    href: "/analysis",
    icon: Microscope,
    kicker: "Deep Analysis",
    title: "Analysis Suite",
    body: "Eval graphs, heatmaps, and cloud game imports.",
  },
];

export default function HomePage() {
  const { profile } = useProfile();

  const stats = [
    { icon: Target, label: "Puzzles solved", value: profile.puzzlesSolved },
    { icon: Timer, label: "Best rush", value: profile.bestRush },
    { icon: Flame, label: "Best streak", value: profile.bestStreak },
    {
      icon: TrendingUp,
      label: "Top accuracy",
      value: profile.bestAccuracy ? `${profile.bestAccuracy}%` : "—",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      {/* Jump Back In */}
      <section className="border border-slate-300 dark:border-slate-800">
        <div className="grid gap-px bg-slate-300 dark:bg-slate-800 md:grid-cols-[1.4fr_1fr]">
          {/* Greeting + Elo */}
          <div className="bg-parchment p-7 dark:bg-charcoal">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-terracotta">
              Jump Back In
            </p>
            <h1 className="mt-2 font-display text-4xl font-semibold leading-tight tracking-tight text-slate-900 dark:text-slate-100 sm:text-5xl">
              Welcome back.
            </h1>
            <div className="mt-5 flex items-end gap-3">
              <span className="font-display text-6xl font-semibold tabular-nums leading-none text-forest dark:text-emerald-400">
                {profile.elo}
              </span>
              <span className="pb-1.5 text-sm uppercase tracking-[0.18em] text-slate-500">
                Current Elo
              </span>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Pick up where you left off — sharpen tactics, drill an opening, or
              put a game under the microscope.
            </p>
          </div>

          {/* Stat grid */}
          <div className="grid grid-cols-2 gap-px bg-slate-300 dark:bg-slate-800">
            {stats.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.label}
                  className="flex flex-col justify-between bg-parchment p-5 dark:bg-charcoal"
                >
                  <Icon className="h-5 w-5 text-slate-400" strokeWidth={1.75} />
                  <div className="mt-4">
                    <p className="font-display text-3xl font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                      {s.value}
                    </p>
                    <p className="text-[0.7rem] uppercase tracking-wider text-slate-400">
                      {s.label}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Quick launch */}
      <section className="mt-6 grid gap-px border border-slate-300 bg-slate-300 dark:border-slate-800 dark:bg-slate-800 sm:grid-cols-3">
        {QUICK.map((q) => {
          const Icon = q.icon;
          return (
            <Link
              key={q.href}
              href={q.href}
              className="group flex flex-col bg-parchment p-6 transition-colors hover:bg-white dark:bg-charcoal dark:hover:bg-white/[0.03]"
            >
              <span className="flex h-10 w-10 items-center justify-center border border-slate-900 text-slate-900 dark:border-slate-100 dark:text-slate-100">
                <Icon className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-terracotta">
                {q.kicker}
              </p>
              <h3 className="mt-1 font-display text-xl font-semibold text-slate-900 dark:text-slate-100">
                {q.title}
              </h3>
              <p className="mt-1 flex-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                {q.body}
              </p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-900 dark:text-slate-100">
                Open
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          );
        })}
      </section>

      {/* Daily puzzle + High-stakes puzzles */}
      <section className="mt-6 grid items-start gap-6 lg:grid-cols-2">
        <DailyPuzzle />
        <PuzzleRush />
      </section>

      {/* Diamond Game Review */}
      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between border-b border-slate-300 pb-3 dark:border-slate-800">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-terracotta">
              Diamond Game Review
            </p>
            <h2 className="font-display text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              Grade a game
            </h2>
          </div>
          <SectionLabel>Accuracy · Badges · Coach</SectionLabel>
        </div>
        <GameReview />
      </section>
    </div>
  );
}
