import { useState, useEffect } from 'react';

interface UseScrollTriggerOptions {
  threshold?: number;
}

export interface ScrollTriggerState {
  isScrolled: boolean;
  scrollY: number;
  scrollProgress: number; // 0 to 100
}

/**
 * Performant scroll-position and threshold trigger hook.
 * Uses requestAnimationFrame and passive event listeners to prevent main-thread jank.
 */
export function useScrollTrigger(options: UseScrollTriggerOptions = {}): ScrollTriggerState {
  const { threshold = 20 } = options;
  const [state, setState] = useState<ScrollTriggerState>({
    isScrolled: false,
    scrollY: 0,
    scrollProgress: 0
  });

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollY = window.scrollY || document.documentElement.scrollTop;
          const maxScroll =
            document.documentElement.scrollHeight - document.documentElement.clientHeight;
          const progress = maxScroll > 0 ? Math.min(100, Math.max(0, (scrollY / maxScroll) * 100)) : 0;

          setState({
            isScrolled: scrollY > threshold,
            scrollY,
            scrollProgress: progress
          });
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [threshold]);

  return state;
}
