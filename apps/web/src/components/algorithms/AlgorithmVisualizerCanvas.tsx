import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  Sparkles,
  Shuffle,
  Sliders,
  CheckCircle2,
  Info,
  Maximize2
} from 'lucide-react';

export type SupportedAlgoKey = 'binary-search' | 'two-pointers' | 'bubble-sort' | 'kadanes-algorithm';

export interface VisualizerStep {
  array: number[];
  pointers?: { [label: string]: number };
  highlightIndices?: number[];
  matchedIndices?: number[];
  windowRange?: [number, number]; // [left, right] active window
  description: string;
  auxData?: { [key: string]: string | number };
}

interface AlgorithmVisualizerCanvasProps {
  initialAlgorithm?: SupportedAlgoKey;
  allowedAlgorithms?: SupportedAlgoKey[];
  showSelector?: boolean;
}

export function AlgorithmVisualizerCanvas({
  initialAlgorithm = 'binary-search',
  allowedAlgorithms = ['binary-search', 'two-pointers', 'bubble-sort', 'kadanes-algorithm'],
  showSelector = true
}: AlgorithmVisualizerCanvasProps) {
  const [selectedAlgo, setSelectedAlgo] = useState<SupportedAlgoKey>(initialAlgorithm);
  const [targetVal, setTargetVal] = useState<number>(23);
  const [customArrayInput, setCustomArrayInput] = useState<string>('');
  const [showInputModal, setShowInputModal] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1); // 0.5, 1, 2
  const timerRef = useRef<any>(null);

  // Generate Steps for the chosen algorithm
  const steps: VisualizerStep[] = useMemo(() => {
    switch (selectedAlgo) {
      case 'binary-search': {
        const arr = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91];
        const target = targetVal;
        const resultSteps: VisualizerStep[] = [];
        let left = 0;
        let right = arr.length - 1;

        resultSteps.push({
          array: [...arr],
          pointers: { L: left, R: right },
          windowRange: [left, right],
          description: `Initial state: Searching for target ${target} in sorted array of ${arr.length} elements.`
        });

        while (left <= right) {
          const mid = Math.floor((left + right) / 2);
          resultSteps.push({
            array: [...arr],
            pointers: { L: left, M: mid, R: right },
            highlightIndices: [mid],
            windowRange: [left, right],
            description: `Inspect midpoint index ${mid} (value = ${arr[mid]}). Comparing against target ${target}.`
          });

          if (arr[mid] === target) {
            resultSteps.push({
              array: [...arr],
              pointers: { Found: mid },
              matchedIndices: [mid],
              windowRange: [mid, mid],
              description: `✓ Target ${target} found at index ${mid} in O(log n) time!`
            });
            break;
          } else if (arr[mid] < target) {
            resultSteps.push({
              array: [...arr],
              pointers: { L: left, M: mid, R: right },
              highlightIndices: [mid],
              windowRange: [left, right],
              description: `${arr[mid]} < ${target}. Target must be in right half. Discarding left range [${left}...${mid}].`
            });
            left = mid + 1;
          } else {
            resultSteps.push({
              array: [...arr],
              pointers: { L: left, M: mid, R: right },
              highlightIndices: [mid],
              windowRange: [left, right],
              description: `${arr[mid]} > ${target}. Target must be in left half. Discarding right range [${mid}...${right}].`
            });
            right = mid - 1;
          }
        }

        if (left > right) {
          resultSteps.push({
            array: [...arr],
            description: `Target ${target} was not found in the array. Search terminated.`
          });
        }
        return resultSteps;
      }

      case 'two-pointers': {
        const arr = [1, 3, 4, 7, 11, 15];
        const target = 15;
        const resultSteps: VisualizerStep[] = [];
        let l = 0;
        let r = arr.length - 1;

        resultSteps.push({
          array: [...arr],
          pointers: { Left: l, Right: r },
          windowRange: [l, r],
          description: `Two-Sum with Sorted Two-Pointers: Find two numbers summing to target ${target}.`
        });

        while (l < r) {
          const sum = arr[l] + arr[r];
          resultSteps.push({
            array: [...arr],
            pointers: { Left: l, Right: r },
            highlightIndices: [l, r],
            windowRange: [l, r],
            auxData: { 'Current Sum': `${arr[l]} + ${arr[r]} = ${sum}`, Target: target },
            description: `Evaluating pair arr[${l}] (${arr[l]}) + arr[${r}] (${arr[r]}) = ${sum}. Target is ${target}.`
          });

          if (sum === target) {
            resultSteps.push({
              array: [...arr],
              pointers: { Pair1: l, Pair2: r },
              matchedIndices: [l, r],
              auxData: { 'Pair Found': `${arr[l]} + ${arr[r]} = ${target}` },
              description: `✓ Match found! Indices [${l}, ${r}] sum exactly to ${target}.`
            });
            break;
          } else if (sum < target) {
            resultSteps.push({
              array: [...arr],
              pointers: { Left: l, Right: r },
              windowRange: [l, r],
              description: `Sum ${sum} is too small (< ${target}). Advance Left pointer from ${l} to ${l + 1}.`
            });
            l++;
          } else {
            resultSteps.push({
              array: [...arr],
              pointers: { Left: l, Right: r },
              windowRange: [l, r],
              description: `Sum ${sum} is too large (> ${target}). Decrement Right pointer from ${r} to ${r - 1}.`
            });
            r--;
          }
        }
        return resultSteps;
      }

      case 'bubble-sort': {
        const arr = [29, 10, 14, 37, 13];
        const resultSteps: VisualizerStep[] = [];
        const copy = [...arr];
        const n = copy.length;

        resultSteps.push({
          array: [...copy],
          description: `Bubble Sort: Sorting array [${copy.join(', ')}] in ascending order.`
        });

        for (let i = 0; i < n - 1; i++) {
          for (let j = 0; j < n - i - 1; j++) {
            resultSteps.push({
              array: [...copy],
              pointers: { A: j, B: j + 1 },
              highlightIndices: [j, j + 1],
              description: `Compare arr[${j}] (${copy[j]}) and arr[${j + 1}] (${copy[j + 1]}).`
            });

            if (copy[j] > copy[j + 1]) {
              const temp = copy[j];
              copy[j] = copy[j + 1];
              copy[j + 1] = temp;
              resultSteps.push({
                array: [...copy],
                pointers: { A: j, B: j + 1 },
                highlightIndices: [j, j + 1],
                description: `Swapped! arr[${j}] was greater than arr[${j + 1}].`
              });
            }
          }
        }

        resultSteps.push({
          array: [...copy],
          matchedIndices: [0, 1, 2, 3, 4],
          description: `✓ Array completely sorted in non-decreasing order!`
        });
        return resultSteps;
      }

      case 'kadanes-algorithm': {
        const arr = [-2, 1, -3, 4, -1, 2, 1, -5, 4];
        const resultSteps: VisualizerStep[] = [];
        let maxSoFar = arr[0];
        let currMax = arr[0];

        resultSteps.push({
          array: [...arr],
          pointers: { i: 0 },
          highlightIndices: [0],
          auxData: { 'Max Subarray Sum': maxSoFar, 'Current Running Sum': currMax },
          description: `Kadane's Algorithm: Find contiguous subarray with maximum sum. Start at index 0 (val = ${arr[0]}).`
        });

        for (let i = 1; i < arr.length; i++) {
          const val = arr[i];
          const continued = currMax + val;
          const startedFresh = val;
          currMax = Math.max(val, currMax + val);
          const improved = currMax > maxSoFar;
          if (improved) maxSoFar = currMax;

          resultSteps.push({
            array: [...arr],
            pointers: { i },
            highlightIndices: [i],
            auxData: { 'Max Subarray Sum': maxSoFar, 'Current Running Sum': currMax },
            description: `Index ${i} (${val}): Extend sum (${continued}) or start fresh (${startedFresh})? currMax = ${currMax}.${improved ? ` New Max: ${maxSoFar}!` : ''}`
          });
        }

        resultSteps.push({
          array: [...arr],
          auxData: { 'Final Maximum Sum': maxSoFar },
          description: `✓ Complete! Maximum contiguous subarray sum is ${maxSoFar}.`
        });
        return resultSteps;
      }
    }
  }, [selectedAlgo, targetVal]);

  // Handle Play/Pause timer
  useEffect(() => {
    if (isPlaying) {
      const intervalMs = Math.round(1100 / speed);
      timerRef.current = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev >= steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, intervalMs);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, speed, steps.length]);

  // Reset step index when algorithm changes
  const handleSelectAlgo = (algo: SupportedAlgoKey) => {
    setSelectedAlgo(algo);
    setCurrentStepIndex(0);
    setIsPlaying(false);
  };

  const currentStep = steps[currentStepIndex] || steps[0];
  const maxValInArr = Math.max(...currentStep.array.map(Math.abs), 1);

  return (
    <div className="rounded-2xl border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#161b22] shadow-sm overflow-hidden transition-all duration-200">
      {/* 1. Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-[#f6f8fa] dark:bg-[#161b22] border-b border-[#d0d7de] dark:border-[#30363d]">
        <div className="flex items-center gap-2.5">
          <span className="p-1.5 rounded-lg bg-[#0969da]/10 text-[#0969da] dark:text-[#58a6ff]">
            <Sparkles className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-xs font-bold tracking-tight text-[#1f2328] dark:text-[#f0f6fc] uppercase">
              Interactive Execution Canvas
            </h3>
            <p className="text-[11px] text-[#57606a] dark:text-[#8b949e]">
              Step-by-step algorithmic telemetry with active pointer tracking
            </p>
          </div>
        </div>

        {/* Algorithm Switcher */}
        {showSelector && (
          <div className="flex items-center gap-2">
            <label className="text-[11px] font-semibold text-[#57606a] dark:text-[#8b949e] hidden sm:inline">
              Algorithm:
            </label>
            <select
              value={selectedAlgo}
              onChange={(e) => handleSelectAlgo(e.target.value as SupportedAlgoKey)}
              className="bg-white dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#30363d] text-xs font-semibold text-[#1f2328] dark:text-[#f0f6fc] rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-[#0969da] dark:focus:ring-[#58a6ff] outline-none cursor-pointer"
            >
              <option value="binary-search">Binary Search (O(log n))</option>
              <option value="two-pointers">Two Pointers (O(n))</option>
              <option value="bubble-sort">Bubble Sort (O(n²))</option>
              <option value="kadanes-algorithm">Kadane&apos;s Algorithm (O(n))</option>
            </select>
          </div>
        )}
      </div>

      {/* 2. Visual Animation Stage */}
      <div className="p-6 sm:p-8 bg-gradient-to-b from-[#f6f8fa]/50 to-white dark:from-[#0d1117] dark:to-[#161b22] min-h-[260px] flex flex-col justify-center items-center select-none">
        {/* Dynamic Canvas Bars / Cells */}
        <div className="w-full max-w-2xl flex items-end justify-center gap-2 sm:gap-3 py-6 px-2 overflow-x-auto min-h-[160px]">
          {currentStep.array.map((val, idx) => {
            const isHighlighted = currentStep.highlightIndices?.includes(idx);
            const isMatched = currentStep.matchedIndices?.includes(idx);
            const isInWindow =
              !currentStep.windowRange ||
              (idx >= currentStep.windowRange[0] && idx <= currentStep.windowRange[1]);

            // Find pointers pointing to this index
            const activePointers = currentStep.pointers
              ? Object.entries(currentStep.pointers).filter(([_, pos]) => pos === idx)
              : [];

            // Height scaling for bar chart look
            const heightPercent = Math.max(35, Math.min(100, Math.round((Math.abs(val) / maxValInArr) * 85) + 20));

            return (
              <div key={idx} className="flex flex-col items-center gap-1.5 flex-1 max-w-[56px] min-w-[36px]">
                {/* Pointer tags above box */}
                <div className="h-5 flex items-center justify-center gap-1">
                  {activePointers.map(([label]) => (
                    <span
                      key={label}
                      className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold shadow-2xs animate-bounce"
                      style={{
                        backgroundColor: label === 'M' || label === 'Found' ? '#2ea043' : '#0969da',
                        color: '#ffffff'
                      }}
                    >
                      {label}
                    </span>
                  ))}
                </div>

                {/* Array cell / bar */}
                <div
                  style={{ height: `${heightPercent}px` }}
                  className={`w-full rounded-xl flex items-center justify-center font-mono font-bold text-xs sm:text-sm border transition-all duration-300 shadow-xs ${
                    isMatched
                      ? 'bg-[#2ea043] text-white border-[#238636] scale-105 shadow-md shadow-[#2ea043]/20 ring-2 ring-[#2ea043]/40'
                      : isHighlighted
                      ? 'bg-[#bb8009] text-white border-[#9a6700] scale-105 shadow-md shadow-[#bb8009]/20 ring-2 ring-[#bb8009]/40'
                      : !isInWindow
                      ? 'bg-[#f6f8fa] dark:bg-[#21262d] text-[#8c959f] dark:text-[#6e7681] border-[#d0d7de] dark:border-[#30363d] opacity-35'
                      : 'bg-white dark:bg-[#161b22] text-[#1f2328] dark:text-[#f0f6fc] border-[#0969da]/40 hover:border-[#0969da]'
                  }`}
                >
                  {val}
                </div>

                {/* Array index label */}
                <span className="text-[10px] font-mono text-[#656d76] dark:text-[#8b949e]">
                  [{idx}]
                </span>
              </div>
            );
          })}
        </div>

        {/* Live Step Explanation Callout */}
        <div className="mt-4 w-full max-w-2xl px-4 py-2.5 rounded-xl bg-white dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#30363d] shadow-2xs flex items-start gap-2.5">
          <Info className="w-4 h-4 text-[#0969da] dark:text-[#58a6ff] shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-mono font-semibold text-[#0969da] dark:text-[#58a6ff]">
                Step {currentStepIndex + 1} of {steps.length}
              </span>
              {currentStep.auxData && (
                <div className="flex items-center gap-2">
                  {Object.entries(currentStep.auxData).map(([k, v]) => (
                    <span
                      key={k}
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#f6f8fa] dark:bg-[#21262d] text-[#1f2328] dark:text-[#f0f6fc] border border-[#d0d7de] dark:border-[#30363d]"
                    >
                      <strong>{k}:</strong> {v}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-[#1f2328] dark:text-[#e6edf3] font-medium mt-0.5 leading-relaxed">
              {currentStep.description}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Playback Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-[#f6f8fa] dark:bg-[#161b22] border-t border-[#d0d7de] dark:border-[#30363d]">
        {/* Step Navigation */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              setIsPlaying(false);
              setCurrentStepIndex(0);
            }}
            title="Reset to step 1"
            className="p-1.5 rounded-lg border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#21262d] hover:bg-[#eaeef2] dark:hover:bg-[#30363d] text-[#1f2328] dark:text-[#f0f6fc] transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => {
              setIsPlaying(false);
              setCurrentStepIndex((prev) => Math.max(0, prev - 1));
            }}
            disabled={currentStepIndex <= 0}
            title="Previous Step"
            className="p-1.5 rounded-lg border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#21262d] hover:bg-[#eaeef2] dark:hover:bg-[#30363d] text-[#1f2328] dark:text-[#f0f6fc] disabled:opacity-40 transition cursor-pointer"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>

          {/* Primary Play/Pause Button */}
          <button
            onClick={() => {
              if (currentStepIndex >= steps.length - 1) {
                setCurrentStepIndex(0);
              }
              setIsPlaying(!isPlaying);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1f883d] hover:bg-[#1a7f37] dark:bg-[#238636] dark:hover:bg-[#2ea043] text-white text-xs font-bold shadow-xs transition cursor-pointer"
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{currentStepIndex >= steps.length - 1 ? 'Replay' : 'Play'}</span>
              </>
            )}
          </button>

          <button
            onClick={() => {
              setIsPlaying(false);
              setCurrentStepIndex((prev) => Math.min(steps.length - 1, prev + 1));
            }}
            disabled={currentStepIndex >= steps.length - 1}
            title="Next Step"
            className="p-1.5 rounded-lg border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#21262d] hover:bg-[#eaeef2] dark:hover:bg-[#30363d] text-[#1f2328] dark:text-[#f0f6fc] disabled:opacity-40 transition cursor-pointer"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Speed & Target Customizer */}
        <div className="flex items-center gap-3">
          {selectedAlgo === 'binary-search' && (
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-[11px] font-semibold text-[#57606a] dark:text-[#8b949e]">Target:</span>
              <select
                value={targetVal}
                onChange={(e) => {
                  setTargetVal(Number(e.target.value));
                  setCurrentStepIndex(0);
                  setIsPlaying(false);
                }}
                className="bg-white dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#30363d] text-xs font-mono font-bold text-[#1f2328] dark:text-[#f0f6fc] rounded px-2 py-1 outline-none cursor-pointer"
              >
                {[2, 8, 16, 23, 56, 91, 99].map((v) => (
                  <option key={v} value={v}>
                    {v} {v === 99 ? '(Not Found)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Speed Selector */}
          <div className="inline-flex rounded-lg p-0.5 bg-white dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#30363d]">
            {[0.5, 1, 2].map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold transition cursor-pointer ${
                  speed === s
                    ? 'bg-[#0969da] text-white shadow-2xs'
                    : 'text-[#656d76] dark:text-[#848d97] hover:text-[#1f2328] dark:hover:text-[#f0f6fc]'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
