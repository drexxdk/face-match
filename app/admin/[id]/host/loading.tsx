import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="bg-card rounded-lg border">
      <div className="space-y-2 p-6">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-5 w-32" />
      </div>
      <div className="space-y-6 p-6 pt-0">
        {/* Game Mode Selection */}
        <div>
          <Skeleton className="mb-4 h-6 w-36" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        </div>

        {/* Settings Sliders */}
        <div className="space-y-4">
          <div>
            <Skeleton className="mb-2 h-5 w-32" />
            <Skeleton className="h-2 w-full" />
          </div>
          <div>
            <Skeleton className="mb-2 h-5 w-40" />
            <Skeleton className="h-2 w-full" />
          </div>
          <div>
            <Skeleton className="mb-2 h-5 w-36" />
            <Skeleton className="h-2 w-full" />
          </div>
        </div>

        {/* Start Button */}
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}
