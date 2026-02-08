import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { getErrorMessage } from '@/lib/logger';

/**
 * Generate a random game code
 * @param length - Length of the code (default: 6)
 * @returns A random alphanumeric code (excluding ambiguous characters)
 */
export function generateGameCode(length = 6): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Delete a person's image from Supabase storage
 * @param supabase - Supabase client instance
 * @param imageUrl - The full URL of the image to delete
 * @returns Object with success status and optional error
 */
export async function deletePersonImage(
  supabase: SupabaseClient<Database>,
  imageUrl: string | null,
): Promise<{ success: boolean; error?: string }> {
  if (!imageUrl) {
    return { success: true };
  }

  try {
    // Extract filename from URL
    // URL format: https://{domain}/storage/v1/object/public/person-images/{filename}
    const urlParts = imageUrl.split('/person-images/');

    if (urlParts.length <= 1) {
      return { success: false, error: 'Could not extract filename from URL' };
    }

    const filename = decodeURIComponent(urlParts[1]);
    const { error } = await supabase.storage.from('person-images').remove([filename]);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: getErrorMessage(err),
    };
  }
}

/**
 * End a game session by marking it as completed
 * @param supabase - Supabase client instance
 * @param sessionId - The game session ID to end
 */
export async function endGameSession(
  supabase: SupabaseClient<Database>,
  sessionId: string,
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.from('game_sessions').update({ status: 'completed' }).eq('id', sessionId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Icebreaker tips for group game sessions
 * Tips to help groups get to know each other better
 */
export const ICEBREAKER_TIPS = [
  'Take turns sharing your favorite memory from this year',
  "Go around and share one thing you're grateful for today",
  'Each person shares their dream vacation destination',
  'Share a fun fact about yourself that others might not know',
  'Tell the group about your favorite hobby or pastime',
  'Describe your perfect weekend in three words',
  "Share the best piece of advice you've ever received",
  "Tell everyone about a skill you'd like to learn",
  "Describe your favorite meal and why it's special to you",
  'Share a movie or book that changed your perspective',
] as const;

/**
 * Get a random icebreaker tip
 */
export function getRandomIcebreakerTip(): string {
  return ICEBREAKER_TIPS[Math.floor(Math.random() * ICEBREAKER_TIPS.length)];
}

/**
 * Format time in seconds to MM:SS format
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format score as percentage
 */
export function formatScorePercentage(score: number, total: number): string {
  if (total === 0) return '0%';
  return `${Math.round((score / total) * 100)}%`;
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Get initials from first and last name
 */
export function getInitials(firstName: string | null | undefined, lastName: string | null | undefined): string {
  const first = firstName?.charAt(0).toUpperCase() || '';
  const last = lastName?.charAt(0).toUpperCase() || '';
  return first + last || '?';
}
