import { useEffect, useCallback } from 'react';

export interface ShortcutConfig {
  key: string; // e.g. 'Enter', 'b', '`', 'k', 'Escape'
  ctrlOrMeta?: boolean; // Ctrl on Win/Linux, Cmd on Mac
  shift?: boolean;
  alt?: boolean;
  description?: string;
  action: (e: KeyboardEvent) => void;
  preventDefault?: boolean;
  disabled?: boolean;
  allowInInputs?: boolean; // If true, triggers even if active element is an input/textarea
}

/**
 * Checks if the current OS is macOS.
 */
export function isMacOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Mac|iPod|iPhone|iPad/.test(navigator.platform || navigator.userAgent || '');
}

/**
 * Formats a visual keybinding string for display in UI tooltips/badges.
 * e.g. "Ctrl+Enter" or "⌘↵"
 */
export function formatShortcutBadge(config: Pick<ShortcutConfig, 'key' | 'ctrlOrMeta' | 'shift' | 'alt'>): string {
  const isMac = isMacOS();
  const parts: string[] = [];

  if (config.ctrlOrMeta) {
    parts.push(isMac ? '⌘' : 'Ctrl');
  }
  if (config.alt) {
    parts.push(isMac ? '⌥' : 'Alt');
  }
  if (config.shift) {
    parts.push(isMac ? '⇧' : 'Shift');
  }

  let keyDisplay = config.key;
  if (config.key.toLowerCase() === 'enter') {
    keyDisplay = '↵';
  } else if (config.key.toLowerCase() === 'escape') {
    keyDisplay = 'Esc';
  } else {
    keyDisplay = config.key.toUpperCase();
  }

  parts.push(keyDisplay);
  return isMac ? parts.join('') : parts.join('+');
}

/**
 * Global keyboard shortcuts hook with cross-platform (Mac/Win/Linux) modifier handling
 * and intelligent input field isolation to avoid conflict while typing.
 */
export function useKeyboardShortcuts(shortcuts: ShortcutConfig[], enabled: boolean = true) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      const isMac = isMacOS();
      const ctrlOrMetaPressed = isMac ? e.metaKey : e.ctrlKey;

      for (const shortcut of shortcuts) {
        if (shortcut.disabled) continue;

        // Check if focus is inside an input, textarea, or contentEditable element
        if (!shortcut.allowInInputs) {
          const target = e.target as HTMLElement | null;
          if (
            target &&
            (target.tagName === 'INPUT' ||
              target.tagName === 'TEXTAREA' ||
              target.isContentEditable)
          ) {
            continue;
          }
        }

        const matchKey = e.key.toLowerCase() === shortcut.key.toLowerCase();
        const matchCtrlOrMeta = shortcut.ctrlOrMeta ? ctrlOrMetaPressed : !e.ctrlKey && !e.metaKey;
        const matchShift = shortcut.shift ? e.shiftKey : !e.shiftKey;
        const matchAlt = shortcut.alt ? e.altKey : !e.altKey;

        if (matchKey && matchCtrlOrMeta && matchShift && matchAlt) {
          if (shortcut.preventDefault !== false) {
            e.preventDefault();
          }
          shortcut.action(e);
          break;
        }
      }
    },
    [shortcuts, enabled]
  );

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, enabled]);
}
