import React, { useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Cog, Plus, Trash2, Edit2, Check } from 'lucide-react';

export function ProcessNode({ data, id }: NodeProps) {
  const executionStatus = (data?.executionStatus as string) || 'idle';
  const assignments = (data?.assignments as string[]) || [];
  const [isEditing, setIsEditing] = useState(false);
  const [localAssignments, setLocalAssignments] = useState<string[]>(
    assignments.length > 0 ? assignments : ['']
  );

  let statusRing = 'border-amber-500/60 bg-slate-900/95';
  if (executionStatus === 'active') {
    statusRing = 'ring-4 ring-blue-500 border-blue-400 bg-blue-950/80 shadow-lg shadow-blue-500/40 scale-105';
  } else if (executionStatus === 'success') {
    statusRing = 'ring-2 ring-emerald-500 border-emerald-400 bg-emerald-950/60 shadow-md shadow-emerald-500/20';
  } else if (executionStatus === 'error') {
    statusRing = 'ring-4 ring-rose-500 border-rose-400 bg-rose-950/80 shadow-lg shadow-rose-500/40 animate-pulse';
  }

  const handleSave = () => {
    setIsEditing(false);
    const cleaned = localAssignments.map((s) => s.trim()).filter(Boolean);
    if (typeof data?.onDataChange === 'function') {
      (data.onDataChange as (id: string, updates: any) => void)(id, {
        assignments: cleaned,
      });
    }
  };

  const addAssignment = () => {
    setLocalAssignments([...localAssignments, '']);
    setIsEditing(true);
  };

  const removeAssignment = (index: number) => {
    const updated = localAssignments.filter((_, i) => i !== index);
    setLocalAssignments(updated.length > 0 ? updated : ['']);
    if (typeof data?.onDataChange === 'function') {
      (data.onDataChange as (id: string, updates: any) => void)(id, {
        assignments: updated.map((s) => s.trim()).filter(Boolean),
      });
    }
  };

  const updateAssignment = (index: number, val: string) => {
    const updated = [...localAssignments];
    updated[index] = val;
    setLocalAssignments(updated);
  };

  return (
    <div
      className={`relative rounded-xl border-2 p-3 min-w-[220px] max-w-[320px] backdrop-blur-md shadow-md transition-all duration-200 ${statusRing}`}
    >
      {/* Primary Inflow */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-amber-400 border-2 border-slate-900 rounded-full hover:scale-125 transition-transform"
      />

      {/* Auxiliary Side Inflow (for loopbacks from below) */}
      <Handle
        type="target"
        position={Position.Left}
        id="target-left"
        className="w-2.5 h-2.5 bg-amber-500/70 border border-slate-900 rounded-full hover:scale-125 transition-transform"
        title="Side entry port"
      />

      <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2 mb-2">
        <div className="flex items-center gap-1.5">
          <Cog className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/80">
            Process Block
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={addAssignment}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition"
            title="Add statement"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
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
        {isEditing ? (
          localAssignments.map((stmt, idx) => (
            <div key={idx} className="flex items-center gap-1">
              <input
                type="text"
                value={stmt}
                onChange={(e) => updateAssignment(idx, e.target.value)}
                onBlur={handleSave}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                placeholder="e.g. sum = a + b"
                className="w-full text-xs font-mono bg-slate-950 border border-amber-500/50 rounded px-2 py-1 text-amber-200 outline-none focus:border-amber-400"
              />
              {localAssignments.length > 1 && (
                <button
                  onClick={() => removeAssignment(idx)}
                  className="text-slate-500 hover:text-rose-400 p-1"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          ))
        ) : (
          <div className="space-y-1">
            {assignments.length > 0 ? (
              assignments.map((stmt, idx) => (
                <div
                  key={idx}
                  className="text-xs font-mono text-amber-200 bg-amber-950/30 px-2 py-1 rounded border border-amber-800/40"
                >
                  {stmt}
                </div>
              ))
            ) : (
              <span className="text-xs italic text-slate-500">
                Click + or edit to add assignments
              </span>
            )}
          </div>
        )}

        {/* Runtime evaluation feedback */}
        {Boolean(data?.lastEvaluated) && (
          <div className="mt-2 pt-1.5 border-t border-slate-800/60 text-[11px] font-mono flex items-center justify-between text-emerald-400">
            <span className="text-slate-400 text-[10px]">Updated:</span>
            <span>
              {(data?.lastEvaluated as any)?.variable} ={' '}
              {JSON.stringify((data?.lastEvaluated as any)?.result)}
            </span>
          </div>
        )}
      </div>

      {/* Auxiliary Side Outflow */}
      <Handle
        type="source"
        position={Position.Right}
        id="source-right"
        className="w-2.5 h-2.5 bg-amber-500/70 border border-slate-900 rounded-full hover:scale-125 transition-transform"
        title="Side exit port"
      />

      {/* Primary Outflow */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-amber-400 border-2 border-slate-900 rounded-full hover:scale-125 transition-transform"
      />
    </div>
  );
}
