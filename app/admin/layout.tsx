import { Header } from '@/components/header';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { LoadingOverlay } from '@/components/ui/loading-spinner';
import { Suspense } from 'react';
import { LoadingProvider } from '@/lib/loading-context';
import { ErrorBoundaryWrapper } from '@/components/error-boundary-wrapper';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col">
      <Header />
      <div className="relative flex grow flex-col">
        <LoadingProvider>
          <ErrorBoundaryWrapper>
            <div className="p-8">
              <div className="mx-auto w-full max-w-5xl">
                <Breadcrumbs />
                <Suspense fallback={<LoadingOverlay />}>{children}</Suspense>
              </div>
            </div>
          </ErrorBoundaryWrapper>
        </LoadingProvider>
      </div>
    </main>
  );
}
