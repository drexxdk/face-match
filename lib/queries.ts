import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import {
  gameSessionSchema,
  gameSessionWithGroupSchema,
  groupSchema,
  personSchema,
  parseOrNull,
  parseArrayFiltered,
} from '@/lib/schemas';
import type { GameSession, GameSessionWithGroup, Group, Person } from '@/lib/schemas';

type TypedSupabaseClient = SupabaseClient<Database>;

// =============================================================================
// Game Sessions
// =============================================================================

/**
 * Get a game session by game code (for players joining)
 */
export async function getActiveGameSessionByCode(
  supabase: TypedSupabaseClient,
  gameCode: string,
): Promise<{ id: string; status: string | null } | null> {
  const { data } = await supabase
    .from('game_sessions')
    .select('id, status')
    .eq('game_code', gameCode)
    .eq('status', 'active')
    .limit(1)
    .single();

  return data;
}

/**
 * Get a game session by code (any status - for rejoining)
 */
export async function getGameSessionByCode(
  supabase: TypedSupabaseClient,
  gameCode: string,
): Promise<GameSession | null> {
  const { data } = await supabase.from('game_sessions').select('*').eq('game_code', gameCode).single();

  return parseOrNull(gameSessionSchema, data);
}

/**
 * Get a game session with group details by ID
 */
export async function getGameSessionWithGroup(
  supabase: TypedSupabaseClient,
  sessionId: string,
): Promise<GameSessionWithGroup | null> {
  const { data } = await supabase.from('game_sessions').select('*, groups(id, name)').eq('id', sessionId).single();

  // Return data directly without strict Zod validation
  // since the host play page needs to access it immediately
  if (!data) return null;
  return data as GameSessionWithGroup;
}

/**
 * Get active game sessions for a user
 */
export async function getUserActiveGameSessions(
  supabase: TypedSupabaseClient,
  userId: string,
  limit = 3,
): Promise<GameSessionWithGroup[]> {
  const { data } = await supabase
    .from('game_sessions')
    .select('*, groups(id, name)')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('started_at', { ascending: false })
    .limit(limit);

  return parseArrayFiltered(gameSessionWithGroupSchema, data ?? []);
}

/**
 * Get game session status by ID
 */
export async function getGameSessionStatus(
  supabase: TypedSupabaseClient,
  sessionId: string,
): Promise<{ status: string | null } | null> {
  const { data } = await supabase.from('game_sessions').select('status').eq('id', sessionId).single();

  return data;
}

// =============================================================================
// Groups
// =============================================================================

/**
 * Get a group by ID
 */
export async function getGroupById(supabase: TypedSupabaseClient, groupId: string): Promise<Group | null> {
  const { data } = await supabase.from('groups').select('*').eq('id', groupId).single();

  return parseOrNull(groupSchema, data);
}

/**
 * Get all groups for a user with people count
 */
export async function getUserGroupsWithCount(
  supabase: TypedSupabaseClient,
  userId: string,
): Promise<Array<Group & { people: { count: number }[] }>> {
  const { data } = await supabase
    .from('groups')
    .select('*, people(count)')
    .eq('creator_id', userId)
    .order('created_at', { ascending: false });

  // Can't use parseArrayFiltered here due to the count aggregate
  return (data ?? []) as Array<Group & { people: { count: number }[] }>;
}

// =============================================================================
// People
// =============================================================================

/**
 * Get all people in a group
 */
export async function getPeopleByGroupId(supabase: TypedSupabaseClient, groupId: string): Promise<Person[]> {
  const { data } = await supabase.from('people').select('*').eq('group_id', groupId).order('first_name');

  return parseArrayFiltered(personSchema, data ?? []);
}

/**
 * Get people count for a group
 */
export async function getPeopleCountByGroupId(supabase: TypedSupabaseClient, groupId: string): Promise<number> {
  const { count } = await supabase.from('people').select('*', { count: 'exact', head: true }).eq('group_id', groupId);

  return count ?? 0;
}

// =============================================================================
// Game Answers
// =============================================================================

/**
 * Get all answers for a game session
 */
export async function getGameAnswers(supabase: TypedSupabaseClient, sessionId: string) {
  const { data } = await supabase.from('game_answers').select('*').eq('session_id', sessionId);

  return data ?? [];
}

/**
 * Get player's join record for a session
 */
export async function getPlayerJoinRecord(
  supabase: TypedSupabaseClient,
  sessionId: string,
  playerName: string,
): Promise<{ id: string } | null> {
  const { data } = await supabase
    .from('game_answers')
    .select('id')
    .eq('session_id', sessionId)
    .eq('player_name', playerName)
    .is('correct_option_id', null)
    .order('created_at', { ascending: false })
    .limit(1);

  const [record] = data ?? [];
  return record ?? null;
}

/**
 * Get existing join records for a player (checking if already joined)
 */
export async function getExistingJoinRecords(
  supabase: TypedSupabaseClient,
  sessionId: string,
  playerName: string,
): Promise<Array<{ id: string }>> {
  const { data } = await supabase
    .from('game_answers')
    .select('id')
    .eq('session_id', sessionId)
    .eq('player_name', playerName)
    .is('correct_option_id', null)
    .order('created_at', { ascending: false })
    .limit(1);

  return data ?? [];
}
