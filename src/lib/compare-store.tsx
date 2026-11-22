// src/lib/compare-store.tsx
// SSR-safe external store using useSyncExternalStore for compare tray persistence
// Caches immutable snapshots to avoid React infinite loop warnings

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

// Immutable module-level constant for SSR and initial empty state
const EMPTY_SLUGS: string[] = Object.freeze([]) as unknown as string[];

let cachedSnapshot: string[] = EMPTY_SLUGS;
let lastRawStorage: string | null = null;
let isInitialized = false;

const listeners = new Set<() => void>();

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

function readStorageSnapshot(): string[] {
  if (typeof window === "undefined") {
    return EMPTY_SLUGS;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === lastRawStorage && isInitialized) {
      return cachedSnapshot;
    }

    lastRawStorage = raw;
    isInitialized = true;

    if (!raw) {
      cachedSnapshot = EMPTY_SLUGS;
      return cachedSnapshot;
    }

    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const sliced = parsed.slice(0, MAX_COMPARE);
      // If content is identical to cached, retain reference
      if (
        cachedSnapshot.length === sliced.length &&
        cachedSnapshot.every((val, i) => val === sliced[i])
      ) {
        return cachedSnapshot;
      }
      cachedSnapshot = Object.freeze(sliced) as string[];
    } else {
      cachedSnapshot = EMPTY_SLUGS;
    }
  } catch {
    cachedSnapshot = EMPTY_SLUGS;
  }

  return cachedSnapshot;
}

function subscribe(callback: () => void) {
  listeners.add(callback);

  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      if (e.newValue === lastRawStorage) return;
      readStorageSnapshot();
      emitChange();
    }
  };

  window.addEventListener("storage", handleStorage);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", handleStorage);
  };
}

function getSnapshot(): string[] {
  return readStorageSnapshot();
}

function getServerSnapshot(): string[] {
  return EMPTY_SLUGS;
}

function saveState(next: string[]) {
  const sliced = next.slice(0, MAX_COMPARE);
  const raw = JSON.stringify(sliced);

  if (raw === lastRawStorage) return;

  lastRawStorage = raw;
  cachedSnapshot = Object.freeze([...sliced]) as string[];
  isInitialized = true;

  try {
    localStorage.setItem(STORAGE_KEY, raw);
  } catch {
    // Ignore storage quota errors
  }

  emitChange();
}

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const slugs = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const add = useCallback((slug: string): boolean => {
    const current = cachedSnapshot;
    if (current.includes(slug) || current.length >= MAX_COMPARE) {
      return false;
    }
    saveState([...current, slug]);
    return true;
  }, []);

  const remove = useCallback((slug: string) => {
    saveState(cachedSnapshot.filter((s) => s !== slug));
  }, []);

  const toggle = useCallback((slug: string) => {
    const current = cachedSnapshot;
    if (current.includes(slug)) {
      saveState(current.filter((s) => s !== slug));
    } else if (current.length < MAX_COMPARE) {
      saveState([...current, slug]);
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
