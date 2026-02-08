'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { FaPencil, FaUserGroup, FaGear, FaPlay, FaTriangleExclamation } from 'react-icons/fa6';
import { PeopleList } from '@/components/people-list';
import { AddPersonForm } from '@/components/add-person-form';
import { BulkUploadPeople } from '@/components/bulk-upload-people';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { SectionCard } from '@/components/ui/section-card';
import { buttonVariants } from '@/components/ui/button';
import { Button } from '@/components/ui/button';
import { GroupSettings } from '@/components/group-settings';
import { DeleteGroupButton } from '@/components/delete-group-button';
import { DuplicateGroupButton } from '@/components/duplicate-group-button';
import type { Group, Person } from '@/lib/schemas';
import { logger } from '@/lib/logger';
import { useMultiRealtimeSubscription, getPayloadNew, getPayloadOld } from '@/lib/hooks/use-realtime';
import { useLoading } from '@/lib/loading-context';
import { LoadingLink } from '@/components/ui/loading-link';
import { createClient } from '@/lib/supabase/client';

export function GroupDetailClient({
  groupData,
  initialPeople,
  groupId,
}: {
  groupData: Group;
  initialPeople: Person[];
  groupId: string;
}) {
  const { setLoading } = useLoading();
  const [updatedGroupData, setUpdatedGroupData] = useState<Group>(groupData);
  const [people, setPeople] = useState<Person[]>(initialPeople);
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [uploadMode, setUploadMode] = useState<'single' | 'bulk'>('single');

  // Reset loading state when component mounts
  useEffect(() => {
    setLoading(false);
  }, [setLoading]);

  // Realtime event handlers
  const handleDelete = useCallback((payload: Parameters<typeof getPayloadOld<Person>>[0]) => {
    const oldData = getPayloadOld<Person>(payload);
    if (!oldData?.id) return;
    logger.log('DELETE event received for person:', oldData.id);
    setPeople((prev) => prev.filter((p) => p.id !== oldData.id));
  }, []);

  const handleInsert = useCallback((payload: Parameters<typeof getPayloadNew<Person>>[0]) => {
    const newPerson = getPayloadNew<Person>(payload);
    if (!newPerson?.id) return;
    logger.log('INSERT event received:', newPerson);
    setPeople((prev) => {
      // Prevent duplicates
      if (prev.some((p) => p.id === newPerson.id)) {
        return prev;
      }
      return [...prev, newPerson].sort((a, b) => a.first_name.localeCompare(b.first_name));
    });
  }, []);

  const handleUpdate = useCallback((payload: Parameters<typeof getPayloadNew<Person>>[0]) => {
    const updatedPerson = getPayloadNew<Person>(payload);
    if (!updatedPerson?.id) return;
    logger.log('UPDATE event received:', updatedPerson);
    setPeople((prev) =>
      prev
        .map((p) => (p.id === updatedPerson.id ? updatedPerson : p))
        .sort((a, b) => a.first_name.localeCompare(b.first_name)),
    );
  }, []);

  // Watch for changes to people in this group
  const realtimeConfig = useMemo(
    () => ({
      channelName: `people:${groupId}`,
      subscriptions: [
        {
          table: 'people',
          event: 'DELETE' as const,
          onEvent: handleDelete,
        },
        {
          table: 'people',
          event: 'INSERT' as const,
          filter: `group_id=eq.${groupId}`,
          onEvent: handleInsert,
        },
        {
          table: 'people',
          event: 'UPDATE' as const,
          filter: `group_id=eq.${groupId}`,
          onEvent: handleUpdate,
        },
      ],
    }),
    [groupId, handleDelete, handleInsert, handleUpdate],
  );

  useMultiRealtimeSubscription<Person>(realtimeConfig);

  // Refresh people list after bulk upload to ensure consistency with database
  const handleBulkUploadComplete = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase.from('people').select('*').eq('group_id', groupId).order('first_name');

    if (!error && data) {
      setPeople(data);
    }
  }, [groupId]);

  const hasEnoughPeople = people.length >= (updatedGroupData.options_count ?? 4);

  const handleGroupUpdate = (updated: Pick<Group, 'name' | 'time_limit_seconds' | 'options_count'>) => {
    setUpdatedGroupData((prev) => ({
      ...prev,
      ...updated,
    }));
  };

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <Card variant="flush">
        <div className="relative overflow-hidden">
          <div className="from-primary/10 absolute inset-0 bg-linear-to-br via-purple-500/10 to-pink-500/10" />
          <div className="relative flex items-start justify-between gap-6 p-8">
            <div className="flex items-start gap-6">
              <div className="from-primary flex size-16 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br to-purple-600 shadow-lg">
                <Icon icon={FaUserGroup} size="xl" color="white" />
              </div>
              <div>
                <h1 className="mb-2 text-3xl font-bold">{updatedGroupData.name}</h1>
                <div className="flex items-center gap-2">
                  <Icon icon={FaUserGroup} size="md" color="primary" />
                  <p className="text-muted-foreground text-lg">
                    <span className="text-foreground font-semibold">{people.length}</span> people in this group
                  </p>
                </div>
              </div>
            </div>
            <Button
              onClick={() => setIsEditingSettings(true)}
              variant="outline"
              size="icon"
              aria-label="Edit group settings"
              className="shrink-0"
            >
              <Icon icon={FaPencil} size="sm" />
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-6">
          {/* Group Settings */}
          <Card variant="compact">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Icon icon={FaGear} size="md" color="primary" />
                <CardTitle>Game Settings</CardTitle>
              </div>
              <CardDescription>Configure how games will be played in this group</CardDescription>
            </CardHeader>
            <CardContent>
              <GroupSettings
                groupId={groupId}
                initialGroup={updatedGroupData}
                peopleCount={people.length}
                onUpdate={handleGroupUpdate}
                isEditing={isEditingSettings}
                onEditChange={setIsEditingSettings}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <Card variant="compact">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Icon icon={FaPlay} size="md" color="primary" />
                <CardTitle>Actions</CardTitle>
              </div>
              <CardDescription>Start a game or manage this group</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <LoadingLink
                href={`/admin/groups/${updatedGroupData.id}/host`}
                className={buttonVariants({
                  className: `w-full gap-2 ${!hasEnoughPeople ? 'pointer-events-none opacity-50' : ''}`,
                })}
              >
                <Icon icon={FaPlay} size="md" />
                Start Game
              </LoadingLink>
              {!hasEnoughPeople && (
                <div className="bg-destructive/10 border-destructive/20 flex items-start gap-2 rounded-lg border p-3">
                  <Icon icon={FaTriangleExclamation} size="md" color="error" className="shrink-0" />
                  <p className="text-destructive text-sm">
                    You need at least {updatedGroupData.options_count} people to start a game
                  </p>
                </div>
              )}
              <DuplicateGroupButton groupId={groupId} />
              <DeleteGroupButton groupId={groupId} />
            </CardContent>
          </Card>

          {/* Add Person */}
          <SectionCard title="Add Person" description="Add new people to this group">
            <div className="flex flex-col gap-4">
              <div className="flex gap-2">
                <Button
                  variant={uploadMode === 'single' ? 'default' : 'outline'}
                  onClick={() => setUploadMode('single')}
                  className="flex-1"
                >
                  Single Person
                </Button>
                <Button
                  variant={uploadMode === 'bulk' ? 'default' : 'outline'}
                  onClick={() => setUploadMode('bulk')}
                  className="flex-1"
                >
                  Bulk Upload (CSV)
                </Button>
              </div>
              {uploadMode === 'single' ? (
                <AddPersonForm groupId={groupId} />
              ) : (
                <BulkUploadPeople groupId={groupId} onComplete={handleBulkUploadComplete} />
              )}
            </div>
          </SectionCard>
        </div>

        <div>
          <SectionCard title="People" description="Manage people in this group">
            <PeopleList people={people} />
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
