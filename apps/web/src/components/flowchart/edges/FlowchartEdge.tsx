import React from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getSmoothStepPath,
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
  // Use Eraser.io style SmoothStep with rounded curves (or dynamic Bezier if selected)
  const isBezier = data?.routing === 'bezier';

  const [edgePath, labelX, labelY] = isBezier
    ? getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
      })
    : getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
        borderRadius: 18,
        offset: 24,
      });

  const isActive = Boolean(data?.isActive);
  const isTrueBranch =
    label === 'TRUE' || data?.branch === 'TRUE' || data?.sourceHandle === 'true';
  const isFalseBranch =
    label === 'FALSE' || data?.branch === 'FALSE' || data?.sourceHandle === 'false';

  let strokeColor = '#64748b'; // slate-500
  let strokeWidth = 2.2;

  if (isActive) {
    strokeColor = '#38bdf8'; // sky-400 active glow
    strokeWidth = 3.5;
  } else if (isTrueBranch) {
    strokeColor = '#10b981'; // emerald-500
    strokeWidth = 2.5;
  } else if (isFalseBranch) {
    strokeColor = '#f43f5e'; // rose-500
    strokeWidth = 2.5;
  }

  const edgeStyle = {
    ...style,
    stroke: strokeColor,
    strokeWidth,
    transition: 'stroke 0.2s, stroke-width 0.2s',
    ...(isActive
      ? {
          strokeDasharray: '6 4',
          filter: 'drop-shadow(0 0 6px rgba(56, 189, 248, 0.6))',
        }
      : {}),
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
          className="flex items-center gap-1 group z-10"
        >
          {label && (
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold shadow-lg uppercase tracking-wider backdrop-blur-md transition-transform group-hover:scale-110 ${
                isTrueBranch
                  ? 'bg-emerald-950/95 text-emerald-300 border border-emerald-500/80 shadow-emerald-950/50'
                  : isFalseBranch
                  ? 'bg-rose-950/95 text-rose-300 border border-rose-500/80 shadow-rose-950/50'
                  : 'bg-slate-900/95 text-slate-300 border border-slate-700 shadow-slate-950/50'
              }`}
            >
              {label}
            </span>
          )}

          {typeof data?.onDelete === 'function' && (
            <button
              onClick={() => (data.onDelete as (id: string) => void)(id)}
              className="opacity-0 group-hover:opacity-100 p-1 rounded-full bg-slate-900 text-slate-400 hover:text-rose-400 border border-slate-700 shadow-lg transition cursor-pointer"
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
