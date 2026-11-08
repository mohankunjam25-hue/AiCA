import React from 'react';
import { ArrayVisualPayload } from '../core/types';
import { Cpu, Variable } from 'lucide-react';

interface ArrayRendererProps {
  payload: ArrayVisualPayload;
}

export function ArrayRenderer({ payload }: ArrayRendererProps) {
  const {
    data = [],
    secondaryData,
    secondaryLabel = 'Output / Merged Array',
    pointers = {},
    activeIndices = [],
    modifiedIndices = [],
    matchedIndices = [],
    discardedRanges = [],
    windowRange,
    variables = {}
  } = payload;

  const isDiscarded = (idx: number) => {
    return discardedRanges.some(([start, end]) => idx >= start && idx <= end);
  };

  const isInWindow = (idx: number) => {
    if (!windowRange) return false;
    return idx >= windowRange[0] && idx <= windowRange[1];
  };

  const formatItem = (val: any) => {
    if (Array.isArray(val)) {
      return `[${val.join(', ')}]`;
    }
    if (typeof val === 'object' && val !== null) {
      return JSON.stringify(val);
    }
    return String(val);
  };

  // If array data is empty, render memory inspection fallback rather than blank screen
  if (!data || data.length === 0) {
    const varEntries = Object.entries(variables).filter(
      ([k]) => !k.startsWith('_')
    );

    return (
      <div className="flex flex-col items-center justify-center p-6 min-h-[220px] w-full select-none text-center animate-in fade-in">
        <div className="w-12 h-12 rounded-2xl bg-[#8250df1a] text-[#8250df] dark:text-[#a371f7] flex items-center justify-center mb-3 shadow-xs">
          <Cpu className="w-6 h-6 animate-pulse" />
        </div>
        <h4 className="text-sm font-bold text-[#1f2328] dark:text-[#f0f6fc] mb-1">
          {varEntries.length > 0 ? 'Active Execution State' : 'Initializing Execution Step'}
        </h4>
        <p className="text-xs text-[#57606a] dark:text-[#8b949e] max-w-sm mb-4">
          {varEntries.length > 0
            ? 'Monitoring active memory registers and variable mutations at this execution frame.'
            : 'Step forward or click Play to trace variable assignments and pointer movements.'}
        </p>

        {varEntries.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-2 max-w-lg">
            {varEntries.map(([k, v]) => (
              <span
                key={k}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#21262d] border border-[#d0d7de] dark:border-[#30363d] text-xs font-mono shadow-2xs"
              >
                <span className="text-[#0969da] dark:text-[#58a6ff] font-semibold">{k}</span>
                <span className="text-[#57606a] dark:text-[#8b949e] mx-1">=</span>
                <span className="text-[#1f2328] dark:text-[#e6edf3] font-bold">
                  {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                </span>
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-6 min-h-[220px] w-full select-none overflow-x-auto space-y-4">
      {/* Sliding Window Label (if active) */}
      {windowRange && (
        <div className="text-xs font-mono font-semibold text-[#8250df] dark:text-[#a371f7] flex items-center gap-1.5 animate-in fade-in">
          <span>Active Window: [{windowRange[0]} ... {windowRange[1]}]</span>
          <span className="text-[11px] text-[#57606a] dark:text-[#8b949e]">
            (Length: {windowRange[1] - windowRange[0] + 1})
          </span>
        </div>
      )}

      {/* Main Array Elements Row */}
      <div className="relative flex items-center gap-2 pt-8 pb-4 px-4 overflow-x-auto max-w-full">
        {data.map((val, idx) => {
          const isActive = activeIndices.includes(idx);
          const isModified = modifiedIndices.includes(idx);
          const isMatched = matchedIndices.includes(idx);
          const discarded = isDiscarded(idx);
          const inWindow = isInWindow(idx);
          const formatted = formatItem(val);
          const isWide = formatted.length > 3;

          // Find pointers targeting this index
          const activePointers = Object.entries(pointers).filter(
            ([_, p]) => p.index === idx
          );

          return (
            <div key={idx} className="relative flex flex-col items-center shrink-0">
              {/* Floating Top Pointers (L, Mid, R, etc) */}
              {activePointers.length > 0 && (
                <div className="absolute -top-8 flex flex-col items-center z-20 animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="flex items-center gap-1">
                    {activePointers.map(([key, p]) => (
                      <span
                        key={key}
                        style={{ backgroundColor: p.color || '#0969da' }}
                        className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold text-white shadow-xs"
                      >
                        {p.label || key}
                      </span>
                    ))}
                  </div>
                  <div className="w-0.5 h-2 bg-[#0969da] dark:bg-[#58a6ff] mt-0.5" />
                </div>
              )}

              {/* Array Box / Bar */}
              <div
                className={`${
                  isWide ? 'min-w-[64px] px-3.5' : 'w-12 sm:w-14'
                } h-14 sm:h-16 rounded-xl flex flex-col items-center justify-center border font-mono font-bold transition-all duration-300 relative ${
                  isMatched
                    ? 'bg-[#dafbe1] dark:bg-[#2ea04326] border-[#1a7f37] dark:border-[#3fb950] text-[#1a7f37] dark:text-[#3fb950] scale-110 shadow-md ring-2 ring-emerald-400/50'
                    : isActive
                    ? 'bg-[#ddf4ff] dark:bg-[#388bfd26] border-[#0969da] dark:border-[#58a6ff] text-[#0969da] dark:text-[#58a6ff] scale-105 shadow-sm'
                    : isModified
                    ? 'bg-[#fff8c5] dark:bg-[#bb800926] border-[#9a6700] dark:border-[#d29922] text-[#9a6700] dark:text-[#d29922] scale-105'
                    : inWindow
                    ? 'bg-[#fbefff] dark:bg-[#8250df26] border-[#8250df] dark:border-[#a371f7] text-[#8250df] dark:text-[#a371f7]'
                    : discarded
                    ? 'bg-[#f6f8fa]/60 dark:bg-[#161b22]/40 border-[#d0d7de]/40 dark:border-[#30363d]/40 text-[#8c959f] dark:text-[#484f58] opacity-40'
                    : 'bg-white dark:bg-[#0d1117] border-[#d0d7de] dark:border-[#30363d] text-[#1f2328] dark:text-[#f0f6fc] shadow-2xs hover:border-[#8c959f]'
                }`}
              >
                <span className="text-sm sm:text-base whitespace-nowrap">{formatted}</span>
              </div>

              {/* Index Subscript */}
              <span
                className={`text-[10px] font-mono mt-1.5 transition-colors ${
                  activePointers.length > 0
                    ? 'text-[#0969da] dark:text-[#58a6ff] font-bold'
                    : 'text-[#8c959f] dark:text-[#6e7681]'
                }`}
              >
                [{idx}]
              </span>
            </div>
          );
        })}
      </div>

      {/* Secondary Data Row (e.g. Merged Intervals Output) */}
      {secondaryData && secondaryData.length > 0 && (
        <div className="flex flex-col items-center pt-2 border-t border-[#d0d7de]/60 dark:border-[#30363d]/60 w-full animate-in fade-in">
          <span className="text-[11px] font-mono font-bold text-[#1a7f37] dark:text-[#3fb950] mb-2 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2ea043]" />
            {secondaryLabel} ({secondaryData.length} items)
          </span>
          <div className="flex items-center gap-2 px-4 overflow-x-auto max-w-full pb-2">
            {secondaryData.map((sVal, sIdx) => (
              <div
                key={sIdx}
                className="min-w-[60px] px-3 h-10 rounded-lg bg-[#dafbe1]/60 dark:bg-[#2ea0431a] border border-[#1a7f37]/40 dark:border-[#3fb950]/40 flex items-center justify-center font-mono text-xs font-bold text-[#1a7f37] dark:text-[#3fb950] shadow-2xs"
              >
                {formatItem(sVal)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
