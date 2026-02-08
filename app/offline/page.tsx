'use client';

export default function OfflinePage() {
  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center p-4">
      <div className="max-w-md space-y-6 text-center">
        <div className="text-6xl">📡</div>
        <h1 className="text-foreground text-2xl font-bold">You&apos;re Offline</h1>
        <p className="text-muted-foreground">
          It looks like you&apos;ve lost your internet connection. Please check your connection and try again.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center rounded-md px-6 py-3 text-sm font-medium transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
