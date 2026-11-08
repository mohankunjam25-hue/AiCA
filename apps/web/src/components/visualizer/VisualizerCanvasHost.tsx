import React, { useState, useMemo, useEffect } from 'react';
import {
  Sparkles,
  Maximize2,
  Minimize2,
  Sliders,
  RotateCcw,
  Code2,
  Layers,
  ChevronDown
} from 'lucide-react';
import {
  ALGORITHM_REGISTRY,
  ALL_ALGORITHM_DEFINITIONS,
  getAlgorithmDef
} from './registry';
import { useVisualizerPlayback } from './core/useVisualizerPlayback';
import { ArrayRenderer } from './renderers/ArrayRenderer';
import { TreeGraphRenderer } from './renderers/TreeGraphRenderer';
import { MatrixDPRenderer } from './renderers/MatrixDPRenderer';
import { SystemStructureRenderer } from './renderers/SystemStructureRenderer';
import { SynchronizedCodeViewer } from './ui/SynchronizedCodeViewer';
import { PlaybackControlsToolbar } from './ui/PlaybackControlsToolbar';
import { StepNarrationCard } from './ui/StepNarrationCard';
import { SupportedLanguage } from './core/types';

interface VisualizerCanvasHostProps {
  initialAlgorithm?: string;
  showSelector?: boolean;
  showCodeViewer?: boolean;
  className?: string;
}

export function VisualizerCanvasHost({
  initialAlgorithm = 'binary-search',
  showSelector = true,
  showCodeViewer = true,
  className = ''
}: VisualizerCanvasHostProps) {
  const [selectedAlgoKey, setSelectedAlgoKey] = useState<string>(initialAlgorithm);
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>('python');
  const [isMaximized, setIsMaximized] = useState<boolean>(false);

  // Sync with prop changes if parent switches algorithm
  useEffect(() => {
    if (initialAlgorithm && initialAlgorithm !== selectedAlgoKey) {
      setSelectedAlgoKey(initialAlgorithm);
    }
  }, [initialAlgorithm]);

  const currentAlgoDef = useMemo(() => {
    return getAlgorithmDef(selectedAlgoKey) || ALGORITHM_REGISTRY['binary-search'];
  }, [selectedAlgoKey]);

  // Generate deterministic trace frames
  const steps = useMemo(() => {
    return currentAlgoDef.generateSteps(currentAlgoDef.defaultInput);
  }, [currentAlgoDef]);

  // Playback state machine
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

  // Keyboard Navigation: Space = Play/Pause, ArrowRight/F10 = Step Next, ArrowLeft/F9 = Step Prev
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowRight' || e.key === 'F10') {
        e.preventDefault();
        stepNext();
      } else if (e.code === 'ArrowLeft' || e.key === 'F9') {
        e.preventDefault();
        stepPrev();
      } else if (e.key === 'Escape' && isMaximized) {
        setIsMaximized(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, stepNext, stepPrev, isMaximized]);

  // Current active line in selected language
  const activeLine = currentFrame?.lineMapping?.[selectedLanguage];

  // Render appropriate visual canvas based on payload kind
  const renderVisualCanvas = () => {
    if (!currentFrame?.visualPayload) return null;

    switch (currentFrame.visualPayload.kind) {
      case 'ARRAY':
        return <ArrayRenderer payload={currentFrame.visualPayload} />;
      case 'TREE':
      case 'GRAPH':
        return <TreeGraphRenderer payload={currentFrame.visualPayload} />;
      case 'MATRIX':
        return <MatrixDPRenderer payload={currentFrame.visualPayload} />;
      case 'SYSTEM_STRUCTURE':
        return <SystemStructureRenderer payload={currentFrame.visualPayload} />;
      default:
        return null;
    }
  };

  return (
    <div
      className={`flex flex-col rounded-2xl border border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#010409] overflow-hidden shadow-xs transition-all ${
        isMaximized ? 'fixed inset-4 z-50 shadow-2xl bg-white dark:bg-[#0d1117]' : className
      }`}
    >
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#161b22] flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#0969da1a] dark:bg-[#388bfd26] text-[#0969da] dark:text-[#58a6ff] flex items-center justify-center font-bold">
            <Sparkles className="w-4 h-4" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#1f2328] dark:text-[#f0f6fc]">
                {currentAlgoDef.name}
              </h3>
              <span className="px-2 py-0.2 rounded-full text-[10px] font-mono font-semibold bg-[#2ea0431a] text-[#1a7f37] dark:text-[#3fb950] border border-[#2ea04333]">
                {currentAlgoDef.timeComplexity}
              </span>
            </div>
            <p className="text-[11px] text-[#57606a] dark:text-[#8b949e]">
              Category: <strong className="text-[#1f2328] dark:text-[#c9d1d9]">{currentAlgoDef.category}</strong> &bull; Space: {currentAlgoDef.spaceComplexity}
            </p>
          </div>
        </div>

        {/* Controls: Selector & Maximize */}
        <div className="flex items-center gap-2">
          {showSelector && (
            <div className="relative">
              <select
                value={selectedAlgoKey}
                onChange={(e) => setSelectedAlgoKey(e.target.value)}
                className="appearance-none pl-3 pr-8 py-1.5 rounded-lg border border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#0d1117] text-xs font-semibold text-[#1f2328] dark:text-[#f0f6fc] cursor-pointer focus:ring-1 focus:ring-[#0969da] outline-none"
              >
                {ALL_ALGORITHM_DEFINITIONS.map((def) => (
                  <option key={def.id} value={def.id}>
                    {def.name} ({def.category})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#57606a] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          )}

          <button
            onClick={() => setIsMaximized((prev) => !prev)}
            className="p-1.5 rounded-lg border border-[#d0d7de] dark:border-[#30363d] text-[#57606a] dark:text-[#8b949e] hover:text-[#1f2328] dark:hover:text-[#e6edf3] hover:bg-[#f6f8fa] dark:hover:bg-[#21262d] transition cursor-pointer"
            title={isMaximized ? 'Exit Fullscreen (Esc)' : 'Maximize Visualizer'}
          >
            {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Content Area: Split 2-Column on Desktop (Canvas on Left, Code on Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 flex-1 min-h-0 overflow-y-auto">
        {/* Left Visual Column */}
        <div
          className={`${
            showCodeViewer ? 'lg:col-span-7 xl:col-span-7' : 'col-span-12'
          } p-4 sm:p-5 flex flex-col justify-between space-y-4 border-b lg:border-b-0 lg:border-r border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] min-w-0`}
        >
          {/* Visual Canvas Display */}
          <div className="flex-1 flex items-center justify-center rounded-xl border border-[#d0d7de]/70 dark:border-[#30363d]/70 bg-[#f6f8fa] dark:bg-[#161b22] relative overflow-hidden min-h-[240px]">
            {renderVisualCanvas()}
          </div>

          {/* Step Narration Banner */}
          <StepNarrationCard frame={currentFrame} />

          {/* VCR Playback Toolbar */}
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

        {/* Right Code Column: Synchronized Code Line Viewer */}
        {showCodeViewer && (
          <div className="lg:col-span-5 xl:col-span-5 p-4 sm:p-5 flex flex-col bg-[#f6f8fa] dark:bg-[#010409] min-w-0">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="font-bold text-[#1f2328] dark:text-[#f0f6fc] flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-[#0969da] dark:text-[#58a6ff]" />
                Synchronized Code Workflow
              </span>
              <span className="font-mono text-[11px] text-[#57606a] dark:text-[#8b949e]">
                Line {activeLine || '-'} Active
              </span>
            </div>

            <div className="flex-1 min-h-[360px]">
              <SynchronizedCodeViewer
                codeMap={currentAlgoDef.codeMap}
                activeLine={activeLine}
                variables={currentFrame?.variables}
                defaultLanguage={selectedLanguage}
                onLanguageChange={setSelectedLanguage}
                maxHeight={isMaximized ? 'calc(100vh - 220px)' : '420px'}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
