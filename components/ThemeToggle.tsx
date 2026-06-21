"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTheme(
      document.documentElement.classList.contains("dark") ? "dark" : "light"
    );
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    try {
      localStorage.setItem("gambit-theme", next);
    } catch {
      /* storage may be unavailable; theme still applies for the session */
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle color theme"
      className="flex h-8 w-8 items-center justify-center border border-slate-300 text-slate-700 transition-colors hover:border-slate-900 hover:text-slate-900 focus-hard dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-100 dark:hover:text-slate-100"
    >
      {/* Avoid hydration mismatch: render a neutral glyph until mounted */}
      {!mounted ? (
        <Sun className="h-4 w-4 opacity-0" />
      ) : theme === "dark" ? (
        <Sun className="h-4 w-4" strokeWidth={2} />
      ) : (
        <Moon className="h-4 w-4" strokeWidth={2} />
      )}
    </button>
  );
}
