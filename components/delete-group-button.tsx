'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
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

      // Get all people in this group to delete their images
      const { data: people } = await supabase.from('people').select('image_url').eq('group_id', groupId);

      // Delete all images from storage
      if (people && people.length > 0) {
        for (const person of people) {
          if (person.image_url) {
            try {
              const urlParts = person.image_url.split('/person-images/');
              if (urlParts.length > 1) {
                const filename = decodeURIComponent(urlParts[1]);
                await supabase.storage.from('person-images').remove([filename]);
              }
            } catch (err) {
              logError('Failed to delete image:', err);
              // Continue with deletion even if image deletion fails
            }
          }
        }
      }

      // Delete all active game sessions for this group
      await supabase.from('game_sessions').delete().eq('group_id', groupId);

      // Delete all people in this group
      await supabase.from('people').delete().eq('group_id', groupId);

      // Delete the group itself
      const { error } = await supabase.from('groups').delete().eq('id', groupId);

      if (error) throw error;

      toast.success('Group deleted successfully');
      push('/admin/groups');
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
        className="w-full"
      >
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
