'use server';

import { createClient } from '@/lib/supabase/server';
import { logger, logError } from '@/lib/logger';

export async function markPlayerAsLeft(sessionId: string, playerName: string, joinSessionId?: string) {
  const supabase = await createClient();

  // Build query - use joinSessionId for precise targeting if available
  let query = supabase.from('game_answers').update({ is_active: false }).eq('session_id', sessionId);

  if (joinSessionId) {
    // Target the specific browser instance
    query = query.eq('join_session_id', joinSessionId);
  } else {
    // Fallback to player name for backward compatibility
    query = query.eq('player_name', playerName);
  }

  const { data, error } = await query.select();

  if (error) {
    logError('Error marking player as left:', error);
    return { success: false, error };
  }

  logger.log('Player marked as left successfully, updated records:', data?.length);
  return { success: true, recordsUpdated: data?.length };
}
