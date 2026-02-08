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

    // Get all people from the original group
    const { data: people, error: peopleError } = await supabase.from('people').select('*').eq('group_id', groupId);

    if (peopleError) {
      logError('Failed to fetch people for duplication', peopleError);
    }

    // If there are people, copy them to the new group
    if (people && people.length > 0) {
      const newPeople = people.map((person) => ({
        group_id: newGroup.id,
        first_name: person.first_name,
        last_name: person.last_name,
        gender: person.gender,
        image_url: person.image_url,
      }));

      const { error: insertPeopleError } = await supabase.from('people').insert(newPeople);

      if (insertPeopleError) {
        logError('Failed to copy people to new group', insertPeopleError);
        // Don't fail the whole operation if people copy fails
      }
    }

    return { success: true, newGroupId: newGroup.id };
  } catch (error) {
    logError('Failed to duplicate group', error);
    return { success: false, error: getErrorMessage(error) };
  }
}
