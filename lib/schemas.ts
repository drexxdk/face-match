import { z } from 'zod';

// Enums
export const gameTypeSchema = z.enum(['guess_name', 'guess_image']);
export const genderTypeSchema = z.enum(['male', 'female', 'other']);
export const userRoleSchema = z.enum(['teacher', 'student']);

export type GameType = z.infer<typeof gameTypeSchema>;
export type GenderType = z.infer<typeof genderTypeSchema>;
export type UserRole = z.infer<typeof userRoleSchema>;

// Game Answers
export const gameAnswerSchema = z.object({
  id: z.string().uuid(),
  session_id: z.string().uuid(),
  player_name: z.string().nullable(),
  correct_option_id: z.string().uuid().nullable(),
  selected_option_id: z.string().uuid().nullable(),
  is_correct: z.boolean(),
  is_active: z.boolean().nullable(),
  response_time_ms: z.number().nullable(),
  join_id: z.string().uuid().nullable(),
  answered_at: z.string().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});

export const gameAnswerInsertSchema = gameAnswerSchema
  .omit({ id: true, created_at: true, updated_at: true, answered_at: true })
  .extend({
    id: z.string().uuid().optional(),
    answered_at: z.string().optional().nullable(),
    created_at: z.string().optional().nullable(),
    updated_at: z.string().optional().nullable(),
    is_active: z.boolean().optional().nullable(),
    response_time_ms: z.number().optional().nullable(),
    join_id: z.string().uuid().optional().nullable(),
  });

export type GameAnswer = z.infer<typeof gameAnswerSchema>;
export type GameAnswerInsert = z.infer<typeof gameAnswerInsertSchema>;

// Groups
export const groupSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  creator_id: z.string().uuid(),
  time_limit_seconds: z.number().nullable(),
  options_count: z.number().nullable(),
  enable_timer: z.boolean().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});

export const groupInsertSchema = groupSchema.omit({ id: true }).extend({
  id: z.string().uuid().optional(),
  time_limit_seconds: z.number().optional().nullable(),
  options_count: z.number().optional().nullable(),
  enable_timer: z.boolean().optional().nullable(),
  created_at: z.string().optional().nullable(),
  updated_at: z.string().optional().nullable(),
});

export type Group = z.infer<typeof groupSchema>;
export type GroupInsert = z.infer<typeof groupInsertSchema>;

// People
export const personSchema = z.object({
  id: z.string().uuid(),
  group_id: z.string().uuid(),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  gender: genderTypeSchema,
  image_url: z.string().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});

export const personInsertSchema = personSchema.omit({ id: true }).extend({
  id: z.string().uuid().optional(),
  image_url: z.string().optional().nullable(),
  created_at: z.string().optional().nullable(),
  updated_at: z.string().optional().nullable(),
});

export type Person = z.infer<typeof personSchema>;
export type PersonInsert = z.infer<typeof personInsertSchema>;

// Profiles
export const profileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email().nullable(),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  avatar_url: z.string().nullable(),
  role: userRoleSchema.nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});

export const profileInsertSchema = profileSchema.extend({
  email: z.string().email().optional().nullable(),
  first_name: z.string().optional().nullable(),
  last_name: z.string().optional().nullable(),
  avatar_url: z.string().optional().nullable(),
  role: userRoleSchema.optional().nullable(),
  created_at: z.string().optional().nullable(),
  updated_at: z.string().optional().nullable(),
});

export type Profile = z.infer<typeof profileSchema>;
export type ProfileInsert = z.infer<typeof profileInsertSchema>;

// Game Sessions
export const gameSessionSchema = z.object({
  id: z.string().uuid(),
  group_id: z.string().uuid(),
  user_id: z.string().uuid().nullable(),
  game_type: gameTypeSchema,
  game_code: z.string().nullable(),
  status: z.string().nullable(),
  score: z.number().nullable(),
  total_questions: z.number().nullable(),
  time_limit_seconds: z.number().nullable(),
  options_count: z.number().nullable(),
  enable_timer: z.boolean().nullable(),
  started_at: z.string().nullable(),
  completed_at: z.string().nullable(),
});

export const gameSessionInsertSchema = gameSessionSchema.omit({ id: true }).extend({
  id: z.string().uuid().optional(),
  game_code: z.string().optional().nullable(),
  status: z.string().optional().nullable(),
  score: z.number().optional().nullable(),
  total_questions: z.number().optional().nullable(),
  time_limit_seconds: z.number().optional().nullable(),
  options_count: z.number().optional().nullable(),
  enable_timer: z.boolean().optional().nullable(),
  user_id: z.string().uuid().optional().nullable(),
  started_at: z.string().optional().nullable(),
  completed_at: z.string().optional().nullable(),
});

export type GameSession = z.infer<typeof gameSessionSchema>;
export type GameSessionInsert = z.infer<typeof gameSessionInsertSchema>;

// Game Session with Group (for joined queries)
export const gameSessionWithGroupSchema = gameSessionSchema.extend({
  groups: z
    .object({
      id: z.string().uuid(),
      name: z.string(),
    })
    .nullable(),
});

export type GameSessionWithGroup = z.infer<typeof gameSessionWithGroupSchema>;

// Person with Group (for joined queries)
export const personWithGroupSchema = personSchema.extend({
  groups: z
    .object({
      id: z.string().uuid(),
      name: z.string(),
    })
    .nullable(),
});

export type PersonWithGroup = z.infer<typeof personWithGroupSchema>;

// =============================================================================
// Validation Utilities
// =============================================================================

/**
 * Parse data with a Zod schema, throwing a descriptive error if validation fails.
 * Use this when you expect valid data and want to fail fast.
 */
export function parseOrThrow<T>(schema: z.ZodType<T>, data: unknown, context?: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errorMessage = result.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    throw new Error(context ? `${context}: ${errorMessage}` : `Validation failed: ${errorMessage}`);
  }
  return result.data;
}

/**
 * Parse data with a Zod schema, returning null if validation fails.
 * Use this for optional/nullable data where failure is acceptable.
 */
export function parseOrNull<T>(schema: z.ZodType<T>, data: unknown): T | null {
  const result = schema.safeParse(data);
  return result.success ? result.data : null;
}

/**
 * Parse an array of items, filtering out invalid entries.
 * Returns only the items that pass validation.
 */
export function parseArrayFiltered<T>(schema: z.ZodType<T>, data: unknown[]): T[] {
  return data
    .map((item) => schema.safeParse(item))
    .filter((result): result is z.ZodSafeParseSuccess<T> => result.success)
    .map((result) => result.data);
}
