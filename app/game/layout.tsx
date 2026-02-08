import { Header } from '@/components/header';
import { LoadingOverlay } from '@/components/ui/loading-spinner';
import { Suspense } from 'react';
import { LoadingProvider } from '@/lib/loading-context';
import { ErrorBoundaryWrapper } from '@/components/error-boundary-wrapper';

export default function GameLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex h-dvh flex-col overflow-hidden">
      <Header />
      <div className="relative flex min-h-0 flex-1 flex-col overflow-auto">
        <LoadingProvider>
          <Suspense fallback={<LoadingOverlay />}>
            <ErrorBoundaryWrapper className="flex min-h-full flex-1 flex-col">{children}</ErrorBoundaryWrapper>
          </Suspense>
        </LoadingProvider>
      </div>
    </main>
  );
}
