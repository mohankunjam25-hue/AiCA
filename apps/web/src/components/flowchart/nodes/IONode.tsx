import React, { useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { ArrowDownToLine, ArrowUpFromLine, Edit2, Check } from 'lucide-react';

export function IONode({ data, id }: NodeProps) {
  const isInput = data?.nodeType === 'input' || id?.startsWith('input');
  const executionStatus = (data?.executionStatus as string) || 'idle';
  const [isEditing, setIsEditing] = useState(false);

  // Local state for editing
  const [inputVars, setInputVars] = useState(
    ((data?.inputVariables as string[]) || []).join(', ')
  );
  const [outputExpr, setOutputExpr] = useState(
    (data?.outputExpression as string) || ''
  );

  let statusRing = 'border-slate-700 bg-slate-900/90';
  if (executionStatus === 'active') {
    statusRing = 'ring-4 ring-blue-500 border-blue-400 bg-blue-950/80 shadow-lg shadow-blue-500/40 scale-105';
  } else if (executionStatus === 'success') {
    statusRing = 'ring-2 ring-emerald-500 border-emerald-400 bg-emerald-950/60 shadow-md shadow-emerald-500/20';
  } else if (executionStatus === 'error') {
    statusRing = 'ring-4 ring-rose-500 border-rose-400 bg-rose-950/80 shadow-lg shadow-rose-500/40 animate-pulse';
  } else {
    statusRing = isInput
      ? 'border-cyan-500/70 bg-slate-900/95 hover:border-cyan-400'
      : 'border-indigo-500/70 bg-slate-900/95 hover:border-indigo-400';
  }

  const handleSave = () => {
    setIsEditing(false);
    if (typeof data?.onDataChange === 'function') {
      if (isInput) {
        const parsed = inputVars
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        (data.onDataChange as (id: string, updates: any) => void)(id, {
          inputVariables: parsed,
        });
      } else {
        (data.onDataChange as (id: string, updates: any) => void)(id, {
          outputExpression: outputExpr.trim(),
        });
      }
    }
  };

  return (
    <div
      className={`relative rounded-xl border-2 p-3 min-w-[210px] max-w-[280px] backdrop-blur-md shadow-md transition-all duration-200 ${statusRing}`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className={`w-3 h-3 ${isInput ? 'bg-cyan-400' : 'bg-indigo-400'} border-2 border-slate-900 rounded-full`}
      />

      <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2 mb-2">
        <div className="flex items-center gap-1.5">
          {isInput ? (
            <ArrowDownToLine className="w-3.5 h-3.5 text-cyan-400" />
          ) : (
            <ArrowUpFromLine className="w-3.5 h-3.5 text-indigo-400" />
          )}
          <span
            className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
              isInput
                ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-800/80'
                : 'bg-indigo-950/60 text-indigo-300 border border-indigo-800/80'
            }`}
          >
            {isInput ? 'Input Block' : 'Output Block'}
          </span>
        </div>

        <button
          onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
          className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition"
          title={isEditing ? 'Save' : 'Edit'}
        >
          {isEditing ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Edit2 className="w-3 h-3" />}
        </button>
      </div>

      {isInput ? (
        <div className="space-y-1">
          <label className="text-[10px] text-slate-400 uppercase font-mono">
            Variables to Read
          </label>
          {isEditing ? (
            <input
              type="text"
              value={inputVars}
              onChange={(e) => setInputVars(e.target.value)}
              onBlur={handleSave}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              placeholder="e.g. n, target"
              className="w-full text-xs font-mono bg-slate-950 border border-cyan-500/50 rounded px-2 py-1 text-cyan-200 outline-none focus:border-cyan-400"
              autoFocus
            />
          ) : (
            <div className="flex flex-wrap gap-1">
              {((data?.inputVariables as string[]) || []).length > 0 ? (
                ((data?.inputVariables as string[]) || []).map((v) => (
                  <span
                    key={v}
                    className="text-xs font-mono px-1.5 py-0.5 rounded bg-cyan-950/40 text-cyan-300 border border-cyan-800/50"
                  >
                    {v}
                  </span>
                ))
              ) : (
                <span className="text-xs italic text-slate-500">Click edit to set variables</span>
              )}
            </div>
          )}

          {data?.runtimeValue !== undefined && (
            <div className="mt-2 pt-1 border-t border-slate-800/60 text-[11px] font-mono text-cyan-400 flex items-center justify-between">
              <span className="text-slate-400 text-[10px]">Read:</span>
              <span>{JSON.stringify(data.runtimeValue)}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-1">
          <label className="text-[10px] text-slate-400 uppercase font-mono">
            Print Expression
          </label>
          {isEditing ? (
            <input
              type="text"
              value={outputExpr}
              onChange={(e) => setOutputExpr(e.target.value)}
              onBlur={handleSave}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              placeholder="e.g. sum or arr"
              className="w-full text-xs font-mono bg-slate-950 border border-indigo-500/50 rounded px-2 py-1 text-indigo-200 outline-none focus:border-indigo-400"
              autoFocus
            />
          ) : (
            <div className="text-xs font-mono text-indigo-200 bg-indigo-950/30 px-2 py-1 rounded border border-indigo-800/40">
              {(data?.outputExpression as string) || <span className="italic text-slate-500">Empty</span>}
            </div>
          )}

          {data?.runtimeValue !== undefined && (
            <div className="mt-2 pt-1 border-t border-slate-800/60 text-[11px] font-mono text-emerald-400 flex items-center justify-between">
              <span className="text-slate-400 text-[10px]">Emitted:</span>
              <span className="font-bold">{String(data.runtimeValue)}</span>
            </div>
          )}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        className={`w-3 h-3 ${isInput ? 'bg-cyan-400' : 'bg-indigo-400'} border-2 border-slate-900 rounded-full`}
      />
    </div>
  );
}
