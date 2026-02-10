'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export function OnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    // Set initial online status
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setShowIndicator(true);
      // Hide the "back online" message after 3 seconds
      setTimeout(() => setShowIndicator(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowIndicator(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <>
      {showIndicator && (
        <div
          className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-lg border px-4 py-2 shadow-lg"
          style={{
            background: isOnline
              ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
              : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            color: 'white',
          }}
        >
          <div className={cn('size-2 rounded-full', isOnline ? 'bg-game-correct' : 'bg-game-incorrect')} />
          <span className="text-sm font-medium">{isOnline ? 'Back online' : 'No internet connection'}</span>
        </div>
      )}
    </>
  );
}
