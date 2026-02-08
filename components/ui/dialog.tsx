'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from './button';

interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

interface DialogContentProps {
  children: React.ReactNode;
  className?: string;
}

interface DialogHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface DialogFooterProps {
  children: React.ReactNode;
  className?: string;
}

interface DialogTitleProps {
  children: React.ReactNode;
  className?: string;
}

interface DialogDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

const DialogContext = React.createContext<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
}>({
  open: false,
  onOpenChange: () => {},
});

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);

  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setIsOpen = isControlled ? onOpenChange || (() => {}) : setInternalOpen;

  return <DialogContext.Provider value={{ open: isOpen, onOpenChange: setIsOpen }}>{children}</DialogContext.Provider>;
}

export function DialogTrigger({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) {
  const { onOpenChange } = React.useContext(DialogContext);

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: (e: React.MouseEvent) => {
        const childProps = children.props as {
          onClick?: (e: React.MouseEvent) => void;
        };
        childProps.onClick?.(e);
        onOpenChange(true);
      },
    } as React.HTMLAttributes<HTMLElement>);
  }

  return (
    <button onClick={() => onOpenChange(true)} type="button">
      {children}
    </button>
  );
}

export function DialogContent({ children, className }: DialogContentProps) {
  const { open, onOpenChange } = React.useContext(DialogContext);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={() => onOpenChange(false)}
    >
      <div
        className={cn(
          'bg-card border-border relative flex w-full max-w-lg flex-col gap-4 rounded-xl border p-6 shadow-2xl',
          'animate-in fade-in-0 zoom-in-95 duration-200',
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export function DialogHeader({ children, className }: DialogHeaderProps) {
  return <div className={cn('flex flex-col gap-2 text-center sm:text-left', className)}>{children}</div>;
}

export function DialogFooter({ children, className }: DialogFooterProps) {
  return (
    <div className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:space-x-2', className)}>
      {children}
    </div>
  );
}

export function DialogTitle({ children, className }: DialogTitleProps) {
  return <h2 className={cn('text-2xl leading-none font-bold tracking-tight', className)}>{children}</h2>;
}

export function DialogDescription({ children, className }: DialogDescriptionProps) {
  return <p className={cn('text-muted-foreground text-sm', className)}>{children}</p>;
}

// Confirmation Dialog helper
interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  variant?: 'destructive' | 'default';
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'destructive',
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {cancelText}
          </Button>
          <Button
            variant={variant}
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
