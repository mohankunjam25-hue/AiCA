import React from 'react';
import {
  CirclePlay,
  FileInput,
  Code2,
  GitBranch,
  FileOutput,
  CircleStop,
  Workflow,
  ShieldCheck,
  Save,
  RotateCcw,
} from 'lucide-react';
import { FlowchartNodeType } from '@aica/shared';

interface FlowchartBlockPaletteProps {
  onAddNode: (type: FlowchartNodeType) => void;
  onValidate: () => void;
  onAutoAlign?: () => void;
  onSave?: () => void;
  onResetLayout?: () => void;
  isValidating?: boolean;
  isSaving?: boolean;
}

export function FlowchartBlockPalette({
  onAddNode,
  onValidate,
  onAutoAlign,
  onSave,
  onResetLayout,
  isValidating = false,
  isSaving = false,
}: FlowchartBlockPaletteProps) {
  const blocks: Array<{
    type: FlowchartNodeType;
    label: string;
    tooltip: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    bg: string;
  }> = [
    {
      type: 'start',
      label: 'Start',
      tooltip: 'Add Start Block (Entry Point)',
      icon: CirclePlay,
      color: 'text-emerald-400',
      bg: 'hover:bg-emerald-950/70 hover:border-emerald-700/80',
    },
    {
      type: 'input',
      label: 'Input',
      tooltip: 'Add Input Block (Read Variables)',
      icon: FileInput,
      color: 'text-cyan-400',
      bg: 'hover:bg-cyan-950/70 hover:border-cyan-700/80',
    },
    {
      type: 'process',
      label: 'Process',
      tooltip: 'Add Process Block (Calculations & Logic)',
      icon: Code2,
      color: 'text-amber-400',
      bg: 'hover:bg-amber-950/70 hover:border-amber-700/80',
    },
    {
      type: 'decision',
      label: 'Decision',
      tooltip: 'Add Decision Block (Branching Condition)',
      icon: GitBranch,
      color: 'text-purple-400',
      bg: 'hover:bg-purple-950/70 hover:border-purple-700/80',
    },
    {
      type: 'output',
      label: 'Output',
      tooltip: 'Add Output Block (Print / Emit Value)',
      icon: FileOutput,
      color: 'text-indigo-400',
      bg: 'hover:bg-indigo-950/70 hover:border-indigo-700/80',
    },
    {
      type: 'end',
      label: 'End',
      tooltip: 'Add End Block (Terminate Program)',
      icon: CircleStop,
      color: 'text-rose-400',
      bg: 'hover:bg-rose-950/70 hover:border-rose-700/80',
    },
  ];

  return (
    <div className="flex items-center gap-1 sm:gap-1.5 p-1 bg-slate-900/90 dark:bg-[#161b22]/95 border border-slate-700/80 dark:border-[#30363d] rounded-2xl shadow-xl backdrop-blur-md">
      {/* Node Type Blocks: Icon Only with Professional Tooltip */}
      {blocks.map(({ type, tooltip, icon: Icon, color, bg }) => (
        <div key={type} className="relative group flex items-center justify-center">
          <button
            onClick={() => onAddNode(type)}
            className={`p-2 sm:p-2.5 rounded-xl border border-transparent text-slate-200 transition cursor-pointer shrink-0 active:scale-95 ${bg}`}
            aria-label={tooltip}
            title={tooltip}
          >
            <Icon className={`w-4 h-4 ${color}`} />
          </button>

          {/* Floating Dark Tooltip */}
          <div className="absolute -bottom-9 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 transform group-hover:translate-y-0 translate-y-1 bg-slate-900 border border-slate-700 text-[11px] font-medium text-slate-200 px-2.5 py-1 rounded-md shadow-2xl whitespace-nowrap z-50 select-none">
            {tooltip}
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 border-t border-l border-slate-700 rotate-45" />
          </div>
        </div>
      ))}

      <div className="h-5 w-[1px] bg-slate-700/80 mx-1 shrink-0" />

      {/* Auto Align / Beautify Layout: Icon Only */}
      {onAutoAlign && (
        <div className="relative group flex items-center justify-center">
          <button
            onClick={onAutoAlign}
            className="p-2 sm:p-2.5 rounded-xl border border-purple-500/50 bg-purple-950/50 hover:bg-purple-900/80 text-purple-300 transition cursor-pointer shrink-0 shadow-sm active:scale-95"
            aria-label="Auto Align & Beautify (Hierarchical DAG)"
            title="Auto Align & Beautify (Hierarchical DAG)"
          >
            <Workflow className="w-4 h-4 text-purple-400" />
          </button>
          <div className="absolute -bottom-9 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 transform group-hover:translate-y-0 translate-y-1 bg-slate-900 border border-slate-700 text-[11px] font-medium text-slate-200 px-2.5 py-1 rounded-md shadow-2xl whitespace-nowrap z-50 select-none">
            Auto-Align Diagram (DAG)
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 border-t border-l border-slate-700 rotate-45" />
          </div>
        </div>
      )}

      {/* Validate Graph: Icon Only */}
      <div className="relative group flex items-center justify-center">
        <button
          onClick={onValidate}
          disabled={isValidating}
          className="p-2 sm:p-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 transition cursor-pointer shrink-0 disabled:opacity-50 active:scale-95"
          aria-label="Validate Flowchart Structure"
          title="Validate Flowchart Structure"
        >
          <ShieldCheck className="w-4 h-4 text-blue-400" />
        </button>
        <div className="absolute -bottom-9 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 transform group-hover:translate-y-0 translate-y-1 bg-slate-900 border border-slate-700 text-[11px] font-medium text-slate-200 px-2.5 py-1 rounded-md shadow-2xl whitespace-nowrap z-50 select-none">
          Validate Flowchart
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 border-t border-l border-slate-700 rotate-45" />
        </div>
      </div>

      {/* Auto Reset Layout: Icon Only */}
      {onResetLayout && (
        <div className="relative group flex items-center justify-center">
          <button
            onClick={onResetLayout}
            className="p-2 sm:p-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition cursor-pointer shrink-0 active:scale-95"
            aria-label="Reset Layout"
            title="Reset Layout"
          >
            <RotateCcw className="w-4 h-4 text-slate-400" />
          </button>
          <div className="absolute -bottom-9 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 transform group-hover:translate-y-0 translate-y-1 bg-slate-900 border border-slate-700 text-[11px] font-medium text-slate-200 px-2.5 py-1 rounded-md shadow-2xl whitespace-nowrap z-50 select-none">
            Reset Layout
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 border-t border-l border-slate-700 rotate-45" />
          </div>
        </div>
      )}

      {/* Save Flowchart: Icon Only */}
      {onSave && (
        <div className="relative group flex items-center justify-center">
          <button
            onClick={onSave}
            disabled={isSaving}
            className="p-2 sm:p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white shadow-sm transition cursor-pointer shrink-0 active:scale-95"
            aria-label={isSaving ? 'Saving...' : 'Save Flowchart to Cloud'}
            title={isSaving ? 'Saving...' : 'Save Flowchart to Cloud'}
          >
            <Save className="w-4 h-4" />
          </button>
          <div className="absolute -bottom-9 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 transform group-hover:translate-y-0 translate-y-1 bg-slate-900 border border-slate-700 text-[11px] font-medium text-slate-200 px-2.5 py-1 rounded-md shadow-2xl whitespace-nowrap z-50 select-none">
            {isSaving ? 'Saving...' : 'Save Flowchart'}
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 border-t border-l border-slate-700 rotate-45" />
          </div>
        </div>
      )}
    </div>
  );
}
