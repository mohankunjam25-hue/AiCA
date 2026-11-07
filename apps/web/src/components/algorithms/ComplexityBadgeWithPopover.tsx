import React, { useState, useRef, useEffect } from 'react';
import { Info, Clock3, HardDrive, Sparkles } from 'lucide-react';

export function parseComplexityBreakdown(timeStr: string, spaceStr?: string, name?: string) {
  // Extract primary O(...) notation
  const timeMatch = timeStr.match(/(O\([^)]+\))/i);
  const primaryTime = timeMatch ? timeMatch[1] : timeStr.split(' ')[0] || timeStr;

  const spaceMatch = spaceStr?.match(/(O\([^)]+\))/i);
  const primarySpace = spaceMatch ? spaceMatch[1] : spaceStr?.split(' ')[0] || spaceStr || 'O(1)';

  let bestCase = primaryTime;
  let averageCase = primaryTime;
  let worstCase = primaryTime;
  let note = '';

  const lower = timeStr.toLowerCase();
  const nameLower = (name || '').toLowerCase();

  if (lower.includes('insertion') || nameLower.includes('insertion')) {
    bestCase = 'O(n) (Presorted inputs)';
    averageCase = 'O(n²) (Random shuffled order)';
    worstCase = 'O(n²) (Reverse sorted)';
    note = 'In-place stable sort. Optimal when array is small or mostly sorted.';
  } else if (lower.includes('quick') || nameLower.includes('quick')) {
    bestCase = 'O(n log n) (Balanced pivot splits)';
    averageCase = 'O(n log n)';
    worstCase = 'O(n²) (Unbalanced pivot skew)';
    note = 'Fastest general sort in practice due to CPU cache locality and small constant factors.';
  } else if (lower.includes('merge') || nameLower.includes('merge')) {
    bestCase = 'O(n log n)';
    averageCase = 'O(n log n)';
    worstCase = 'O(n log n)';
    note = 'Guaranteed asymptotic performance across all inputs, requiring O(n) auxiliary memory.';
  } else if (lower.includes('binary') || nameLower.includes('binary')) {
    bestCase = 'O(1) (Target found on initial mid check)';
    averageCase = 'O(log n)';
    worstCase = 'O(log n)';
    note = 'Halves search boundaries each iteration. Requires presorted inputs.';
  } else if (lower.includes('v + e') || primaryTime.includes('V + E')) {
    bestCase = 'O(1) (Start node is target)';
    averageCase = 'O(V + E)';
    worstCase = 'O(V + E)';
    note = 'Visits each vertex and edge once. Space is bounded by the queue or call stack.';
  } else if (primaryTime.includes('O(n)')) {
    bestCase = 'O(1) or O(n)';
    averageCase = 'O(n)';
    worstCase = 'O(n)';
    note = 'Single pass linear scan or amortized hash-map evaluation.';
  }

  const hasDetails =
    timeStr.length > primaryTime.length ||
    Boolean(spaceStr && spaceStr.length > primarySpace.length) ||
    Boolean(note);

  return {
    primaryTime,
    primarySpace,
    bestCase,
    averageCase,
    worstCase,
    hasDetails,
    note
  };
}

export function getBadgeColorClasses(complexity: string) {
  const c = complexity.toLowerCase();
  if (c.includes('1') || (c.includes('log n') && !c.includes('n log'))) {
    return 'bg-[#dafbe1] dark:bg-[#2ea04326] text-[#1a7f37] dark:text-[#3fb950] border-[#4ac26b66] dark:border-[#2ea0434d] hover:border-[#1a7f37]';
  }
  if (c.includes('n') && !c.includes('n log') && !c.includes('n²') && !c.includes('n^2') && !c.includes('v + e')) {
    return 'bg-[#ddf4ff] dark:bg-[#388bfd26] text-[#0969da] dark:text-[#58a6ff] border-[#54aeff66] dark:border-[#388bfd4d] hover:border-[#0969da]';
  }
  if (c.includes('n log') || c.includes('v + e')) {
    return 'bg-[#fff8c5] dark:bg-[#bb800926] text-[#9a6700] dark:text-[#d29922] border-[#d4a72c66] dark:border-[#bb80094d] hover:border-[#9a6700]';
  }
  return 'bg-[#ffebe9] dark:bg-[#f8514926] text-[#cf222e] dark:text-[#f85149] border-[#ff818266] dark:border-[#f851494d] hover:border-[#cf222e]';
}

export function ComplexityBadgeWithPopover({
  timeComplexity,
  spaceComplexity,
  algorithmName
}: {
  timeComplexity: string;
  spaceComplexity?: string;
  algorithmName?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<any>(null);

  const breakdown = parseComplexityBreakdown(timeComplexity, spaceComplexity, algorithmName);
  const colorClasses = getBadgeColorClasses(breakdown.primaryTime);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 120);
  };

  // Close when clicked outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative inline-flex items-center justify-center"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label={`Time complexity ${breakdown.primaryTime}. Click for asymptotic breakdown.`}
        className={`px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold border transition-all duration-150 cursor-pointer whitespace-nowrap shadow-2xs flex items-center gap-1 ${colorClasses}`}
      >
        <span>{breakdown.primaryTime}</span>
        {breakdown.hasDetails && (
          <Info className="w-2.5 h-2.5 opacity-60 hover:opacity-100 transition-opacity" />
        )}
      </button>

      {/* Floating Popover Tooltip (Smooth Transition & Professional Light/Dark Theme) */}
      <div
        role="tooltip"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 w-76 sm:w-80 p-4 rounded-2xl bg-white/95 dark:bg-[#161b22]/95 backdrop-blur-md text-[#1f2328] dark:text-[#f0f6fc] border border-[#d0d7de] dark:border-[#30363d] shadow-xl shadow-slate-900/10 dark:shadow-2xl dark:shadow-black/70 z-50 text-left select-text transition-all duration-200 ease-out origin-bottom ${
          isOpen
            ? 'opacity-100 visible translate-y-0 scale-100 pointer-events-auto'
            : 'opacity-0 invisible translate-y-1.5 scale-95 pointer-events-none'
        }`}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-[#d0d7de]/70 dark:border-[#30363d] pb-2.5 mb-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#57606a] dark:text-[#8b949e] flex items-center gap-1.5">
            <Clock3 className="w-3.5 h-3.5 text-[#0969da] dark:text-[#58a6ff]" />
            Asymptotic Profile
          </span>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#0969da]/10 text-[#0969da] dark:bg-[#388bfd26] dark:text-[#58a6ff] border border-[#54aeff44] dark:border-[#388bfd4d]">
            {algorithmName || 'Breakdown'}
          </span>
        </div>

        {/* Structured Cases Grid */}
        <div className="space-y-1.5 text-xs">
          {/* Best Case */}
          <div className="flex items-center justify-between py-1 border-b border-[#d0d7de]/40 dark:border-[#30363d]/40">
            <span className="flex items-center gap-1.5 text-[#57606a] dark:text-[#8b949e] text-[11px] font-medium">
              <span className="w-2 h-2 rounded-full bg-[#2ea043]" />
              Best Case:
            </span>
            <span className="font-mono font-semibold text-[#1a7f37] dark:text-[#3fb950] text-[11px]">
              {breakdown.bestCase}
            </span>
          </div>

          {/* Average Case */}
          <div className="flex items-center justify-between py-1 border-b border-[#d0d7de]/40 dark:border-[#30363d]/40">
            <span className="flex items-center gap-1.5 text-[#57606a] dark:text-[#8b949e] text-[11px] font-medium">
              <span className="w-2 h-2 rounded-full bg-[#bb8009]" />
              Average Case:
            </span>
            <span className="font-mono font-semibold text-[#9a6700] dark:text-[#d29922] text-[11px]">
              {breakdown.averageCase}
            </span>
          </div>

          {/* Worst Case */}
          <div className="flex items-center justify-between py-1 border-b border-[#d0d7de]/40 dark:border-[#30363d]/40">
            <span className="flex items-center gap-1.5 text-[#57606a] dark:text-[#8b949e] text-[11px] font-medium">
              <span className="w-2 h-2 rounded-full bg-[#cf222e]" />
              Worst Case:
            </span>
            <span className="font-mono font-semibold text-[#cf222e] dark:text-[#f85149] text-[11px]">
              {breakdown.worstCase}
            </span>
          </div>

          {/* Auxiliary Space */}
          {spaceComplexity && (
            <div className="flex items-center justify-between py-1 pt-1.5">
              <span className="flex items-center gap-1.5 text-[#57606a] dark:text-[#8b949e] text-[11px] font-medium">
                <HardDrive className="w-3.5 h-3.5 text-[#8250df] dark:text-[#a371f7]" />
                Auxiliary Space:
              </span>
              <span className="font-mono font-semibold text-[#8250df] dark:text-[#a371f7] text-[11px]">
                {spaceComplexity}
              </span>
            </div>
          )}
        </div>

        {/* Behavior Context Note */}
        {breakdown.note && (
          <div className="mt-2.5 pt-2 border-t border-[#d0d7de]/70 dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#0d1117] rounded-xl p-2.5 text-[11px] text-[#57606a] dark:text-[#8b949e] leading-relaxed">
            <strong className="text-[#1f2328] dark:text-[#f0f6fc]">Performance Note:</strong> {breakdown.note}
          </div>
        )}

        {/* Seamless Rotated Triangle Pointer */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1.5 w-3 h-3 rotate-45 bg-white dark:bg-[#161b22] border-r border-b border-[#d0d7de] dark:border-[#30363d]" />
      </div>
    </div>
  );
}

export function SpaceComplexityBadgeWithPopover({
  spaceComplexity
}: {
  spaceComplexity: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<any>(null);

  const match = spaceComplexity.match(/(O\([^)]+\))/i);
  const primarySpace = match ? match[1] : spaceComplexity.split(' ')[0] || spaceComplexity;
  const hasExtra = spaceComplexity.length > primarySpace.length;

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 120);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative inline-flex items-center justify-center font-mono text-[11px]"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="px-2 py-0.5 rounded text-[11px] font-mono text-[#656d76] dark:text-[#848d97] hover:bg-[#eaeef2] dark:hover:bg-[#21262d] transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap"
      >
        <span>{primarySpace}</span>
        {hasExtra && <Info className="w-2.5 h-2.5 opacity-50" />}
      </button>

      {hasExtra && (
        <div
          role="tooltip"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 rounded-xl bg-white/95 dark:bg-[#161b22]/95 backdrop-blur-md text-[#1f2328] dark:text-[#f0f6fc] border border-[#d0d7de] dark:border-[#30363d] shadow-lg shadow-slate-900/10 dark:shadow-xl dark:shadow-black/60 z-50 text-left text-xs transition-all duration-200 ease-out origin-bottom ${
            isOpen
              ? 'opacity-100 visible translate-y-0 scale-100 pointer-events-auto'
              : 'opacity-0 invisible translate-y-1.5 scale-95 pointer-events-none'
          }`}
        >
          <div className="text-[10px] uppercase font-bold text-[#57606a] dark:text-[#8b949e] mb-1">
            Auxiliary Memory Detail
          </div>
          <p className="text-[11px] text-[#1f2328] dark:text-[#f0f6fc] font-mono leading-relaxed">
            {spaceComplexity}
          </p>
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1.5 w-3 h-3 rotate-45 bg-white dark:bg-[#161b22] border-r border-b border-[#d0d7de] dark:border-[#30363d]" />
        </div>
      )}
    </div>
  );
}
