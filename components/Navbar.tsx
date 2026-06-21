"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Swords, Puzzle, Microscope } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

const links = [
  { href: "/play", label: "Play", icon: Swords },
  { href: "/puzzles", label: "Puzzles", icon: Puzzle },
  { href: "/analysis", label: "Analysis", icon: Microscope },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-300 bg-parchment/95 backdrop-blur-0 dark:border-slate-800 dark:bg-charcoal/95">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center border border-slate-900 bg-forest text-base font-bold text-parchment shadow-hard-sm dark:border-slate-100">
            ♞
          </span>
          <span className="font-display text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Gambit
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {links.map(({ href, label, icon: Icon }) => {
            const active =
              pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={[
                  "flex items-center gap-2 border px-3 py-1.5 text-sm font-medium transition-colors focus-hard",
                  active
                    ? "border-slate-900 bg-slate-900 text-parchment dark:border-slate-100 dark:bg-slate-100 dark:text-charcoal"
                    : "border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-slate-100",
                ].join(" ")}
              >
                <Icon className="h-4 w-4" strokeWidth={2} />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
          <div className="mx-1 h-6 w-px bg-slate-300 dark:bg-slate-700" />
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
