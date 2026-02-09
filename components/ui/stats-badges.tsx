import { Badge, type BadgeProps } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatItem {
  label: string;
  value: number;
  variant?: BadgeProps['variant'];
  className?: string;
}

interface StatsBadgesProps {
  stats: StatItem[];
  hideZero?: boolean;
  className?: string;
}

export function StatsBadges({ stats, hideZero = true, className }: StatsBadgesProps) {
  const visibleStats = hideZero ? stats.filter((stat) => stat.value > 0) : stats;

  if (visibleStats.length === 0) return null;

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {visibleStats.map((stat, index) => (
        <Badge key={index} variant={stat.variant || 'secondary'} className={stat.className}>
          {stat.value} {stat.label}
        </Badge>
      ))}
    </div>
  );
}

// Preset for player stats
interface PlayerStatsProps {
  correct: number;
  wrong: number;
  missing: number;
  className?: string;
}

export function PlayerStatsBadges({ correct, wrong, missing, className }: PlayerStatsProps) {
  return (
    <StatsBadges
      stats={[
        {
          label: 'correct',
          value: correct,
          variant: 'default',
          className: 'bg-green-600 hover:bg-green-600',
        },
        {
          label: 'wrong',
          value: wrong,
          variant: 'destructive',
          className: 'hover:bg-destructive',
        },
        {
          label: 'missing',
          value: missing,
          variant: 'secondary',
          className: 'hover:bg-secondary',
        },
      ]}
      hideZero
      className={className}
    />
  );
}
