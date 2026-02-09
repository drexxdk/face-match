import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { type IconType } from 'react-icons';
import { Icon } from '@/components/ui/icon';

interface SettingsItem {
  label: string;
  value: ReactNode;
  icon?: IconType;
  valueClassName?: string;
  labelClassName?: string;
  className?: string;
}

interface SettingsGridProps {
  items: SettingsItem[];
  columns?: 2 | 3 | 4;
  className?: string;
}

export function SettingsGrid({ items, columns = 4, className }: SettingsGridProps) {
  return (
    <div
      className={cn(
        'grid gap-4 text-sm',
        {
          'grid-cols-2': columns === 2,
          'grid-cols-2 md:grid-cols-3': columns === 3,
          'grid-cols-2 md:grid-cols-4': columns === 4,
        },
        className,
      )}
    >
      {items.map((item, index) => (
        <div key={index} className={cn('bg-muted flex flex-col gap-0.5 rounded p-3', item.className)}>
          <p className={cn('text-muted-foreground flex items-center gap-1.5', item.labelClassName)}>
            {item.icon && <Icon icon={item.icon} size="xs" />}
            {item.label}
          </p>
          <p className={cn('font-semibold', item.valueClassName)}>{item.value}</p>
        </div>
      ))}
    </div>
  );
}

// Variant for inline settings (not in a card)
interface InlineSettingsProps {
  items: SettingsItem[];
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export function InlineSettings({ items, orientation = 'horizontal', className }: InlineSettingsProps) {
  return (
    <div
      className={cn(
        'flex gap-4',
        {
          'flex-row flex-wrap': orientation === 'horizontal',
          'flex-col': orientation === 'vertical',
        },
        className,
      )}
    >
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          {item.icon && <Icon icon={item.icon} size="sm" color="primary" />}
          <span className="text-muted-foreground text-sm">{item.label}:</span>
          <span className={cn('text-sm font-semibold', item.valueClassName)}>{item.value}</span>
        </div>
      ))}
    </div>
  );
}
