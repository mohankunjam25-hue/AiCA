import React, { useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { GitFork, Edit2, Check, Trash2 } from 'lucide-react';

export function DecisionNode({ data, id }: NodeProps) {
  const executionStatus = (data?.executionStatus as string) || 'idle';
  const condition = (data?.condition as string) || '';
  const [isEditing, setIsEditing] = useState(false);
  const [localCondition, setLocalCondition] = useState(condition);

  let statusRing = 'border-purple-500/70 bg-slate-900/95';
  if (executionStatus === 'active') {
    statusRing = 'ring-4 ring-blue-500 border-blue-400 bg-blue-950/80 shadow-lg shadow-blue-500/40 scale-105';
  } else if (executionStatus === 'success') {
    statusRing = 'ring-2 ring-emerald-500 border-emerald-400 bg-emerald-950/60 shadow-md shadow-emerald-500/20';
  } else if (executionStatus === 'error') {
    statusRing = 'ring-4 ring-rose-500 border-rose-400 bg-rose-950/80 shadow-lg shadow-rose-500/40 animate-pulse';
  }

  const handleSave = () => {
    setIsEditing(false);
    if (typeof data?.onDataChange === 'function') {
      (data.onDataChange as (id: string, updates: any) => void)(id, {
        condition: localCondition.trim(),
      });
    }
  };

  const branchTaken = (data?.branchTaken as 'TRUE' | 'FALSE') || null;

  return (
    <div
      className={`relative rounded-2xl border-2 p-3 min-w-[220px] max-w-[290px] backdrop-blur-md shadow-md transition-all duration-200 ${statusRing}`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-purple-400 border-2 border-slate-900 rounded-full"
      />

      <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2 mb-2">
        <div className="flex items-center gap-1.5">
          <GitFork className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-800/80">
            Decision (Branch)
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition"
            title={isEditing ? 'Save' : 'Edit'}
          >
            {isEditing ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Edit2 className="w-3 h-3" />}
          </button>
          {typeof data?.onDeleteNode === 'function' && (
            <button
              onClick={() => (data.onDeleteNode as (id: string) => void)(id)}
              className="text-slate-400 hover:text-rose-400 p-1 rounded hover:bg-rose-950/40 transition"
              title="Delete block"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] text-slate-400 uppercase font-mono">
          Boolean Condition
        </label>
        {isEditing ? (
          <input
            type="text"
            value={localCondition}
            onChange={(e) => setLocalCondition(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            placeholder="e.g. a > b or i < n"
            className="w-full text-xs font-mono bg-slate-950 border border-purple-500/50 rounded px-2 py-1 text-purple-200 outline-none focus:border-purple-400"
            autoFocus
          />
        ) : (
          <div className="text-xs font-mono text-purple-200 bg-purple-950/30 px-2 py-1 rounded border border-purple-800/40 text-center font-bold">
            {condition || <span className="italic text-slate-500 font-normal">Click edit to set condition</span>}
          </div>
        )}

        {/* Runtime branch evaluation status */}
        {branchTaken && (
          <div className="mt-2 pt-1 border-t border-slate-800/60 text-[11px] font-mono flex items-center justify-between">
            <span className="text-slate-400 text-[10px]">Evaluated:</span>
            <span
              className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${
                branchTaken === 'TRUE'
                  ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-700'
                  : 'bg-rose-950/80 text-rose-400 border border-rose-700'
              }`}
            >
              Branch: {branchTaken}
            </span>
          </div>
        )}
      </div>

      {/* Left Handle: FALSE branch */}
      <Handle
        type="source"
        position={Position.Left}
        id="false"
        className="w-3.5 h-3.5 bg-rose-500 border-2 border-slate-900 rounded-full hover:scale-125 transition-transform"
        title="FALSE branch port"
      />

      {/* Right Handle: TRUE branch */}
      <Handle
        type="source"
        position={Position.Right}
        id="true"
        className="w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full hover:scale-125 transition-transform"
        title="TRUE branch port"
      />

      {/* Bottom Auxiliary Outflow Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="default"
        className="w-3 h-3 bg-purple-500 border-2 border-slate-900 rounded-full hover:scale-125 transition-transform"
      />

      {/* Two explicit branch indicator badges */}
      <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-800/50 text-[10px] font-mono font-bold select-none">
        <div className="flex items-center gap-1 text-rose-400">
          <span className="bg-rose-950/80 px-1.5 py-0.5 rounded border border-rose-800/80 shadow-xs">
            ◀ FALSE
          </span>
        </div>
        <div className="flex items-center gap-1 text-emerald-400">
          <span className="bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800/80 shadow-xs">
            TRUE ▶
          </span>
        </div>
      </div>
    </div>
  );
}
