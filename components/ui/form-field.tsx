import { type ReactNode } from 'react';
import { Label } from '@/components/ui/label';
import { ErrorMessage } from '@/components/ui/error-message';
import { cn } from '@/lib/utils';

interface FormFieldProps {
  label?: string;
  error?: string;
  required?: boolean;
  description?: string;
  children: ReactNode;
  className?: string;
  labelClassName?: string;
  htmlFor?: string;
}

export function FormField({
  label,
  error,
  required,
  description,
  children,
  className,
  labelClassName,
  htmlFor,
}: FormFieldProps) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {label && (
        <Label htmlFor={htmlFor} className={labelClassName}>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      {description && <p className="text-muted-foreground text-sm">{description}</p>}
      {children}
      {error && <ErrorMessage message={error} size="sm" />}
    </div>
  );
}

// Inline variant for checkboxes/radios
interface InlineFormFieldProps {
  label: string;
  error?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function InlineFormField({ label, error, description, children, className }: InlineFormFieldProps) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-center gap-2">
        {children}
        <Label className="cursor-pointer">{label}</Label>
      </div>
      {description && <p className="text-muted-foreground text-sm">{description}</p>}
      {error && <ErrorMessage message={error} size="sm" />}
    </div>
  );
}
