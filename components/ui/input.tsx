import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const inputVariants = cva(
  'bg-card/50 file:text-foreground placeholder:text-muted-foreground flex w-full touch-manipulation rounded-lg border-2 shadow-sm transition-all duration-200 file:border-0 file:bg-transparent file:font-medium focus-visible:scale-[1.01] focus-visible:shadow-lg focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      inputSize: {
        sm: 'min-h-9 px-3 py-1.5 text-sm file:text-xs',
        md: 'min-h-11 px-4 py-2.5 text-base file:text-sm',
        lg: 'min-h-14 px-5 py-3 text-lg file:text-base',
      },
      inputState: {
        default:
          'border-input focus-visible:ring-primary focus-visible:border-primary hover:border-primary/50 hover:shadow-md',
        error:
          'border-destructive focus-visible:ring-destructive focus-visible:border-destructive hover:border-destructive/70 hover:shadow-md',
        success:
          'border-green-500 focus-visible:ring-green-500 focus-visible:border-green-500 hover:border-green-500/70 hover:shadow-md',
      },
    },
    defaultVariants: {
      inputSize: 'md',
      inputState: 'default',
    },
  },
);

export interface InputProps
  extends Omit<React.ComponentProps<'input'>, 'size'>,
    VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, inputSize, inputState, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(inputVariants({ inputSize, inputState }), className)}
        ref={ref}
        aria-invalid={props['aria-invalid'] || inputState === 'error'}
        aria-describedby={props['aria-describedby']}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';

export { Input, inputVariants };
