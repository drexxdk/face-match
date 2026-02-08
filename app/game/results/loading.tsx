import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="bg-card mx-auto w-full max-w-md rounded-lg border">
      <div className="flex flex-col gap-2 p-6">
        <Skeleton className="mx-auto h-7 w-32" />
        <Skeleton className="mx-auto h-5 w-48" />
      </div>
      <div className="flex flex-col gap-6 p-6 pt-0">
        {/* Score */}
        <div className="text-center">
          <Skeleton className="mx-auto h-16 w-24" />
          <Skeleton className="mx-auto mt-2 h-5 w-32" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>

        {/* Button */}
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}
