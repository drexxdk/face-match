import { Header } from '@/components/header';
import { LoadingOverlay } from '@/components/ui/loading-spinner';
import { Suspense } from 'react';
import { LoadingProvider } from '@/lib/loading-context';
import { ErrorBoundaryWrapper } from '@/components/error-boundary-wrapper';

export default function GameLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="from-brand-primary to-brand-tertiary flex min-h-screen flex-col overflow-hidden bg-linear-to-br">
      <Header />
      <LoadingProvider>
        <Suspense fallback={<LoadingOverlay />}>
          <ErrorBoundaryWrapper>
            <div className="relative flex flex-1 overflow-x-hidden">{children}</div>
          </ErrorBoundaryWrapper>
        </Suspense>
      </LoadingProvider>
    </main>
  );
}
