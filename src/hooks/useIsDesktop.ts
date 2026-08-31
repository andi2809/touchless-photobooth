'use client';

import { useState, useEffect } from 'react';

export const MIN_DESKTOP_BREAKPOINT = 1024; // Tailwind 'lg' breakpoint

export interface UseIsDesktopResult {
  isDesktop: boolean | null; // null during SSR/initial mount
  windowWidth: number;
  minWidth: number;
}

/**
 * Custom hook to detect if the current viewport width meets the minimum desktop requirement.
 * Prevents hydration mismatches by returning null on initial server render.
 */
export function useIsDesktop(minWidth: number = MIN_DESKTOP_BREAKPOINT): UseIsDesktopResult {
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);
  const [windowWidth, setWindowWidth] = useState<number>(0);

  useEffect(() => {
    const handleResize = () => {
      const currentWidth = window.innerWidth;
      setWindowWidth(currentWidth);
      setIsDesktop(currentWidth >= minWidth);
    };

    // Evaluate on client mount
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [minWidth]);

  return {
    isDesktop,
    windowWidth,
    minWidth,
  };
}
