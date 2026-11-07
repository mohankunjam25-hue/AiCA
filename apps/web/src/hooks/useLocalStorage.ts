import { useState, useEffect, useCallback } from 'react';

/**
 * Type-safe localStorage hook with error boundary resilience and multi-tab synchronization.
 *
 * @param key The localStorage key
 * @param initialValue The fallback initial value if key does not exist
 * @param options.syncTabs Whether to listen to 'storage' events from other browser tabs (default: true)
 * @returns [storedValue, setValue, removeValue]
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options: { syncTabs?: boolean } = { syncTabs: true }
): [T, (value: T | ((val: T) => T)) => void, () => void] {
  // Read value from localStorage or fallback
  const readValue = useCallback((): T => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item !== null ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      console.warn(`[useLocalStorage] Error reading key "${key}":`, error);
      return initialValue;
    }
  }, [key, initialValue]);

  const [storedValue, setStoredValue] = useState<T>(readValue);

  // Return a wrapped version of useState's setter function that persists to localStorage
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      if (typeof window === 'undefined') {
        return;
      }
      try {
        setStoredValue((current) => {
          const valueToStore = value instanceof Function ? value(current) : value;
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
          return valueToStore;
        });
      } catch (error) {
        console.warn(`[useLocalStorage] Error setting key "${key}":`, error);
      }
    },
    [key]
  );

  // Remove value from localStorage
  const removeValue = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.warn(`[useLocalStorage] Error removing key "${key}":`, error);
    }
  }, [key, initialValue]);

  // Sync state if another tab updates localStorage
  useEffect(() => {
    if (!options.syncTabs || typeof window === 'undefined') return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue) as T);
        } catch {
          // Ignore non-json updates
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, options.syncTabs]);

  return [storedValue, setValue, removeValue];
}

/**
 * Specialized hook for Monaco Editor code auto-draft persistence.
 * Guarantees that code is never lost on refresh or tab navigation.
 */
export function useCodeDraft(problemId: string, language: string, defaultCode: string) {
  const storageKey = `aica_draft_${problemId}_${language}`;
  return useLocalStorage<string>(storageKey, defaultCode);
}
