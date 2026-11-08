import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  FastForward
} from 'lucide-react';

interface PlaybackControlsToolbarProps {
  currentStepIndex: number;
  totalSteps: number;
  isPlaying: boolean;
  speed: number;
  onTogglePlay: () => void;
  onStepNext: () => void;
  onStepPrev: () => void;
  onSeek: (step: number) => void;
  onReset: () => void;
  onSpeedChange: (speed: number) => void;
}

export function PlaybackControlsToolbar({
  currentStepIndex,
  totalSteps,
  isPlaying,
  speed,
  onTogglePlay,
  onStepNext,
  onStepPrev,
  onSeek,
  onReset,
  onSpeedChange
}: PlaybackControlsToolbarProps) {
  const isAtEnd = currentStepIndex >= totalSteps - 1;
  const isAtStart = currentStepIndex === 0;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#161b22] shadow-xs">
      {/* Playback Button Group */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={onReset}
          disabled={isAtStart}
          className="p-1.5 rounded-lg border border-[#d0d7de] dark:border-[#30363d] text-[#57606a] dark:text-[#8b949e] hover:text-[#1f2328] dark:hover:text-[#e6edf3] hover:bg-[#f6f8fa] dark:hover:bg-[#21262d] disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
          title="Reset to Start"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onStepPrev}
          disabled={isAtStart}
          className="p-1.5 rounded-lg border border-[#d0d7de] dark:border-[#30363d] text-[#57606a] dark:text-[#8b949e] hover:text-[#1f2328] dark:hover:text-[#e6edf3] hover:bg-[#f6f8fa] dark:hover:bg-[#21262d] disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
          title="Step Backward (F9)"
        >
          <SkipBack className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onTogglePlay}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer ${
            isPlaying
              ? 'bg-[#d29922] hover:bg-[#bb8009] text-white'
              : 'bg-[#0969da] hover:bg-[#0860ca] dark:bg-[#1f6feb] dark:hover:bg-[#388bfd] text-white'
          }`}
          title={isPlaying ? 'Pause Animation (Space)' : 'Play Animation (Space)'}
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          <span>{isPlaying ? 'Pause' : 'Play'}</span>
        </button>

        <button
          onClick={onStepNext}
          disabled={isAtEnd}
          className="p-1.5 rounded-lg border border-[#d0d7de] dark:border-[#30363d] text-[#57606a] dark:text-[#8b949e] hover:text-[#1f2328] dark:hover:text-[#e6edf3] hover:bg-[#f6f8fa] dark:hover:bg-[#21262d] disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
          title="Step Forward (F10)"
        >
          <SkipForward className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Scrubber Timeline */}
      <div className="flex items-center gap-3 w-full sm:flex-1 max-w-md px-1">
        <input
          type="range"
          min={0}
          max={Math.max(0, totalSteps - 1)}
          value={currentStepIndex}
          onChange={(e) => onSeek(Number(e.target.value))}
          className="w-full h-1.5 bg-[#afb8c133] dark:bg-[#21262d] rounded-lg appearance-none cursor-pointer accent-[#0969da] dark:accent-[#58a6ff]"
        />
        <span className="text-[11px] font-mono font-bold text-[#57606a] dark:text-[#8b949e] shrink-0">
          {totalSteps > 0 ? currentStepIndex + 1 : 0} / {totalSteps}
        </span>
      </div>

      {/* Speed Controls */}
      <div className="flex items-center gap-1 shrink-0">
        <span className="text-[11px] text-[#57606a] dark:text-[#8b949e] mr-1 hidden sm:inline">Speed:</span>
        {[0.5, 1, 2, 4].map((s) => (
          <button
            key={s}
            onClick={() => onSpeedChange(s)}
            className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold transition cursor-pointer ${
              speed === s
                ? 'bg-[#0969da] text-white dark:bg-[#1f6feb]'
                : 'text-[#57606a] dark:text-[#8b949e] hover:bg-[#f6f8fa] dark:hover:bg-[#21262d]'
            }`}
          >
            {s}x
          </button>
        ))}
      </div>
    </div>
  );
}
