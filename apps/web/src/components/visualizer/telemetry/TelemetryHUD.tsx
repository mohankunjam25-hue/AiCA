import React from 'react';
import { Activity, Gauge, Cpu, CheckCircle } from 'lucide-react';
import { TraceFrame } from '../core/types';

interface TelemetryHUDProps {
  frame?: TraceFrame;
  currentStepIndex: number;
  totalSteps: number;
  timeComplexity: string;
}

export function TelemetryHUD({
  frame,
  currentStepIndex,
  totalSteps,
  timeComplexity
}: TelemetryHUDProps) {
  if (!frame) return null;

  const currentStep = currentStepIndex + 1;
  const progressPct = totalSteps > 0 ? Math.round((currentStep / totalSteps) * 100) : 0;

  // Deriving comparisons/ops count from variables or step index
  const comparisonsCount = frame.telemetry?.comparisonsCount ?? currentStep;
  const boundNote = frame.telemetry?.theoreticalBound || timeComplexity;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl border border-[#d0d7de]/70 dark:border-[#30363d]/70 bg-white dark:bg-[#0d1117] text-xs font-mono shadow-2xs">
      {/* 1. Progress / Step Counter */}
      <div className="p-2 rounded-lg bg-[#f6f8fa] dark:bg-[#161b22] border border-[#d0d7de]/50 dark:border-[#30363d]/50 space-y-1">
        <span className="text-[10px] text-[#57606a] dark:text-[#8b949e] flex items-center gap-1 font-sans font-semibold">
          <Activity className="w-3 h-3 text-[#0969da]" />
          Execution Step
        </span>
        <div className="text-sm font-bold text-[#1f2328] dark:text-[#f0f6fc]">
          {currentStep} / {totalSteps}
          <span className="text-[10px] font-normal text-[#57606a] ml-1">({progressPct}%)</span>
        </div>
      </div>

      {/* 2. Operations / Comparisons Gauge */}
      <div className="p-2 rounded-lg bg-[#f6f8fa] dark:bg-[#161b22] border border-[#d0d7de]/50 dark:border-[#30363d]/50 space-y-1">
        <span className="text-[10px] text-[#57606a] dark:text-[#8b949e] flex items-center gap-1 font-sans font-semibold">
          <Gauge className="w-3 h-3 text-[#8250df]" />
          Operations Count
        </span>
        <div className="text-sm font-bold text-[#8250df] dark:text-[#a371f7]">
          {comparisonsCount} ops
        </div>
      </div>

      {/* 3. Theoretical Upper Bound */}
      <div className="p-2 rounded-lg bg-[#f6f8fa] dark:bg-[#161b22] border border-[#d0d7de]/50 dark:border-[#30363d]/50 space-y-1">
        <span className="text-[10px] text-[#57606a] dark:text-[#8b949e] flex items-center gap-1 font-sans font-semibold">
          <Cpu className="w-3 h-3 text-[#1a7f37]" />
          Theoretical Bound
        </span>
        <div className="text-sm font-bold text-[#1a7f37] dark:text-[#3fb950]">
          {boundNote}
        </div>
      </div>

      {/* 4. Action State / Invariant */}
      <div className="p-2 rounded-lg bg-[#f6f8fa] dark:bg-[#161b22] border border-[#d0d7de]/50 dark:border-[#30363d]/50 space-y-1">
        <span className="text-[10px] text-[#57606a] dark:text-[#8b949e] flex items-center gap-1 font-sans font-semibold">
          <CheckCircle className="w-3 h-3 text-[#0969da]" />
          Current Op
        </span>
        <div className="text-xs font-bold text-[#0969da] dark:text-[#58a6ff] truncate">
          {frame.actionType}
        </div>
      </div>
    </div>
  );
}
