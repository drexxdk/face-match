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
                  // Check if running as PWA or on mobile
                  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
                  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
                  
                  if (isStandalone || isMobile) {
                    // New content available, prompt user to refresh on PWA/mobile
                    if (confirm('New version available! Reload to update?')) {
                      newWorker.postMessage('skipWaiting');
                      window.location.reload();
                    }
                  } else {
                    // On desktop browser, silently update
                    newWorker.postMessage('skipWaiting');
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
