import React, { useState } from 'react';
import { Shuffle, Zap, AlertTriangle, Edit3, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { AlgorithmDefinition } from '../core/types';
import { CustomInputDialog } from './CustomInputDialog';

interface InputControlBarProps {
  algorithm: AlgorithmDefinition;
  currentInput: any;
  onUpdateInput: (newInput: any) => void;
  onResetDefault: () => void;
}

export function InputControlBar({
  algorithm,
  currentInput,
  onUpdateInput,
  onResetDefault
}: InputControlBarProps) {
  const [showCustomModal, setShowCustomModal] = useState(false);

  const presets = algorithm.presets;

  // Randomize handler
  const handleRandomize = () => {
    if (presets?.generateRandom) {
      onUpdateInput(presets.generateRandom());
      return;
    }

    // Default randomize for array searching
    if (currentInput?.array && Array.isArray(currentInput.array)) {
      const len = 8 + Math.floor(Math.random() * 5); // 8-12 elements
      const randomSet = new Set<number>();
      while (randomSet.size < len) {
        randomSet.add(Math.floor(Math.random() * 95) + 3);
      }
      const sorted = Array.from(randomSet).sort((a, b) => a - b);
      const randomTarget = sorted[Math.floor(Math.random() * sorted.length)];

      onUpdateInput({
        ...currentInput,
        array: sorted,
        target: randomTarget
      });
    }
  };

  const handleBestCase = () => {
    if (presets?.bestCase) {
      onUpdateInput(presets.bestCase.input);
    } else if (currentInput?.array && Array.isArray(currentInput.array)) {
      // For binary search: target at exact midpoint
      const midIdx = Math.floor(currentInput.array.length / 2);
      onUpdateInput({
        ...currentInput,
        target: currentInput.array[midIdx]
      });
    }
  };

  const handleWorstCase = () => {
    if (presets?.worstCase) {
      onUpdateInput(presets.worstCase.input);
    } else if (currentInput?.array && Array.isArray(currentInput.array)) {
      // Target absent from array
      onUpdateInput({
        ...currentInput,
        target: 999
      });
    }
  };

  return (
    <>
      <div className="flex items-center justify-between gap-2 p-2 px-3 rounded-xl border border-[#d0d7de]/70 dark:border-[#30363d]/70 bg-white/80 dark:bg-[#0d1117]/80 backdrop-blur-xs text-xs flex-wrap">
        {/* Left: Input Summary */}
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-3.5 h-3.5 text-[#0969da] dark:text-[#58a6ff]" />
          <span className="font-semibold text-[#1f2328] dark:text-[#f0f6fc]">
            Live Input Studio:
          </span>
          {currentInput?.target !== undefined && (
            <span className="px-2 py-0.5 rounded-md font-mono bg-[#f6f8fa] dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] text-[#0969da] dark:text-[#58a6ff]">
              Target: <strong>{currentInput.target}</strong>
            </span>
          )}
          {currentInput?.capacity !== undefined && (
            <span className="px-2 py-0.5 rounded-md font-mono bg-[#f6f8fa] dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] text-[#8250df] dark:text-[#a371f7]">
              Capacity: <strong>{currentInput.capacity}</strong>
            </span>
          )}
        </div>

        {/* Right: Quick Action Presets */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={handleRandomize}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold border border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#161b22] text-[#57606a] dark:text-[#8b949e] hover:text-[#1f2328] dark:hover:text-[#f0f6fc] hover:bg-[#eaeef2] transition cursor-pointer"
            title="Generate Random Dataset"
          >
            <Shuffle className="w-3 h-3 text-[#0969da]" />
            <span>Randomize</span>
          </button>

          <button
            onClick={handleBestCase}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold border border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#161b22] text-[#1a7f37] dark:text-[#3fb950] hover:bg-[#dafbe1]/40 transition cursor-pointer"
            title="Load Best-Case Scenario (Immediate O(1) hit)"
          >
            <Zap className="w-3 h-3" />
            <span>Best Case</span>
          </button>

          <button
            onClick={handleWorstCase}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold border border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#161b22] text-[#cf222e] dark:text-[#f85149] hover:bg-[#ffebe9]/40 transition cursor-pointer"
            title="Load Worst-Case Scenario (Full Traversal / Absent)"
          >
            <AlertTriangle className="w-3 h-3" />
            <span>Worst Case</span>
          </button>

          <button
            onClick={() => setShowCustomModal(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold border border-[#0969da]/30 dark:border-[#58a6ff]/40 bg-[#ddf4ff] dark:bg-[#388bfd1a] text-[#0969da] dark:text-[#58a6ff] hover:bg-[#b6e3ff] transition cursor-pointer"
            title="Edit input array and target"
          >
            <Edit3 className="w-3 h-3" />
            <span>Custom Edit</span>
          </button>

          <button
            onClick={onResetDefault}
            className="p-1 rounded-md text-[#57606a] dark:text-[#8b949e] hover:text-[#1f2328] dark:hover:text-[#f0f6fc] transition cursor-pointer"
            title="Reset to Default Specifications"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <CustomInputDialog
        isOpen={showCustomModal}
        onClose={() => setShowCustomModal(false)}
        currentInput={currentInput}
        algoCategory={algorithm.category}
        algoName={algorithm.name}
        onApplyInput={onUpdateInput}
      />
    </>
  );
}
