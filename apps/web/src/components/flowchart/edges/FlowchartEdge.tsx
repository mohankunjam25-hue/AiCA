import React from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getBezierPath,
} from '@xyflow/react';
import { X } from 'lucide-react';

export function FlowchartEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  label,
  data,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const isActive = Boolean(data?.isActive);
  const isTrueBranch =
    label === 'TRUE' || data?.branch === 'TRUE' || data?.sourceHandle === 'true';
  const isFalseBranch =
    label === 'FALSE' || data?.branch === 'FALSE' || data?.sourceHandle === 'false';

  let strokeColor = '#64748b'; // slate-500
  let strokeWidth = 2;

  if (isActive) {
    strokeColor = '#38bdf8'; // sky-400 active glow
    strokeWidth = 3.5;
  } else if (isTrueBranch) {
    strokeColor = '#10b981'; // emerald-500
  } else if (isFalseBranch) {
    strokeColor = '#f43f5e'; // rose-500
  }

  const edgeStyle = {
    ...style,
    stroke: strokeColor,
    strokeWidth,
    ...(isActive ? { strokeDasharray: '6 4', animation: 'flowAnimation 1s linear infinite' } : {}),
  };

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={edgeStyle} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="flex items-center gap-1 group"
        >
          {label && (
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold shadow-md uppercase tracking-wider backdrop-blur-md ${
                isTrueBranch
                  ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-600'
                  : isFalseBranch
                  ? 'bg-rose-950/90 text-rose-300 border border-rose-600'
                  : 'bg-slate-900/90 text-slate-300 border border-slate-700'
              }`}
            >
              {label}
            </span>
          )}

          {typeof data?.onDelete === 'function' && (
            <button
              onClick={() => (data.onDelete as (id: string) => void)(id)}
              className="opacity-0 group-hover:opacity-100 p-0.5 rounded-full bg-slate-800 text-slate-400 hover:text-rose-400 border border-slate-700 transition"
              title="Remove connection"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
