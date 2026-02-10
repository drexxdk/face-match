import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SectionCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
}

/**
 * Reusable card component with consistent header spacing
 * Use for informational sections with title and content
 */
export function SectionCard({ title, description, children, className, actions }: SectionCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <div>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {actions && <div className="mt-4 grid grid-cols-2 gap-2">{actions}</div>}
      </CardHeader>
      <CardContent className="pt-6">{children}</CardContent>
    </Card>
  );
}

interface InfoListCardProps {
  title: string;
  description?: string;
  items: string[];
  ordered?: boolean;
  className?: string;
}

/**
 * Card component specifically for displaying lists
 * Enforces consistent list styling
 */
export function InfoListCard({ title, description, items, ordered = false, className }: InfoListCardProps) {
  const ListComponent = ordered ? 'ol' : 'ul';
  const listClass = ordered ? 'list-decimal' : 'list-disc';

  return (
    <SectionCard title={title} description={description} className={className}>
      <ListComponent className={cn(listClass, 'text-muted-foreground list-inside space-y-2 text-sm')}>
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ListComponent>
    </SectionCard>
  );
}
