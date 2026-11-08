import React from 'react';
import { TreeVisualPayload, GraphVisualPayload } from '../core/types';
import { Layers, Workflow, GitBranch } from 'lucide-react';

interface TreeGraphRendererProps {
  payload: TreeVisualPayload | GraphVisualPayload;
}

export function TreeGraphRenderer({ payload }: TreeGraphRendererProps) {
  if (payload.kind === 'TREE') {
    return <TreeComponent payload={payload} />;
  }
  return <GraphComponent payload={payload} />;
}

/* ========================================================================= */
/* 1. TREE RENDERER                                                          */
/* ========================================================================= */
function TreeComponent({ payload }: { payload: TreeVisualPayload }) {
  const { nodes = [], rootId, activeNodeId, traversalPath = [] } = payload;

  // Compute node coordinates recursively for hierarchical SVG display
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const positions = new Map<string, { x: number; y: number }>();

  function calculatePositions(nodeId: string | undefined, x: number, y: number, spread: number) {
    if (!nodeId) return;
    const node = nodeMap.get(nodeId);
    if (!node) return;

    positions.set(nodeId, { x, y });

    if (node.leftId) {
      calculatePositions(node.leftId, x - spread, y + 60, spread / 2);
    }
    if (node.rightId) {
      calculatePositions(node.rightId, x + spread, y + 60, spread / 2);
    }
  }

  calculatePositions(rootId, 250, 40, 100);

  return (
    <div className="flex flex-col items-center justify-center p-4 min-h-[260px] w-full select-none overflow-x-auto">
      {/* Path HUD */}
      {traversalPath.length > 0 && (
        <div className="mb-2 text-xs font-mono text-[#8250df] dark:text-[#a371f7] flex items-center gap-1.5 animate-in fade-in">
          <GitBranch className="w-3.5 h-3.5" />
          <span>Traversal Path: {traversalPath.join(' ➔ ')}</span>
        </div>
      )}

      {/* SVG Canvas for Tree */}
      <svg className="w-full max-w-[500px] h-[220px]" viewBox="0 0 500 220">
        {/* Draw Branch Lines */}
        {nodes.map((node) => {
          const currentPos = positions.get(node.id);
          if (!currentPos) return null;

          const lines: React.ReactNode[] = [];
          if (node.leftId && positions.has(node.leftId)) {
            const leftPos = positions.get(node.leftId)!;
            lines.push(
              <line
                key={`${node.id}-left`}
                x1={currentPos.x}
                y1={currentPos.y}
                x2={leftPos.x}
                y2={leftPos.y}
                stroke="#8c959f"
                strokeWidth="2"
                strokeDasharray={node.status === 'visited' ? 'none' : '4'}
                className="transition-all duration-300"
              />
            );
          }
          if (node.rightId && positions.has(node.rightId)) {
            const rightPos = positions.get(node.rightId)!;
            lines.push(
              <line
                key={`${node.id}-right`}
                x1={currentPos.x}
                y1={currentPos.y}
                x2={rightPos.x}
                y2={rightPos.y}
                stroke="#8c959f"
                strokeWidth="2"
                strokeDasharray={node.status === 'visited' ? 'none' : '4'}
                className="transition-all duration-300"
              />
            );
          }
          return lines;
        })}

        {/* Draw Node Circles */}
        {nodes.map((node) => {
          const pos = positions.get(node.id);
          if (!pos) return null;

          const isActive = node.id === activeNodeId || node.status === 'active';
          const isVisited = node.status === 'visited';
          const isMatched = node.status === 'matched';

          let fill = '#ffffff';
          let stroke = '#d0d7de';
          let textColor = '#1f2328';

          if (isMatched) {
            fill = '#2ea043';
            stroke = '#1a7f37';
            textColor = '#ffffff';
          } else if (isActive) {
            fill = '#0969da';
            stroke = '#0550ae';
            textColor = '#ffffff';
          } else if (isVisited) {
            fill = '#8250df';
            stroke = '#6639ba';
            textColor = '#ffffff';
          }

          return (
            <g key={node.id} className="transition-all duration-300">
              <circle
                cx={pos.x}
                cy={pos.y}
                r={18}
                fill={fill}
                stroke={stroke}
                strokeWidth="3"
                className={`transition-all ${isActive ? 'filter drop-shadow-md' : ''}`}
              />
              <text
                x={pos.x}
                y={pos.y + 5}
                textAnchor="middle"
                fill={textColor}
                fontSize="12"
                fontFamily="monospace"
                fontWeight="bold"
              >
                {node.value}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ========================================================================= */
/* 2. GRAPH RENDERER                                                         */
/* ========================================================================= */
function GraphComponent({ payload }: { payload: GraphVisualPayload }) {
  const { nodes = [], edges = [], activeNodeId, activeEdge, queueState = [], callStack = [] } = payload;

  return (
    <div className="flex flex-col items-center justify-center p-4 min-h-[260px] w-full select-none overflow-x-auto space-y-3">
      {/* Queue or Call Stack HUD */}
      <div className="flex items-center gap-4 flex-wrap text-xs font-mono">
        {queueState.length > 0 && (
          <div className="flex items-center gap-1.5 p-1.5 px-3 rounded-lg bg-[#ddf4ff] dark:bg-[#388bfd1a] border border-[#0969da]/30 text-[#0969da] dark:text-[#58a6ff]">
            <Layers className="w-3.5 h-3.5" />
            <span>BFS Queue (FIFO): [ {queueState.join(', ')} ]</span>
          </div>
        )}

        {callStack.length > 0 && (
          <div className="flex items-center gap-1.5 p-1.5 px-3 rounded-lg bg-[#fbefff] dark:bg-[#8250df1a] border border-[#8250df]/30 text-[#8250df] dark:text-[#a371f7]">
            <Workflow className="w-3.5 h-3.5" />
            <span>DFS Stack (LIFO): [ {callStack.join(' ➔ ')} ]</span>
          </div>
        )}
      </div>

      {/* SVG Canvas for Graph */}
      <svg className="w-full max-w-[500px] h-[200px]" viewBox="0 0 500 200">
        {/* Draw Edges */}
        {edges.map((edge, idx) => {
          const fromNode = nodes.find((n) => n.id === edge.from);
          const toNode = nodes.find((n) => n.id === edge.to);
          if (!fromNode || !toNode) return null;

          const isEdgeActive =
            activeEdge &&
            ((activeEdge.from === edge.from && activeEdge.to === edge.to) ||
              (activeEdge.from === edge.to && activeEdge.to === edge.from));

          const inShortest = edge.inShortestPath;

          const strokeColor = inShortest ? '#2ea043' : isEdgeActive ? '#0969da' : '#8c959f';
          const strokeW = inShortest || isEdgeActive ? 3 : 1.5;

          const midX = (fromNode.x + toNode.x) / 2;
          const midY = (fromNode.y + toNode.y) / 2;

          return (
            <g key={idx}>
              <line
                x1={fromNode.x}
                y1={fromNode.y}
                x2={toNode.x}
                y2={toNode.y}
                stroke={strokeColor}
                strokeWidth={strokeW}
                className="transition-all duration-300"
              />
              {edge.weight !== undefined && (
                <rect
                  x={midX - 10}
                  y={midY - 8}
                  width="20"
                  height="16"
                  rx="3"
                  fill="#f6f8fa"
                  stroke="#d0d7de"
                />
              )}
              {edge.weight !== undefined && (
                <text
                  x={midX}
                  y={midY + 4}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#57606a"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {edge.weight}
                </text>
              )}
            </g>
          );
        })}

        {/* Draw Graph Nodes */}
        {nodes.map((node) => {
          const isActive = node.id === activeNodeId || node.state === 'visiting';
          const isVisited = node.state === 'visited';
          const isQueued = node.state === 'queued';

          let fill = '#ffffff';
          let stroke = '#d0d7de';
          let textFill = '#1f2328';

          if (isActive) {
            fill = '#0969da';
            stroke = '#0550ae';
            textFill = '#ffffff';
          } else if (isVisited) {
            fill = '#2ea043';
            stroke = '#1a7f37';
            textFill = '#ffffff';
          } else if (isQueued) {
            fill = '#d29922';
            stroke = '#9a6700';
            textFill = '#ffffff';
          }

          return (
            <g key={node.id} className="transition-all duration-300">
              <circle
                cx={node.x}
                cy={node.y}
                r={16}
                fill={fill}
                stroke={stroke}
                strokeWidth="2.5"
                className={isActive ? 'filter drop-shadow-md scale-105' : ''}
              />
              <text
                x={node.x}
                y={node.y + 4}
                textAnchor="middle"
                fill={textFill}
                fontSize="11"
                fontFamily="monospace"
                fontWeight="bold"
              >
                {node.label}
              </text>
              {node.distance !== undefined && (
                <text
                  x={node.x}
                  y={node.y + 28}
                  textAnchor="middle"
                  fill="#0969da"
                  fontSize="10"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  d={node.distance}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
