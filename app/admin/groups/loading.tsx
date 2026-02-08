import { GroupCardSkeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="bg-muted h-9 w-32 animate-pulse rounded" />
          <div className="bg-muted mt-2 h-5 w-64 animate-pulse rounded" />
        </div>
        <div className="bg-muted h-10 w-40 animate-pulse rounded" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <GroupCardSkeleton />
        <GroupCardSkeleton />
        <GroupCardSkeleton />
      </div>
    </>
  );
}
