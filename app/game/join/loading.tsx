import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="bg-card mx-auto w-full max-w-md rounded-lg border">
      <div className="space-y-2 p-6">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-5 w-48" />
      </div>
      <div className="space-y-4 p-6 pt-0">
        <div className="space-y-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}
