'use client';

import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Only show install prompt on mobile devices
    const checkMobile = () => {
      const mobile =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        window.innerWidth < 768;
      setIsMobile(mobile);
    };
    checkMobile();

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    // Listen for successful installation
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Store dismissal in localStorage to not show again for a while
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
  };

  // Don't show if already installed, not mobile, or dismissed recently
  if (isInstalled || !showPrompt || !isMobile) return null;

  // Check if dismissed recently (within 7 days)
  const dismissedAt = localStorage.getItem('pwa-prompt-dismissed');
  if (dismissedAt) {
    const daysSinceDismissed = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60 * 24);
    if (daysSinceDismissed < 7) return null;
  }

  return (
    <div className="bg-card border-border animate-in slide-in-from-bottom-4 fixed right-4 bottom-4 left-4 z-50 rounded-lg border p-4 shadow-lg md:right-4 md:left-auto md:w-80">
      <div className="flex items-start gap-3">
        <div className="text-2xl">🎮</div>
        <div className="flex-1">
          <h3 className="text-foreground font-semibold">Install Guess Who</h3>
          <p className="text-muted-foreground mt-1 text-sm">
            Add to your home screen for quick access and offline play!
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleInstall}
              className="bg-primary text-primary-foreground hover:bg-primary/90 flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors"
            >
              Install
            </button>
            <button
              onClick={handleDismiss}
              className="text-muted-foreground hover:text-foreground px-3 py-2 text-sm transition-colors"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
