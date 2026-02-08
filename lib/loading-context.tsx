'use client';

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { LoadingOverlay } from '@/components/ui/loading-spinner';

interface LoadingContextType {
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

const LoadingContext = createContext<LoadingContextType | null>(null);

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();

  const setLoading = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  // Clear loading state when pathname changes
  useEffect(() => {
    setIsLoading(false);
  }, [pathname]);

  return (
    <LoadingContext.Provider value={{ isLoading, setLoading }}>
      {isLoading && <LoadingOverlay />}
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within LoadingProvider');
  }
  return context;
}
