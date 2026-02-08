'use client';

import { useState, useEffect, useCallback, memo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/lib/logger';
import { sanitizeGroupName, validateLength } from '@/lib/security';
import type { Group } from '@/lib/schemas';

interface GroupSettingsProps {
  groupId: string;
  initialGroup: Pick<Group, 'id' | 'name' | 'time_limit_seconds' | 'options_count' | 'enable_timer'>;
  peopleCount?: number;
  onUpdate?: (updatedGroup: Pick<Group, 'name' | 'time_limit_seconds' | 'options_count' | 'enable_timer'>) => void;
  isEditing?: boolean;
  onEditChange?: (isEditing: boolean) => void;
}

export const GroupSettings = memo(function GroupSettings({
  groupId,
  initialGroup,
  peopleCount = 4,
  onUpdate,
  isEditing: externalIsEditing = false,
  onEditChange,
}: GroupSettingsProps) {
  const [isEditing, setIsEditing] = useState(externalIsEditing);
  const [groupName, setGroupName] = useState<string>(initialGroup.name);
  const [timeLimitSeconds, setTimeLimitSeconds] = useState<number>(Number(initialGroup.time_limit_seconds) || 30);
  const [optionsCount, setOptionsCount] = useState<number>(Number(initialGroup.options_count) || 4);
  const [enableTimer, setEnableTimer] = useState<boolean>(initialGroup.enable_timer ?? true);
  const [totalQuestions, setTotalQuestions] = useState<number>(Math.min(peopleCount, 10));
  const [isSaving, setIsSaving] = useState(false);

  // Sync external isEditing prop with local state
  useEffect(() => {
    setIsEditing(externalIsEditing);
  }, [externalIsEditing]);

  // Adjust totalQuestions if peopleCount changes and becomes smaller
  useEffect(() => {
    const maxQuestions = Math.min(peopleCount, 10);
    setTotalQuestions((prev) => Math.min(prev, maxQuestions));
  }, [peopleCount]);

  const handleSave = useCallback(async () => {
    // Sanitize and validate group name
    const sanitizedName = sanitizeGroupName(groupName);

    if (!sanitizedName) {
      toast.error('Please enter a group name');
      return;
    }

    if (!validateLength(sanitizedName, 100, 1)) {
      toast.error('Group name must be between 1 and 100 characters');
      return;
    }

    setIsSaving(true);

    try {
      const supabase = createClient();

      const { error: updateError } = await supabase
        .from('groups')
        .update({
          name: sanitizedName,
          time_limit_seconds: timeLimitSeconds,
          options_count: optionsCount,
          enable_timer: enableTimer,
        })
        .eq('id', groupId);

      if (updateError) throw updateError;

      // Update local state with sanitized name
      setGroupName(sanitizedName);
      toast.success('Settings saved!');
      setIsEditing(false);

      // Call the onUpdate callback to sync parent component
      if (onUpdate) {
        onUpdate({
          name: sanitizedName,
          time_limit_seconds: timeLimitSeconds,
          options_count: optionsCount,
          enable_timer: enableTimer,
        });
      }

      // Notify parent that edit mode is closed
      if (onEditChange) {
        onEditChange(false);
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }, [groupName, timeLimitSeconds, optionsCount, enableTimer, groupId, onUpdate, onEditChange]);

  const handleCancel = useCallback(() => {
    setGroupName(initialGroup.name);
    setTimeLimitSeconds(initialGroup.time_limit_seconds ?? 30);
    setOptionsCount(initialGroup.options_count ?? 4);
    setEnableTimer(initialGroup.enable_timer ?? true);
    setIsEditing(false);
    if (onEditChange) {
      onEditChange(false);
    }
  }, [initialGroup, onEditChange]);

  if (isEditing) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <Label htmlFor="group-name">Group name</Label>
          <input
            id="group-name"
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            className="border-input bg-background mt-1 w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            id="enable-timer"
            type="checkbox"
            checked={enableTimer}
            onChange={(e) => setEnableTimer(e.target.checked)}
            className="text-primary focus:ring-primary size-4 cursor-pointer rounded border-gray-300 focus:ring-2 focus:ring-offset-2"
          />
          <Label htmlFor="enable-timer" className="cursor-pointer text-sm leading-none font-medium">
            Enable countdown timer
          </Label>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <Label htmlFor="time-limit">Default time limit per question</Label>
            <span className="bg-muted rounded px-3 py-1 text-sm font-medium">{timeLimitSeconds}s</span>
          </div>
          <input
            id="time-limit"
            type="range"
            min="5"
            max="120"
            step="1"
            value={timeLimitSeconds}
            onChange={(e) => setTimeLimitSeconds(parseInt(e.target.value) || 30)}
            className="bg-secondary accent-primary h-2 w-full cursor-pointer appearance-none rounded-lg"
          />
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <Label htmlFor="options-count">Default options per question</Label>
            <span className="bg-muted rounded px-3 py-1 text-sm font-medium">{optionsCount}</span>
          </div>
          <input
            id="options-count"
            type="range"
            min="2"
            max={Math.min(peopleCount, 10)}
            step="1"
            value={optionsCount}
            onChange={(e) => setOptionsCount(parseInt(e.target.value) || 4)}
            className="bg-secondary accent-primary h-2 w-full cursor-pointer appearance-none rounded-lg"
          />
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <Label htmlFor="total-questions">Default amount of questions</Label>
            <span className="bg-muted rounded px-3 py-1 text-sm font-medium">{totalQuestions}</span>
          </div>
          <input
            id="total-questions"
            type="range"
            min="1"
            max={peopleCount}
            step="1"
            value={totalQuestions}
            onChange={(e) => setTotalQuestions(parseInt(e.target.value) || 1)}
            className="bg-secondary accent-primary h-2 w-full cursor-pointer appearance-none rounded-lg"
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={handleCancel} variant="outline" disabled={isSaving} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSave} loading={isSaving} loadingText="Saving..." className="flex-1">
            Save
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Countdown timer</span>
        <span className="bg-muted rounded px-3 py-1 text-sm font-medium">{enableTimer ? 'Enabled' : 'Disabled'}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Default time limit per question</span>
        <span className="bg-muted rounded px-3 py-1 text-sm font-medium">{timeLimitSeconds}s</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Default options per question</span>
        <span className="bg-muted rounded px-3 py-1 text-sm font-medium">{optionsCount}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Default amount of questions</span>
        <span className="bg-muted rounded px-3 py-1 text-sm font-medium">{totalQuestions}</span>
      </div>
    </div>
  );
});
