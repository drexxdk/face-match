import { Skeleton, PersonCardSkeleton, CardSkeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* People Section */}
      <div className="bg-card rounded-lg border">
        <div className="p-6 pb-2">
          <Skeleton className="mb-1 h-7 w-24" />
          <Skeleton className="h-5 w-48" />
        </div>
        <div className="flex flex-col gap-4 p-6 pt-2">
          <PersonCardSkeleton />
          <PersonCardSkeleton />
          <PersonCardSkeleton />
        </div>
      </div>

      {/* Settings Section */}
      <div className="space-y-6">
        <CardSkeleton />
        <div className="bg-card space-y-4 rounded-lg border p-6">
          <Skeleton className="h-6 w-32" />
          <div className="space-y-3">
            <div className="flex justify-between">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-6 w-12" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-6 w-12" />
            </div>
          </div>
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </div>
  );
}
