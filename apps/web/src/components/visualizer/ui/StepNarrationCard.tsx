import React from 'react';
import { Sparkles, Info, Clock } from 'lucide-react';
import { TraceFrame } from '../core/types';

interface StepNarrationCardProps {
  frame?: TraceFrame;
}

export function StepNarrationCard({ frame }: StepNarrationCardProps) {
  if (!frame) return null;

  const { narration, variables, actionType } = frame;

  return (
    <div className="p-3.5 rounded-xl border border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#161b22] space-y-2.5">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#0969da] dark:text-[#58a6ff] shrink-0" />
          <h4 className="text-xs font-bold text-[#1f2328] dark:text-[#f0f6fc]">
            {narration.title}
          </h4>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-white dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#30363d] text-[#656d76] dark:text-[#848d97]">
            {actionType}
          </span>
          {narration.complexityImpact && (
            <span className="flex items-center gap-1 text-[11px] font-mono text-[#1a7f37] dark:text-[#3fb950] font-semibold">
              <Clock className="w-3 h-3" />
              {narration.complexityImpact}
            </span>
          )}
        </div>
      </div>

      <p className="text-xs text-[#24292f] dark:text-[#c9d1d9] leading-relaxed">
        {narration.explanation}
      </p>

      {/* Variable State Pills */}
      {variables && Object.keys(variables).length > 0 && (
        <div className="flex items-center gap-2 pt-1 border-t border-[#d0d7de]/50 dark:border-[#30363d]/50 flex-wrap">
          <span className="text-[10px] uppercase font-bold text-[#57606a] dark:text-[#8b949e]">
            Scope:
          </span>
          {Object.entries(variables)
            .filter(([k]) => !k.startsWith('_'))
            .map(([key, val]) => (
              <span
                key={key}
                className="px-2 py-0.5 rounded-md bg-white dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#30363d] text-[11px] font-mono text-[#0969da] dark:text-[#58a6ff]"
              >
                <strong>{key}</strong> = {typeof val === 'object' ? JSON.stringify(val) : String(val)}
              </span>
            ))}
        </div>
      )}
    </div>
  );
}
