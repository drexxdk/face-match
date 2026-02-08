import { Skeleton, PlayerListSkeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="flex flex-col gap-4">
      {/* Header Card */}
      <div className="bg-card rounded-lg border">
        <div className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
        <div className="space-y-4 p-6 pt-0">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
          <div className="flex gap-4">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 flex-1" />
          </div>
        </div>
      </div>

      {/* Players Card */}
      <div className="bg-card rounded-lg border">
        <div className="p-6">
          <Skeleton className="mb-4 h-6 w-32" />
          <PlayerListSkeleton />
        </div>
      </div>
    </div>
  );
}
