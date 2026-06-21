"use client";

import { Fragment, type ReactNode } from "react";
import type { OpeningNode, Repertoire } from "@/lib/openings";

interface OpeningTreeProps {
  rep: Repertoire;
  selectedPath: number[];
  onSelect: (path: number[]) => void;
}

function samePath(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

export function OpeningTree({ rep, selectedPath, onSelect }: OpeningTreeProps) {
  function token(
    node: OpeningNode,
    path: number[],
    ply: number,
    variationStart: boolean
  ): ReactNode {
    const isWhite = ply % 2 === 1;
    const num = Math.ceil(ply / 2);
    const prefix = isWhite ? `${num}.` : variationStart ? `${num}…` : "";
    const active = samePath(path, selectedPath);
    return (
      <button
        key={`m-${path.join("-")}`}
        onClick={() => onSelect(path)}
        className={[
          "mx-0.5 inline-flex items-baseline gap-1 rounded-none px-1 py-0.5 font-mono text-sm transition-colors focus-hard",
          active
            ? "bg-forest text-parchment"
            : "text-slate-700 hover:bg-slate-900/10 dark:text-slate-200 dark:hover:bg-slate-100/10",
        ].join(" ")}
        title={node.comment}
      >
        {prefix && (
          <span className={active ? "text-parchment/70" : "text-slate-400"}>
            {prefix}
          </span>
        )}
        <span className="font-semibold">{node.san}</span>
      </button>
    );
  }

  function renderChildren(
    children: OpeningNode[],
    basePath: number[],
    ply: number
  ): ReactNode[] {
    if (children.length === 0) return [];
    const out: ReactNode[] = [];
    const mainPath = [...basePath, 0];

    out.push(token(children[0], mainPath, ply, false));

    // Sibling alternatives render inline in parentheses, PGN style.
    for (let i = 1; i < children.length; i++) {
      const vp = [...basePath, i];
      out.push(
        <span
          key={`v-${vp.join("-")}`}
          className="text-slate-400 dark:text-slate-500"
        >
          {" ("}
          {token(children[i], vp, ply, true)}
          {renderChildren(children[i].children, vp, ply + 1)}
          {") "}
        </span>
      );
    }

    // Continue the mainline.
    out.push(
      <Fragment key={`c-${mainPath.join("-")}`}>
        {renderChildren(children[0].children, mainPath, ply + 1)}
      </Fragment>
    );
    return out;
  }

  const selectedNode = nodeAt(rep, selectedPath);

  return (
    <div className="flex flex-col">
      <div className="leading-7">
        <button
          onClick={() => onSelect([])}
          className={[
            "mr-1 px-1 py-0.5 font-mono text-sm transition-colors focus-hard",
            selectedPath.length === 0
              ? "bg-forest text-parchment"
              : "text-slate-400 hover:bg-slate-900/10 dark:hover:bg-slate-100/10",
          ].join(" ")}
        >
          start
        </button>
        {renderChildren(rep.line, [], 1)}
      </div>

      {selectedNode?.comment && (
        <p className="mt-3 border-l-2 border-terracotta pl-3 text-sm italic leading-relaxed text-slate-600 dark:text-slate-300">
          {selectedNode.comment}
        </p>
      )}
    </div>
  );
}

function nodeAt(rep: Repertoire, path: number[]): OpeningNode | null {
  let children = rep.line;
  let node: OpeningNode | null = null;
  for (const idx of path) {
    node = children[idx] ?? null;
    if (!node) return null;
    children = node.children;
  }
  return node;
}
