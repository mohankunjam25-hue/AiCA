import { create } from 'zustand';

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
}

interface DataCacheState {
  cache: Record<string, CacheEntry>;
  get: <T>(key: string, maxAgeMs?: number) => T | null;
  set: <T>(key: string, data: T) => void;
  invalidate: (keyPrefix: string) => void;
  clear: () => void;
}

/**
 * High-performance, in-memory client-side cache store (SWR pattern).
 * Prevents redundant re-fetching, layout shifts, and intrusive loading spinners
 * during routine tab switching, filtering, and page navigation.
 */
export const useDataCacheStore = create<DataCacheState>((set, get) => ({
  cache: {},

  get: <T>(key: string, maxAgeMs: number = 3 * 60 * 1000): T | null => {
    const entry = get().cache[key];
    if (!entry) return null;
    const now = Date.now();
    if (now - entry.timestamp > maxAgeMs) {
      return null;
    }
    return entry.data as T;
  },

  set: <T>(key: string, data: T) => {
    set((state) => ({
      cache: {
        ...state.cache,
        [key]: { data, timestamp: Date.now() }
      }
    }));
  },

  invalidate: (keyPrefix: string) => {
    set((state) => {
      const nextCache = { ...state.cache };
      let changed = false;
      Object.keys(nextCache).forEach((k) => {
        if (k.startsWith(keyPrefix)) {
          delete nextCache[k];
          changed = true;
        }
      });
      return changed ? { cache: nextCache } : state;
    });
  },

  clear: () => {
    set({ cache: {} });
  }
}));
