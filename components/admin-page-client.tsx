'use client';

import { useEffect, useState, memo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaUserGroup, FaRightToBracket, FaFolder, FaPlus, FaGear } from 'react-icons/fa6';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { PageHero } from '@/components/ui/page-hero';
import { PageContainer } from '@/components/ui/page-container';
import { InfoListCard } from '@/components/ui/section-card';
import { LoadingLink } from '@/components/ui/loading-link';
import { EmptyState } from '@/components/ui/empty-state';
import { useLoading } from '@/lib/loading-context';
import { GroupModal } from '@/components/group-modal';
import { ActiveGamesModal } from '@/components/active-games-modal';

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
  const [activeGamesModalGroup, setActiveGamesModalGroup] = useState<GroupWithGames | null>(null);

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
    // Modal handles navigation directly, just refresh the page data
    router.refresh();
  };

  const handleCreateModalChange = (open: boolean) => {
    setShowCreateModal(open);
    if (!open) {
      router.push('/admin');
    }
  };

  return (
    <PageContainer spacing="spacious">
      <PageHero
        icon={FaUserGroup}
        iconSize="2xl"
        title="Welcome to Face Match!"
        titleClassName="from-primary bg-linear-to-r to-purple-600 bg-clip-text text-transparent"
        description="A social icebreaker game that helps people learn about each other. Create groups for your team, classroom, or event and help everyone connect!"
        actions={
          <>
            <Button onClick={() => setShowCreateModal(true)} size="lg" className="gap-2">
              <Icon icon={FaPlus} size="md" />
              Create Group
            </Button>
            <LoadingLink href="/game/join" className={buttonVariants({ size: 'lg', className: 'gap-2' })}>
              <Icon icon={FaRightToBracket} size="md" />
              Join Game
            </LoadingLink>
          </>
        }
      />

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
              <p className="text-muted-foreground text-sm">
                Create groups of people, then start game sessions for players to join
              </p>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => {
              const peopleCount = group.group_people?.at(0)?.count ?? 0;
              const activeGamesCount = group.game_sessions.length;
              return (
                <Card key={group.id} variant="compact" className="flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Icon icon={FaFolder} size="md" color="primary" />
                      <CardTitle className="text-lg">{group.name}</CardTitle>
                      <Badge variant="secondary" className="ml-auto gap-1">
                        <Icon icon={FaUserGroup} size="xs" />
                        {peopleCount}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    <div className="flex gap-2">
                      <LoadingLink
                        href={`/admin/${group.id}`}
                        className={buttonVariants({ variant: 'outline', size: 'sm', className: 'flex-1 gap-2' })}
                      >
                        <Icon icon={FaGear} size="xs" />
                        Manage Group
                      </LoadingLink>
                      {activeGamesCount > 0 ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          className="flex-1"
                          onClick={() => setActiveGamesModalGroup(group)}
                        >
                          Active Games ({activeGamesCount})
                        </Button>
                      ) : (
                        <Button variant="secondary" size="sm" disabled className="flex-1">
                          No Games Running
                        </Button>
                      )}
                    </div>
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

      {activeGamesModalGroup && (
        <ActiveGamesModal
          open={!!activeGamesModalGroup}
          onOpenChange={(open) => !open && setActiveGamesModalGroup(null)}
          groupId={activeGamesModalGroup.id}
          groupName={activeGamesModalGroup.name}
          gameSessions={activeGamesModalGroup.game_sessions}
        />
      )}
    </PageContainer>
  );
});
