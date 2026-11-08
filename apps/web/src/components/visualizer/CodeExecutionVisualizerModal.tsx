import React, { useState, useEffect } from 'react';
import { X, Sparkles, Code2, Maximize2, Minimize2, Eye, Loader2, ArrowRight, Lightbulb, Play } from 'lucide-react';
import {
  NormalizedTraceFrame,
  Problem,
  DataStructureClassifier,
  getCanonicalApproaches,
  SolutionApproach
} from '@aica/shared';
import { useVisualizerPlayback } from './core/useVisualizerPlayback';
import { ArrayRenderer } from './renderers/ArrayRenderer';
import { TreeGraphRenderer } from './renderers/TreeGraphRenderer';
import { MatrixDPRenderer } from './renderers/MatrixDPRenderer';
import { SynchronizedCodeViewer } from './ui/SynchronizedCodeViewer';
import { PlaybackControlsToolbar } from './ui/PlaybackControlsToolbar';
import { StepNarrationCard } from './ui/StepNarrationCard';
import { TelemetryHUD } from './telemetry/TelemetryHUD';
import { SupportedLanguage } from './core/types';
import { api } from '../../services/api';
import { toast } from '../../store/useToastStore';

interface CodeExecutionVisualizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  frames: NormalizedTraceFrame[];
  code: string;
  language: SupportedLanguage;
  problemTitle?: string;
  problem?: Problem;
  sampleInput?: string;
}

export function CodeExecutionVisualizerModal({
  isOpen,
  onClose,
  frames,
  code,
  language,
  problemTitle,
  problem,
  sampleInput = ''
}: CodeExecutionVisualizerModalProps) {
  const [isMaximized, setIsMaximized] = useState<boolean>(false);
  const [activeFrames, setActiveFrames] = useState<NormalizedTraceFrame[]>(frames);
  const [activeCode, setActiveCode] = useState<string>(code);
  const [selectedApproachKey, setSelectedApproachKey] = useState<string | number>('MY_CODE');
  const [isSwitchingApproach, setIsSwitchingApproach] = useState<boolean>(false);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  // Retrieve canonical approaches for this problem
  const canonicalData = getCanonicalApproaches(problem?.slug || problemTitle || '');
  const availableApproaches: SolutionApproach[] =
    canonicalData?.solutionApproaches || problem?.solutionApproaches || [];

  const loadApproachTrace = async (codeToTrace: string, approachKey: string | number) => {
    setIsSwitchingApproach(true);
    try {
      const res = await api.post('/tracer/trace', {
        code: codeToTrace,
        language,
        stdin: sampleInput || ''
      });
      const steps = res.data?.data?.steps || [];
      if (steps.length > 0) {
        const normalized = DataStructureClassifier.normalizeTrace(steps, language);
        setActiveFrames(normalized);
        setActiveCode(codeToTrace);
        setSelectedApproachKey(approachKey);
      } else {
        toast.error('No execution steps returned for approach.');
      }
    } catch (err: any) {
      console.error('[VisualizerModal] Failed to trace approach:', err);
      toast.error('Could not trace selected approach.');
    } finally {
      setIsSwitchingApproach(false);
    }
  };

  // On mount or when initial frames / code change:
  // If the user's code is empty or starter boilerplate (pass), auto-load the Canonical Optimal Approach
  useEffect(() => {
    if (!isOpen) return;

    const isStubCode =
      code.includes('pass\n') ||
      code.trim().endsWith('pass') ||
      code.trim().length < 40;

    if ((isStubCode || frames.length <= 3) && availableApproaches.length > 0) {
      // Find optimal or first approach with executable code
      const optimalAppIdx = availableApproaches.findIndex(
        (a) => (a.paradigm === 'TWO_POINTER' || a.paradigm === 'OPTIMAL' || a.isUserApproach) && a.executableCode
      );
      const targetIdx = optimalAppIdx >= 0 ? optimalAppIdx : availableApproaches.findIndex((a) => a.executableCode);

      if (targetIdx >= 0 && availableApproaches[targetIdx]?.executableCode) {
        const targetApp = availableApproaches[targetIdx];
        setSelectedApproachKey(targetIdx);
        setNoticeMessage(
          `Viewing Canonical: ${targetApp.title} (since editor currently contains starter template).`
        );
        loadApproachTrace(targetApp.executableCode!, targetIdx);
        return;
      }
    }

    setActiveFrames(frames);
    setActiveCode(code);
    setSelectedApproachKey('MY_CODE');
    setNoticeMessage(null);
  }, [isOpen, frames, code]);

  // Cast normalized frames to match TraceFrame interface for playback hook
  const steps = activeFrames as any[];

  const {
    currentStepIndex,
    totalSteps,
    currentFrame,
    isPlaying,
    speed,
    setSpeed,
    togglePlay,
    stepNext,
    stepPrev,
    seek,
    reset
  } = useVisualizerPlayback({ steps, defaultSpeed: 1 });

  // Keyboard navigation inside modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowRight' || e.key === 'F10') {
        e.preventDefault();
        stepNext();
      } else if (e.code === 'ArrowLeft' || e.key === 'F9') {
        e.preventDefault();
        stepPrev();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, togglePlay, stepNext, stepPrev, onClose]);

  if (!isOpen) return null;

  const activeLine = currentFrame?.lineMapping?.[language] || currentFrame?.variables?._line;

  const handleSelectApproach = (key: string | number) => {
    if (key === 'MY_CODE') {
      setSelectedApproachKey('MY_CODE');
      setNoticeMessage(null);
      loadApproachTrace(code, 'MY_CODE');
    } else {
      const app = availableApproaches[key as number];
      if (app && app.executableCode) {
        setSelectedApproachKey(key);
        setNoticeMessage(`Viewing Canonical: ${app.title}`);
        loadApproachTrace(app.executableCode, key);
      }
    }
  };

  const renderCanvas = () => {
    if (isSwitchingApproach) {
      return (
        <div className="flex flex-col items-center justify-center p-8 space-y-2 text-[#0969da] dark:text-[#58a6ff]">
          <Loader2 className="w-7 h-7 animate-spin" />
          <span className="text-xs font-mono font-semibold">Tracing Execution in Sandbox...</span>
        </div>
      );
    }

    if (!currentFrame?.visualPayload) return null;

    switch (currentFrame.visualPayload.kind) {
      case 'ARRAY':
        return <ArrayRenderer payload={currentFrame.visualPayload as any} />;
      case 'TREE':
      case 'GRAPH':
        return <TreeGraphRenderer payload={currentFrame.visualPayload as any} />;
      case 'MATRIX':
        return <MatrixDPRenderer payload={currentFrame.visualPayload as any} />;
      default:
        return <ArrayRenderer payload={currentFrame.visualPayload as any} />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className={`w-full ${
          isMaximized ? 'h-[96vh]' : 'max-w-6xl max-h-[92vh]'
        } bg-white dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#30363d] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#161b22]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#8250df1a] text-[#8250df] dark:text-[#a371f7] flex items-center justify-center font-bold shadow-2xs">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#1f2328] dark:text-[#f0f6fc]">
                  Zero-AI Code Execution Visualizer
                </h3>
                <span className="px-2 py-0.2 rounded-full text-[10px] font-mono font-semibold bg-[#2ea0431a] text-[#1a7f37] dark:text-[#3fb950] border border-[#2ea04333]">
                  100% Deterministic Tracer
                </span>
              </div>
              <p className="text-[11px] text-[#57606a] dark:text-[#8b949e]">
                {problemTitle ? `Tracing: ${problemTitle}` : 'Interactive Step-by-Step Memory Mutation'} &bull; Language: {language}
              </p>
            </div>
          </div>

          {/* Approach Switcher Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-[#eaeef2] dark:bg-[#21262d] rounded-xl border border-[#d0d7de]/60 dark:border-[#30363d]/60">
            {availableApproaches.map((app, idx) => {
              const isSelected = selectedApproachKey === idx;
              const isOptimal = app.paradigm === 'OPTIMAL' || app.paradigm === 'TWO_POINTER' || app.isUserApproach;

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectApproach(idx)}
                  disabled={isSwitchingApproach}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    isSelected
                      ? 'bg-white dark:bg-[#0d1117] text-[#0969da] dark:text-[#58a6ff] shadow-xs'
                      : 'text-[#57606a] dark:text-[#8b949e] hover:text-[#1f2328] dark:hover:text-[#e6edf3]'
                  }`}
                  title={app.intuition}
                >
                  <span className="text-[11px]">{isOptimal ? '🌟' : '⚡'}</span>
                  <span>{app.title.split('(')[0].trim()}</span>
                  <span className="text-[10px] opacity-75 font-mono">({app.timeComplexity})</span>
                </button>
              );
            })}

            <button
              onClick={() => handleSelectApproach('MY_CODE')}
              disabled={isSwitchingApproach}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                selectedApproachKey === 'MY_CODE'
                  ? 'bg-white dark:bg-[#0d1117] text-[#8250df] dark:text-[#a371f7] shadow-xs'
                  : 'text-[#57606a] dark:text-[#8b949e] hover:text-[#1f2328] dark:hover:text-[#e6edf3]'
              }`}
              title="Visualize your current workspace code from the Monaco editor"
            >
              <Code2 className="w-3.5 h-3.5 text-[#8250df] dark:text-[#a371f7]" />
              <span>My Code</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsMaximized((prev) => !prev)}
              className="p-1.5 rounded-lg border border-[#d0d7de] dark:border-[#30363d] text-[#57606a] dark:text-[#8b949e] hover:text-[#1f2328] dark:hover:text-[#e6edf3] hover:bg-[#eaeef2] transition cursor-pointer"
              title={isMaximized ? 'Restore View' : 'Maximize Fullscreen'}
            >
              {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg border border-[#d0d7de] dark:border-[#30363d] text-[#57606a] dark:text-[#8b949e] hover:text-[#1f2328] dark:hover:text-[#e6edf3] hover:bg-[#eaeef2] transition cursor-pointer"
              title="Close Visualizer (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notice Ribbon when viewing a canonical approach */}
        {noticeMessage && (
          <div className="px-4 py-1.5 bg-[#ddf4ff40] dark:bg-[#388bfd1a] border-b border-[#54aeff44] dark:border-[#388bfd33] flex items-center justify-between text-xs text-[#0969da] dark:text-[#58a6ff]">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-3.5 h-3.5 shrink-0" />
              <span>{noticeMessage}</span>
            </div>
            {selectedApproachKey !== 'MY_CODE' && (
              <button
                onClick={() => handleSelectApproach('MY_CODE')}
                className="text-[11px] underline font-semibold hover:opacity-80 cursor-pointer"
              >
                Switch to My Code
              </button>
            )}
          </div>
        )}

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 flex-1 min-h-0 overflow-y-auto">
          {/* Left Canvas Column */}
          <div className="lg:col-span-7 xl:col-span-7 p-4 flex flex-col justify-between space-y-3.5 border-b lg:border-b-0 lg:border-r border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] min-w-0">
            {/* Visual Canvas */}
            <div className="flex-1 flex items-center justify-center rounded-2xl border border-[#d0d7de]/70 dark:border-[#30363d]/70 bg-[#f6f8fa] dark:bg-[#161b22] relative overflow-hidden min-h-[260px] shadow-inner">
              {renderCanvas()}
            </div>

            {/* Telemetry HUD */}
            <TelemetryHUD
              frame={currentFrame}
              currentStepIndex={currentStepIndex}
              totalSteps={totalSteps}
              timeComplexity={
                selectedApproachKey !== 'MY_CODE' && typeof selectedApproachKey === 'number'
                  ? availableApproaches[selectedApproachKey]?.timeComplexity || 'O(N log N)'
                  : 'Zero-AI Deterministic'
              }
            />

            {/* Step Narration */}
            <StepNarrationCard frame={currentFrame} />

            {/* VCR Playback Controls */}
            <PlaybackControlsToolbar
              currentStepIndex={currentStepIndex}
              totalSteps={totalSteps}
              isPlaying={isPlaying}
              speed={speed}
              onTogglePlay={togglePlay}
              onStepNext={stepNext}
              onStepPrev={stepPrev}
              onSeek={seek}
              onReset={reset}
              onSpeedChange={setSpeed}
            />
          </div>

          {/* Right Code Column */}
          <div className="lg:col-span-5 xl:col-span-5 p-4 flex flex-col bg-[#f6f8fa] dark:bg-[#010409] min-w-0">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="font-bold text-[#1f2328] dark:text-[#f0f6fc] flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-[#0969da] dark:text-[#58a6ff]" />
                {selectedApproachKey === 'MY_CODE' ? 'Active Student Code' : 'Canonical Approach Code'}
              </span>
              <span className="font-mono text-[11px] text-[#57606a] dark:text-[#8b949e]">
                Line {activeLine || '-'} Active
              </span>
            </div>

            <div className="flex-1 min-h-[380px]">
              <SynchronizedCodeViewer
                codeMap={{ [language]: activeCode } as any}
                activeLine={activeLine}
                variables={currentFrame?.variables}
                defaultLanguage={language}
                maxHeight={isMaximized ? 'calc(96vh - 180px)' : '420px'}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
