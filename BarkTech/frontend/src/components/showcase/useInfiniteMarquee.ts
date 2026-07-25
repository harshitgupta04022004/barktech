import { useCallback, useRef, useState, useEffect } from 'react';

interface UseInfiniteMarqueeOptions {
  speed?: number;       // pixels per frame (~60fps)
  pauseOnHover?: boolean;
}

export function useInfiniteMarquee(options: UseInfiniteMarqueeOptions = {}) {
  const { speed = 0.8, pauseOnHover = true } = options;
  const trackRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const animFrameRef = useRef<number>(0);
  const offsetRef = useRef(0);
  const isTabActive = useRef(true);

  // Pause when tab is inactive
  useEffect(() => {
    const onVisibility = () => {
      isTabActive.current = !document.hidden;
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  // Respect prefers-reduced-motion
  const prefersReducedMotion = typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const animate = useCallback(() => {
    const track = trackRef.current;
    if (!track || prefersReducedMotion) return;

    if (!isPaused && isTabActive.current) {
      offsetRef.current -= speed;
      // Reset when we've scrolled one full set
      const halfWidth = track.scrollWidth / 2;
      if (Math.abs(offsetRef.current) >= halfWidth) {
        offsetRef.current += halfWidth;
      }
      track.style.transform = `translate3d(${offsetRef.current}px, 0, 0)`;
    }

    animFrameRef.current = requestAnimationFrame(animate);
  }, [speed, isPaused, prefersReducedMotion]);

  useEffect(() => {
    if (prefersReducedMotion) return;
    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [animate, prefersReducedMotion]);

  const handleMouseEnter = useCallback(() => {
    if (pauseOnHover) setIsPaused(true);
  }, [pauseOnHover]);

  const handleMouseLeave = useCallback(() => {
    if (pauseOnHover) setIsPaused(false);
  }, [pauseOnHover]);

  return {
    trackRef,
    handleMouseEnter,
    handleMouseLeave,
    isPaused,
  };
}
