'use client';

import { useEffect, memo } from 'react';
import { FaPlus, FaUserGroup, FaPlay, FaGear, FaClock } from 'react-icons/fa6';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { LoadingLink } from '@/components/ui/loading-link';
import { EmptyState } from '@/components/ui/empty-state';
import { StaggeredGrid, StaggeredGridItem } from '@/components/ui/staggered-list';
import { useLoading } from '@/lib/loading-context';

interface Group {
  id: string;
  name: string;
  people?: { count: number }[];
}

interface GroupsListProps {
  groups: Group[] | null;
}

export const GroupsList = memo(function GroupsList({ groups }: GroupsListProps) {
  const { setLoading } = useLoading();

  // Reset loading state when page mounts
  useEffect(() => {
    setLoading(false);
  }, [setLoading]);
  return (
    <>
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">My Groups</h1>
          <p className="text-muted-foreground">
            Create groups for your team, classroom, or event. Help people learn names and faces!
          </p>
        </div>
        <LoadingLink href="/admin/groups/new" className={buttonVariants({ className: 'gap-2' })}>
          <Icon icon={FaPlus} size="sm" />
          Create Group
        </LoadingLink>
      </div>

      {!groups || groups.length === 0 ? (
        <EmptyState
          icon={<Icon icon={FaUserGroup} size="xl" />}
          title="No groups yet"
          description="Create your first group to help people get to know each other through an icebreaker game"
          action={
            <LoadingLink href="/admin/groups/new" className={buttonVariants({ size: 'lg' })}>
              Create Your First Group
            </LoadingLink>
          }
        />
      ) : (
        <StaggeredGrid className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => {
            const peopleCount = group.people?.at(0)?.count ?? 0;
            return (
              <StaggeredGridItem key={group.id}>
                <Card variant="flush" hover className="group flex h-full flex-col overflow-hidden">
                  {/* Visual Header with Gradient */}
                  <div className="from-primary/20 relative h-32 bg-linear-to-br via-purple-500/20 to-pink-500/20">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Icon
                        icon={FaUserGroup}
                        size="4xl"
                        className="text-primary/40 transition-transform group-hover:scale-110"
                      />
                    </div>
                    {/* People Count Badge */}
                    <div className="absolute right-3 bottom-3 flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 shadow-lg backdrop-blur-sm dark:bg-gray-900/90">
                      <Icon icon={FaUserGroup} size="sm" color="primary" />
                      <span className="text-sm font-semibold">{peopleCount}</span>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="flex flex-1 flex-col p-4">
                    <CardHeader className="p-0 pb-4">
                      <CardTitle className="line-clamp-2">{group.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1.5">
                        <FaClock className="h-3.5 w-3.5" />
                        Ready to play
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="mt-auto flex gap-2 p-0">
                      <LoadingLink
                        href={`/admin/groups/${group.id}/host`}
                        className={buttonVariants({ className: 'flex-1 gap-2 group-hover:shadow-md' })}
                      >
                        <Icon icon={FaPlay} size="sm" />
                        Start Game
                      </LoadingLink>
                      <LoadingLink
                        href={`/admin/groups/${group.id}`}
                        className={buttonVariants({
                          variant: 'outline',
                          className: 'flex-1 gap-2',
                        })}
                      >
                        <Icon icon={FaGear} size="sm" />
                        Manage
                      </LoadingLink>
                    </CardContent>
                  </div>
                </Card>
              </StaggeredGridItem>
            );
          })}
        </StaggeredGrid>
      )}
    </>
  );
});
