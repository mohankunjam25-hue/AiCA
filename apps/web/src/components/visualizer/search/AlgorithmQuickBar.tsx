import React from 'react';
import { Search, ChevronDown, Sparkles } from 'lucide-react';
import { AlgorithmDefinition } from '../core/types';
import { ALL_ALGORITHM_DEFINITIONS } from '../registry';

interface AlgorithmQuickBarProps {
  currentAlgo: AlgorithmDefinition;
  onOpenSearch: () => void;
  onSelectAlgorithm: (algoId: string) => void;
}

export function AlgorithmQuickBar({
  currentAlgo,
  onOpenSearch,
  onSelectAlgorithm
}: AlgorithmQuickBarProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Prominent Search Palette Trigger Button */}
      <button
        onClick={onOpenSearch}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] hover:bg-[#eaeef2] dark:bg-[#0d1117] dark:hover:bg-[#21262d] text-[#57606a] dark:text-[#8b949e] hover:text-[#1f2328] dark:hover:text-[#f0f6fc] text-xs font-medium transition cursor-pointer shadow-2xs group"
        title="Search any algorithm (Ctrl+K)"
      >
        <Search className="w-3.5 h-3.5 text-[#8c959f] group-hover:text-[#0969da] transition-colors" />
        <span className="hidden sm:inline font-sans">Search algorithms...</span>
        <span className="sm:hidden font-sans">Search...</span>
        <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white dark:bg-[#21262d] border border-[#d0d7de] dark:border-[#30363d] text-[10px] font-mono text-[#57606a] dark:text-[#8b949e]">
          ⌘K
        </kbd>
      </button>

      {/* Quick Dropdown Select */}
      <div className="relative">
        <select
          value={currentAlgo.id}
          onChange={(e) => onSelectAlgorithm(e.target.value)}
          className="appearance-none pl-3 pr-8 py-1.5 rounded-xl border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] text-xs font-semibold text-[#1f2328] dark:text-[#f0f6fc] cursor-pointer focus:ring-1 focus:ring-[#0969da] outline-none shadow-2xs"
        >
          {ALL_ALGORITHM_DEFINITIONS.map((def) => (
            <option key={def.id} value={def.id}>
              {def.name} ({def.category})
            </option>
          ))}
        </select>
        <ChevronDown className="w-3.5 h-3.5 text-[#57606a] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>
    </div>
  );
}
