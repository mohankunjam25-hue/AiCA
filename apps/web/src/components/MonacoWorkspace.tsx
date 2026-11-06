import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import {
  Play,
  Send,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Terminal,
  Cpu,
  AlertTriangle,
  Trash2,
  Loader2
} from 'lucide-react';
import {
  Problem,
  SupportedLanguage,
  LANGUAGE_CONFIGS,
  SubmissionStatusStreamEvent,
  CustomRunResult
} from '@aica/shared';
import { api } from '../services/api';
import { useSubmissionSSE } from '../hooks/useSSE';
import { useThemeStore } from '../store/useThemeStore';
import { useEditorPreferencesStore } from '../store/useEditorPreferencesStore';

interface MonacoWorkspaceProps {
  problem: Problem;
  onEvaluationComplete?: (reportId: string, submissionId: string) => void;
  loadedCode?: { code: string; language: SupportedLanguage } | null;
}

export function MonacoWorkspace({ problem, onEvaluationComplete, loadedCode }: MonacoWorkspaceProps) {
  const { isDark } = useThemeStore();
  const editorPrefs = useEditorPreferencesStore();
  const [language, setLanguage] = useState<SupportedLanguage>('python');
  const [code, setCode] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'tests' | 'custom' | 'console'>('tests');
  const [lastInputTab, setLastInputTab] = useState<'tests' | 'custom'>('tests');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRunningCustom, setIsRunningCustom] = useState(false);
  const [consoleOutput, setConsoleOutput] = useState<string | null>(null);
  const [customRunResult, setCustomRunResult] = useState<CustomRunResult | null>(null);
  const [activeTestIndex, setActiveTestIndex] = useState(0);
  const [customStdin, setCustomStdin] = useState<string>('');

  const { currentEvent, isStreaming, startStream } = useSubmissionSSE(null);

  const publicTestCases = problem.testCases || [];

  // Initialize customStdin with first testcase input
  useEffect(() => {
    if (publicTestCases.length > 0 && !customStdin) {
      setCustomStdin(publicTestCases[0].input);
    }
  }, [publicTestCases]);

  // Load starter code or saved draft
  useEffect(() => {
    const draftKey = `draft_${problem.id}_${language}`;
    const savedDraft = localStorage.getItem(draftKey);

    if (savedDraft) {
      setCode(savedDraft);
    } else {
      const defaultCode =
        problem.starterCode?.[language] || LANGUAGE_CONFIGS[language].defaultBoilerplate;
      setCode(defaultCode);
    }
  }, [problem, language]);

  // Handle externally loaded submission code
  useEffect(() => {
    if (loadedCode) {
      setLanguage(loadedCode.language);
      setCode(loadedCode.code);
      localStorage.setItem(`draft_${problem.id}_${loadedCode.language}`, loadedCode.code);
    }
  }, [loadedCode, problem.id]);

  // Handle Code Change & Draft Saving
  const handleCodeChange = (value?: string) => {
    const newCode = value || '';
    setCode(newCode);
    localStorage.setItem(`draft_${problem.id}_${language}`, newCode);
  };

  const handleReset = () => {
    const defaultCode =
      problem.starterCode?.[language] || LANGUAGE_CONFIGS[language].defaultBoilerplate;
    setCode(defaultCode);
    localStorage.removeItem(`draft_${problem.id}_${language}`);
  };

  // Ephemeral Custom Run (Fast isolated sandbox without polluting DB history)
  const handleRunCustom = async () => {
    setIsRunningCustom(true);
    setConsoleOutput(null);
    setCustomRunResult(null);
    setActiveTab('console');

    // Strict Stdin Selection Precedence:
    // Custom tab -> customStdin
    // Tests tab -> selected public test case input
    // Console tab -> whichever input tab was previously active (lastInputTab)
    const effectiveInputTab = activeTab === 'console' ? lastInputTab : activeTab;
    const stdinToUse =
      effectiveInputTab === 'custom'
        ? customStdin
        : (publicTestCases[activeTestIndex]?.input ?? '');

    try {
      const res = await api.post('/submissions/run-custom', {
        language,
        code,
        stdin: stdinToUse
      });

      const data: CustomRunResult = res.data.data;
      setCustomRunResult(data);
    } catch (err: any) {
      setCustomRunResult(null);
      setConsoleOutput(`Execution failed: ${err.response?.data?.error?.message || err.message}`);
    } finally {
      setIsRunningCustom(false);
    }
  };

  // Full Official Submission Evaluation
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setCustomRunResult(null);
    setConsoleOutput('Queueing official solution for batch sandbox verification...');
    setActiveTab('console');

    try {
      const response = await api.post('/submissions', {
        problemId: problem.id,
        language,
        code,
        isTestRun: false
      });

      const submissionId = response.data.data.submissionId;
      startStream(submissionId);

      // Polling fallback to check completion
      const checkInterval = setInterval(async () => {
        try {
          const subRes = await api.get(`/submissions/${submissionId}`);
          const subData = subRes.data.data;

          if (subData.pipelineStatus === 'COMPLETED' || subData.pipelineStatus === 'FAILED') {
            clearInterval(checkInterval);
            setIsSubmitting(false);

            if (subData.verdict === 'ACCEPTED') {
              setConsoleOutput(`Verdict: ACCEPTED ✓\nPassed: ${subData.testCasesPassed}/${subData.testCasesTotal}\nTime: ${subData.executionTimeMs}ms\nMemory: ${subData.memoryUsedKb}KB\nComposite Score: ${subData.compositeScore}`);
            } else {
              setConsoleOutput(`Verdict: ${subData.verdict}\nPassed: ${subData.testCasesPassed}/${subData.testCasesTotal}\n${subData.compileOutput || 'Failed test verification.'}`);
            }

            if (onEvaluationComplete && subData.evaluationReportId) {
              onEvaluationComplete(subData.evaluationReportId, submissionId);
            }
          }
        } catch {
          // keep polling until complete
        }
      }, 1000);
    } catch (err: any) {
      setIsSubmitting(false);
      setConsoleOutput(`Submission error: ${err.response?.data?.error?.message || err.message}`);
    }
  };

  // Keyboard Shortcuts (Ctrl+Enter to Run, Ctrl+Shift+Enter to Submit)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (e.shiftKey) {
          e.preventDefault();
          if (!isSubmitting && !isRunningCustom && !isStreaming) {
            handleSubmit();
          }
        } else {
          e.preventDefault();
          if (!isSubmitting && !isRunningCustom && !isStreaming) {
            handleRunCustom();
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [code, language, customStdin, activeTestIndex, activeTab, isSubmitting, isRunningCustom, isStreaming]);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#30363d] rounded-lg overflow-hidden shadow-xs transition-colors duration-200">
      {/* Editor Toolbar (GitHub Style) */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-[#f6f8fa] dark:bg-[#161b22] border-b border-[#d0d7de] dark:border-[#30363d] transition-colors">
        <div className="flex items-center gap-2.5">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
            className="bg-white dark:bg-[#21262d] border border-[#d0d7de] dark:border-[#30363d] text-xs text-[#1f2328] dark:text-[#e6edf3] font-semibold rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#0969da] font-mono shadow-xs"
          >
            <option value="python">Python (3.10)</option>
            <option value="javascript">JavaScript (Node 18)</option>
            <option value="cpp">C++ (GCC 12)</option>
            <option value="java">Java (OpenJDK 17)</option>
          </select>

          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-[#656d76] dark:text-[#848d97] hover:text-[#1f2328] dark:hover:text-[#e6edf3] bg-white dark:bg-[#21262d] border border-[#d0d7de] dark:border-[#30363d] rounded-md shadow-xs transition cursor-pointer"
            title="Reset to boilerplate"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRunCustom}
            disabled={isSubmitting || isRunningCustom || isStreaming}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-[#f6f8fa] hover:bg-[#eaeef2] dark:bg-[#21262d] dark:hover:bg-[#30363d] text-[#1f2328] dark:text-[#e6edf3] border border-[#d0d7de] dark:border-[#30363d] text-xs font-semibold shadow-xs disabled:opacity-50 transition cursor-pointer"
            title="Run against custom or public input (Ctrl+Enter)"
          >
            {isRunningCustom ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#1a7f37] dark:text-[#3fb950]" />
            ) : (
              <Play className="w-3.5 h-3.5 text-[#1a7f37] dark:text-[#3fb950] fill-[#1a7f37] dark:fill-[#3fb950]" />
            )}
            {isRunningCustom ? 'Running...' : 'Run Code'}
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || isRunningCustom || isStreaming}
            className="flex items-center gap-2 px-4 py-1.5 rounded-md bg-[#1f883d] hover:bg-[#1a7f37] dark:bg-[#238636] dark:hover:bg-[#2ea043] text-white text-xs font-semibold shadow-xs border border-[rgba(27,31,36,0.15)] dark:border-[#2ea04366] disabled:opacity-50 transition cursor-pointer"
            title="Submit for full verification & ranking (Ctrl+Shift+Enter)"
          >
            {isSubmitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            {isSubmitting ? 'Evaluating...' : 'Submit Solution'}
          </button>
        </div>
      </div>

      {/* Real-time SSE Progress Ribbon (GitHub Alert style) */}
      {(isSubmitting || isStreaming || currentEvent) && (
        <div className="bg-[#ddf4ff40] dark:bg-[#388bfd1a] border-b border-[#54aeff66] dark:border-[#388bfd40] px-4 py-2 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#58a6ff] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#0969da]"></span>
            </span>
            <span className="text-[#0969da] dark:text-[#58a6ff] font-semibold">
              Stage: {currentEvent?.pipelineStatus || 'QUEUED'}
            </span>
            {currentEvent?.verdict && currentEvent.verdict !== 'PENDING' && (
              <span className="text-[#57606a] dark:text-[#8b949e]">Verdict: {currentEvent.verdict}</span>
            )}
          </div>
          <span className="text-[#57606a] dark:text-[#8b949e]">
            Step {currentEvent?.step || 1} of {currentEvent?.totalSteps || 4}
          </span>
        </div>
      )}

      {/* Monaco Code Editor Canvas */}
      <div className="flex-1 min-h-[320px]">
        <Editor
          height="100%"
          language={LANGUAGE_CONFIGS[language].monacoLanguage}
          theme={isDark ? "vs-dark" : "light"}
          value={code}
          onChange={handleCodeChange}
          options={{
            fontSize: editorPrefs.fontSize,
            minimap: { enabled: editorPrefs.minimap },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: editorPrefs.tabSize,
            bracketPairColorization: { enabled: editorPrefs.bracketPairColorization },
            wordWrap: editorPrefs.wordWrap,
            fontFamily: editorPrefs.fontFamily
          }}
        />
      </div>

      {/* Bottom Test Case & Console Panel */}
      <div className="h-60 border-t border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] flex flex-col transition-colors">
        <div className="flex items-center gap-4 px-4 py-2 border-b border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#161b22] text-xs font-medium">
          <button
            onClick={() => {
              setActiveTab('tests');
              setLastInputTab('tests');
            }}
            className={`flex items-center gap-1.5 pb-1 cursor-pointer transition ${
              activeTab === 'tests'
                ? 'text-[#1f2328] dark:text-[#e6edf3] border-b-2 border-[#fd8c73] dark:border-[#f78166] font-semibold'
                : 'text-[#656d76] dark:text-[#848d97] hover:text-[#1f2328] dark:hover:text-[#e6edf3]'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Test Cases ({publicTestCases.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('custom');
              setLastInputTab('custom');
            }}
            className={`flex items-center gap-1.5 pb-1 cursor-pointer transition ${
              activeTab === 'custom'
                ? 'text-[#1f2328] dark:text-[#e6edf3] border-b-2 border-[#fd8c73] dark:border-[#f78166] font-semibold'
                : 'text-[#656d76] dark:text-[#848d97] hover:text-[#1f2328] dark:hover:text-[#e6edf3]'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            Custom Input
          </button>
          <button
            onClick={() => setActiveTab('console')}
            className={`flex items-center gap-1.5 pb-1 cursor-pointer transition ${
              activeTab === 'console'
                ? 'text-[#1f2328] dark:text-[#e6edf3] border-b-2 border-[#fd8c73] dark:border-[#f78166] font-semibold'
                : 'text-[#656d76] dark:text-[#848d97] hover:text-[#1f2328] dark:hover:text-[#e6edf3]'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            Execution Console
          </button>
        </div>

        <div className="flex-1 p-4 overflow-y-auto text-xs font-mono">
          {activeTab === 'tests' ? (
            <div className="space-y-3">
              <div className="flex gap-2">
                {publicTestCases.map((tc, idx) => (
                  <button
                    key={tc.id || idx}
                    onClick={() => setActiveTestIndex(idx)}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer transition ${
                      activeTestIndex === idx
                        ? 'bg-white dark:bg-[#21262d] text-[#1f2328] dark:text-[#f0f6fc] border border-[#d0d7de] dark:border-[#30363d] shadow-xs'
                        : 'bg-[#f6f8fa] dark:bg-[#161b22] text-[#656d76] dark:text-[#848d97] hover:bg-[#eaeef2] dark:hover:bg-[#21262d] border border-[#d0d7de] dark:border-[#21262d]'
                    }`}
                  >
                    Case {idx + 1}
                  </button>
                ))}
              </div>

              {publicTestCases[activeTestIndex] && (
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div className="bg-white dark:bg-[#161b22] p-3 rounded-md border border-[#d0d7de] dark:border-[#30363d]">
                    <span className="text-[#57606a] dark:text-[#8b949e] block mb-1 font-sans text-xs font-semibold">Standard Input (stdin):</span>
                    <pre className="text-[#1f2328] dark:text-[#e6edf3] whitespace-pre-wrap">{publicTestCases[activeTestIndex].input}</pre>
                  </div>
                  <div className="bg-white dark:bg-[#161b22] p-3 rounded-md border border-[#d0d7de] dark:border-[#30363d]">
                    <span className="text-[#57606a] dark:text-[#8b949e] block mb-1 font-sans text-xs font-semibold">Expected Output:</span>
                    <pre className="text-[#1a7f37] dark:text-[#3fb950] font-bold whitespace-pre-wrap">{publicTestCases[activeTestIndex].expectedOutput}</pre>
                  </div>
                </div>
              )}
            </div>
          ) : activeTab === 'custom' ? (
            <div className="space-y-2 h-full flex flex-col">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 font-sans text-xs pb-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Custom Input (stdin):</span>
                  <span className="text-[11px] text-slate-400">
                    {new TextEncoder().encode(customStdin).length} / 65536 bytes
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {publicTestCases.length > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] text-slate-400">Load test case:</span>
                      {publicTestCases.map((tc, idx) => (
                        <button
                          key={tc.id || idx}
                          type="button"
                          onClick={() => setCustomStdin(tc.input)}
                          className="px-2 py-0.5 text-[11px] font-mono rounded bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                          title={`Load Case ${idx + 1} input`}
                        >
                          Case {idx + 1}
                        </button>
                      ))}
                    </div>
                  )}
                  {customStdin && (
                    <button
                      type="button"
                      onClick={() => setCustomStdin('')}
                      className="flex items-center gap-1 text-[11px] text-rose-500 hover:text-rose-600 dark:text-rose-400 px-1.5 py-0.5 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                      title="Clear custom input"
                    >
                      <Trash2 className="w-3 h-3" />
                      Clear
                    </button>
                  )}
                </div>
              </div>
              <textarea
                value={customStdin}
                onChange={(e) => setCustomStdin(e.target.value)}
                placeholder="Paste or write custom stdin lines here..."
                className="flex-1 w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>
          ) : (
            <div>
              {isRunningCustom ? (
                <div className="flex items-center justify-center gap-3 py-10 text-slate-500 dark:text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
                  <span className="font-sans text-xs">Executing code in isolated Judge0 sandbox...</span>
                </div>
              ) : customRunResult ? (
                <div className="space-y-3">
                  {/* Result Header Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      {customRunResult.verdict === 'EXECUTED' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3.5 h-3.5" /> EXECUTED
                        </span>
                      ) : customRunResult.verdict === 'TIME_LIMIT_EXCEEDED' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          <Clock className="w-3.5 h-3.5" /> TIME LIMIT EXCEEDED
                        </span>
                      ) : customRunResult.verdict === 'MEMORY_LIMIT_EXCEEDED' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                          <Cpu className="w-3.5 h-3.5" /> MEMORY LIMIT EXCEEDED
                        </span>
                      ) : customRunResult.verdict === 'COMPILATION_ERROR' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                          <XCircle className="w-3.5 h-3.5" /> COMPILATION ERROR
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                          <AlertTriangle className="w-3.5 h-3.5" /> {customRunResult.verdict}
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400 font-sans">
                        {customRunResult.statusDescription}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 font-sans">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        Latency: <strong className="font-mono text-slate-700 dark:text-slate-300">{customRunResult.executionTimeMs} ms</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <Cpu className="w-3 h-3 text-slate-400" />
                        Memory: <strong className="font-mono text-slate-700 dark:text-slate-300">{customRunResult.memoryUsedKb > 1024 ? `${(customRunResult.memoryUsedKb / 1024).toFixed(1)} MB` : `${customRunResult.memoryUsedKb} KB`}</strong>
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-200/60 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px]">
                        Ephemeral Sandbox
                      </span>
                    </div>
                  </div>

                  {/* Compiler Output */}
                  {customRunResult.compileOutput && (
                    <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50">
                      <div className="text-xs font-semibold text-rose-700 dark:text-rose-300 font-sans mb-1">Compiler Output:</div>
                      <pre className="text-rose-600 dark:text-rose-400 whitespace-pre-wrap">{customRunResult.compileOutput}</pre>
                    </div>
                  )}

                  {/* Standard Error */}
                  {customRunResult.stderr && (
                    <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50">
                      <div className="text-xs font-semibold text-rose-700 dark:text-rose-300 font-sans mb-1">Standard Error (stderr):</div>
                      <pre className="text-rose-600 dark:text-rose-400 whitespace-pre-wrap">{customRunResult.stderr}</pre>
                    </div>
                  )}

                  {/* Standard Output */}
                  <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-sans mb-1">Standard Output (stdout):</div>
                    {customRunResult.stdout ? (
                      <pre className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap">{customRunResult.stdout}</pre>
                    ) : (
                      <div className="text-slate-400 italic font-sans">(Empty standard output)</div>
                    )}
                  </div>
                </div>
              ) : consoleOutput ? (
                <pre className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">{consoleOutput}</pre>
              ) : (
                <div className="text-slate-400 dark:text-slate-500 italic py-6 text-center font-sans">
                  Click &quot;Run Code&quot; (Ctrl+Enter) or &quot;Submit Solution&quot; (Ctrl+Shift+Enter) to inspect isolated Judge0 stdout, stderr, and execution telemetry.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
