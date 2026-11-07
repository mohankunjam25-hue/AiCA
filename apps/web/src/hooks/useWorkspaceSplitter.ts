import { useState, useEffect, useRef, useCallback } from 'react';

export interface UseWorkspaceSplitterOptions {
  storageKey?: string;
  defaultSplit?: number; // e.g. 40 (%)
  min?: number; // Minimum left percentage (e.g. 20)
  max?: number; // Maximum left percentage (e.g. 75)
}

export interface SplitterProps {
  onMouseDown: (e: React.MouseEvent) => void;
  onDoubleClick: () => void;
  title: string;
}

export interface UseWorkspaceSplitterReturn {
  containerRef: React.RefObject<HTMLDivElement>;
  leftWidth: number;
  setLeftWidth: React.Dispatch<React.SetStateAction<number>>;
  isDragging: boolean;
  resetSplit: () => void;
  splitterProps: SplitterProps;
}

/**
 * Decoupled draggable workspace splitter hook.
 * Manages responsive horizontal split ratios, mouse drag physics,
 * boundary clamping, and local storage persistence.
 */
export function useWorkspaceSplitter(
  options: UseWorkspaceSplitterOptions = {}
): UseWorkspaceSplitterReturn {
  const {
    storageKey = 'aica_workspace_left_split',
    defaultSplit = 40,
    min = 20,
    max = 75
  } = options;

  const containerRef = useRef<HTMLDivElement>(null);
  const [leftWidth, setLeftWidth] = useState<number>(() => {
    if (typeof window === 'undefined') return defaultSplit;
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? Math.min(max, Math.max(min, parseFloat(saved))) : defaultSplit;
    } catch {
      return defaultSplit;
    }
  });
  const [isDragging, setIsDragging] = useState<boolean>(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width <= 0) return;
      const rawPercent = ((e.clientX - rect.left) / rect.width) * 100;
      const clampedPercent = Math.min(max, Math.max(min, rawPercent));
      setLeftWidth(clampedPercent);
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        try {
          localStorage.setItem(storageKey, String(leftWidth));
        } catch {}
      }
    };

    if (isDragging) {
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, leftWidth, max, min, storageKey]);

  const resetSplit = useCallback(() => {
    setLeftWidth(defaultSplit);
    try {
      localStorage.setItem(storageKey, String(defaultSplit));
    } catch {}
  }, [defaultSplit, storageKey]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  return {
    containerRef,
    leftWidth,
    setLeftWidth,
    isDragging,
    resetSplit,
    splitterProps: {
      onMouseDown,
      onDoubleClick: resetSplit,
      title: `Drag to resize panels (Double click to reset to ${defaultSplit}%)`
    }
  };
}
