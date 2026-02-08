'use server';

import { createClient } from '@/lib/supabase/server';
import { logError, getErrorMessage } from '@/lib/logger';

export async function duplicateGroup(
  groupId: string,
): Promise<{ success: boolean; newGroupId?: string; error?: string }> {
  try {
    const supabase = await createClient();

    // Get the current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    // Get the original group
    const { data: originalGroup, error: groupError } = await supabase
      .from('groups')
      .select('*')
      .eq('id', groupId)
      .eq('creator_id', user.id)
      .single();

    if (groupError || !originalGroup) {
      return { success: false, error: 'Group not found or access denied' };
    }

    // Create new group with "Copy of" prefix
    const insertData: {
      creator_id: string;
      name: string;
      time_limit_seconds: number | null;
      options_count: number | null;
      enable_timer?: boolean | null;
    } = {
      creator_id: user.id,
      name: `Copy of ${originalGroup.name}`,
      time_limit_seconds: originalGroup.time_limit_seconds,
      options_count: originalGroup.options_count,
    };

    // Add enable_timer if it exists (for backward compatibility)
    if ('enable_timer' in originalGroup) {
      insertData.enable_timer = originalGroup.enable_timer as boolean | null;
    }

    const { data: newGroup, error: createError } = await supabase.from('groups').insert(insertData).select().single();

    if (createError || !newGroup) {
      return { success: false, error: getErrorMessage(createError) };
    }

    // Get all people from the original group via junction table
    const { data: groupPeople, error: peopleError } = await supabase
      .from('group_people')
      .select('person_id')
      .eq('group_id', groupId);

    if (peopleError) {
      logError('Failed to fetch people for duplication', peopleError);
    }

    // If there are people, link them to the new group (shares references, no duplication)
    if (groupPeople && groupPeople.length > 0) {
      const newGroupPeople = groupPeople.map((gp) => ({
        group_id: newGroup.id,
        person_id: gp.person_id,
      }));

      const { error: linkError } = await supabase.from('group_people').insert(newGroupPeople);

      if (linkError) {
        logError('Failed to link people to new group', linkError);
        // Don't fail the whole operation if linking fails
      }
    }

    return { success: true, newGroupId: newGroup.id };
  } catch (error) {
    logError('Failed to duplicate group', error);
    return { success: false, error: getErrorMessage(error) };
  }
}
