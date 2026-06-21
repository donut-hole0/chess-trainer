"use client";

import { useCallback, useEffect, useState } from "react";

// Everything we persist lives under a single namespace so the studio never
// collides with anything else on the origin.
const NS = "gambit:";

function key(name: string): string {
  return `${NS}${name}`;
}

/** Read a JSON value from localStorage, falling back when absent or malformed. */
export function readStore<T>(name: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key(name));
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/** Write a JSON value to localStorage and notify listeners in this tab. */
export function writeStore<T>(name: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key(name), JSON.stringify(value));
    // localStorage's native `storage` event only fires in *other* tabs, so we
    // dispatch our own so hooks in this tab re-read immediately.
    window.dispatchEvent(new CustomEvent("gambit:store", { detail: name }));
  } catch {
    /* storage may be full or unavailable; values stay in memory for the session */
  }
}

/**
 * Reactive localStorage binding. Behaves like useState but persists across
 * reloads and keeps every hook bound to the same key in sync within the tab.
 */
export function useLocalStorage<T>(
  name: string,
  initial: T
): [T, (next: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(initial);

  // Hydrate from storage after mount to keep SSR output deterministic.
  useEffect(() => {
    setValue(readStore<T>(name, initial));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);

  // Stay in sync with writes from elsewhere (other hooks or other tabs).
  useEffect(() => {
    function refresh(e: Event) {
      if (e instanceof CustomEvent && e.detail !== name) return;
      setValue(readStore<T>(name, initial));
    }
    window.addEventListener("gambit:store", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("gambit:store", refresh);
      window.removeEventListener("storage", refresh);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);

  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved =
          typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        writeStore(name, resolved);
        return resolved;
      });
    },
    [name]
  );

  return [value, set];
}
