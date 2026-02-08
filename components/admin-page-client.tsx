'use client';

import { useEffect, memo } from 'react';
import {
  FaUserGroup,
  FaRightToBracket,
  FaFolder,
  FaPlay,
  FaUser,
  FaImage,
  FaArrowUpRightFromSquare,
} from 'react-icons/fa6';
import { buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { InfoListCard } from '@/components/ui/section-card';
import { LoadingLink } from '@/components/ui/loading-link';
import { useLoading } from '@/lib/loading-context';
import type { GameSessionWithGroup } from '@/lib/schemas';

interface AdminPageClientProps {
  activeSessions: GameSessionWithGroup[];
}

export const AdminPageClient = memo(function AdminPageClient({ activeSessions }: AdminPageClientProps) {
  const { setLoading } = useLoading();

  // Reset loading state when page mounts
  useEffect(() => {
    setLoading(false);
  }, [setLoading]);

  return (
    <div className="flex w-full flex-1 flex-col gap-12">
      {/* Hero Section with Gradient */}
      <Card variant="flush" className="relative overflow-hidden">
        <div className="from-primary/10 absolute inset-0 bg-linear-to-br via-purple-500/10 to-pink-500/10" />
        <div className="relative flex items-start gap-6 p-8">
          <div className="from-primary flex size-20 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br to-purple-600 shadow-lg">
            <Icon icon={FaUserGroup} size="2xl" color="white" />
          </div>
          <div className="flex grow flex-col gap-4">
            <div>
              <h1 className="from-primary mb-2 bg-linear-to-r to-purple-600 bg-clip-text text-4xl font-bold text-transparent">
                Welcome to Guess Who!
              </h1>
              <p className="text-muted-foreground text-lg">
                A social icebreaker game that helps people learn about each other. Create groups for your team,
                classroom, or event and help everyone connect!
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <LoadingLink href="/game/join" className={buttonVariants({ size: 'lg', className: 'gap-2' })}>
                <Icon icon={FaRightToBracket} size="md" />
                Join Game
              </LoadingLink>
              <LoadingLink
                href="/admin/groups"
                className={buttonVariants({ variant: 'secondary', size: 'lg', className: 'gap-2' })}
              >
                <Icon icon={FaFolder} size="md" />
                My Groups
              </LoadingLink>
            </div>
          </div>
        </div>
      </Card>

      {/* Active Games Section */}
      {activeSessions.length > 0 && (
        <div>
          <div className="mb-6 flex items-center gap-3">
            <div className="bg-primary/20 flex size-10 items-center justify-center rounded-lg">
              <Icon icon={FaPlay} size="lg" color="primary" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold">Your Active Games</h2>
              <p className="text-muted-foreground text-sm">Continue hosting your live game sessions</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {activeSessions.map((session: GameSessionWithGroup) => (
              <Card key={session.id} variant="compact" hover className="group">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {session.game_type === 'guess_name' ? (
                        <Icon icon={FaUser} size="md" color="primary" />
                      ) : (
                        <Icon icon={FaImage} size="md" color="primary" />
                      )}
                      <CardTitle className="text-base">{session.groups?.name || 'Unknown'}</CardTitle>
                    </div>
                    <Badge className="font-mono text-xs">{session.game_code}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-primary/5 border-primary/10 flex flex-col gap-1 rounded-lg border p-2.5">
                      <p className="text-muted-foreground text-xs font-medium">Type</p>
                      <p className="text-sm font-semibold">{session.game_type === 'guess_name' ? 'Name' : 'Face'}</p>
                    </div>
                    <div className="bg-primary/5 border-primary/10 flex flex-col gap-1 rounded-lg border p-2.5">
                      <p className="text-muted-foreground text-xs font-medium">Timer</p>
                      <p className="text-sm font-semibold">{session.time_limit_seconds || 30}s</p>
                    </div>
                    <div className="bg-primary/5 border-primary/10 flex flex-col gap-1 rounded-lg border p-2.5">
                      <p className="text-muted-foreground text-xs font-medium">Options</p>
                      <p className="text-sm font-semibold">{session.options_count || 4}</p>
                    </div>
                    <div className="bg-primary/5 border-primary/10 flex flex-col gap-1 rounded-lg border p-2.5">
                      <p className="text-muted-foreground text-xs font-medium">Questions</p>
                      <p className="text-sm font-semibold">{session.total_questions}</p>
                    </div>
                  </div>

                  <LoadingLink
                    href={`/admin/groups/${session.groups?.id}/host/${session.id}/play`}
                    className={buttonVariants({ className: 'w-full gap-2 group-hover:shadow-lg' })}
                  >
                    <Icon icon={FaArrowUpRightFromSquare} size="sm" />
                    Open Game
                  </LoadingLink>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <InfoListCard
        title="How It Works"
        items={[
          'Create a group and add people with their photos and names',
          'Start a game and choose the mode (guess name or guess face)',
          'Share the game code with players',
          'Players join using the code and compete in real-time',
          'View results and see who knows the group best!',
        ]}
        ordered={true}
        className="md:col-span-2"
      />
    </div>
  );
});
