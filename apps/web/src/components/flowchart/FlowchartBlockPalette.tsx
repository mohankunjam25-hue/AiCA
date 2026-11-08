import React from 'react';
import {
  Play,
  Square,
  ArrowDownToLine,
  ArrowUpFromLine,
  Cog,
  GitFork,
  CheckCircle,
  Save,
  RotateCcw,
} from 'lucide-react';
import { FlowchartNodeType } from '@aica/shared';

interface FlowchartBlockPaletteProps {
  onAddNode: (type: FlowchartNodeType) => void;
  onValidate: () => void;
  onSave?: () => void;
  onResetLayout?: () => void;
  isValidating?: boolean;
  isSaving?: boolean;
}

export function FlowchartBlockPalette({
  onAddNode,
  onValidate,
  onSave,
  onResetLayout,
  isValidating = false,
  isSaving = false,
}: FlowchartBlockPaletteProps) {
  const blocks: Array<{
    type: FlowchartNodeType;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    bg: string;
  }> = [
    {
      type: 'start',
      label: 'Start',
      icon: Play,
      color: 'text-emerald-400',
      bg: 'hover:bg-emerald-950/60 hover:border-emerald-700',
    },
    {
      type: 'input',
      label: 'Input',
      icon: ArrowDownToLine,
      color: 'text-cyan-400',
      bg: 'hover:bg-cyan-950/60 hover:border-cyan-700',
    },
    {
      type: 'process',
      label: 'Process',
      icon: Cog,
      color: 'text-amber-400',
      bg: 'hover:bg-amber-950/60 hover:border-amber-700',
    },
    {
      type: 'decision',
      label: 'Decision',
      icon: GitFork,
      color: 'text-purple-400',
      bg: 'hover:bg-purple-950/60 hover:border-purple-700',
    },
    {
      type: 'output',
      label: 'Output',
      icon: ArrowUpFromLine,
      color: 'text-indigo-400',
      bg: 'hover:bg-indigo-950/60 hover:border-indigo-700',
    },
    {
      type: 'end',
      label: 'End',
      icon: Square,
      color: 'text-rose-400',
      bg: 'hover:bg-rose-950/60 hover:border-rose-700',
    },
  ];

  return (
    <div className="flex items-center gap-1.5 p-1.5 bg-slate-900/90 dark:bg-[#161b22]/95 border border-slate-700/80 dark:border-[#30363d] rounded-2xl shadow-2xl backdrop-blur-md">
      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 px-2 select-none">
        Add Block:
      </span>

      {blocks.map(({ type, label, icon: Icon, color, bg }) => (
        <button
          key={type}
          onClick={() => onAddNode(type)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-transparent text-xs font-semibold text-slate-200 transition cursor-pointer ${bg}`}
          title={`Add ${label} block`}
        >
          <Icon className={`w-3.5 h-3.5 ${color}`} />
          <span>{label}</span>
        </button>
      ))}

      <div className="h-5 w-[1px] bg-slate-700 mx-1" />

      {/* Validate Graph */}
      <button
        onClick={onValidate}
        disabled={isValidating}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition cursor-pointer"
        title="Check flowchart validity"
      >
        <CheckCircle className="w-3.5 h-3.5 text-blue-400" />
        <span>Validate</span>
      </button>

      {/* Auto Reset Layout */}
      {onResetLayout && (
        <button
          onClick={onResetLayout}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-xs text-slate-300 transition cursor-pointer"
          title="Auto arrange blocks"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
        </button>
      )}

      {/* Save Flowchart */}
      {onSave && (
        <button
          onClick={onSave}
          disabled={isSaving}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-xs font-semibold text-white shadow-sm transition cursor-pointer"
          title="Save flowchart to cloud"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{isSaving ? 'Saving...' : 'Save'}</span>
        </button>
      )}
    </div>
  );
}
