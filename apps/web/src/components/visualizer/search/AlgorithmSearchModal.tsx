import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, Sparkles, Clock, ArrowRight, Layers, Database, Cpu } from 'lucide-react';
import { AlgorithmDefinition } from '../core/types';
import { ALL_ALGORITHM_DEFINITIONS } from '../registry';

interface AlgorithmSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAlgorithm: (algoId: string) => void;
  currentAlgoId?: string;
}

const CATEGORIES = [
  'All',
  'Searching',
  'Sorting',
  'Graphs',
  'Dynamic Programming',
  'System Design'
];

export function AlgorithmSearchModal({
  isOpen,
  onClose,
  onSelectAlgorithm,
  currentAlgoId
}: AlgorithmSearchModalProps) {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedCategory('All');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Global ESC to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Filter algorithms
  const filteredAlgorithms = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ALL_ALGORITHM_DEFINITIONS.filter((algo) => {
      const matchCat =
        selectedCategory === 'All' ||
        algo.category.toLowerCase() === selectedCategory.toLowerCase();
      if (!matchCat) return false;

      if (!q) return true;
      return (
        algo.name.toLowerCase().includes(q) ||
        algo.category.toLowerCase().includes(q) ||
        algo.timeComplexity.toLowerCase().includes(q) ||
        algo.description.toLowerCase().includes(q)
      );
    });
  }, [query, selectedCategory]);

  // Keyboard navigation through search results
  useEffect(() => {
    const handleKeyNav = (e: KeyboardEvent) => {
      if (!isOpen || filteredAlgorithms.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredAlgorithms.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredAlgorithms.length) % filteredAlgorithms.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = filteredAlgorithms[selectedIndex];
        if (selected) {
          onSelectAlgorithm(selected.id);
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyNav);
    return () => window.removeEventListener('keydown', handleKeyNav);
  }, [isOpen, filteredAlgorithms, selectedIndex, onSelectAlgorithm, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header Input */}
        <div className="relative flex items-center px-4 py-3.5 border-b border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#0d1117]">
          <Search className="w-5 h-5 text-[#8c959f] dark:text-[#6e7681] mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search any algorithm (e.g., 'Binary Search', 'Knapsack', 'O(log n)')..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="w-full bg-transparent text-sm text-[#1f2328] dark:text-[#f0f6fc] placeholder-[#8c959f] dark:placeholder-[#6e7681] outline-none font-medium"
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-[#57606a] dark:text-[#8b949e] hover:bg-[#d0d7de]/50 dark:hover:bg-[#30363d]"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block px-2 py-0.5 rounded bg-white dark:bg-[#21262d] border border-[#d0d7de] dark:border-[#30363d] text-[10px] font-mono text-[#57606a] dark:text-[#8b949e]">
              ESC
            </kbd>
          )}
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-[#d0d7de]/60 dark:border-[#30363d]/60 bg-white dark:bg-[#161b22] overflow-x-auto scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setSelectedIndex(0);
              }}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#0969da] text-white shadow-2xs'
                  : 'bg-[#f6f8fa] dark:bg-[#21262d] text-[#57606a] dark:text-[#8b949e] hover:text-[#1f2328] dark:hover:text-[#f0f6fc]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 divide-y divide-[#d0d7de]/30 dark:divide-[#30363d]/30">
          {filteredAlgorithms.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <p className="text-xs text-[#57606a] dark:text-[#8b949e]">
                No algorithms found matching "<strong>{query}</strong>"
              </p>
              <p className="text-[11px] text-[#8c959f]">
                Try searching for "Binary Search", "Graph", "DP", or "LRU"
              </p>
            </div>
          ) : (
            filteredAlgorithms.map((algo, idx) => {
              const isSelected = selectedIndex === idx;
              const isCurrent = currentAlgoId === algo.id;

              return (
                <div
                  key={algo.id}
                  onClick={() => {
                    onSelectAlgorithm(algo.id);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#ddf4ff] dark:bg-[#388bfd1a] border-l-4 border-[#0969da]'
                      : 'hover:bg-[#f6f8fa] dark:hover:bg-[#21262d]/50'
                  }`}
                >
                  <div className="space-y-1 pr-3 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-[#1f2328] dark:text-[#f0f6fc]">
                        {algo.name}
                      </span>
                      <span className="px-2 py-0.2 rounded-full text-[10px] font-mono font-semibold bg-[#8250df]/10 text-[#8250df] dark:text-[#a371f7]">
                        {algo.category}
                      </span>
                      {isCurrent && (
                        <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-[#2ea0431a] text-[#1a7f37] dark:text-[#3fb950] border border-[#2ea04333]">
                          Active Now
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#57606a] dark:text-[#8b949e] line-clamp-1">
                      {algo.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-white dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#30363d] text-[#0969da] dark:text-[#58a6ff]">
                      {algo.timeComplexity}
                    </span>
                    <ArrowRight className={`w-4 h-4 transition-transform ${isSelected ? 'translate-x-1 text-[#0969da]' : 'text-[#8c959f]'}`} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer Hotkeys */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#0d1117] text-[11px] text-[#57606a] dark:text-[#8b949e]">
          <div className="flex items-center gap-3">
            <span><kbd className="font-mono bg-white dark:bg-[#21262d] px-1 rounded border border-[#d0d7de] dark:border-[#30363d]">↑↓</kbd> Navigate</span>
            <span><kbd className="font-mono bg-white dark:bg-[#21262d] px-1 rounded border border-[#d0d7de] dark:border-[#30363d]">Enter</kbd> Visualize</span>
          </div>
          <span>Total {filteredAlgorithms.length} Algorithms</span>
        </div>
      </div>
    </div>
  );
}
