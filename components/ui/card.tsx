import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

const cardVariants = cva(
  'border-border/50 bg-gradient-card text-card-foreground relative flex flex-col rounded-glass border shadow-glass transition-all duration-300',
  {
    variants: {
      variant: {
        default: 'p-6 gap-4 glass-subtle',
        compact: 'p-4 gap-3 glass-subtle',
        flush: 'p-0 gap-0 overflow-hidden rounded-glass',
        glass: 'p-6 gap-4 glass',
        enhanced: 'p-6 gap-4 glass-strong border-gradient-subtle shadow-glass-lg',
      },
      hover: {
        true: 'hover:border-primary/40 cursor-pointer hover:scale-[1.02] hover:shadow-glass-lg hover:shadow-primary/10 hover:bg-card/90',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'enhanced',
      hover: false,
    },
  },
);

interface CardProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {
  glass?: boolean; // Keep for backward compatibility
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(({ className, variant, hover, glass, ...props }, ref) => {
  // If glass prop is used, override variant
  const effectiveVariant = glass ? 'glass' : variant;

  // Enhanced variant gets gradient border wrapper
  if (effectiveVariant === 'enhanced') {
    return (
      <div className="from-primary/20 to-secondary/20 rounded-glass-lg relative bg-linear-to-br via-transparent p-[1px]">
        <div ref={ref} className={cn(cardVariants({ variant: effectiveVariant, hover }), className)} {...props} />
      </div>
    );
  }

  return <div ref={ref} className={cn(cardVariants({ variant: effectiveVariant, hover }), className)} {...props} />;
});
Card.displayName = 'Card';

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn('flex flex-col gap-2', className)} {...props} />,
);
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('text-2xl leading-tight font-bold tracking-tight', className)} {...props} />
  ),
);
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-muted-foreground text-sm leading-relaxed', className)} {...props} />
  ),
);
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn(className)} {...props} />,
);
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn('flex items-center', className)} {...props} />,
);
CardFooter.displayName = 'CardFooter';

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, cardVariants };
