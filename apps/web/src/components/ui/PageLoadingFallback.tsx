import React from 'react';

export function PageLoadingFallback() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-12 min-h-[50vh] text-center select-none">
      <div className="relative w-8 h-8 mb-3">
        <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20" />
        <div className="absolute inset-0 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
      </div>
      <span className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400 animate-pulse">
        Loading module...
      </span>
    </div>
  );
}
