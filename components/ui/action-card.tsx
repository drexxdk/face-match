import { type IconType } from 'react-icons';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button, type ButtonProps, buttonVariants } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Divider } from '@/components/ui/divider';
import { cn } from '@/lib/utils';

interface ActionItem extends Omit<ButtonProps, 'children'> {
  label: string;
  icon?: IconType;
  onClick?: () => void;
  href?: string;
  loading?: boolean;
}

interface ActionGroup {
  label?: string;
  actions: ActionItem[];
}

interface ActionCardProps {
  title?: string;
  description?: string;
  actions?: ActionItem[];
  groups?: ActionGroup[];
  layout?: 'flex' | 'grid';
  columns?: 1 | 2 | 3;
  variant?: 'default' | 'compact' | 'flush';
  className?: string;
}

export function ActionCard({
  title,
  description,
  actions,
  groups,
  layout = 'flex',
  columns = 2,
  variant = 'compact',
  className,
}: ActionCardProps) {
  const hasHeader = title || description;
  const contentItems = groups || (actions ? [{ actions }] : []);

  return (
    <Card variant={variant} className={className}>
      {hasHeader && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent className={cn(hasHeader ? 'pt-6' : '')}>
        <div className="flex flex-col gap-6">
          {contentItems.map((group, groupIndex) => (
            <div key={groupIndex}>
              {group.label && (
                <>
                  {groupIndex > 0 && (
                    <div className="mb-6">
                      <Divider />
                    </div>
                  )}
                  <h3 className="text-muted-foreground mb-3 text-sm font-semibold tracking-wide uppercase">
                    {group.label}
                  </h3>
                </>
              )}
              <div
                className={cn('gap-3', {
                  'flex flex-wrap': layout === 'flex',
                  grid: layout === 'grid',
                  'grid-cols-1': layout === 'grid' && columns === 1,
                  'grid-cols-2': layout === 'grid' && columns === 2,
                  'grid-cols-3': layout === 'grid' && columns === 3,
                })}
              >
                {group.actions.map((action, actionIndex) => {
                  const { label, icon, onClick, href, loading, className: actionClassName, ...buttonProps } = action;
                  const buttonClass = cn(
                    {
                      'flex-1': layout === 'flex',
                      'w-full': layout === 'grid',
                    },
                    actionClassName,
                  );

                  const buttonContent = (
                    <>
                      {icon && <Icon icon={icon} size="sm" />}
                      {label}
                    </>
                  );

                  if (href) {
                    // Use a regular link with button styling
                    return (
                      <a
                        key={actionIndex}
                        href={href}
                        className={cn(buttonVariants({ ...buttonProps }), buttonClass, 'gap-2')}
                      >
                        {buttonContent}
                      </a>
                    );
                  }

                  return (
                    <Button
                      key={actionIndex}
                      onClick={onClick}
                      loading={loading}
                      className={cn(buttonClass, 'gap-2')}
                      {...buttonProps}
                    >
                      {buttonContent}
                    </Button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Simpler variant without card wrapper
export function ActionGroup({
  actions,
  layout = 'flex',
  columns = 2,
  className,
}: Pick<ActionCardProps, 'actions' | 'layout' | 'columns' | 'className'>) {
  if (!actions || actions.length === 0) return null;

  return (
    <div
      className={cn(
        'gap-3',
        {
          'flex flex-wrap': layout === 'flex',
          grid: layout === 'grid',
          'grid-cols-1': layout === 'grid' && columns === 1,
          'grid-cols-2': layout === 'grid' && columns === 2,
          'grid-cols-3': layout === 'grid' && columns === 3,
        },
        className,
      )}
    >
      {actions.map((action, index) => {
        const { label, icon, onClick, href, loading, className: actionClassName, ...buttonProps } = action;
        const buttonClass = cn(
          {
            'flex-1': layout === 'flex',
            'w-full': layout === 'grid',
          },
          actionClassName,
        );

        const buttonContent = (
          <>
            {icon && <Icon icon={icon} size="sm" />}
            {label}
          </>
        );

        if (href) {
          // Use a regular link with button styling
          return (
            <a key={index} href={href} className={cn(buttonVariants({ ...buttonProps }), buttonClass, 'gap-2')}>
              {buttonContent}
            </a>
          );
        }

        return (
          <Button key={index} onClick={onClick} loading={loading} className={cn(buttonClass, 'gap-2')} {...buttonProps}>
            {buttonContent}
          </Button>
        );
      })}
    </div>
  );
}
