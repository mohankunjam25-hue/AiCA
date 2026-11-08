import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Play,
  ChevronDown,
  ChevronUp,
  Lock,
  Terminal,
  Layers,
} from 'lucide-react';

interface TestCaseResult {
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

interface FlowchartTestcaseDrawerProps {
  customInput: string;
  onCustomInputChange: (val: string) => void;
  onRunCustom: () => void;
  onRunTestCases: () => void;
  isRunning: boolean;
  testCaseResults: TestCaseResult[] | null;
  allPassed?: boolean;
}

export function FlowchartTestcaseDrawer({
  customInput,
  onCustomInputChange,
  onRunCustom,
  onRunTestCases,
  isRunning,
  testCaseResults,
  allPassed,
}: FlowchartTestcaseDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'custom' | 'testcases'>('custom');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(1);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3.5 py-2 bg-slate-900/90 dark:bg-[#161b22]/95 border border-slate-700/80 rounded-full shadow-2xl backdrop-blur-md text-xs text-slate-200 hover:text-white hover:border-slate-500 transition cursor-pointer"
        title="Open Test Cases & Custom Input Drawer"
      >
        <Terminal className="w-3.5 h-3.5 text-blue-400" />
        <span className="font-semibold text-xs">Test Cases & Input</span>
        {testCaseResults && (
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              allPassed
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-700'
                : 'bg-rose-950 text-rose-400 border border-rose-700'
            }`}
          >
            {testCaseResults.filter((t) => t.passed).length}/{testCaseResults.length}
          </span>
        )}
        <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
      </button>
    );
  }

  return (
    <div className="flex flex-col bg-slate-900/95 dark:bg-[#161b22]/95 border border-slate-700/80 dark:border-[#30363d] rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden text-xs w-80 sm:w-96 max-h-[380px] animate-in fade-in slide-in-from-bottom-2 duration-150">
      {/* Header Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 px-3 bg-slate-950/60">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('custom')}
            className={`px-3 py-2 font-semibold border-b-2 transition cursor-pointer ${
              activeTab === 'custom'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Custom Input
          </button>
          <button
            onClick={() => setActiveTab('testcases')}
            className={`flex items-center gap-1.5 px-3 py-2 font-semibold border-b-2 transition cursor-pointer ${
              activeTab === 'testcases'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Test Cases</span>
            {testCaseResults && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  allPassed
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-700'
                    : 'bg-rose-950 text-rose-400 border border-rose-700'
                }`}
              >
                {testCaseResults.filter((t) => t.passed).length}/
                {testCaseResults.length}
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          {activeTab === 'custom' ? (
            <button
              onClick={onRunCustom}
              disabled={isRunning}
              className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-lg shadow-sm transition cursor-pointer text-[11px]"
            >
              <Play className="w-3 h-3 fill-white" />
              <span>Run</span>
            </button>
          ) : (
            <button
              onClick={onRunTestCases}
              disabled={isRunning}
              className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-lg shadow-sm transition cursor-pointer text-[11px]"
            >
              <Play className="w-3 h-3 fill-white" />
              <span>Run All</span>
            </button>
          )}

          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Minimize Test Cases"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-3 overflow-y-auto max-h-[300px]">
        {activeTab === 'custom' ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Standard Input (stdin)</span>
              <span className="text-[10px] text-slate-500">
                Space/newline separated
              </span>
            </div>
            <textarea
              value={customInput}
              onChange={(e) => onCustomInputChange(e.target.value)}
              placeholder="e.g. 5 10 or [1, 2, 3]"
              rows={3}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 font-mono text-xs text-slate-200 outline-none focus:border-blue-500 transition resize-none"
            />
          </div>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {!testCaseResults ? (
              <div className="text-center py-6 text-slate-500 italic">
                Click "Run All" to evaluate flowchart against problem test cases.
              </div>
            ) : (
              testCaseResults.map((tc) => {
                const isExpanded = expandedIndex === tc.index;
                return (
                  <div
                    key={tc.index}
                    className="border border-slate-800 rounded-lg bg-slate-950/70 overflow-hidden"
                  >
                    <button
                      onClick={() =>
                        setExpandedIndex(isExpanded ? null : tc.index)
                      }
                      className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-slate-900/50 transition cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        {tc.passed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        )}
                        <span className="font-semibold text-slate-300">
                          Test #{tc.index}
                        </span>
                        {!tc.isPublic && (
                          <span className="flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-950/60 text-amber-300 border border-amber-800">
                            <Lock className="w-2.5 h-2.5" />
                            Hidden
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {tc.executionTimeMs !== undefined && (
                          <span className="text-[10px] font-mono text-slate-500">
                            {tc.executionTimeMs} ms
                          </span>
                        )}
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-3 pb-3 pt-1 border-t border-slate-800/80 space-y-2 text-xs font-mono">
                        {tc.isPublic ? (
                          <>
                            <div>
                              <div className="text-[10px] uppercase text-slate-400">
                                Input:
                              </div>
                              <div className="p-1.5 bg-slate-900 rounded border border-slate-800 text-slate-300 whitespace-pre-wrap">
                                {tc.input}
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <div className="text-[10px] uppercase text-slate-400">
                                  Expected:
                                </div>
                                <div className="p-1.5 bg-slate-900 rounded border border-slate-800 text-emerald-300 whitespace-pre-wrap">
                                  {tc.expectedOutput}
                                </div>
                              </div>
                              <div>
                                <div className="text-[10px] uppercase text-slate-400">
                                  Actual Output:
                                </div>
                                <div
                                  className={`p-1.5 bg-slate-900 rounded border ${
                                    tc.passed
                                      ? 'border-emerald-800/60 text-emerald-300'
                                      : 'border-rose-800/60 text-rose-300'
                                  } whitespace-pre-wrap`}
                                >
                                  {tc.actualOutput || (
                                    <span className="italic text-slate-500">
                                      Empty
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            {tc.error && (
                              <div className="text-rose-400 text-[11px]">
                                Error: {tc.error}
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-slate-400 italic py-1">
                            Hidden test case data is locked.
                            {tc.passed ? (
                              <span className="text-emerald-400 ml-1">Passed!</span>
                            ) : (
                              <span className="text-rose-400 ml-1">Failed. Check edge cases.</span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
