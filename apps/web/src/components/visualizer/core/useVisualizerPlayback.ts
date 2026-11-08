import { useState, useEffect, useRef, useCallback } from 'react';
import { TraceFrame } from './types';

interface UseVisualizerPlaybackOptions {
  steps: TraceFrame[];
  defaultSpeed?: number; // 0.5, 1, 2, 4
  autoPlay?: boolean;
}

export function useVisualizerPlayback({
  steps,
  defaultSpeed = 1,
  autoPlay = false
}: UseVisualizerPlaybackOptions) {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(autoPlay);
  const [speed, setSpeed] = useState<number>(defaultSpeed);
  const timerRef = useRef<any>(null);

  const totalSteps = steps.length;
  const currentFrame: TraceFrame | undefined = steps[currentStepIndex] || steps[0];

  // Reset index if steps array changes
  useEffect(() => {
    setCurrentStepIndex(0);
    setIsPlaying(false);
  }, [steps]);

  const pause = useCallback(() => {
    setIsPlaying(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const play = useCallback(() => {
    if (currentStepIndex >= totalSteps - 1) {
      setCurrentStepIndex(0);
    }
    setIsPlaying(true);
  }, [currentStepIndex, totalSteps]);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const stepNext = useCallback(() => {
    pause();
    setCurrentStepIndex((prev) => Math.min(prev + 1, totalSteps - 1));
  }, [totalSteps, pause]);

  const stepPrev = useCallback(() => {
    pause();
    setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
  }, [pause]);

  const seek = useCallback((index: number) => {
    pause();
    setCurrentStepIndex(Math.max(0, Math.min(index, totalSteps - 1)));
  }, [totalSteps, pause]);

  const reset = useCallback(() => {
    pause();
    setCurrentStepIndex(0);
  }, [pause]);

  // Autoplay loop timer
  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    if (currentStepIndex >= totalSteps - 1) {
      setIsPlaying(false);
      return;
    }

    // Base step interval: 1000ms / speed
    const intervalMs = Math.max(200, Math.round(1200 / speed));

    timerRef.current = setTimeout(() => {
      setCurrentStepIndex((prev) => {
        if (prev >= totalSteps - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, intervalMs);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isPlaying, currentStepIndex, totalSteps, speed]);

  return {
    currentStepIndex,
    totalSteps,
    currentFrame,
    isPlaying,
    speed,
    setSpeed,
    play,
    pause,
    togglePlay,
    stepNext,
    stepPrev,
    seek,
    reset
  };
}
