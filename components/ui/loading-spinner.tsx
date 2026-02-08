import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const spinnerVariants = cva('animate-spin rounded-full border-transparent', {
  variants: {
    size: {
      sm: 'size-8 border-2',
      md: 'size-12 border-3',
      lg: 'size-16 border-4',
    },
    color: {
      white: 'border-t-white border-r-white',
      primary: 'border-t-primary border-r-primary',
      accent: 'border-t-accent border-r-accent',
      muted: 'border-t-muted-foreground border-r-muted-foreground',
    },
  },
  defaultVariants: {
    size: 'lg',
    color: 'white',
  },
});

interface LoadingSpinnerProps extends VariantProps<typeof spinnerVariants> {
  className?: string;
}

export function LoadingSpinner({ className, size, color }: LoadingSpinnerProps) {
  return <div className={cn(spinnerVariants({ size, color }), className)} />;
}

export function LoadingOverlay({ size = 'lg' }: { size?: 'sm' | 'md' | 'lg' }) {
  return (
    <div className="top-header fixed right-0 bottom-0 left-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 rounded-lg bg-black/80 px-8 py-6">
        <LoadingSpinner size={size} color="white" />
        <p className="text-lg font-semibold text-white">Loading...</p>
      </div>
    </div>
  );
}

export { spinnerVariants };
