import React, { useState, useEffect } from 'react';
import { X, Sparkles, Code2, Maximize2, Minimize2, Eye } from 'lucide-react';
import { NormalizedTraceFrame } from '@aica/shared';
import { useVisualizerPlayback } from './core/useVisualizerPlayback';
import { ArrayRenderer } from './renderers/ArrayRenderer';
import { TreeGraphRenderer } from './renderers/TreeGraphRenderer';
import { MatrixDPRenderer } from './renderers/MatrixDPRenderer';
import { SynchronizedCodeViewer } from './ui/SynchronizedCodeViewer';
import { PlaybackControlsToolbar } from './ui/PlaybackControlsToolbar';
import { StepNarrationCard } from './ui/StepNarrationCard';
import { TelemetryHUD } from './telemetry/TelemetryHUD';
import { SupportedLanguage } from './core/types';

interface CodeExecutionVisualizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  frames: NormalizedTraceFrame[];
  code: string;
  language: SupportedLanguage;
  problemTitle?: string;
}

export function CodeExecutionVisualizerModal({
  isOpen,
  onClose,
  frames,
  code,
  language,
  problemTitle
}: CodeExecutionVisualizerModalProps) {
  const [isMaximized, setIsMaximized] = useState<boolean>(false);

  // Cast normalized frames to match TraceFrame interface
  const steps = frames as any[];

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

  const renderCanvas = () => {
    if (!currentFrame?.visualPayload) return null;

    switch (currentFrame.visualPayload.kind) {
      case 'ARRAY':
        return <ArrayRenderer payload={currentFrame.visualPayload} />;
      case 'TREE':
      case 'GRAPH':
        return <TreeGraphRenderer payload={currentFrame.visualPayload} />;
      case 'MATRIX':
        return <MatrixDPRenderer payload={currentFrame.visualPayload} />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className={`w-full ${
          isMaximized ? 'h-[96vh]' : 'max-w-6xl max-h-[90vh]'
        } bg-white dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#30363d] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#161b22]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#8250df1a] text-[#8250df] dark:text-[#a371f7] flex items-center justify-center font-bold">
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

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 flex-1 min-h-0 overflow-y-auto">
          {/* Left Canvas Column */}
          <div className="lg:col-span-7 xl:col-span-7 p-4 flex flex-col justify-between space-y-3.5 border-b lg:border-b-0 lg:border-r border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] min-w-0">
            {/* Visual Canvas */}
            <div className="flex-1 flex items-center justify-center rounded-2xl border border-[#d0d7de]/70 dark:border-[#30363d]/70 bg-[#f6f8fa] dark:bg-[#161b22] relative overflow-hidden min-h-[250px] shadow-inner">
              {renderCanvas()}
            </div>

            {/* Telemetry HUD */}
            <TelemetryHUD
              frame={currentFrame}
              currentStepIndex={currentStepIndex}
              totalSteps={totalSteps}
              timeComplexity="Zero-AI Deterministic"
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
                Active Student Code
              </span>
              <span className="font-mono text-[11px] text-[#57606a] dark:text-[#8b949e]">
                Line {activeLine || '-'} Active
              </span>
            </div>

            <div className="flex-1 min-h-[380px]">
              <SynchronizedCodeViewer
                codeMap={{ [language]: code } as any}
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
