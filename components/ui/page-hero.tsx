import { type ReactNode } from 'react';
import { type IconType } from 'react-icons';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const heroVariants = cva('absolute inset-0 bg-linear-to-br', {
  variants: {
    gradient: {
      primary: 'from-primary/10 via-purple-500/10 to-pink-500/10',
      purple: 'from-purple-500/10 via-pink-500/10 to-primary/10',
      blue: 'from-blue-500/10 via-primary/10 to-purple-500/10',
    },
  },
  defaultVariants: {
    gradient: 'primary',
  },
});

const iconGradientVariants = cva(
  'flex size-16 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br shadow-lg',
  {
    variants: {
      gradient: {
        primary: 'from-primary to-purple-600',
        purple: 'from-purple-600 to-pink-600',
        blue: 'from-blue-600 to-primary',
      },
    },
    defaultVariants: {
      gradient: 'primary',
    },
  },
);

interface MetadataItem {
  icon: IconType;
  label?: string;
  value: string;
  className?: string;
}

interface PageHeroProps extends VariantProps<typeof heroVariants> {
  icon: IconType;
  iconSize?: 'xl' | '2xl' | '3xl';
  title: string;
  titleClassName?: string;
  description?: string;
  actions?: ReactNode;
  metadata?: MetadataItem[];
  className?: string;
}

export function PageHero({
  icon,
  iconSize = 'xl',
  title,
  titleClassName,
  description,
  actions,
  metadata,
  gradient,
  className,
}: PageHeroProps) {
  return (
    <Card variant="flush" className={cn('relative overflow-hidden', className)}>
      <div className="relative overflow-hidden">
        <div className={heroVariants({ gradient })} />
        <div className="relative flex items-start justify-between gap-6 p-8">
          <div className="flex items-start gap-6">
            <div className={iconGradientVariants({ gradient })}>
              <Icon icon={icon} size={iconSize} color="white" />
            </div>
            <div>
              <h1 className={cn('mb-2 text-3xl font-bold', titleClassName)}>{title}</h1>
              {description && <p className="text-muted-foreground mb-3 text-lg">{description}</p>}
              {metadata && metadata.length > 0 && (
                <div className="flex flex-col gap-2">
                  {metadata.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Icon icon={item.icon} size="md" color="primary" />
                      <p className="text-muted-foreground text-lg">
                        {item.label && <span className="text-muted-foreground mr-1">{item.label}:</span>}
                        <span className={cn('text-foreground font-semibold', item.className)}>{item.value}</span>
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
        </div>
      </div>
    </Card>
  );
}

// Alternative compact hero for smaller pages
export function PageHeroCompact({
  icon,
  title,
  description,
  actions,
  gradient,
  className,
}: Omit<PageHeroProps, 'metadata' | 'iconSize'>) {
  return (
    <Card variant="flush" className={cn('relative overflow-hidden', className)}>
      <div className="relative overflow-hidden">
        <div className={heroVariants({ gradient })} />
        <div className="relative flex items-center justify-between gap-6 p-6">
          <div className="flex items-center gap-4">
            <div className={cn(iconGradientVariants({ gradient }), 'size-12')}>
              <Icon icon={icon} size="lg" color="white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{title}</h1>
              {description && <p className="text-muted-foreground text-sm">{description}</p>}
            </div>
          </div>
          {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
        </div>
      </div>
    </Card>
  );
}
