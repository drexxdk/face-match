'use client';

import * as React from 'react';
import { Card, CardContent } from './card';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  animated?: boolean;
}

export function EmptyState({ icon, title, description, action, className, animated = true }: EmptyStateProps) {
  const Content = animated ? motion.div : 'div';

  return (
    <Card className={cn('border-dashed', className)}>
      <CardContent className="flex flex-col items-center justify-center gap-4 py-12">
        {icon && (
          <Content
            className="bg-muted text-muted-foreground flex size-16 items-center justify-center rounded-full"
            {...(animated && {
              initial: { scale: 0, rotate: -180 },
              animate: { scale: 1, rotate: 0 },
              transition: {
                type: 'spring',
                stiffness: 200,
                damping: 15,
                duration: 0.6,
              },
            })}
          >
            {icon}
          </Content>
        )}
        <Content
          className="space-y-2 text-center"
          {...(animated && {
            initial: { opacity: 0, y: 20 },
            animate: { opacity: 1, y: 0 },
            transition: { delay: 0.2, duration: 0.4 },
          })}
        >
          <h3 className="text-lg font-semibold">{title}</h3>
          {description && <p className="text-muted-foreground max-w-sm text-sm">{description}</p>}
        </Content>
        {action && (
          <Content
            className="pt-2"
            {...(animated && {
              initial: { opacity: 0, scale: 0.8 },
              animate: { opacity: 1, scale: 1 },
              transition: { delay: 0.4, duration: 0.3 },
            })}
          >
            {action}
          </Content>
        )}
      </CardContent>
    </Card>
  );
}
