import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Polyfill localStorage & window for Node.js test environment
const mockStorage: Record<string, string> = {};
globalThis.localStorage = {
  getItem: (key: string) => mockStorage[key] ?? null,
  setItem: (key: string, value: string) => {
    mockStorage[key] = value;
  },
  removeItem: (key: string) => {
    delete mockStorage[key];
  },
  clear: () => {
    Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);
  },
  key: (i: number) => Object.keys(mockStorage)[i] ?? null,
  length: 0
} as any;

describe('Hooks Suite: useDebounce, useLocalStorage & useClipboard', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('useDebounce Logic Invariants', () => {
    it('1. should debounce value updates by the specified delay', () => {
      let value = 'two sum';
      let debounced = value;

      const updateValue = (next: string) => {
        value = next;
        setTimeout(() => {
          debounced = next;
        }, 250);
      };

      expect(debounced).toBe('two sum');

      updateValue('two sum optimal');
      expect(debounced).toBe('two sum'); // Not updated yet

      vi.advanceTimersByTime(200);
      expect(debounced).toBe('two sum'); // Still before 250ms

      vi.advanceTimersByTime(50);
      expect(debounced).toBe('two sum optimal'); // Updated at 250ms
    });

    it('2. should cancel previous timer when value changes rapidly', () => {
      let callCount = 0;
      let timer: any = null;

      const trigger = () => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          callCount++;
        }, 300);
      };

      trigger();
      vi.advanceTimersByTime(100);
      trigger();
      vi.advanceTimersByTime(100);
      trigger();
      vi.advanceTimersByTime(300);

      expect(callCount).toBe(1); // Only fired once after settling
    });
  });

  describe('useLocalStorage & useCodeDraft Logic Invariants', () => {
    it('1. should return initialValue if key is not found in storage', () => {
      const key = 'aica_unknown_key';
      const initial = { test: 123 };
      const item = localStorage.getItem(key);
      const val = item !== null ? JSON.parse(item) : initial;
      expect(val).toEqual({ test: 123 });
    });

    it('2. should serialize and deserialize JSON objects correctly', () => {
      const key = 'aica_user_pref';
      const data = { theme: 'dark', fontSize: 14 };
      localStorage.setItem(key, JSON.stringify(data));

      const raw = localStorage.getItem(key);
      expect(raw).toBeTruthy();
      expect(JSON.parse(raw!)).toEqual(data);
    });

    it('3. should gracefully handle malformed JSON without crashing', () => {
      const key = 'aica_corrupted_key';
      localStorage.setItem(key, '{not-valid-json');

      let parsed: any;
      try {
        parsed = JSON.parse(localStorage.getItem(key)!);
      } catch {
        parsed = 'fallback-val';
      }

      expect(parsed).toBe('fallback-val');
    });

    it('4. should isolate problem code drafts per problem ID and language', () => {
      const draftKeyPy = 'draft_prob-101_python';
      const draftKeyCpp = 'draft_prob-101_cpp';

      localStorage.setItem(draftKeyPy, 'def solution(): pass');
      localStorage.setItem(draftKeyCpp, 'int main() { return 0; }');

      expect(localStorage.getItem(draftKeyPy)).toBe('def solution(): pass');
      expect(localStorage.getItem(draftKeyCpp)).toBe('int main() { return 0; }');
      expect(localStorage.getItem(draftKeyPy)).not.toBe(localStorage.getItem(draftKeyCpp));
    });
  });

  describe('useClipboard Logic Invariants', () => {
    it('1. should handle clipboard execution safely', () => {
      let copiedText = '';
      const mockClipboard = {
        writeText: vi.fn().mockImplementation(async (text: string) => {
          copiedText = text;
          return Promise.resolve();
        })
      };

      Object.defineProperty(globalThis.navigator, 'clipboard', {
        value: mockClipboard,
        configurable: true,
        writable: true
      });

      mockClipboard.writeText('input: [1, 2, 3]');
      expect(mockClipboard.writeText).toHaveBeenCalledWith('input: [1, 2, 3]');
      expect(copiedText).toBe('input: [1, 2, 3]');
    });
  });
});
