import React, { useState } from 'react';
import { Database, Terminal, AlertTriangle, ChevronDown, ChevronUp, X } from 'lucide-react';
import { FlowchartExecutionStep } from '@aica/shared';

interface FlowchartMemoryHUDProps {
  step: FlowchartExecutionStep | null;
  output: string;
  error?: string | null;
}

export function FlowchartMemoryHUD({ step, output, error }: FlowchartMemoryHUDProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const variables = step?.variables || {};
  const prevVariables = step?.previousVariables || {};
  const varEntries = Object.entries(variables);

  // If collapsed, show compact glassmorphic pill
  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-2xl backdrop-blur-md text-xs transition cursor-pointer ${
          error
            ? 'bg-rose-950/80 border-rose-600 text-rose-200 animate-pulse'
            : 'bg-slate-900/90 dark:bg-[#161b22]/95 border-slate-700/80 text-slate-200 hover:text-white hover:border-slate-500'
        }`}
        title="Click to inspect Memory Registers & State"
      >
        <Database className="w-3.5 h-3.5 text-cyan-400" />
        <span className="font-semibold text-xs hidden sm:inline">Memory</span>
        {varEntries.length > 0 && (
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
            {varEntries.length} vars
          </span>
        )}
        {step && (
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-blue-950 text-blue-300 border border-blue-800">
            Step {step.stepIndex}
          </span>
        )}
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-3.5 bg-slate-900/95 dark:bg-[#161b22]/95 border border-slate-700/80 dark:border-[#30363d] rounded-2xl shadow-2xl backdrop-blur-md text-xs w-72 sm:w-80 max-h-[460px] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-1.5 font-semibold text-slate-200">
          <Database className="w-3.5 h-3.5 text-cyan-400" />
          <span>Execution Memory & State</span>
        </div>
        <div className="flex items-center gap-1.5">
          {step && (
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
              Step {step.stepIndex}
            </span>
          )}
          <button
            onClick={() => setIsExpanded(false)}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Minimize Memory HUD"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Step Action / Narrative */}
      {step ? (
        <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800/80">
          <div className="text-[10px] text-slate-400 uppercase font-mono mb-1">
            Active Block: <span className="text-white font-bold">{step.nodeLabel}</span> ({step.nodeType})
          </div>
          <div className="text-xs font-mono text-cyan-300 break-words">
            {step.action}
          </div>
        </div>
      ) : (
        <div className="text-xs text-slate-500 italic p-2 text-center">
          Click Play or Step to inspect execution.
        </div>
      )}

      {/* Runtime Error alert */}
      {error && (
        <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-700/80 text-rose-300 text-xs flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
          <div>
            <div className="font-bold">Execution Error:</div>
            <div className="font-mono text-[11px] mt-0.5">{error}</div>
          </div>
        </div>
      )}

      {/* Variable Registers */}
      <div className="flex-1 overflow-y-auto space-y-1.5 max-h-40">
        <div className="text-[10px] text-slate-400 uppercase font-mono font-semibold">
          Variable Registers
        </div>
        {varEntries.length > 0 ? (
          <div className="divide-y divide-slate-800/60 rounded-lg border border-slate-800 bg-slate-950/60">
            {varEntries.map(([name, val]) => {
              const isChanged =
                prevVariables[name] !== undefined &&
                JSON.stringify(prevVariables[name]) !== JSON.stringify(val);

              return (
                <div
                  key={name}
                  className={`flex items-center justify-between px-2.5 py-1 font-mono transition-colors ${
                    isChanged ? 'bg-emerald-950/40 text-emerald-300' : 'text-slate-300'
                  }`}
                >
                  <span className="font-bold text-slate-400">{name}</span>
                  <div className="flex items-center gap-1.5">
                    {isChanged && (
                      <span className="text-[9px] px-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                        UPDATED
                      </span>
                    )}
                    <span className="text-cyan-200">{formatVal(val)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-[11px] text-slate-500 italic px-2 py-1">
            No variables in memory.
          </div>
        )}
      </div>

      {/* Output Stream */}
      <div className="border-t border-slate-800/80 pt-2">
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 uppercase font-mono mb-1">
          <Terminal className="w-3 h-3 text-emerald-400" />
          <span>Output Stream</span>
        </div>
        <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-400 min-h-[36px] max-h-20 overflow-y-auto whitespace-pre-wrap">
          {output ? output : <span className="text-slate-600 italic">No output produced yet</span>}
        </div>
      </div>
    </div>
  );
}

function formatVal(v: any): string {
  if (Array.isArray(v)) {
    return `[${v.join(', ')}]`;
  }
  if (typeof v === 'object' && v !== null) {
    return JSON.stringify(v);
  }
  return String(v);
}
