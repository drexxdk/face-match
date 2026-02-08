import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Suspense } from 'react';

async function ErrorContent({ searchParams }: { searchParams: Promise<{ error: string }> }) {
  const params = await searchParams;

  return (
    <>
      {params?.error ? (
        <p className="text-muted-foreground text-sm">Code error: {params.error}</p>
      ) : (
        <p className="text-muted-foreground text-sm">An unspecified error occurred.</p>
      )}
    </>
  );
}

export default function Page({ searchParams }: { searchParams: Promise<{ error: string }> }) {
  return (
    <div className="flex min-h-screen items-center justify-center p-2">
      <Card className="max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Sorry, something went wrong.</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <Suspense>
            <ErrorContent searchParams={searchParams} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
