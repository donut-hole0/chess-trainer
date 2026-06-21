"use client";

import { useEffect, useState } from "react";
import { Download, Loader2, Trash2, ChevronRight } from "lucide-react";
import { Button, SectionLabel } from "@/components/ui";
import {
  readGames,
  addGames,
  clearGames,
  fetchLichessGames,
  fetchChessComGames,
  type ImportedGame,
  type GameSource,
} from "@/lib/games";

const SOURCE_LABEL: Record<GameSource, string> = {
  lichess: "Lichess",
  chesscom: "Chess.com",
  manual: "Manual",
};

export function CloudImporter({
  onLoad,
}: {
  onLoad: (game: ImportedGame) => void;
}) {
  const [source, setSource] = useState<Exclude<GameSource, "manual">>("lichess");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [games, setGames] = useState<ImportedGame[]>([]);

  useEffect(() => {
    setGames(readGames());
  }, []);

  async function fetchGames() {
    setLoading(true);
    setError(null);
    try {
      const fetched =
        source === "lichess"
          ? await fetchLichessGames(username, 10)
          : await fetchChessComGames(username, 10);
      setGames(addGames(fetched));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed.");
    } finally {
      setLoading(false);
    }
  }

  function handleClear() {
    clearGames();
    setGames([]);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <SectionLabel>Import games</SectionLabel>
        {games.length > 0 && (
          <button
            onClick={handleClear}
            className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-terracotta"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear
          </button>
        )}
      </div>

      {/* Source toggle */}
      <div className="mt-2 flex border border-slate-300 dark:border-slate-700">
        {(["lichess", "chesscom"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSource(s)}
            className={[
              "flex-1 px-3 py-1.5 text-xs font-semibold transition-colors focus-hard",
              source === s
                ? "bg-slate-900 text-parchment dark:bg-slate-100 dark:text-charcoal"
                : "text-slate-600 hover:bg-slate-900/5 dark:text-slate-300",
            ].join(" ")}
          >
            {SOURCE_LABEL[s]}
          </button>
        ))}
      </div>

      <div className="mt-2 flex gap-2">
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !loading && fetchGames()}
          placeholder={`${SOURCE_LABEL[source]} username`}
          className="min-w-0 flex-1 border border-slate-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-slate-900 dark:border-slate-700 dark:focus:border-slate-300"
        />
        <Button variant="secondary" onClick={fetchGames} disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Fetch
        </Button>
      </div>
      {error && <p className="mt-1 text-xs text-terracotta">{error}</p>}

      {/* Saved games */}
      <div className="mt-3 max-h-60 overflow-y-auto border border-slate-200 dark:border-slate-800">
        {games.length === 0 ? (
          <p className="px-3 py-4 text-sm italic text-slate-400">
            Fetch a user&apos;s recent games, then load any one into the board.
          </p>
        ) : (
          <ul>
            {games.map((g) => (
              <li key={g.id}>
                <button
                  onClick={() => onLoad(g)}
                  className="group flex w-full items-center justify-between gap-2 border-b border-slate-200 px-3 py-2 text-left transition-colors last:border-b-0 hover:bg-slate-900/5 dark:border-slate-800 dark:hover:bg-slate-100/5"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-slate-800 dark:text-slate-200">
                      {g.white} <span className="text-slate-400">vs</span> {g.black}
                    </span>
                    <span className="text-[0.7rem] uppercase tracking-wider text-slate-400">
                      {SOURCE_LABEL[g.source]} · {g.result}
                      {g.date ? ` · ${g.date}` : ""}
                    </span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
