'use client';

import { useEffect } from 'react';
import { logger, logError } from '@/lib/logger';

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Register service worker
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          logger.log('Service Worker registered with scope:', registration.scope);

          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New content available, prompt user to refresh
                  if (confirm('New version available! Reload to update?')) {
                    newWorker.postMessage('skipWaiting');
                    window.location.reload();
                  }
                }
              });
            }
          });
        })
        .catch((error) => {
          logError(error, 'Service Worker registration failed');
        });

      // Handle controller change (when new SW takes over)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    }
  }, []);

  return null;
}
