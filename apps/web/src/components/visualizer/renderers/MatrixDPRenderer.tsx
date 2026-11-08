import React from 'react';
import { MatrixVisualPayload } from '../core/types';
import { Table, Zap } from 'lucide-react';

interface MatrixDPRendererProps {
  payload: MatrixVisualPayload;
}

export function MatrixDPRenderer({ payload }: MatrixDPRendererProps) {
  const {
    grid = [],
    rowLabels = [],
    colLabels = [],
    activeCell,
    dependencyCells = [],
    formulaExplanation
  } = payload;

  const isDependency = (r: number, c: number) => {
    return dependencyCells.some(([dr, dc]) => dr === r && dc === c);
  };

  const isActive = (r: number, c: number) => {
    return activeCell && activeCell[0] === r && activeCell[1] === c;
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 min-h-[260px] w-full select-none overflow-x-auto space-y-3">
      {/* Formula HUD */}
      {formulaExplanation && (
        <div className="flex items-center gap-1.5 p-2 px-3.5 rounded-lg bg-[#ddf4ff] dark:bg-[#388bfd1a] border border-[#0969da]/30 text-xs font-mono text-[#0969da] dark:text-[#58a6ff] animate-in fade-in">
          <Zap className="w-3.5 h-3.5 shrink-0" />
          <span>{formulaExplanation}</span>
        </div>
      )}

      {/* DP Table */}
      <div className="rounded-xl border border-[#d0d7de] dark:border-[#30363d] overflow-hidden shadow-xs bg-white dark:bg-[#0d1117]">
        <table className="border-collapse text-xs font-mono">
          <thead>
            <tr className="bg-[#f6f8fa] dark:bg-[#161b22] border-b border-[#d0d7de] dark:border-[#30363d]">
              <th className="p-2.5 px-3 text-[#57606a] dark:text-[#8b949e] border-r border-[#d0d7de] dark:border-[#30363d]">
                Items / Cap
              </th>
              {colLabels.map((col, cIdx) => (
                <th
                  key={cIdx}
                  className={`p-2 px-3 text-center transition-colors ${
                    activeCell && activeCell[1] === cIdx
                      ? 'text-[#0969da] dark:text-[#58a6ff] font-bold bg-[#0969da1a]'
                      : 'text-[#57606a] dark:text-[#8b949e]'
                  }`}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.map((row, rIdx) => {
              const isRowActive = activeCell && activeCell[0] === rIdx;

              return (
                <tr
                  key={rIdx}
                  className={`border-b last:border-b-0 border-[#d0d7de]/60 dark:border-[#30363d]/60 ${
                    isRowActive ? 'bg-[#0969da0a]' : ''
                  }`}
                >
                  {/* Row Header */}
                  <td className="p-2 px-3 font-semibold text-[#1f2328] dark:text-[#f0f6fc] bg-[#f6f8fa] dark:bg-[#161b22] border-r border-[#d0d7de] dark:border-[#30363d]">
                    {rowLabels[rIdx] || `R${rIdx}`}
                  </td>

                  {/* Cells */}
                  {row.map((val, cIdx) => {
                    const active = isActive(rIdx, cIdx);
                    const dep = isDependency(rIdx, cIdx);

                    return (
                      <td
                        key={cIdx}
                        className={`p-2.5 px-3.5 text-center font-bold transition-all duration-300 relative ${
                          active
                            ? 'bg-[#0969da] text-white scale-105 shadow-md z-10'
                            : dep
                            ? 'bg-[#8250df26] dark:bg-[#8250df33] text-[#8250df] dark:text-[#a371f7] ring-1 ring-[#8250df]'
                            : 'text-[#24292f] dark:text-[#c9d1d9] hover:bg-[#f6f8fa] dark:hover:bg-[#161b22]'
                        }`}
                      >
                        {val}
                        {active && (
                          <span className="absolute -top-1 -right-1 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-[11px] text-[#57606a] dark:text-[#8b949e]">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-[#0969da]" />
          <span>Active Cell dp[i][w]</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-[#8250df33] border border-[#8250df]" />
          <span>Lookup Source Dependencies</span>
        </div>
      </div>
    </div>
  );
}
