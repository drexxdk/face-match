'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  FaPencil,
  FaUserGroup,
  FaGear,
  FaPlay,
  FaTriangleExclamation,
  FaShareNodes,
  FaCopy,
  FaPlus,
  FaFileArrowUp,
} from 'react-icons/fa6';
import { PeopleList } from '@/components/people-list';
import { PersonModal } from '@/components/person-modal';
import { BulkUploadPeople } from '@/components/bulk-upload-people';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { SectionCard } from '@/components/ui/section-card';
import { buttonVariants } from '@/components/ui/button';
import { Button } from '@/components/ui/button';
import { GroupSettings } from '@/components/group-settings';
import { DeleteGroupButton } from '@/components/delete-group-button';
import { DuplicateGroupButton } from '@/components/duplicate-group-button';
import { GroupQRCode } from '@/components/group-qr-code';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Group, Person } from '@/lib/schemas';
import { logger, logError } from '@/lib/logger';
import { useMultiRealtimeSubscription, getPayloadNew, getPayloadOld } from '@/lib/hooks/use-realtime';
import { useLoading } from '@/lib/loading-context';
import { LoadingLink } from '@/components/ui/loading-link';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

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
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareCode, setShareCode] = useState<string | null>(null);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [showPersonModal, setShowPersonModal] = useState(false);
  const [editPerson, setEditPerson] = useState<Person | null>(null);
  const [showBulkUpload, setShowBulkUpload] = useState(false);

  // Reset loading state when component mounts
  useEffect(() => {
    setLoading(false);
  }, [setLoading]);

  // Realtime event handlers
  const handleUpdate = useCallback((payload: Parameters<typeof getPayloadNew<Person>>[0]) => {
    const updatedPerson = getPayloadNew<Person>(payload);
    if (!updatedPerson?.id) return;
    logger.log('UPDATE event received:', updatedPerson);
    setPeople((prev) =>
      prev.map((p) => (p.id === updatedPerson.id ? updatedPerson : p)).sort((a, b) => a.name.localeCompare(b.name)),
    );
  }, []);

  // Handle group_people junction table changes
  const handleGroupPeopleInsert = useCallback(
    async (payload: Parameters<typeof getPayloadNew<{ person_id: string }>>[0]) => {
      const record = getPayloadNew<{ person_id: string }>(payload);
      if (!record?.person_id) return;
      logger.log('Person added to group:', record.person_id);

      // Fetch the person details
      const supabase = createClient();
      const { data: person } = await supabase.from('people').select('*').eq('id', record.person_id).single();

      if (person) {
        setPeople((prev) => {
          // Check if person already exists to prevent duplicates
          const exists = prev.some((p) => p.id === person.id);
          if (exists) return prev;
          return [...prev, person].sort((a, b) => a.name.localeCompare(b.name));
        });
      }
    },
    [],
  );

  const handleGroupPeopleDelete = useCallback((payload: Parameters<typeof getPayloadOld<{ person_id: string }>>[0]) => {
    const record = getPayloadOld<{ person_id: string }>(payload);
    if (!record?.person_id) return;
    logger.log('Person removed from group:', record.person_id);
    setPeople((prev) => prev.filter((p) => p.id !== record.person_id));
  }, []);

  // Watch for changes to people in this group via junction table
  const realtimeConfig = useMemo(
    () => ({
      channelName: `group-people:${groupId}`,
      subscriptions: [
        {
          table: 'group_people',
          event: 'INSERT' as const,
          filter: `group_id=eq.${groupId}`,
          onEvent: handleGroupPeopleInsert,
        },
        {
          table: 'group_people',
          event: 'DELETE' as const,
          filter: `group_id=eq.${groupId}`,
          onEvent: handleGroupPeopleDelete,
        },
        {
          table: 'people',
          event: 'UPDATE' as const,
          // Person updates affect all groups, so we filter locally
          onEvent: handleUpdate,
        },
      ],
    }),
    [groupId, handleGroupPeopleInsert, handleGroupPeopleDelete, handleUpdate],
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useMultiRealtimeSubscription(realtimeConfig as any);

  // Refresh people list after bulk upload to ensure consistency with database
  const handleBulkUploadComplete = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('people')
      .select('*, group_people!inner(group_id)')
      .eq('group_people.group_id', groupId)
      .order('name');

    if (!error && data) {
      setPeople(data);
    }
    setShowBulkUpload(false);
  }, [groupId]);

  const handleAddPersonClick = () => {
    setEditPerson(null);
    setShowPersonModal(true);
  };

  const handleEditPersonClick = (person: Person) => {
    setEditPerson(person);
    setShowPersonModal(true);
  };

  // Update share URL when share code changes (client-side only to avoid hydration issues)
  useEffect(() => {
    if (shareCode && typeof window !== 'undefined') {
      setShareUrl(`${window.location.origin}/admin/groups/import?code=${shareCode}`);
    }
  }, [shareCode]);

  const hasEnoughPeople = people.length >= (updatedGroupData.options_count ?? 4);

  const handleGroupUpdate = (updated: Pick<Group, 'name' | 'time_limit_seconds' | 'options_count'>) => {
    setUpdatedGroupData((prev) => ({
      ...prev,
      ...updated,
    }));
  };

  const handleShareGroup = async () => {
    try {
      setIsGeneratingCode(true);
      const supabase = createClient();

      // Check if group already has a share code
      if (updatedGroupData.share_code) {
        setShareCode(updatedGroupData.share_code);
        setShowShareDialog(true);
        return;
      }

      // Generate new share code
      const { data, error } = await supabase.rpc('generate_group_share_code', {
        group_id_param: groupId,
      });

      if (error) {
        logError('Failed to generate share code', { error });
        toast.error('Failed to generate share code');
        return;
      }

      setShareCode(data);
      setUpdatedGroupData((prev) => ({ ...prev, share_code: data }));
      setShowShareDialog(true);
      toast.success('Share code generated!');
    } catch (error) {
      logError('Error generating share code', { error });
      toast.error('An unexpected error occurred');
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const copyShareCode = () => {
    if (shareCode) {
      navigator.clipboard.writeText(shareCode);
      toast.success('Share code copied!');
    }
  };

  const copyShareUrl = () => {
    if (shareCode) {
      const url = `${window.location.origin}/admin/groups/import?code=${shareCode}`;
      navigator.clipboard.writeText(url);
      toast.success('Share link copied!');
    }
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
              <Button onClick={handleShareGroup} variant="outline" className="w-full gap-2" disabled={isGeneratingCode}>
                <Icon icon={FaShareNodes} size="md" />
                {isGeneratingCode ? 'Generating...' : 'Share Group'}
              </Button>
              <DuplicateGroupButton groupId={groupId} />
              <DeleteGroupButton groupId={groupId} />
            </CardContent>
          </Card>

          {/* Add Person Actions */}
          <Card variant="compact">
            <CardHeader>
              <CardTitle>Add People</CardTitle>
              <CardDescription>Add people to this group individually or in bulk</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Button onClick={handleAddPersonClick} className="w-full gap-2">
                <Icon icon={FaPlus} size="md" />
                Add Person
              </Button>
              <Button onClick={() => setShowBulkUpload(true)} variant="outline" className="w-full gap-2">
                <Icon icon={FaFileArrowUp} size="md" />
                Bulk Upload (CSV)
              </Button>
            </CardContent>
          </Card>
        </div>

        <div>
          <SectionCard title="People" description="Manage people in this group">
            <PeopleList people={people} onEditClick={handleEditPersonClick} />
          </SectionCard>
        </div>
      </div>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Group</DialogTitle>
            <DialogDescription>
              Share this group with others using a code or QR code. They&apos;ll need to login to import it.
            </DialogDescription>
          </DialogHeader>
          {shareCode && (
            <div className="space-y-4">
              {/* Share Code */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Share Code</label>
                <div className="flex gap-2">
                  <div className="bg-muted flex-1 rounded-lg px-4 py-3 text-center font-mono text-2xl font-bold tracking-wider">
                    {shareCode}
                  </div>
                  <Button onClick={copyShareCode} variant="outline" size="icon" className="shrink-0">
                    <Icon icon={FaCopy} size="md" />
                  </Button>
                </div>
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center gap-2">
                <label className="text-sm font-medium">QR Code</label>
                <div className="rounded-lg border bg-white p-4">
                  <GroupQRCode shareCode={shareCode} />
                </div>
              </div>

              {/* Share URL */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Share Link</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="bg-muted flex-1 rounded-lg px-3 py-2 text-sm"
                  />
                  <Button onClick={copyShareUrl} variant="outline" size="icon" className="shrink-0">
                    <Icon icon={FaCopy} size="md" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Person Modal (Add/Edit) */}
      <PersonModal
        open={showPersonModal}
        onOpenChange={setShowPersonModal}
        groupId={groupId}
        people={people}
        editPerson={editPerson}
      />

      {/* Bulk Upload Modal */}
      <Dialog open={showBulkUpload} onOpenChange={setShowBulkUpload}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bulk Upload People</DialogTitle>
            <DialogDescription>
              Import multiple people at once using a CSV file. Include base64 encoded images or leave them blank to
              upload during review.
            </DialogDescription>
          </DialogHeader>
          <BulkUploadPeople groupId={groupId} people={people} onComplete={handleBulkUploadComplete} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
