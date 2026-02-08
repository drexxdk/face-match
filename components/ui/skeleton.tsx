import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  shimmer?: boolean;
}

export function Skeleton({ className, shimmer = true }: SkeletonProps) {
  return (
    <div
      className={cn(
        'bg-muted animate-pulse rounded-md',
        shimmer &&
          'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-linear-to-r before:from-transparent before:via-white/10 before:to-transparent',
        className,
      )}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-card space-y-4 rounded-lg border p-6">
      <Skeleton className="h-6 w-1/3" />
      <Skeleton className="h-4 w-2/3" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
      </div>
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

export function GroupCardSkeleton() {
  return (
    <div className="bg-card flex h-full flex-col rounded-lg border transition-shadow hover:shadow-lg">
      <div className="space-y-2 p-6">
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-4 w-1/4" />
      </div>
      <div className="mt-auto space-y-4 p-6 pt-0">
        <div className="flex gap-2">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 flex-1" />
        </div>
      </div>
    </div>
  );
}

export function PersonCardSkeleton() {
  return (
    <div className="bg-card flex items-center gap-4 rounded-lg border p-4">
      <Skeleton className="size-16 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-4 w-1/4" />
      </div>
      <Skeleton className="size-8" />
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-full" />
      </div>
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

export function GameCardSkeleton() {
  return (
    <div className="bg-card rounded-lg border transition-shadow hover:shadow-lg">
      <div className="space-y-4 p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </div>
      <div className="space-y-3 p-6 pt-0">
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-16 rounded-md" />
          <Skeleton className="h-16 rounded-md" />
          <Skeleton className="h-16 rounded-md" />
          <Skeleton className="h-16 rounded-md" />
        </div>
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}

export function PlayerListSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-muted flex items-center justify-between gap-3 rounded-lg p-3">
          <div className="flex items-center gap-3">
            <Skeleton className="size-3 shrink-0 rounded-full" />
            <Skeleton className="h-5 w-32" />
          </div>
          <div className="flex shrink-0 gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
