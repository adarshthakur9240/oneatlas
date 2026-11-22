// src/lib/compare-store.tsx
// SSR-safe external store using useSyncExternalStore for compare tray persistence

"use client";

import React, {
  createContext,
  useContext,
  useCallback,
  useSyncExternalStore,
} from "react";

interface CompareContextType {
  slugs: string[];
  add: (slug: string) => boolean;
  remove: (slug: string) => void;
  toggle: (slug: string) => void;
  clear: () => void;
  has: (slug: string) => boolean;
}

const CompareContext = createContext<CompareContextType | null>(null);

const STORAGE_KEY = "oneatlas_compare_slugs";
const MAX_COMPARE = 4;

let memoryState: string[] = [];
const listeners = new Set<() => void>();

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      try {
        memoryState = e.newValue ? JSON.parse(e.newValue) : [];
      } catch {
        memoryState = [];
      }
      emitChange();
    }
  };
  window.addEventListener("storage", handleStorage);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", handleStorage);
  };
}

let hasReadStorage = false;
function getSnapshot(): string[] {
  if (typeof window === "undefined") return [];
  if (!hasReadStorage) {
    hasReadStorage = true;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          memoryState = parsed.slice(0, MAX_COMPARE);
        }
      }
    } catch {
      memoryState = [];
    }
  }
  return memoryState;
}

function getServerSnapshot(): string[] {
  return [];
}

function saveState(next: string[]) {
  memoryState = next.slice(0, MAX_COMPARE);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryState));
  } catch {
    // Ignore storage quota error
  }
  emitChange();
}

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const slugs = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const add = useCallback((slug: string): boolean => {
    if (memoryState.includes(slug) || memoryState.length >= MAX_COMPARE) {
      return false;
    }
    saveState([...memoryState, slug]);
    return true;
  }, []);

  const remove = useCallback((slug: string) => {
    saveState(memoryState.filter((s) => s !== slug));
  }, []);

  const toggle = useCallback((slug: string) => {
    if (memoryState.includes(slug)) {
      saveState(memoryState.filter((s) => s !== slug));
    } else if (memoryState.length < MAX_COMPARE) {
      saveState([...memoryState, slug]);
    }
  }, []);

  const clear = useCallback(() => {
    saveState([]);
  }, []);

  const has = useCallback(
    (slug: string) => {
      return slugs.includes(slug);
    },
    [slugs]
  );

  return (
    <CompareContext.Provider
      value={{
        slugs,
        add,
        remove,
        toggle,
        clear,
        has,
      }}
    >
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) {
    throw new Error("useCompare must be used within a CompareProvider");
  }
  return ctx;
}
