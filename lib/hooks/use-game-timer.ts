'use client';

import { useEffect, useRef } from 'react';

interface UseGameTimerOptions {
  timeLeft: number;
  answered: boolean;
  timerEnabled: boolean;
  onTick: () => void;
  onTimeout: () => void;
}

/**
 * Custom hook for managing game countdown timer
 * Automatically cleans up and handles pause/resume based on answer state
 */
export function useGameTimer({ timeLeft, answered, timerEnabled, onTick, onTimeout }: UseGameTimerOptions) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // Only run timer if enabled, not answered, and time remaining
    if (!timerEnabled || answered || timeLeft <= 0) {
      return;
    }

    // Handle timeout
    if (timeLeft === 0) {
      onTimeout();
      return;
    }

    // Set up tick timer
    timerRef.current = setTimeout(() => {
      onTick();
    }, 1000);

    // Cleanup on unmount or dependency change
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [timeLeft, answered, timerEnabled, onTick, onTimeout]);
}
