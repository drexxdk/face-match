import { Skeleton, GameCardSkeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="flex w-full flex-1 flex-col gap-12">
      <div className="flex items-start gap-4">
        <div className="flex grow flex-col gap-4">
          <Skeleton className="h-9 w-72" />
          <Skeleton className="h-5 w-96" />
          <div className="flex gap-4">
            <Skeleton className="h-10 w-28" />
            <Skeleton className="h-10 w-28" />
          </div>
        </div>
      </div>

      <div>
        <Skeleton className="mb-4 h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-3">
          <GameCardSkeleton />
          <GameCardSkeleton />
          <GameCardSkeleton />
        </div>
      </div>

      <div className="bg-card rounded-lg border">
        <div className="p-6">
          <Skeleton className="mb-4 h-6 w-32" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </div>
    </div>
  );
}
