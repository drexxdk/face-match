import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="bg-card rounded-lg border">
      <div className="space-y-6 p-6">
        <div className="space-y-4 py-8 text-center">
          <Skeleton className="mx-auto h-8 w-40" />
          <div className="space-y-2">
            <Skeleton className="mx-auto h-5 w-24" />
            <Skeleton className="mx-auto h-20 w-48" />
          </div>
          <Skeleton className="mx-auto h-5 w-72" />
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 flex-1" />
        </div>
      </div>
    </div>
  );
}
