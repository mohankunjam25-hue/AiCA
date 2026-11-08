import React from 'react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  RotateCcw,
  Gauge,
} from 'lucide-react';

interface FlowchartVCRControlsProps {
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
  disabled?: boolean;
}

export function FlowchartVCRControls({
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
  disabled = false,
}: FlowchartVCRControlsProps) {
  const speeds = [0.5, 1, 2, 4];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-slate-900/90 dark:bg-[#161b22]/95 border border-slate-700/80 dark:border-[#30363d] rounded-xl shadow-2xl backdrop-blur-md">
      {/* Playback Action Buttons */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={onReset}
          disabled={disabled || totalSteps === 0}
          className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent transition cursor-pointer"
          title="Reset execution (Home)"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={onStepBackward}
          disabled={disabled || currentStep <= 0}
          className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent transition cursor-pointer"
          title="Step Previous (F9)"
        >
          <SkipBack className="w-4 h-4" />
        </button>

        <button
          onClick={isPlaying ? onPause : onPlay}
          disabled={disabled || totalSteps === 0}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-semibold text-xs transition cursor-pointer shadow-md ${
            isPlaying
              ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30'
              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30 disabled:opacity-40'
          }`}
          title={isPlaying ? 'Pause' : 'Play Flowchart'}
        >
          {isPlaying ? (
            <>
              <Pause className="w-3.5 h-3.5 fill-white" />
              <span>Pause</span>
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
          disabled={disabled || currentStep >= totalSteps}
          className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent transition cursor-pointer"
          title="Step Forward (F10)"
        >
          <SkipForward className="w-4 h-4" />
        </button>
      </div>

      {/* Scrubber slider */}
      <div className="flex items-center gap-3 min-w-[200px] flex-1 max-w-md px-2">
        <input
          type="range"
          min={0}
          max={Math.max(totalSteps, 1)}
          value={currentStep}
          onChange={(e) => onSeek(Number(e.target.value))}
          disabled={disabled || totalSteps === 0}
          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500 disabled:opacity-40"
        />
        <span className="text-xs font-mono font-medium text-slate-400 whitespace-nowrap min-w-[65px] text-right">
          {currentStep} / {totalSteps}
        </span>
      </div>

      {/* Speed control buttons */}
      <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800">
        <Gauge className="w-3 h-3 text-slate-400 ml-1 mr-0.5" />
        {speeds.map((s) => (
          <button
            key={s}
            onClick={() => onSpeedChange(s)}
            className={`px-2 py-0.5 rounded text-[11px] font-mono transition cursor-pointer ${
              speed === s
                ? 'bg-blue-600 text-white font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {s}x
          </button>
        ))}
      </div>
    </div>
  );
}
