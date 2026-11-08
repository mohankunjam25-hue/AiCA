import React from 'react';
import { ArrayVisualPayload } from '../core/types';

interface ArrayRendererProps {
  payload: ArrayVisualPayload;
}

export function ArrayRenderer({ payload }: ArrayRendererProps) {
  const {
    data = [],
    pointers = {},
    activeIndices = [],
    modifiedIndices = [],
    matchedIndices = [],
    discardedRanges = [],
    windowRange
  } = payload;

  const isDiscarded = (idx: number) => {
    return discardedRanges.some(([start, end]) => idx >= start && idx <= end);
  };

  const isInWindow = (idx: number) => {
    if (!windowRange) return false;
    return idx >= windowRange[0] && idx <= windowRange[1];
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 min-h-[220px] w-full select-none overflow-x-auto">
      {/* Sliding Window Label (if active) */}
      {windowRange && (
        <div className="mb-2 text-xs font-mono font-semibold text-[#8250df] dark:text-[#a371f7] flex items-center gap-1.5 animate-in fade-in">
          <span>Active Window: [{windowRange[0]} ... {windowRange[1]}]</span>
          <span className="text-[11px] text-[#57606a] dark:text-[#8b949e]">
            (Length: {windowRange[1] - windowRange[0] + 1})
          </span>
        </div>
      )}

      {/* Main Array Elements Row */}
      <div className="relative flex items-center gap-2 pt-10 pb-12 px-4">
        {data.map((val, idx) => {
          const isActive = activeIndices.includes(idx);
          const isModified = modifiedIndices.includes(idx);
          const isMatched = matchedIndices.includes(idx);
          const discarded = isDiscarded(idx);
          const inWindow = isInWindow(idx);

          // Find pointers targeting this index
          const activePointers = Object.entries(pointers).filter(
            ([_, p]) => p.index === idx
          );

          return (
            <div key={idx} className="relative flex flex-col items-center">
              {/* Floating Top Pointers (L, Mid, R) */}
              {activePointers.length > 0 && (
                <div className="absolute -top-9 flex flex-col items-center z-20 animate-in fade-in slide-in-from-top-1 duration-200">
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
                className={`w-12 h-14 sm:w-14 sm:h-16 rounded-xl flex flex-col items-center justify-center border font-mono font-bold transition-all duration-300 relative ${
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
                <span className="text-base sm:text-lg">{val}</span>
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
    </div>
  );
}
