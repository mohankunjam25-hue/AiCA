import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  RotateCcw,
  Terminal,
  FlaskConical,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Lock,
} from 'lucide-react';

export interface TestCaseResult {
  index: number;
  isPublic: boolean;
  passed: boolean;
  status: string;
  input?: string;
  expectedOutput?: string;
  actualOutput?: string;
  executionTimeMs?: number;
  error?: string;
  stepsCount?: number;
}

interface FlowchartBottomConsoleProps {
  // Playback state
  currentStep: number;
  totalSteps: number;
  isPlaying: boolean;
  speed: number;
  onPlay: () => void;
  onPause: () => void;
  onStepForward: () => void;
  onStepBackward: () => void;
  onReset: () => void;
  onSeek: (step: number) => void;
  onSpeedChange: (speed: number) => void;

  // Output terminal state
  output: string;

  // Test case & Input state
  customInput: string;
  onCustomInputChange: (val: string) => void;
  onRunCustom: () => void;
  onRunTestCases: () => void;
  isRunningTests: boolean;
  testCaseResults: TestCaseResult[] | null;
  allPassed?: boolean;
  problemId?: string;
}

export function FlowchartBottomConsole({
  currentStep,
  totalSteps,
  isPlaying,
  speed,
  onPlay,
  onPause,
  onStepForward,
  onStepBackward,
  onReset,
  onSeek,
  onSpeedChange,
  output,
  customInput,
  onCustomInputChange,
  onRunCustom,
  onRunTestCases,
  isRunningTests,
  testCaseResults,
  allPassed,
  problemId,
}: FlowchartBottomConsoleProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'terminal' | 'testcases'>('terminal');
  const [expandedTestIndex, setExpandedTestIndex] = useState<number | null>(1);
  const terminalScrollRef = useRef<HTMLDivElement>(null);

  const speeds = [0.5, 1, 2, 4];
  const isFinished = totalSteps > 0 && currentStep >= totalSteps;
  const outputLines = output ? output.split('\n').filter(Boolean) : [];

  // Auto-scroll terminal when new output is streamed
  useEffect(() => {
    if (terminalScrollRef.current) {
      terminalScrollRef.current.scrollTop = terminalScrollRef.current.scrollHeight;
    }
  }, [output]);

  return (
    <div className="w-full bg-slate-900/95 dark:bg-[#161b22]/98 border-t border-slate-800/90 shadow-2xl backdrop-blur-md flex flex-col z-20 transition-all duration-200">
      {/* Dock Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 sm:px-4 sm:py-2 border-b border-slate-800/70 select-none">
        {/* Left: VCR Playback Engine Controls */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          <button
            onClick={onReset}
            disabled={totalSteps === 0}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
            title="Reset execution (Home)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onStepBackward}
            disabled={currentStep <= 0}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
            title="Step Backward (F9)"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={isPlaying ? onPause : onPlay}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-xs transition cursor-pointer shadow-md ${
              isPlaying
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30'
                : isFinished
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
            }`}
            title={isPlaying ? 'Pause' : isFinished ? 'Replay from start' : 'Play Flowchart'}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-white" />
                <span>Pause</span>
              </>
            ) : isFinished ? (
              <>
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Replay</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Play</span>
              </>
            )}
          </button>

          <button
            onClick={onStepForward}
            disabled={totalSteps > 0 && currentStep >= totalSteps}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
            title="Step Forward (F10)"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>

          {/* Scrubber slider */}
          <div className="hidden sm:flex items-center gap-2 px-2">
            <input
              type="range"
              min={0}
              max={totalSteps || 1}
              value={currentStep}
              onChange={(e) => onSeek(Number(e.target.value))}
              disabled={totalSteps === 0}
              className="w-20 md:w-32 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500 disabled:opacity-40"
            />
            <span className="font-mono text-[11px] text-slate-400 whitespace-nowrap">
              {currentStep}/{totalSteps}
            </span>
          </div>

          {/* Speed Selector */}
          <div className="hidden md:flex items-center gap-0.5 bg-slate-950/70 p-0.5 rounded-lg border border-slate-800">
            {speeds.map((s) => (
              <button
                key={s}
                onClick={() => onSpeedChange(s)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold transition cursor-pointer ${
                  speed === s
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* Center / Right: Tabs & Drawer Toggle */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Terminal Tab Button */}
          <button
            onClick={() => {
              setActiveTab('terminal');
              setIsExpanded(true);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === 'terminal' && isExpanded
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/80 shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span>Terminal</span>
            {outputLines.length > 0 && (
              <span className="text-[10px] font-mono px-1 rounded-full bg-emerald-900/80 text-emerald-300">
                {outputLines.length}
              </span>
            )}
          </button>

          {/* Test Cases Tab Button */}
          <button
            onClick={() => {
              setActiveTab('testcases');
              setIsExpanded(true);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === 'testcases' && isExpanded
                ? 'bg-blue-950/80 text-blue-300 border border-blue-700/80 shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5 text-blue-400" />
            <span>Test Cases</span>
            {testCaseResults && (
              <span
                className={`text-[10px] font-mono px-1 rounded-full ${
                  allPassed
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-700'
                    : 'bg-rose-950 text-rose-400 border border-rose-700'
                }`}
              >
                {testCaseResults.filter((t) => t.passed).length}/{testCaseResults.length}
              </span>
            )}
          </button>

          {/* Expand / Minimize Toggle */}
          <button
            onClick={() => setIsExpanded((prev) => !prev)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title={isExpanded ? 'Collapse Console' : 'Expand Console'}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronUp className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded Console Panel Body */}
      {isExpanded && (
        <div className="p-3 sm:p-4 max-h-56 sm:max-h-64 overflow-y-auto animate-in fade-in duration-150">
          {/* TAB 1: Real-time Streaming Output Terminal */}
          {activeTab === 'terminal' && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>Output Stream (Live Step-by-Step Execution)</span>
                {outputLines.length > 0 && (
                  <span>{outputLines.length} lines emitted</span>
                )}
              </div>
              <div
                ref={terminalScrollRef}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-400 min-h-[90px] max-h-48 overflow-y-auto whitespace-pre-wrap select-text scroll-smooth"
              >
                {output ? (
                  output
                ) : (
                  <span className="text-slate-600 italic">
                    No output produced yet. Click Play to start execution.
                  </span>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Custom Input & Problem Test Cases */}
          {activeTab === 'testcases' && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-300">
                    Standard Input (stdin):
                  </span>
                  <span className="text-[11px] text-slate-500 italic">
                    Space or newline separated values
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={onRunCustom}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition cursor-pointer shadow-sm active:scale-95"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Run Custom</span>
                  </button>

                  {problemId && (
                    <button
                      onClick={onRunTestCases}
                      disabled={isRunningTests}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition cursor-pointer shadow-sm disabled:opacity-50"
                    >
                      <span>
                        {isRunningTests ? 'Evaluating...' : 'Run All Test Cases'}
                      </span>
                    </button>
                  )}
                </div>
              </div>

              {/* Stdin text area */}
              <textarea
                value={customInput}
                onChange={(e) => onCustomInputChange(e.target.value)}
                placeholder="e.g. 5 10 or [[1, 3], [2, 6]]"
                className="w-full h-16 p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 outline-none focus:border-blue-500 resize-none"
              />

              {/* Official problem test case results table (if run) */}
              {testCaseResults && testCaseResults.length > 0 && (
                <div className="mt-2 space-y-1.5 border-t border-slate-800/80 pt-2">
                  <div className="text-xs font-semibold text-slate-300">
                    Test Results:
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {testCaseResults.map((tc) => (
                      <div
                        key={tc.index}
                        onClick={() =>
                          setExpandedTestIndex((prev) =>
                            prev === tc.index ? null : tc.index
                          )
                        }
                        className={`p-2 rounded-xl border text-xs cursor-pointer transition flex items-center justify-between ${
                          tc.passed
                            ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-300'
                            : 'bg-rose-950/40 border-rose-700/60 text-rose-300'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          {tc.passed ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 text-rose-400" />
                          )}
                          <span className="font-semibold">Case {tc.index}</span>
                        </div>
                        {!tc.isPublic && (
                          <Lock className="w-3 h-3 text-slate-400" />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Expanded test case inspector */}
                  {expandedTestIndex !== null && (
                    (() => {
                      const sel = testCaseResults.find(
                        (t) => t.index === expandedTestIndex
                      );
                      if (!sel) return null;
                      return (
                        <div className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 text-xs font-mono space-y-1">
                          <div className="flex items-center justify-between font-bold">
                            <span>Test Case #{sel.index} Details:</span>
                            <span
                              className={
                                sel.passed ? 'text-emerald-400' : 'text-rose-400'
                              }
                            >
                              {sel.passed ? 'PASSED' : 'FAILED'}
                            </span>
                          </div>
                          {sel.input !== undefined && (
                            <div>
                              <span className="text-slate-500">Input: </span>
                              <span className="text-slate-300">{sel.input}</span>
                            </div>
                          )}
                          {sel.expectedOutput !== undefined && (
                            <div>
                              <span className="text-slate-500">
                                Expected Output:{' '}
                              </span>
                              <span className="text-slate-300">
                                {sel.expectedOutput}
                              </span>
                            </div>
                          )}
                          {sel.actualOutput !== undefined && (
                            <div>
                              <span className="text-slate-500">
                                Actual Output:{' '}
                              </span>
                              <span
                                className={
                                  sel.passed ? 'text-emerald-400' : 'text-rose-400'
                                }
                              >
                                {sel.actualOutput}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })()
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
