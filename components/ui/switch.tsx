'use client';

import { Switch as HeadlessSwitch } from '@headlessui/react';
import { cn } from '@/lib/utils';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export function Switch({ checked, onChange, disabled = false, className, id }: SwitchProps) {
  return (
    <HeadlessSwitch
      id={id}
      checked={checked}
      onChange={onChange}
      disabled={disabled}
      className={cn(
        'group focus:ring-primary relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none',
        checked ? 'bg-primary' : 'bg-muted',
        disabled && 'cursor-not-allowed opacity-50',
        className,
      )}
    >
      <span
        className={cn(
          'inline-block size-4 transform rounded-full bg-white shadow-lg transition-transform',
          checked ? 'translate-x-6' : 'translate-x-1',
        )}
      />
    </HeadlessSwitch>
  );
}
