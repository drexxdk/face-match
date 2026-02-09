'use client';

import { useEffect, useState, memo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  FaUserGroup,
  FaRightToBracket,
  FaFolder,
  FaUser,
  FaImage,
  FaArrowUpRightFromSquare,
  FaPlus,
  FaGear,
} from 'react-icons/fa6';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { InfoListCard } from '@/components/ui/section-card';
import { LoadingLink } from '@/components/ui/loading-link';
import { EmptyState } from '@/components/ui/empty-state';
import { useLoading } from '@/lib/loading-context';
import { GroupModal } from '@/components/group-modal';

interface GameSession {
  id: string;
  game_code: string | null;
  game_type: 'guess_name' | 'guess_face' | 'guess_image';
  time_limit_seconds: number | null;
  options_count: number | null;
  total_questions: number | null;
  started_at: string | null;
  status: string | null;
}

interface GroupWithGames {
  id: string;
  name: string;
  created_at: string | null;
  group_people?: { count: number }[];
  game_sessions: GameSession[];
}

interface AdminPageClientProps {
  groups: GroupWithGames[];
}

export const AdminPageClient = memo(function AdminPageClient({ groups }: AdminPageClientProps) {
  const { setLoading } = useLoading();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Check for create query param
  useEffect(() => {
    const create = searchParams.get('create');
    if (create === 'true') {
      setShowCreateModal(true);
    }
  }, [searchParams]);

  // Reset loading state when page mounts
  useEffect(() => {
    setLoading(false);
  }, [setLoading]);

  const handleGroupCreated = () => {
    router.push('/admin');
    router.refresh();
  };

  const handleCreateModalChange = (open: boolean) => {
    setShowCreateModal(open);
    if (!open) {
      router.push('/admin');
    }
  };

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
                Welcome to Face Match!
              </h1>
              <p className="text-muted-foreground text-lg">
                A social icebreaker game that helps people learn about each other. Create groups for your team,
                classroom, or event and help everyone connect!
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => setShowCreateModal(true)} size="lg" className="gap-2">
                <Icon icon={FaPlus} size="md" />
                Create Group
              </Button>
              <LoadingLink href="/game/join" className={buttonVariants({ size: 'lg', className: 'gap-2' })}>
                <Icon icon={FaRightToBracket} size="md" />
                Join Game
              </LoadingLink>
            </div>
          </div>
        </div>
      </Card>

      {/* Groups Section */}
      {!groups || groups.length === 0 ? (
        <EmptyState
          icon={<Icon icon={FaUserGroup} size="xl" />}
          title="No groups yet"
          description="Create your first group to help people get to know each other through an icebreaker game"
          action={
            <Button onClick={() => setShowCreateModal(true)} size="lg">
              Create Your First Group
            </Button>
          }
        />
      ) : (
        <div>
          <div className="mb-6 flex items-center gap-3">
            <div className="bg-primary/20 flex size-10 items-center justify-center rounded-lg">
              <Icon icon={FaFolder} size="lg" color="primary" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold">Your Groups</h2>
              <p className="text-muted-foreground text-sm">Manage your groups and active game sessions</p>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => {
              const peopleCount = group.group_people?.at(0)?.count ?? 0;
              const activeGamesCount = group.game_sessions.length;
              return (
                <Card key={group.id} variant="compact" className="flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Icon icon={FaFolder} size="md" color="primary" />
                        <CardTitle className="text-lg">{group.name}</CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="gap-1">
                          <Icon icon={FaUserGroup} size="xs" />
                          {peopleCount}
                        </Badge>
                        <LoadingLink
                          href={`/admin/groups/${group.id}`}
                          className={buttonVariants({ variant: 'outline', size: 'sm', className: 'shrink-0 gap-2' })}
                        >
                          <Icon icon={FaGear} size="xs" />
                          Manage
                        </LoadingLink>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    {activeGamesCount > 0 ? (
                      group.game_sessions.map((session) => (
                        <div
                          key={session.id}
                          className="bg-primary/5 border-primary/10 flex flex-col gap-3 rounded-lg border p-3"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {session.game_type === 'guess_name' ? (
                                <Icon icon={FaUser} size="sm" color="primary" />
                              ) : (
                                <Icon icon={FaImage} size="sm" color="primary" />
                              )}
                              <span className="text-sm font-medium">
                                {session.game_type === 'guess_name' ? 'Name' : 'Face'}
                              </span>
                            </div>
                            <Badge className="font-mono text-xs">{session.game_code || 'N/A'}</Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <div className="flex flex-col gap-0.5">
                              <p className="text-muted-foreground text-xs">Timer</p>
                              <p className="text-sm font-semibold">{session.time_limit_seconds || 30}s</p>
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <p className="text-muted-foreground text-xs">Options</p>
                              <p className="text-sm font-semibold">{session.options_count || 4}</p>
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <p className="text-muted-foreground text-xs">Questions</p>
                              <p className="text-sm font-semibold">{session.total_questions || 10}</p>
                            </div>
                          </div>
                          <LoadingLink
                            href={`/admin/groups/${group.id}/host/${session.id}/play`}
                            className={buttonVariants({ size: 'sm', className: 'w-full gap-2' })}
                          >
                            <Icon icon={FaArrowUpRightFromSquare} size="xs" />
                            Open Game
                          </LoadingLink>
                        </div>
                      ))
                    ) : (
                      <div className="py-4 text-center">
                        <p className="text-muted-foreground text-sm">No active games</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
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

      <GroupModal open={showCreateModal} onOpenChange={handleCreateModalChange} onSuccess={handleGroupCreated} />
    </div>
  );
});
