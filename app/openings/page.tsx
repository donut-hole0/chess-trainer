"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpen, GitBranch, Brain, Plus, Trash2, Crown } from "lucide-react";
import { ChessBoard } from "@/components/ChessBoard";
import { OpeningTree } from "@/components/openings/OpeningTree";
import { MemoryDrill } from "@/components/openings/MemoryDrill";
import { Button, Panel, SectionLabel, Pill } from "@/components/ui";
import {
  MASTER_REPERTOIRES,
  readCustomRepertoires,
  saveCustomRepertoire,
  deleteCustomRepertoire,
  createCustomRepertoire,
  sansForPath,
  fenForSans,
  type Repertoire,
} from "@/lib/openings";

type Mode = "explore" | "drill";

export default function OpeningsPage() {
  const [custom, setCustom] = useState<Repertoire[]>([]);
  const [selectedId, setSelectedId] = useState(MASTER_REPERTOIRES[0].id);
  const [mode, setMode] = useState<Mode>("explore");
  const [path, setPath] = useState<number[]>([]);

  // Importer form.
  const [impName, setImpName] = useState("");
  const [impColor, setImpColor] = useState<"white" | "black">("white");
  const [impText, setImpText] = useState("");
  const [impError, setImpError] = useState<string | null>(null);
  const [showImporter, setShowImporter] = useState(false);

  useEffect(() => {
    setCustom(readCustomRepertoires());
  }, []);

  const all = useMemo(() => [...MASTER_REPERTOIRES, ...custom], [custom]);
  const rep = all.find((r) => r.id === selectedId) ?? MASTER_REPERTOIRES[0];

  // Reset the explored path when switching repertoires.
  useEffect(() => {
    setPath([]);
  }, [selectedId]);

  const exploreFen = useMemo(
    () => fenForSans(sansForPath(rep, path), rep.startFen),
    [rep, path]
  );

  function handleImport() {
    const created = createCustomRepertoire(impName, impColor, impText);
    if (!created) {
      setImpError("Couldn't read that as PGN or FEN.");
      return;
    }
    saveCustomRepertoire(created);
    setCustom(readCustomRepertoires());
    setSelectedId(created.id);
    setImpName("");
    setImpText("");
    setImpError(null);
    setShowImporter(false);
    setMode("explore");
  }

  function handleDelete(id: string) {
    deleteCustomRepertoire(id);
    const next = readCustomRepertoires();
    setCustom(next);
    if (selectedId === id) setSelectedId(MASTER_REPERTOIRES[0].id);
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-terracotta">
          Repertoire
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          Opening Trainer
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-500">
          Explore master repertoires move by move, then drill them to memory. The
          computer answers from the book — your job is to find the right reply.
        </p>
      </header>

      {/* Repertoire picker */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {all.map((r) => {
          const active = r.id === selectedId;
          return (
            <button
              key={r.id}
              onClick={() => setSelectedId(r.id)}
              className={[
                "inline-flex items-center gap-2 border px-3 py-1.5 text-sm font-medium transition-colors focus-hard",
                active
                  ? "border-slate-900 bg-slate-900 text-parchment dark:border-slate-100 dark:bg-slate-100 dark:text-charcoal"
                  : "border-slate-300 text-slate-600 hover:border-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-400",
              ].join(" ")}
            >
              <BookOpen className="h-4 w-4" />
              {r.name}
              {r.custom && (
                <Trash2
                  className="h-3.5 w-3.5 opacity-50 hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(r.id);
                  }}
                />
              )}
            </button>
          );
        })}
        <button
          onClick={() => setShowImporter((s) => !s)}
          className="inline-flex items-center gap-2 border border-dashed border-slate-400 px-3 py-1.5 text-sm font-medium text-slate-500 transition-colors hover:border-slate-900 hover:text-slate-900 focus-hard dark:border-slate-600 dark:hover:border-slate-300"
        >
          <Plus className="h-4 w-4" />
          Import
        </button>
      </div>

      {/* Importer */}
      {showImporter && (
        <Panel className="mb-6 p-4">
          <SectionLabel>Import a custom repertoire</SectionLabel>
          <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
            <input
              value={impName}
              onChange={(e) => setImpName(e.target.value)}
              placeholder="Name (e.g. My London System)"
              className="border border-slate-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-slate-900 dark:border-slate-700 dark:focus:border-slate-300"
            />
            <div className="flex border border-slate-300 dark:border-slate-700">
              {(["white", "black"] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setImpColor(c)}
                  className={[
                    "px-3 py-2 text-sm font-medium capitalize transition-colors focus-hard",
                    impColor === c
                      ? "bg-slate-900 text-parchment dark:bg-slate-100 dark:text-charcoal"
                      : "text-slate-600 hover:bg-slate-900/5 dark:text-slate-300",
                  ].join(" ")}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <textarea
            value={impText}
            onChange={(e) => setImpText(e.target.value)}
            rows={3}
            spellCheck={false}
            placeholder="Paste PGN (1. d4 d5 2. Bf4 …) or a FEN string"
            className="mt-3 w-full resize-none border border-slate-300 bg-transparent px-3 py-2 font-mono text-xs outline-none focus:border-slate-900 dark:border-slate-700 dark:focus:border-slate-300"
          />
          {impError && <p className="mt-1 text-xs text-terracotta">{impError}</p>}
          <div className="mt-3">
            <Button variant="primary" onClick={handleImport}>
              <Plus className="h-4 w-4" />
              Save repertoire
            </Button>
          </div>
        </Panel>
      )}

      {/* Description + mode tabs */}
      <div className="mb-5 flex flex-col gap-3 border-b border-slate-300 pb-4 dark:border-slate-800 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-2xl font-semibold text-slate-900 dark:text-slate-100">
              {rep.name}
            </h2>
            {rep.eco && <Pill>{rep.eco}</Pill>}
            <Pill tone="forest">Plays {rep.color}</Pill>
          </div>
          <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            {rep.description}
          </p>
        </div>
        <div className="flex shrink-0 border border-slate-300 dark:border-slate-700">
          {(["explore", "drill"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={[
                "inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold capitalize transition-colors focus-hard",
                mode === m
                  ? "bg-slate-900 text-parchment dark:bg-slate-100 dark:text-charcoal"
                  : "text-slate-600 hover:bg-slate-900/5 dark:text-slate-300",
              ].join(" ")}
            >
              {m === "explore" ? <GitBranch className="h-4 w-4" /> : <Brain className="h-4 w-4" />}
              {m}
            </button>
          ))}
        </div>
      </div>

      {mode === "explore" ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="min-w-0">
            <ChessBoard position={exploreFen} orientation={rep.color} interactive={false} />
            <p className="mt-3 text-center text-sm text-slate-500">
              Click any move in the tree to jump the board to that position.
            </p>
          </div>
          <Panel className="max-h-[520px] overflow-y-auto p-4">
            <SectionLabel>Variation tree</SectionLabel>
            <div className="mt-3">
              {rep.line.length > 0 ? (
                <OpeningTree rep={rep} selectedPath={path} onSelect={setPath} />
              ) : (
                <p className="flex items-center gap-2 text-sm italic text-slate-400">
                  <Crown className="h-4 w-4" />
                  A saved position — paste a PGN to build a drillable line.
                </p>
              )}
            </div>
          </Panel>
        </div>
      ) : (
        <MemoryDrill key={rep.id} rep={rep} />
      )}
    </div>
  );
}
