'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useGroupNameValidation } from '@/lib/hooks/use-group-name-validation';
import { useLoading } from '@/lib/loading-context';
import { getErrorMessage, logError } from '@/lib/logger';
import type { Group } from '@/lib/schemas';
import { sanitizeGroupName, validateLength } from '@/lib/security';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

interface GroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editGroup?: Pick<Group, 'id' | 'name' | 'time_limit_seconds' | 'options_count' | 'enable_timer'> | null;
  onSuccess?: (groupId?: string) => void;
  peopleCount?: number;
}

export function GroupModal({ open, onOpenChange, editGroup, onSuccess, peopleCount = 4 }: GroupModalProps) {
  const router = useRouter();
  const { setLoading } = useLoading();
  const [formData, setFormData] = useState({
    name: editGroup?.name || '',
    time_limit_seconds: editGroup?.time_limit_seconds || 15,
    options_count: editGroup?.options_count || 3,
    enable_timer: editGroup?.enable_timer ?? true,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [userGroups, setUserGroups] = useState<{ id: string; name: string }[]>([]);

  // Fetch user's groups for duplicate validation
  useEffect(() => {
    const fetchUserGroups = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase.from('groups').select('id, name').eq('creator_id', user.id);

      if (!error && data) {
        setUserGroups(data);
      }
    };

    if (open) {
      fetchUserGroups();
    }
  }, [open]);

  // Use the validation hook
  const { duplicateError } = useGroupNameValidation(userGroups, formData.name, editGroup?.id);

  // Reset form when modal opens/closes or editGroup changes
  useEffect(() => {
    if (open) {
      setFormData({
        name: editGroup?.name || '',
        time_limit_seconds: editGroup?.time_limit_seconds || 15,
        options_count: editGroup?.options_count || 3,
        enable_timer: editGroup?.enable_timer ?? true,
      });
    }
  }, [open, editGroup]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Sanitize and validate group name
    const sanitizedName = sanitizeGroupName(formData.name);

    if (!sanitizedName) {
      toast.error('Please enter a group name');
      return;
    }

    if (!validateLength(sanitizedName, 100, 1)) {
      toast.error('Group name must be between 1 and 100 characters');
      return;
    }

    // Check for duplicate name
    if (duplicateError) {
      toast.error(duplicateError);
      return;
    }

    setIsSaving(true);

    try {
      const supabase = createClient();

      if (editGroup) {
        // Update existing group
        const { error: updateError } = await supabase
          .from('groups')
          .update({
            name: sanitizedName,
            time_limit_seconds: formData.time_limit_seconds,
            options_count: formData.options_count,
            enable_timer: formData.enable_timer,
          })
          .eq('id', editGroup.id);

        if (updateError) throw updateError;

        toast.success('Group updated successfully!');
      } else {
        // Create new group
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          throw new Error('Not authenticated');
        }

        const { data: newGroup, error: insertError } = await supabase
          .from('groups')
          .insert({
            name: sanitizedName,
            creator_id: user.id,
            time_limit_seconds: formData.time_limit_seconds,
            options_count: formData.options_count,
            enable_timer: formData.enable_timer,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        toast.success('Group created successfully!');

        // Navigate to the new group's manage page
        if (newGroup?.id) {
          setLoading(true);
          onOpenChange(false);
          router.push(`/admin/${newGroup.id}`);
        } else {
          // Fallback: call onSuccess and close modal
          onSuccess?.(newGroup?.id);
          onOpenChange(false);
        }
        return;
      }

      // For edits, just refresh without navigation
      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      logError('Error saving group', { error: err });
      toast.error(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const maxOptions = Math.min(peopleCount, 4);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle>{editGroup ? 'Edit Group' : 'Create New Group'}</DialogTitle>
          <DialogDescription>
            {editGroup
              ? 'Update the settings for this group.'
              : 'Set up a new group of people for your Face Match game.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="group-name">Group name</Label>
            <Input
              id="group-name"
              placeholder="e.g., Friends, Family, Coworkers"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              disabled={isSaving}
            />
            {duplicateError && <p className="text-destructive text-sm">{duplicateError}</p>}
          </div>

          <div className="flex items-center gap-3">
            <Switch
              id="enable-timer"
              checked={formData.enable_timer}
              onChange={(checked) => setFormData({ ...formData, enable_timer: checked })}
              disabled={isSaving}
            />
            <Label htmlFor="enable-timer" className="cursor-pointer text-sm leading-none font-medium">
              Enable countdown timer
            </Label>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <Label htmlFor="time-limit">Time limit per question</Label>
              <span className="bg-muted rounded px-3 py-1 text-sm font-medium">{formData.time_limit_seconds}s</span>
            </div>
            <input
              id="time-limit"
              type="range"
              min="5"
              max="120"
              step="1"
              value={formData.time_limit_seconds}
              onChange={(e) => setFormData({ ...formData, time_limit_seconds: parseInt(e.target.value) || 15 })}
              disabled={isSaving}
              className="bg-secondary accent-primary h-2 w-full cursor-pointer appearance-none rounded-lg"
            />
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <Label htmlFor="options-count">Options per question</Label>
              <span className="bg-muted rounded px-3 py-1 text-sm font-medium">{formData.options_count}</span>
            </div>
            <input
              id="options-count"
              type="range"
              min="2"
              max={maxOptions}
              step="1"
              value={formData.options_count}
              onChange={(e) => setFormData({ ...formData, options_count: parseInt(e.target.value) || 3 })}
              disabled={isSaving}
              className="bg-secondary accent-primary h-2 w-full cursor-pointer appearance-none rounded-lg"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" loading={isSaving} loadingText="Saving..." className="flex-1">
              {editGroup ? 'Save Changes' : 'Create Group'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
