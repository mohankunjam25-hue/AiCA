import React, { useState } from 'react';
import { X, CheckCircle2, AlertCircle } from 'lucide-react';

interface CustomInputDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentInput: any;
  algoCategory: string;
  algoName: string;
  onApplyInput: (newInput: any) => void;
}

export function CustomInputDialog({
  isOpen,
  onClose,
  currentInput,
  algoCategory,
  algoName,
  onApplyInput
}: CustomInputDialogProps) {
  const [arrayStr, setArrayStr] = useState<string>(() => {
    if (currentInput?.array && Array.isArray(currentInput.array)) {
      return currentInput.array.join(', ');
    }
    return '2, 5, 8, 12, 16, 23, 38';
  });

  const [targetVal, setTargetVal] = useState<number>(() => {
    return currentInput?.target ?? 23;
  });

  const [capacityVal, setCapacityVal] = useState<number>(() => {
    return currentInput?.capacity ?? 3;
  });

  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (algoCategory === 'Searching' || currentInput?.array) {
        const parsed = arrayStr
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
          .map(Number);

        if (parsed.some(isNaN)) {
          setError('Array must contain valid numbers separated by commas.');
          return;
        }

        if (parsed.length < 2) {
          setError('Please provide at least 2 numbers in the array.');
          return;
        }

        // If it's binary search, ensure sorted
        if (algoName.toLowerCase().includes('binary')) {
          parsed.sort((a, b) => a - b);
        }

        onApplyInput({
          ...currentInput,
          array: parsed,
          target: targetVal
        });
        onClose();
      } else if (algoCategory === 'System Design' || currentInput?.capacity !== undefined) {
        if (capacityVal < 1 || capacityVal > 10) {
          setError('Capacity must be between 1 and 10.');
          return;
        }
        onApplyInput({
          ...currentInput,
          capacity: capacityVal
        });
        onClose();
      } else {
        // Fallback
        onApplyInput(currentInput);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Invalid input formatting');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-md bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#0d1117]">
          <h3 className="text-sm font-bold text-[#1f2328] dark:text-[#f0f6fc]">
            Custom Input Studio: {algoName}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[#57606a] dark:text-[#8b949e] hover:bg-[#d0d7de]/50 dark:hover:bg-[#30363d]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleApply} className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-lg border border-[#cf222e]/40 bg-[#ffebe9] dark:bg-[#f851491a] text-[#cf222e] dark:text-[#f85149] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Array Input */}
          {(algoCategory === 'Searching' || currentInput?.array) && (
            <>
              <div className="space-y-1.5">
                <label className="font-bold text-[#1f2328] dark:text-[#f0f6fc] block">
                  Array Elements (comma-separated):
                </label>
                <input
                  type="text"
                  value={arrayStr}
                  onChange={(e) => setArrayStr(e.target.value)}
                  placeholder="e.g. 3, 7, 12, 19, 25, 42"
                  className="w-full p-2.5 rounded-lg border border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#0d1117] font-mono text-xs text-[#1f2328] dark:text-[#f0f6fc] focus:ring-1 focus:ring-[#0969da] outline-none"
                />
                <span className="text-[11px] text-[#57606a] dark:text-[#8b949e]">
                  {algoName.toLowerCase().includes('binary') ? 'Values will be sorted automatically.' : 'Separate numbers with commas.'}
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-[#1f2328] dark:text-[#f0f6fc] block">
                  Target Value to Search:
                </label>
                <input
                  type="number"
                  value={targetVal}
                  onChange={(e) => setTargetVal(Number(e.target.value))}
                  className="w-full p-2.5 rounded-lg border border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#0d1117] font-mono text-xs text-[#1f2328] dark:text-[#f0f6fc] focus:ring-1 focus:ring-[#0969da] outline-none"
                />
              </div>
            </>
          )}

          {/* System Design / Capacity Input */}
          {(algoCategory === 'System Design' || currentInput?.capacity !== undefined) && (
            <div className="space-y-1.5">
              <label className="font-bold text-[#1f2328] dark:text-[#f0f6fc] block">
                Cache Capacity Limit (1 - 10):
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={capacityVal}
                onChange={(e) => setCapacityVal(Number(e.target.value))}
                className="w-full p-2.5 rounded-lg border border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#0d1117] font-mono text-xs text-[#1f2328] dark:text-[#f0f6fc] focus:ring-1 focus:ring-[#0969da] outline-none"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#d0d7de] dark:border-[#30363d]">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-[#d0d7de] dark:border-[#30363d] text-[#57606a] dark:text-[#8b949e] hover:bg-[#f6f8fa] dark:hover:bg-[#21262d] transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-[#0969da] hover:bg-[#0860ca] dark:bg-[#1f6feb] text-white font-semibold shadow-xs transition cursor-pointer"
            >
              Recalibrate & Visualize
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
