import React from 'react';
import { Database, AlertTriangle, X, Activity, CheckCircle, ArrowRight } from 'lucide-react';
import { FlowchartExecutionStep } from '@aica/shared';

interface FlowchartInspectorProps {
  step: FlowchartExecutionStep | null;
  error?: string | null;
  isOpen: boolean;
  onClose: () => void;
  currentStepIndex: number;
  totalSteps: number;
}

export function FlowchartInspector({
  step,
  error,
  isOpen,
  onClose,
  currentStepIndex,
  totalSteps,
}: FlowchartInspectorProps) {
  if (!isOpen) return null;

  const variables = step?.variables || {};
  const prevVariables = step?.previousVariables || {};
  const varEntries = Object.entries(variables);

  return (
    <aside className="w-80 md:w-88 border-l border-slate-800/90 bg-slate-900/95 dark:bg-[#161b22]/98 backdrop-blur-md flex flex-col h-full z-10 shrink-0 select-none animate-in slide-in-from-right-4 duration-200">
      {/* Inspector Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-slate-800 bg-slate-900 dark:bg-[#161b22]">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold text-xs text-slate-200 tracking-wide">
            Execution Inspector
          </span>
        </div>

        <div className="flex items-center gap-2">
          {totalSteps > 0 && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800">
              Step {currentStepIndex}/{totalSteps}
            </span>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Collapse Inspector"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Inspector Body */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 scrollbar-thin">
        {/* Step Action / Narrative Card */}
        {step ? (
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                Active Block
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded uppercase font-semibold bg-cyan-950 text-cyan-300 border border-cyan-800">
                {step.nodeType}
              </span>
            </div>

            <div className="font-mono text-sm font-bold text-white flex items-center gap-1.5">
              <span>{step.nodeLabel}</span>
            </div>

            <div className="text-xs font-mono text-cyan-300 break-words leading-relaxed pt-1 border-t border-slate-800/80">
              {step.action}
            </div>

            {/* Decision branch indicator if present */}
            {step.evaluatedCondition && (
              <div className="flex items-center gap-1.5 text-xs font-mono pt-1">
                <span className="text-slate-400">Branch:</span>
                <span
                  className={`px-1.5 py-0.2 rounded font-bold text-[11px] ${
                    step.evaluatedCondition.branchTaken === 'TRUE'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                      : 'bg-rose-950 text-rose-300 border border-rose-700'
                  }`}
                >
                  {step.evaluatedCondition.branchTaken}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/60 text-center space-y-1.5">
            <Activity className="w-5 h-5 text-slate-500 mx-auto" />
            <div className="text-xs font-semibold text-slate-400">
              Execution Idle
            </div>
            <div className="text-[11px] text-slate-500 leading-normal">
              Click <span className="text-blue-400 font-semibold">Play</span> or <span className="text-blue-400 font-semibold">Step Forward</span> to inspect live runtime variables.
            </div>
          </div>
        )}

        {/* Runtime Error alert */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-700/80 text-rose-300 text-xs flex items-start gap-2 shadow-lg">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <div className="space-y-0.5">
              <div className="font-bold text-rose-200">Execution Error:</div>
              <div className="font-mono text-[11px] text-rose-300/90 leading-tight">
                {error}
              </div>
            </div>
          </div>
        )}

        {/* Variable Registers */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] uppercase font-mono font-semibold text-slate-400">
            <span>Variable Registers</span>
            <span className="text-[10px] text-slate-500">{varEntries.length} active</span>
          </div>

          {varEntries.length > 0 ? (
            <div className="divide-y divide-slate-800/70 rounded-xl border border-slate-800 bg-slate-950/80 overflow-hidden">
              {varEntries.map(([name, val]) => {
                const isChanged =
                  prevVariables[name] !== undefined &&
                  JSON.stringify(prevVariables[name]) !== JSON.stringify(val);

                return (
                  <div
                    key={name}
                    className={`flex items-center justify-between px-3 py-2 font-mono text-xs transition-colors ${
                      isChanged ? 'bg-emerald-950/40 text-emerald-300' : 'text-slate-300'
                    }`}
                  >
                    <span className="font-bold text-slate-400">{name}</span>
                    <div className="flex items-center gap-2">
                      {isChanged && (
                        <span className="text-[9px] px-1 py-0.2 rounded font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse">
                          UPDATED
                        </span>
                      )}
                      <span className="text-cyan-200 font-semibold tracking-tight">
                        {formatVal(val)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 text-[11px] text-slate-500 italic text-center">
              No variables in memory.
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

function formatVal(v: any): string {
  if (Array.isArray(v)) {
    return `[${v.map((item) => (Array.isArray(item) ? `[${item.join(', ')}]` : String(item))).join(', ')}]`;
  }
  if (typeof v === 'object' && v !== null) {
    return JSON.stringify(v);
  }
  return String(v);
}
