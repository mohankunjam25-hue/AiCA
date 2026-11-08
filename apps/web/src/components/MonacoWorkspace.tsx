import { useState, useEffect, useRef } from 'react';
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
  Loader2,
  ChevronUp,
  ChevronDown,
  Settings2,
  Maximize2,
  Minimize2,
  Minus,
  Plus,
  PanelLeftClose,
  PanelLeftOpen,
  Eye
} from 'lucide-react';
import {
  Problem,
  SupportedLanguage,
  LANGUAGE_CONFIGS,
  SubmissionStatusStreamEvent,
  CustomRunResult,
  DataStructureClassifier,
  NormalizedTraceFrame
} from '@aica/shared';
import { api } from '../services/api';
import { useSubmissionSSE, useLocalStorage, useKeyboardShortcuts, isMacOS, useOnlineStatus } from '../hooks';
import { useThemeStore } from '../store/useThemeStore';
import { useEditorPreferencesStore } from '../store/useEditorPreferencesStore';
import { toast } from '../store/useToastStore';
import { CodeExecutionVisualizerModal } from './visualizer/CodeExecutionVisualizerModal';

interface MonacoWorkspaceProps {
  problem: Problem;
  onEvaluationComplete?: (reportId: string, submissionId: string) => void;
  loadedCode?: { code: string; language: SupportedLanguage } | null;
  isZenMode?: boolean;
  onToggleZenMode?: () => void;
  isPanelCollapsed?: boolean;
  onTogglePanelCollapse?: () => void;
}

export function MonacoWorkspace({
  problem,
  onEvaluationComplete,
  loadedCode,
  isZenMode = false,
  onToggleZenMode,
  isPanelCollapsed = false,
  onTogglePanelCollapse
}: MonacoWorkspaceProps) {
  const isDark = useThemeStore((s) => s.isDark);
  const editorPrefs = useEditorPreferencesStore();
  const { isOnline } = useOnlineStatus();

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

  // Visualizer Execution Modal State (100% Deterministic Tracer, Zero AI)
  const [isVisualizing, setIsVisualizing] = useState<boolean>(false);
  const [visualizerFrames, setVisualizerFrames] = useState<NormalizedTraceFrame[] | null>(null);
  const [isVisualizerModalOpen, setIsVisualizerModalOpen] = useState<boolean>(false);

  // Collapsible & Resizable Bottom Console State (Default: Collapsed for maximum vertical coding space)
  const [isConsoleCollapsed, setIsConsoleCollapsed] = useState<boolean>(true);
  const [consoleHeight, setConsoleHeight] = useState<number>(240);
  const [isConsoleDragging, setIsConsoleDragging] = useState<boolean>(false);
  const consoleDragStartY = useRef<number>(0);
  const consoleStartHeight = useRef<number>(240);

  // Monaco Editor instance reference
  const editorRef = useRef<any>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  // ResizeObserver to detect layout/container width changes and re-layout Monaco seamlessly
  useEffect(() => {
    if (!editorContainerRef.current) return;
    const ro = new ResizeObserver(() => {
      if (editorRef.current) {
        editorRef.current.layout();
      }
    });
    ro.observe(editorContainerRef.current);
    return () => ro.disconnect();
  }, []);

  // Re-layout Monaco whenever console is toggled or resized
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.layout();
    }
  }, [isConsoleCollapsed, consoleHeight, isZenMode, isPanelCollapsed]);

  // Quick Preferences Popover State
  const [showPreferences, setShowPreferences] = useState<boolean>(false);
  const prefsRef = useRef<HTMLDivElement>(null);

  const { currentEvent, isStreaming, startStream } = useSubmissionSSE(null);
  const publicTestCases = problem.testCases || [];

  // Close preferences popover when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (prefsRef.current && !prefsRef.current.contains(e.target as Node)) {
        setShowPreferences(false);
      }
    }
    if (showPreferences) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPreferences]);

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

  // Ephemeral Custom Run
  const handleRunCustom = async () => {
    setIsRunningCustom(true);
    setConsoleOutput(null);
    setCustomRunResult(null);

    // Expand console and focus execution tab
    setIsConsoleCollapsed(false);
    setActiveTab('console');

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
      if (data.verdict === 'EXECUTED') {
        setConsoleOutput(data.stdout || '(Program exited cleanly with empty output)');
      } else if (data.verdict === 'COMPILATION_ERROR') {
        setConsoleOutput(`Compilation Error:\n${data.compileOutput}`);
      } else if (data.verdict === 'TIME_LIMIT_EXCEEDED') {
        setConsoleOutput(`Time Limit Exceeded (${data.executionTimeMs}ms)\n${data.stderr || ''}`);
      } else {
        setConsoleOutput(data.stderr || data.stdout || `Execution failed with status: ${data.verdict}`);
      }
    } catch (err: any) {
      setConsoleOutput(`Custom run error: ${err.response?.data?.error?.message || err.message}`);
    } finally {
      setIsRunningCustom(false);
    }
  };

  // Full Verification Submission
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setConsoleOutput(null);
    setCustomRunResult(null);

    // Expand console and focus execution tab
    setIsConsoleCollapsed(false);
    setActiveTab('console');

    try {
      const res = await api.post('/submissions', {
        problemId: problem.id,
        language,
        code,
        isTestRun: false
      });

      const submissionId = res.data.data.submissionId;
      setConsoleOutput(`Submission #${submissionId} queued for sandbox execution & deterministic scoring...\nWaiting for pipeline worker...`);

      // Start SSE stream for real-time stage updates
      startStream(submissionId);

      // Poll fallback for final evaluation report
      const interval = setInterval(async () => {
        try {
          const pollRes = await api.get(`/submissions/${submissionId}`);
          const subData = pollRes.data.data;

          if (subData.pipelineStatus === 'COMPLETED' || subData.pipelineStatus === 'FAILED') {
            clearInterval(interval);
            setIsSubmitting(false);

            if (subData.verdict === 'ACCEPTED') {
              setConsoleOutput(`🎉 VERDICT: ACCEPTED!\nAll ${subData.testCasesPassed}/${subData.testCasesTotal} test cases passed.\nExecution Time: ${subData.executionTimeMs}ms | Memory: ${Math.round(subData.memoryUsedKb / 1024)}MB\nComposite Score: ${subData.compositeScore} pts\nAI code quality review is now available in the Report tab!`);
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

  // Step-by-Step Execution Visualizer (100% Deterministic Tracer, Zero AI)
  const handleVisualizeCode = async () => {
    if (isVisualizing) return;
    setIsVisualizing(true);
    try {
      const sampleInput =
        customStdin.trim() ||
        problem.testCases?.[0]?.input ||
        (problem as any).examples?.[0]?.input ||
        '';

      const res = await api.post('/tracer/trace', {
        code,
        language,
        stdin: sampleInput
      });

      const steps = res.data?.data?.steps || [];
      if (!steps || steps.length === 0) {
        toast.error('Tracer could not detect execution steps. Verify your code syntax.');
        return;
      }

      const normalized = DataStructureClassifier.normalizeTrace(steps, language);
      setVisualizerFrames(normalized);
      setIsVisualizerModalOpen(true);
    } catch (err: any) {
      console.error('[MonacoWorkspace] Visualization failed:', err);
      const msg = err.response?.data?.message || 'Visualization tracer failed. Ensure code has valid syntax.';
      toast.error(msg);
    } finally {
      setIsVisualizing(false);
    }
  };

  // Reusable Keyboard Shortcuts (Ctrl+Enter to Run, Ctrl+Shift+Enter to Submit, Ctrl+` to toggle console)
  useKeyboardShortcuts([
    {
      key: 'Enter',
      ctrlOrMeta: true,
      shift: true,
      description: 'Submit Solution',
      allowInInputs: true,
      disabled: isSubmitting || isRunningCustom || isStreaming || !isOnline,
      action: () => handleSubmit()
    },
    {
      key: 'Enter',
      ctrlOrMeta: true,
      shift: false,
      description: 'Run Test Cases',
      allowInInputs: true,
      disabled: isSubmitting || isRunningCustom || isStreaming || !isOnline,
      action: () => handleRunCustom()
    },
    {
      key: '`',
      ctrlOrMeta: true,
      description: 'Toggle Test Console',
      allowInInputs: true,
      action: () => setIsConsoleCollapsed((prev) => !prev)
    }
  ]);

  // Console Resizing Drag Handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isConsoleDragging) return;
      const deltaY = consoleDragStartY.current - e.clientY;
      const newHeight = Math.min(500, Math.max(140, consoleStartHeight.current + deltaY));
      setConsoleHeight(newHeight);
    };

    const handleMouseUp = () => {
      setIsConsoleDragging(false);
    };

    if (isConsoleDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isConsoleDragging]);

  const handleConsoleDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsConsoleDragging(true);
    consoleDragStartY.current = e.clientY;
    consoleStartHeight.current = consoleHeight;
  };

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 w-full bg-white dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#30363d] rounded-2xl overflow-hidden shadow-xs transition-colors duration-200">
      {/* Editor Toolbar (GitHub IDE Style) */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-[#f6f8fa] dark:bg-[#161b22] border-b border-[#d0d7de] dark:border-[#30363d] transition-colors shrink-0">
        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
            className="bg-white dark:bg-[#21262d] border border-[#d0d7de] dark:border-[#30363d] text-xs text-[#1f2328] dark:text-[#e6edf3] font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#8250df] font-mono shadow-2xs cursor-pointer"
          >
            <option value="python">Python (3.10)</option>
            <option value="javascript">JavaScript (Node 18)</option>
            <option value="cpp">C++ (GCC 12)</option>
            <option value="java">Java (OpenJDK 17)</option>
          </select>

          {/* Reset Button */}
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-[#656d76] dark:text-[#848d97] hover:text-[#1f2328] dark:hover:text-[#e6edf3] bg-white dark:bg-[#21262d] border border-[#d0d7de] dark:border-[#30363d] rounded-lg shadow-2xs transition cursor-pointer"
            title="Reset code to default template"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          {/* Quick Preferences Popover Trigger */}
          <div className="relative" ref={prefsRef}>
            <button
              type="button"
              onClick={() => setShowPreferences((prev) => !prev)}
              className={`p-1.5 rounded-lg border transition cursor-pointer ${
                showPreferences
                  ? 'bg-[#8250df]/15 text-[#8250df] border-[#8250df]/40'
                  : 'bg-white dark:bg-[#21262d] border-[#d0d7de] dark:border-[#30363d] text-[#656d76] dark:text-[#848d97] hover:text-[#1f2328] dark:hover:text-[#e6edf3]'
              }`}
              title="Editor Preferences (Font size, Word wrap, Minimap)"
            >
              <Settings2 className="w-3.5 h-3.5" />
            </button>

            {/* Preferences Dropdown Panel */}
            {showPreferences && (
              <div className="absolute left-0 mt-2 w-64 rounded-xl border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#161b22] p-3 shadow-xl z-50 text-xs space-y-3 font-sans animate-in fade-in">
                <div className="flex items-center justify-between pb-1.5 border-b border-[#d0d7de]/60 dark:border-[#30363d]/60 font-bold text-[#1f2328] dark:text-[#f0f6fc]">
                  <span>Editor Preferences</span>
                  <span className="text-[10px] text-[#8c959f] font-mono">Real-time</span>
                </div>

                {/* Font Size Stepper */}
                <div className="flex items-center justify-between">
                  <span className="text-[#656d76] dark:text-[#848d97]">Font Size</span>
                  <div className="flex items-center gap-1.5 bg-[#f6f8fa] dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#30363d] rounded-lg p-0.5">
                    <button
                      type="button"
                      onClick={() => editorPrefs.setFontSize(Math.max(11, editorPrefs.fontSize - 1))}
                      className="p-1 rounded hover:bg-[#eaeef2] dark:hover:bg-[#21262d] text-[#656d76] dark:text-[#848d97] cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="px-2 font-mono font-bold text-[#1f2328] dark:text-[#f0f6fc]">
                      {editorPrefs.fontSize}px
                    </span>
                    <button
                      type="button"
                      onClick={() => editorPrefs.setFontSize(Math.min(22, editorPrefs.fontSize + 1))}
                      className="p-1 rounded hover:bg-[#eaeef2] dark:hover:bg-[#21262d] text-[#656d76] dark:text-[#848d97] cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Word Wrap Toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-[#656d76] dark:text-[#848d97]">Word Wrap</span>
                  <button
                    type="button"
                    onClick={() => editorPrefs.setWordWrap(editorPrefs.wordWrap === 'on' ? 'off' : 'on')}
                    className={`px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold transition cursor-pointer ${
                      editorPrefs.wordWrap === 'on'
                        ? 'bg-[#8250df] text-white'
                        : 'bg-[#eaeef2] dark:bg-[#21262d] text-[#656d76] dark:text-[#848d97]'
                    }`}
                  >
                    {editorPrefs.wordWrap === 'on' ? 'ON' : 'OFF'}
                  </button>
                </div>

                {/* Minimap Toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-[#656d76] dark:text-[#848d97]">Minimap</span>
                  <button
                    type="button"
                    onClick={() => editorPrefs.setMinimap(!editorPrefs.minimap)}
                    className={`px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold transition cursor-pointer ${
                      editorPrefs.minimap
                        ? 'bg-[#8250df] text-white'
                        : 'bg-[#eaeef2] dark:bg-[#21262d] text-[#656d76] dark:text-[#848d97]'
                    }`}
                  >
                    {editorPrefs.minimap ? 'ON' : 'OFF'}
                  </button>
                </div>

                {/* Tab Size */}
                <div className="flex items-center justify-between">
                  <span className="text-[#656d76] dark:text-[#848d97]">Tab Spacing</span>
                  <div className="flex items-center gap-1">
                    {[2, 4].map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => editorPrefs.setTabSize(size)}
                        className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold transition cursor-pointer ${
                          editorPrefs.tabSize === size
                            ? 'bg-[#8250df] text-white'
                            : 'bg-[#eaeef2] dark:bg-[#21262d] text-[#656d76] dark:text-[#848d97]'
                        }`}
                      >
                        {size} spaces
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Zen / Focus Mode Toggle Button */}
          {onToggleZenMode && (
            <button
              type="button"
              onClick={onToggleZenMode}
              className={`p-1.5 rounded-lg border transition cursor-pointer ${
                isZenMode
                  ? 'bg-[#8250df] text-white border-[#8250df] ring-2 ring-purple-400/40 shadow-xs'
                  : 'bg-white dark:bg-[#21262d] border-[#d0d7de] dark:border-[#30363d] text-[#656d76] dark:text-[#848d97] hover:text-[#1f2328] dark:hover:text-[#e6edf3]'
              }`}
              title={isZenMode ? 'Exit Zen Focus Mode (Esc)' : 'Zen Focus Mode (Fullscreen Code Editor)'}
            >
              {isZenMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          )}

          {/* Quick Problem Panel Toggle (Expand/Contract Editor) */}
          {onTogglePanelCollapse && (
            <button
              type="button"
              onClick={onTogglePanelCollapse}
              className={`hidden md:flex items-center gap-1.5 p-1.5 rounded-lg border transition cursor-pointer ${
                isPanelCollapsed
                  ? 'bg-[#0969da] text-white border-[#0969da]'
                  : 'bg-white dark:bg-[#21262d] border-[#d0d7de] dark:border-[#30363d] text-[#656d76] dark:text-[#848d97] hover:text-[#1f2328] dark:hover:text-[#e6edf3]'
              }`}
              title={
                isZenMode
                  ? 'Exit Zen Focus & Show Problem'
                  : isPanelCollapsed
                  ? 'Show Problem Description'
                  : 'Full Editor Width (Collapse Problem)'
              }
            >
              {isPanelCollapsed ? <PanelLeftOpen className="w-3.5 h-3.5" /> : <PanelLeftClose className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>

        {/* Execution Actions */}
        <div className="flex items-center gap-2">
          {/* Visualize Code Execution (Zero AI, Pure Debugger) */}
          <button
            onClick={handleVisualizeCode}
            disabled={isSubmitting || isRunningCustom || isVisualizing || !isOnline}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#8250df1a] hover:bg-[#8250df26] dark:bg-[#8250df26] dark:hover:bg-[#8250df33] text-[#8250df] dark:text-[#a371f7] border border-[#8250df40] text-xs font-semibold shadow-2xs disabled:opacity-50 transition cursor-pointer"
            title={!isOnline ? "Network is offline (visualizer disabled)" : "Visualize step-by-step code execution (Zero AI, Pure Debugger)"}
          >
            {isVisualizing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#8250df] dark:text-[#a371f7]" />
            ) : (
              <Eye className="w-3.5 h-3.5 text-[#8250df] dark:text-[#a371f7]" />
            )}
            <span>{isVisualizing ? 'Tracing...' : 'Visualize'}</span>
          </button>

          {/* Run Code */}
          <button
            onClick={handleRunCustom}
            disabled={isSubmitting || isRunningCustom || isStreaming || !isOnline}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f6f8fa] hover:bg-[#eaeef2] dark:bg-[#21262d] dark:hover:bg-[#30363d] text-[#1f2328] dark:text-[#e6edf3] border border-[#d0d7de] dark:border-[#30363d] text-xs font-semibold shadow-2xs disabled:opacity-50 transition cursor-pointer"
            title={!isOnline ? "Network is offline (execution disabled)" : "Run against test inputs (Ctrl+Enter)"}
          >
            {isRunningCustom ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#1a7f37] dark:text-[#3fb950]" />
            ) : (
              <Play className="w-3.5 h-3.5 text-[#1a7f37] dark:text-[#3fb950] fill-[#1a7f37] dark:fill-[#3fb950]" />
            )}
            <span>{isRunningCustom ? 'Running...' : 'Run'}</span>
            <span className="hidden xl:inline text-[10px] text-[#8c959f] font-mono">
              {isMacOS() ? '⌘↵' : 'Ctrl+↵'}
            </span>
          </button>

          {/* Submit Solution */}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || isRunningCustom || isStreaming || !isOnline}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#1f883d] to-[#1a7f37] hover:from-[#1a7f37] hover:to-[#16682c] dark:from-[#238636] dark:to-[#2ea043] text-white text-xs font-bold shadow-xs border border-[rgba(27,31,36,0.15)] dark:border-[#2ea04366] disabled:opacity-50 transition cursor-pointer"
            title={!isOnline ? "Network is offline (submission disabled)" : "Submit for official ranking and AI evaluation (Ctrl+Shift+Enter)"}
          >
            {isSubmitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            <span>{isSubmitting ? 'Evaluating...' : 'Submit'}</span>
            <span className="hidden xl:inline text-[10px] text-emerald-200 font-mono">
              {isMacOS() ? '⌘⇧↵' : 'Ctrl+Shift+↵'}
            </span>
          </button>
        </div>
      </div>

      {/* Real-time SSE Progress Ribbon */}
      {(isSubmitting || isStreaming || currentEvent) && (
        <div className="bg-[#ddf4ff40] dark:bg-[#388bfd1a] border-b border-[#54aeff66] dark:border-[#388bfd40] px-4 py-1.5 flex items-center justify-between text-xs font-mono shrink-0">
          <div className="flex items-center gap-3">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#58a6ff] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0969da]"></span>
            </span>
            <span className="text-[#0969da] dark:text-[#58a6ff] font-semibold text-[11px]">
              Stage: {currentEvent?.pipelineStatus || 'QUEUED'}
            </span>
            {currentEvent?.verdict && currentEvent.verdict !== 'PENDING' && (
              <span className="text-[#57606a] dark:text-[#8b949e] text-[11px]">Verdict: {currentEvent.verdict}</span>
            )}
          </div>
          <span className="text-[#57606a] dark:text-[#8b949e] text-[11px]">
            Step {currentEvent?.step || 1} of {currentEvent?.totalSteps || 4}
          </span>
        </div>
      )}

      {/* Monaco Code Editor Canvas (Takes 100% of available vertical height with robust absolute inset layout) */}
      <div ref={editorContainerRef} className="flex-1 min-h-[420px] lg:min-h-[480px] w-full relative">
        <div className="absolute inset-0">
          <Editor
            height="100%"
            width="100%"
            language={LANGUAGE_CONFIGS[language].monacoLanguage}
            theme={isDark ? "vs-dark" : "light"}
            value={code}
            onChange={handleCodeChange}
            onMount={(editor) => {
              editorRef.current = editor;
              editor.layout();
              setTimeout(() => editor.layout(), 50);
            }}
            options={{
              fontSize: editorPrefs.fontSize,
              minimap: { enabled: editorPrefs.minimap },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: editorPrefs.tabSize,
              bracketPairColorization: { enabled: editorPrefs.bracketPairColorization },
              wordWrap: editorPrefs.wordWrap,
              fontFamily: editorPrefs.fontFamily,
              padding: { top: 12, bottom: 12 }
            }}
          />
        </div>
      </div>

      {/* Horizontal Drag Handle (Visible only when console is expanded) */}
      {!isConsoleCollapsed && (
        <div
          onMouseDown={handleConsoleDragStart}
          className="h-1.5 bg-[#d0d7de]/50 dark:bg-[#30363d]/50 hover:bg-[#8250df] transition cursor-row-resize shrink-0"
          title="Drag up or down to resize console height"
        />
      )}

      {/* Collapsible & Draggable Bottom Test Case & Console Panel (Always anchored to bottom) */}
      <div
        style={{ height: isConsoleCollapsed ? '38px' : `${consoleHeight}px` }}
        className="mt-auto border-t border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] flex flex-col transition-[height] duration-200 shrink-0 overflow-hidden"
      >
        {/* Console Header Bar */}
        <div className="flex items-center justify-between px-3 h-[37px] border-b border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#161b22] text-xs font-medium shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto scrollbar-none py-0.5">
            <button
              onClick={() => {
                setActiveTab('tests');
                setLastInputTab('tests');
                setIsConsoleCollapsed(false);
              }}
              className={`flex items-center gap-1.5 py-1 px-1.5 rounded-md cursor-pointer transition ${
                activeTab === 'tests' && !isConsoleCollapsed
                  ? 'text-[#8250df] dark:text-[#bc8cff] font-bold bg-[#8250df]/10'
                  : 'text-[#656d76] dark:text-[#848d97] hover:text-[#1f2328] dark:hover:text-[#e6edf3]'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-[#1a7f37] dark:text-[#3fb950]" />
              <span>Test Cases ({publicTestCases.length})</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('custom');
                setLastInputTab('custom');
                setIsConsoleCollapsed(false);
              }}
              className={`flex items-center gap-1.5 py-1 px-1.5 rounded-md cursor-pointer transition ${
                activeTab === 'custom' && !isConsoleCollapsed
                  ? 'text-[#8250df] dark:text-[#bc8cff] font-bold bg-[#8250df]/10'
                  : 'text-[#656d76] dark:text-[#848d97] hover:text-[#1f2328] dark:hover:text-[#e6edf3]'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-blue-500" />
              <span>Custom Input</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('console');
                setIsConsoleCollapsed(false);
              }}
              className={`flex items-center gap-1.5 py-1 px-1.5 rounded-md cursor-pointer transition ${
                activeTab === 'console' && !isConsoleCollapsed
                  ? 'text-[#8250df] dark:text-[#bc8cff] font-bold bg-[#8250df]/10'
                  : 'text-[#656d76] dark:text-[#848d97] hover:text-[#1f2328] dark:hover:text-[#e6edf3]'
              }`}
            >
              <Terminal className="w-3.5 h-3.5 text-purple-500" />
              <span>Execution Console</span>
            </button>
          </div>

          {/* Right Chevron Toggle Button */}
          <button
            type="button"
            onClick={() => setIsConsoleCollapsed((prev) => !prev)}
            className="flex items-center gap-1 text-[11px] text-[#656d76] dark:text-[#848d97] hover:text-[#1f2328] dark:hover:text-[#e6edf3] px-2 py-1 rounded-md hover:bg-[#eaeef2] dark:hover:bg-[#21262d] transition cursor-pointer"
            title={isConsoleCollapsed ? 'Expand Test Console (Ctrl+`)' : 'Collapse Console (Ctrl+`)'}
          >
            <span className="hidden sm:inline font-mono">
              {isConsoleCollapsed ? 'Expand' : 'Collapse'}
            </span>
            {isConsoleCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Console Content Body (Shown only when expanded) */}
        {!isConsoleCollapsed && (
          <div className="flex-1 p-4 overflow-y-auto text-xs font-mono min-h-0">
            {activeTab === 'tests' ? (
              <div className="space-y-3">
                <div className="flex gap-2">
                  {publicTestCases.map((tc, idx) => (
                    <button
                      key={tc.id || idx}
                      onClick={() => setActiveTestIndex(idx)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition ${
                        activeTestIndex === idx
                          ? 'bg-[#8250df] text-white shadow-2xs'
                          : 'bg-[#f6f8fa] dark:bg-[#21262d] text-[#656d76] dark:text-[#848d97] hover:text-[#1f2328] dark:hover:text-[#f0f6fc]'
                      }`}
                    >
                      Case {idx + 1}
                    </button>
                  ))}
                </div>

                {publicTestCases[activeTestIndex] && (
                  <div className="space-y-2">
                    <div>
                      <span className="text-[#656d76] dark:text-[#848d97] font-semibold text-[11px] block mb-1">
                        Input:
                      </span>
                      <pre className="p-2.5 rounded-lg bg-[#f6f8fa] dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] text-[#1f2328] dark:text-[#e6edf3] overflow-x-auto">
                        {publicTestCases[activeTestIndex].input}
                      </pre>
                    </div>
                    <div>
                      <span className="text-[#656d76] dark:text-[#848d97] font-semibold text-[11px] block mb-1">
                        Expected Output:
                      </span>
                      <pre className="p-2.5 rounded-lg bg-[#f6f8fa] dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] text-[#1a7f37] dark:text-[#3fb950] font-bold overflow-x-auto">
                        {publicTestCases[activeTestIndex].expectedOutput}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            ) : activeTab === 'custom' ? (
              <div className="h-full flex flex-col space-y-2">
                <div className="flex items-center justify-between text-xs text-[#656d76] dark:text-[#848d97]">
                  <span className="font-semibold text-[11px]">Standard Input (stdin):</span>
                  <button
                    onClick={() => setCustomStdin('')}
                    className="flex items-center gap-1 text-[11px] hover:text-rose-500 transition cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" /> Clear
                  </button>
                </div>
                <textarea
                  value={customStdin}
                  onChange={(e) => setCustomStdin(e.target.value)}
                  placeholder="Paste custom input lines here..."
                  className="flex-1 w-full p-2.5 bg-[#f6f8fa] dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] rounded-lg text-xs font-mono text-[#1f2328] dark:text-[#e6edf3] focus:outline-none focus:border-[#8250df] resize-none"
                />
              </div>
            ) : (
              <div className="space-y-3">
                {customRunResult && (
                  <div className="flex items-center gap-4 p-2 rounded-lg bg-[#f6f8fa] dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] text-xs font-mono">
                    <span
                      className={`font-bold flex items-center gap-1.5 ${
                        customRunResult.verdict === 'EXECUTED'
                          ? 'text-[#1a7f37] dark:text-[#3fb950]'
                          : 'text-[#cf222e] dark:text-[#f85149]'
                      }`}
                    >
                      {customRunResult.verdict === 'EXECUTED' ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <AlertTriangle className="w-4 h-4" />
                      )}
                      {customRunResult.verdict}
                    </span>
                    <span className="text-[#656d76] dark:text-[#848d97] flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {customRunResult.executionTimeMs}ms
                    </span>
                    <span className="text-[#656d76] dark:text-[#848d97] flex items-center gap-1">
                      <Cpu className="w-3 h-3" /> {Math.round(customRunResult.memoryUsedKb / 1024)}MB
                    </span>
                  </div>
                )}

                <pre className="p-3 rounded-lg bg-[#f6f8fa] dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] text-xs font-mono text-[#1f2328] dark:text-[#e6edf3] whitespace-pre-wrap overflow-x-auto min-h-[80px]">
                  {consoleOutput || 'Click "Run" or "Submit" to see execution outputs here.'}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 100% Deterministic Code Execution Visualizer Modal (Zero AI) */}
      {visualizerFrames && visualizerFrames.length > 0 && (
        <CodeExecutionVisualizerModal
          isOpen={isVisualizerModalOpen}
          onClose={() => setIsVisualizerModalOpen(false)}
          frames={visualizerFrames}
          code={code}
          language={language as any}
          problemTitle={problem.title}
        />
      )}
    </div>
  );
}
