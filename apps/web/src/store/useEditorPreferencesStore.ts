import { create } from 'zustand';

export interface EditorPreferences {
  fontSize: number;
  tabSize: number;
  minimap: boolean;
  bracketPairColorization: boolean;
  wordWrap: 'on' | 'off';
  fontFamily: string;
  setFontSize: (size: number) => void;
  setTabSize: (size: number) => void;
  setMinimap: (enabled: boolean) => void;
  setBracketPairColorization: (enabled: boolean) => void;
  setWordWrap: (wrap: 'on' | 'off') => void;
  setFontFamily: (family: string) => void;
  resetDefaults: () => void;
}

export type EditorPreferencesData = Pick<
  EditorPreferences,
  'fontSize' | 'tabSize' | 'minimap' | 'bracketPairColorization' | 'wordWrap' | 'fontFamily'
>;

const STORAGE_KEY = 'aica_editor_preferences';

const DEFAULT_PREFERENCES: EditorPreferencesData = {
  fontSize: 14,
  tabSize: 4,
  minimap: false,
  bracketPairColorization: true,
  wordWrap: 'on',
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
};

function loadSavedPreferences(): EditorPreferencesData {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_PREFERENCES, ...parsed };
    }
  } catch (err) {
    console.warn('Failed to parse saved editor preferences:', err);
  }
  return DEFAULT_PREFERENCES;
}

function persistPreferences(state: Partial<EditorPreferencesData>) {
  if (typeof window === 'undefined') return;
  try {
    const current = loadSavedPreferences();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...state }));
  } catch (err) {
    console.warn('Failed to persist editor preferences:', err);
  }
}

export const useEditorPreferencesStore = create<EditorPreferences>((set) => {
  const initial = loadSavedPreferences();

  return {
    ...initial,
    setFontSize: (fontSize) => {
      persistPreferences({ fontSize });
      set({ fontSize });
    },
    setTabSize: (tabSize) => {
      persistPreferences({ tabSize });
      set({ tabSize });
    },
    setMinimap: (minimap) => {
      persistPreferences({ minimap });
      set({ minimap });
    },
    setBracketPairColorization: (bracketPairColorization) => {
      persistPreferences({ bracketPairColorization });
      set({ bracketPairColorization });
    },
    setWordWrap: (wordWrap) => {
      persistPreferences({ wordWrap });
      set({ wordWrap });
    },
    setFontFamily: (fontFamily) => {
      persistPreferences({ fontFamily });
      set({ fontFamily });
    },
    resetDefaults: () => {
      persistPreferences(DEFAULT_PREFERENCES);
      set(DEFAULT_PREFERENCES);
    },
  };
});
