import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Play, Square } from 'lucide-react';

export function StartEndNode({ data, id }: NodeProps) {
  const isStart = data?.nodeType === 'start' || id?.startsWith('start');
  const executionStatus = (data?.executionStatus as string) || 'idle';

  let statusRing = 'border-slate-700 bg-slate-900/95';
  if (executionStatus === 'active') {
    statusRing = 'ring-4 ring-blue-500 border-blue-400 bg-blue-950/80 shadow-lg shadow-blue-500/40 scale-105';
  } else if (executionStatus === 'success') {
    statusRing = 'ring-2 ring-emerald-500 border-emerald-400 bg-emerald-950/60 shadow-md shadow-emerald-500/20';
  } else if (executionStatus === 'error') {
    statusRing = 'ring-4 ring-rose-500 border-rose-400 bg-rose-950/80 shadow-lg shadow-rose-500/40 animate-pulse';
  } else {
    statusRing = isStart
      ? 'border-emerald-500/80 bg-emerald-950/40 text-emerald-300'
      : 'border-rose-500/80 bg-rose-950/40 text-rose-300';
  }

  return (
    <div
      className={`relative px-5 py-2.5 rounded-full border-2 transition-all duration-200 flex items-center gap-2.5 cursor-grab active:cursor-grabbing backdrop-blur-md ${statusRing}`}
    >
      {!isStart && (
        <Handle
          type="target"
          position={Position.Top}
          className="w-3 h-3 bg-rose-500 border-2 border-slate-900 rounded-full"
        />
      )}

      {isStart ? (
        <Play className="w-4 h-4 fill-emerald-400 text-emerald-400" />
      ) : (
        <Square className="w-4 h-4 fill-rose-400 text-rose-400" />
      )}

      <span className="font-semibold text-xs tracking-wider uppercase font-mono">
        {(data?.label as string) || (isStart ? 'Start' : 'End')}
      </span>

      {isStart && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full"
        />
      )}
    </div>
  );
}
