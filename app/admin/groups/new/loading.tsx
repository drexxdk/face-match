import { Skeleton, FormSkeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="bg-card rounded-lg border">
      <div className="space-y-2 p-6">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-5 w-64" />
      </div>
      <div className="p-6 pt-0">
        <FormSkeleton />
      </div>
    </div>
  );
}
