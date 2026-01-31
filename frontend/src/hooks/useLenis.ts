'use client';

import { useEffect, useRef, useCallback } from 'react';
import Lenis from 'lenis';

let lenisInstance: Lenis | null = null;

export function getLenis(): Lenis | null {
  return lenisInstance;
}

export function setLenisInstance(lenis: Lenis | null) {
  lenisInstance = lenis;
}

export function useLenis(callback?: (lenis: Lenis) => void) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const lenis = getLenis();
    if (lenis && callbackRef.current) {
      callbackRef.current(lenis);
    }
  }, []);

  const scrollTo = useCallback((
    target: string | number | HTMLElement,
    options?: {
      offset?: number;
      duration?: number;
      easing?: (t: number) => number;
      immediate?: boolean;
      lock?: boolean;
      onComplete?: () => void;
    }
  ) => {
    const lenis = getLenis();
    if (lenis) {
      lenis.scrollTo(target, options);
    }
  }, []);

  const stop = useCallback(() => {
    const lenis = getLenis();
    if (lenis) {
      lenis.stop();
    }
  }, []);

  const start = useCallback(() => {
    const lenis = getLenis();
    if (lenis) {
      lenis.start();
    }
  }, []);

  return {
    lenis: getLenis(),
    scrollTo,
    stop,
    start,
  };
}
