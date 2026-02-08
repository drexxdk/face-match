import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="bg-card mx-auto w-full max-w-2xl rounded-lg border">
      <div className="flex flex-col gap-2 p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-5 w-24" />
        </div>
      </div>
      <div className="space-y-6 p-6 pt-0">
        {/* Question area */}
        <div className="space-y-4 text-center">
          <Skeleton className="mx-auto h-6 w-48" />
          <Skeleton className="mx-auto h-48 w-48 rounded-lg" />
        </div>

        {/* Options */}
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
        </div>

        {/* Timer */}
        <Skeleton className="h-2 w-full" />
      </div>
    </div>
  );
}
