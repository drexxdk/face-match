'use client';

import * as React from 'react';
import { Card, CardContent } from './card';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  animated?: boolean;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <Card className={cn('border-dashed', className)}>
      <CardContent className="flex flex-col items-center justify-center gap-4 py-12">
        {icon && (
          <div className="bg-muted text-muted-foreground flex size-16 items-center justify-center rounded-full">
            {icon}
          </div>
        )}
        <div className="space-y-2 text-center">
          <h3 className="text-lg font-semibold">{title}</h3>
          {description && <p className="text-muted-foreground max-w-sm text-sm">{description}</p>}
        </div>
        {action && <div className="pt-2">{action}</div>}
      </CardContent>
    </Card>
  );
}
