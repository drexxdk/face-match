import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { FaCircleExclamation, FaTriangleExclamation, FaCircleInfo, FaCircleCheck } from 'react-icons/fa6';
import { Icon } from './icon';

const messageVariants = cva('flex items-start gap-3 rounded-lg border transition-all duration-200', {
  variants: {
    severity: {
      error: 'bg-destructive/10 border-destructive/20 text-destructive',
      warning: 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400',
      info: 'bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-400',
      success: 'bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400',
    },
    size: {
      sm: 'p-2 text-xs',
      md: 'p-3 text-sm',
      lg: 'p-4 text-base',
    },
  },
  defaultVariants: {
    severity: 'error',
    size: 'md',
  },
});

const iconMap = {
  error: FaCircleExclamation,
  warning: FaTriangleExclamation,
  info: FaCircleInfo,
  success: FaCircleCheck,
};

interface ErrorMessageProps extends VariantProps<typeof messageVariants> {
  message: string | null | undefined;
  className?: string;
  suggestion?: string;
}

export function ErrorMessage({ message, className, size, severity, suggestion }: ErrorMessageProps) {
  if (!message) return null;

  const IconComponent = iconMap[severity || 'error'];

  return (
    <div className={cn(messageVariants({ severity, size }), className)} role="alert">
      <Icon icon={IconComponent} size="md" className="self-start" />
      <div className="flex flex-1 flex-col gap-1">
        <p className="font-medium">{message}</p>
        {suggestion && <p className="text-xs opacity-80">{suggestion}</p>}
      </div>
    </div>
  );
}

export { messageVariants };
