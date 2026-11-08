import React, { useState } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getSmoothStepPath,
  getBezierPath,
} from '@xyflow/react';
import { Trash2, ArrowLeftRight } from 'lucide-react';

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
  selected,
}: EdgeProps) {
  const [showControls, setShowControls] = useState(false);

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
  const isDecisionEdge = isTrueBranch || isFalseBranch;

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
  } else if (selected) {
    strokeColor = '#38bdf8';
    strokeWidth = 3;
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

  const isExpanded = selected || showControls;

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
          onClick={(e) => {
            e.stopPropagation();
            setShowControls((prev) => !prev);
          }}
        >
          {/* Label Badge (TRUE / FALSE / Plain) */}
          {label ? (
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold shadow-lg uppercase tracking-wider backdrop-blur-md cursor-pointer transition-all ${
                isTrueBranch
                  ? 'bg-emerald-950/95 text-emerald-300 border border-emerald-500/80 shadow-emerald-950/50 hover:bg-emerald-900'
                  : isFalseBranch
                  ? 'bg-rose-950/95 text-rose-300 border border-rose-500/80 shadow-rose-950/50 hover:bg-rose-900'
                  : 'bg-slate-900/95 text-slate-300 border border-slate-700 shadow-slate-950/50 hover:bg-slate-800'
              }`}
            >
              {label}
            </span>
          ) : (
            /* Subtle anchor dot for non-labeled edges on mobile / hover */
            <div
              className={`w-3.5 h-3.5 rounded-full border border-slate-600 bg-slate-900/90 shadow cursor-pointer transition-all flex items-center justify-center ${
                isExpanded
                  ? 'scale-110 border-sky-400 bg-sky-950 text-sky-400'
                  : 'opacity-40 group-hover:opacity-100 hover:scale-125'
              }`}
              title="Click or tap to edit connection"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            </div>
          )}

          {/* Decision Branch Toggle Button (Switch TRUE <-> FALSE) */}
          {isDecisionEdge && (isExpanded || true) && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (typeof data?.onToggleBranch === 'function') {
                  (data.onToggleBranch as (id: string) => void)(id);
                }
              }}
              className={`${
                isExpanded ? 'flex' : 'hidden group-hover:flex'
              } items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-900/95 border border-purple-500/60 text-purple-300 hover:text-purple-100 hover:border-purple-400 text-[9px] font-mono font-semibold shadow-lg backdrop-blur-md transition cursor-pointer active:scale-95`}
              title="Toggle branch condition"
            >
              <ArrowLeftRight className="w-2.5 h-2.5 text-purple-400" />
              <span>{isTrueBranch ? 'To FALSE' : 'To TRUE'}</span>
            </button>
          )}

          {/* Delete Connection Button */}
          {typeof data?.onDelete === 'function' && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                (data.onDelete as (id: string) => void)(id);
              }}
              className={`${
                isExpanded ? 'flex' : 'hidden group-hover:flex'
              } p-1 rounded-full bg-slate-900/95 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-500/80 shadow-lg backdrop-blur-md transition cursor-pointer active:scale-95`}
              title="Remove connection"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
