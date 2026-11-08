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
    hoverBg: string;
  }> = [
    {
      type: 'start',
      label: 'Start',
      tooltip: 'Add Start Block',
      icon: CirclePlay,
      color: 'text-emerald-400',
      hoverBg: 'hover:bg-emerald-950/70 hover:text-emerald-300',
    },
    {
      type: 'input',
      label: 'Input',
      tooltip: 'Add Input Block (Read Variables)',
      icon: FileInput,
      color: 'text-cyan-400',
      hoverBg: 'hover:bg-cyan-950/70 hover:text-cyan-300',
    },
    {
      type: 'process',
      label: 'Process',
      tooltip: 'Add Process Block (Assignments)',
      icon: Code2,
      color: 'text-amber-400',
      hoverBg: 'hover:bg-amber-950/70 hover:text-amber-300',
    },
    {
      type: 'decision',
      label: 'Decision',
      tooltip: 'Add Decision Block (Branches)',
      icon: GitBranch,
      color: 'text-purple-400',
      hoverBg: 'hover:bg-purple-950/70 hover:text-purple-300',
    },
    {
      type: 'output',
      label: 'Output',
      tooltip: 'Add Output Block (Print)',
      icon: FileOutput,
      color: 'text-indigo-400',
      hoverBg: 'hover:bg-indigo-950/70 hover:text-indigo-300',
    },
    {
      type: 'end',
      label: 'End',
      tooltip: 'Add End Block',
      icon: CircleStop,
      color: 'text-rose-400',
      hoverBg: 'hover:bg-rose-950/70 hover:text-rose-300',
    },
  ];

  return (
    <div className="inline-flex items-center gap-0.5 sm:gap-1 p-1 bg-slate-900/90 dark:bg-[#161b22]/95 border border-slate-800 shadow-2xl backdrop-blur-xl rounded-xl select-none">
      {/* Node Type Blocks: Micro Icon Buttons */}
      {blocks.map(({ type, tooltip, icon: Icon, color, hoverBg }) => (
        <div key={type} className="relative group flex items-center justify-center">
          <button
            onClick={() => onAddNode(type)}
            className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg text-slate-300 transition-all duration-150 cursor-pointer active:scale-90 ${hoverBg}`}
            aria-label={tooltip}
            title={tooltip}
          >
            <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${color}`} />
          </button>

          {/* Micro Floating Tooltip */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 transform group-hover:translate-y-0 translate-y-1 bg-slate-900 border border-slate-700/80 text-[10px] font-semibold text-slate-200 px-2 py-0.5 rounded-md shadow-2xl whitespace-nowrap z-50">
            {tooltip}
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-slate-900 border-t border-l border-slate-700/80 rotate-45" />
          </div>
        </div>
      ))}

      <div className="h-4 w-[1px] bg-slate-800 mx-0.5 shrink-0" />

      {/* Auto Align / Beautify Layout */}
      {onAutoAlign && (
        <div className="relative group flex items-center justify-center">
          <button
            onClick={onAutoAlign}
            className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg bg-purple-950/40 hover:bg-purple-900/60 border border-purple-800/50 text-purple-300 transition-all duration-150 cursor-pointer shadow-xs active:scale-90"
            aria-label="Auto Align Diagram (DAG)"
            title="Auto Align Diagram (DAG)"
          >
            <Workflow className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400" />
          </button>
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 transform group-hover:translate-y-0 translate-y-1 bg-slate-900 border border-slate-700/80 text-[10px] font-semibold text-slate-200 px-2 py-0.5 rounded-md shadow-2xl whitespace-nowrap z-50">
            Auto-Align Diagram
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-slate-900 border-t border-l border-slate-700/80 rotate-45" />
          </div>
        </div>
      )}

      {/* Validate Graph */}
      <div className="relative group flex items-center justify-center">
        <button
          onClick={onValidate}
          disabled={isValidating}
          className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-all duration-150 cursor-pointer disabled:opacity-40 active:scale-90"
          aria-label="Validate Flowchart Structure"
          title="Validate Flowchart Structure"
        >
          <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" />
        </button>
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 transform group-hover:translate-y-0 translate-y-1 bg-slate-900 border border-slate-700/80 text-[10px] font-semibold text-slate-200 px-2 py-0.5 rounded-md shadow-2xl whitespace-nowrap z-50">
          Validate Flowchart
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-slate-900 border-t border-l border-slate-700/80 rotate-45" />
        </div>
      </div>

      {/* Auto Reset Layout */}
      {onResetLayout && (
        <div className="relative group flex items-center justify-center">
          <button
            onClick={onResetLayout}
            className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-all duration-150 cursor-pointer active:scale-90"
            aria-label="Reset Layout"
            title="Reset Layout"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
          </button>
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 transform group-hover:translate-y-0 translate-y-1 bg-slate-900 border border-slate-700/80 text-[10px] font-semibold text-slate-200 px-2 py-0.5 rounded-md shadow-2xl whitespace-nowrap z-50">
            Reset Layout
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-slate-900 border-t border-l border-slate-700/80 rotate-45" />
          </div>
        </div>
      )}

      {/* Save Flowchart */}
      {onSave && (
        <div className="relative group flex items-center justify-center">
          <button
            onClick={onSave}
            disabled={isSaving}
            className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg bg-emerald-600/90 hover:bg-emerald-500 disabled:opacity-40 text-white shadow-xs transition-all duration-150 cursor-pointer active:scale-90"
            aria-label={isSaving ? 'Saving...' : 'Save Flowchart to Cloud'}
            title={isSaving ? 'Saving...' : 'Save Flowchart to Cloud'}
          >
            <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 transform group-hover:translate-y-0 translate-y-1 bg-slate-900 border border-slate-700/80 text-[10px] font-semibold text-slate-200 px-2 py-0.5 rounded-md shadow-2xl whitespace-nowrap z-50">
            {isSaving ? 'Saving...' : 'Save Flowchart'}
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-slate-900 border-t border-l border-slate-700/80 rotate-45" />
          </div>
        </div>
      )}
    </div>
  );
}
