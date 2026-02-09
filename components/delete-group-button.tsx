'use client';

import { useState } from 'react';
import { FaTrash } from 'react-icons/fa6';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { ConfirmDialog } from '@/components/ui/dialog';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';
import { logError, getErrorMessage } from '@/lib/logger';
import { useNavigate } from '@/lib/hooks/use-navigate';

export function DeleteGroupButton({ groupId }: { groupId: string }) {
  const { push, refresh } = useNavigate();
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDeleteGroup = async () => {
    setDeleting(true);
    try {
      const supabase = createClient();

      // Get all people in this group through the junction table
      const { data: groupPeople } = await supabase
        .from('group_people')
        .select('person_id, people(image_url)')
        .eq('group_id', groupId);

      // For each person, check if they're in other groups
      const peopleToDelete: string[] = [];
      const imagesToDelete: string[] = [];

      if (groupPeople && groupPeople.length > 0) {
        for (const gp of groupPeople) {
          // Check if this person is in any other groups
          const { data: otherGroups, error } = await supabase
            .from('group_people')
            .select('id')
            .eq('person_id', gp.person_id)
            .neq('group_id', groupId)
            .limit(1);

          if (error) {
            logError('Error checking other groups:', error);
            continue;
          }

          // If person is not in any other groups, mark for deletion
          if (!otherGroups || otherGroups.length === 0) {
            peopleToDelete.push(gp.person_id);
            const personData = gp.people as { image_url?: string } | null;
            if (personData?.image_url) {
              const urlParts = personData.image_url.split('/person-images/');
              if (urlParts.length > 1) {
                imagesToDelete.push(decodeURIComponent(urlParts[1]));
              }
            }
          }
        }
      }

      // Delete images for people not in other groups
      if (imagesToDelete.length > 0) {
        try {
          await supabase.storage.from('person-images').remove(imagesToDelete);
        } catch (err) {
          logError('Failed to delete images:', err);
          // Continue with deletion even if image deletion fails
        }
      }

      // Delete junction table records for this group
      await supabase.from('group_people').delete().eq('group_id', groupId);

      // Delete people not in other groups
      if (peopleToDelete.length > 0) {
        await supabase.from('people').delete().in('id', peopleToDelete);
      }

      // Delete all active game sessions for this group
      await supabase.from('game_sessions').delete().eq('group_id', groupId);

      // Delete the group itself
      const { error } = await supabase.from('groups').delete().eq('id', groupId);

      if (error) throw error;

      toast.success('Group deleted successfully');
      push('/admin');
      refresh();
    } catch (err: unknown) {
      toast.error('Error deleting group: ' + getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Button
        variant="destructive"
        onClick={() => setShowConfirm(true)}
        disabled={deleting}
        loading={deleting}
        loadingText="Deleting..."
        className="w-full gap-2"
      >
        <Icon icon={FaTrash} size="sm" />
        Delete Group
      </Button>
      <ConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title="Delete Group"
        description="Are you sure you want to delete this group? This will also delete all people and active games in this group. This action cannot be undone."
        onConfirm={handleDeleteGroup}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </>
  );
}
