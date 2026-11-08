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
    <div className="flex items-center justify-between gap-2 sm:gap-3 px-3 sm:px-4 py-1.5 sm:py-2 bg-slate-900/95 dark:bg-[#161b22]/95 border border-slate-700/80 dark:border-[#30363d] rounded-2xl shadow-2xl backdrop-blur-md max-w-xl">
      {/* Playback Action Buttons */}
      <div className="flex items-center gap-1">
        <button
          onClick={onReset}
          disabled={disabled || totalSteps === 0}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
          title="Reset execution (Home)"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onStepBackward}
          disabled={disabled || currentStep <= 0}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
          title="Step Previous (F9)"
        >
          <SkipBack className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={isPlaying ? onPause : onPlay}
          disabled={disabled || totalSteps === 0}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-xs transition cursor-pointer shadow-md ${
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
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
          title="Step Forward (F10)"
        >
          <SkipForward className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Scrubber slider */}
      <div className="flex items-center gap-2 min-w-[110px] sm:min-w-[150px] flex-1 max-w-xs px-1">
        <input
          type="range"
          min={0}
          max={Math.max(totalSteps, 1)}
          value={currentStep}
          onChange={(e) => onSeek(Number(e.target.value))}
          disabled={disabled || totalSteps === 0}
          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500 disabled:opacity-30"
        />
        <span className="text-[11px] font-mono font-medium text-slate-400 whitespace-nowrap min-w-[50px] text-right">
          {currentStep}/{totalSteps}
        </span>
      </div>

      {/* Speed control buttons */}
      <div className="hidden sm:flex items-center gap-0.5 bg-slate-950/80 p-0.5 rounded-lg border border-slate-800">
        <Gauge className="w-3 h-3 text-slate-500 ml-1 mr-0.5" />
        {speeds.map((s) => (
          <button
            key={s}
            onClick={() => onSpeedChange(s)}
            className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition cursor-pointer ${
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
