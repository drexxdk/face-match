#!/usr/bin/env node

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, unlinkSync } from 'fs';

const inputFile = 'lib/database.types.ts';
const outputFile = 'lib/schemas.ts';
const tempFile = 'lib/temp-schemas.ts';

interface ProcessingError extends Error {
  message: string;
}

// Run supazod to generate base schemas
console.log('Generating base schemas with supazod...');
try {
  execSync(`npx supazod -i ${inputFile} -o ${tempFile}`, { stdio: 'inherit' });
} catch (error) {
  const execError = error as ProcessingError;
  console.error('Failed to run supazod:', execError.message);
  process.exit(1);
}

// Read the generated file
let generatedContent: string;
try {
  generatedContent = readFileSync(tempFile, 'utf8');
} catch (error) {
  const readError = error as ProcessingError;
  console.error('Failed to read generated file:', readError.message);
  process.exit(1);
}

// Post-process to match current format:
// 1. Change z.enum(["a", "b"]) to z.union([z.literal("a"), z.literal("b")])
generatedContent = generatedContent.replace(/z\.enum\(\[([^\]]+)\]\)/g, (match: string, values: string): string => {
  const literals: string = values
    .split(',')
    .map((val: string): string => `z.literal(${val.trim()})`)
    .join(', ');
  return `z.union([${literals}])`;
});

// 2. Change jsonSchema type from z.ZodSchema<Json> to z.ZodType<unknown>
generatedContent = generatedContent.replace(
  /export const jsonSchema: z\.ZodSchema<Json> = z\.lazy/g,
  'export const jsonSchema: z.ZodType<unknown> = z.lazy',
);

// 3. Remove the Json import
generatedContent = generatedContent.replace(/import { type Json } from "\.\/database\.types";\n\n/g, '');

// Read the custom schemas part
const customSchemas: string = `
// =============================
// Custom Schemas for Queries
// =============================

// GameSession schema (row)
export const gameSessionSchema = publicGameSessionsRowSchema;
export type GameSession = z.infer<typeof gameSessionSchema>;

// GameSession with group details (for joined queries)
export const gameSessionWithGroupSchema = z.object({
  ...publicGameSessionsRowSchema.shape,
  groups: z
    .object({
      id: z.string(),
      name: z.string(),
    })
    .nullable(),
});
export type GameSessionWithGroup = z.infer<typeof gameSessionWithGroupSchema>;

// Group schema (row)
export const groupSchema = publicGroupsRowSchema;
export type Group = z.infer<typeof groupSchema>;

// Person schema (row)
export const personSchema = publicPeopleRowSchema;
export type Person = z.infer<typeof personSchema>;

// Utility: parseOrNull - validates data or returns null
export function parseOrNull<T>(schema: z.ZodType<T>, data: unknown): T | null {
  if (!data) return null;
  const result = schema.safeParse(data);
  return result.success ? result.data : null;
}

// Utility: parseArrayFiltered - validates array, filters out invalid
export function parseArrayFiltered<T>(schema: z.ZodType<T>, data: unknown): T[] {
  if (!Array.isArray(data)) return [];
  return data
    .map((item: unknown): T | null => {
      const result = schema.safeParse(item);
      return result.success ? result.data : null;
    })
    .filter((item: T | null): item is T => item !== null);
}

// Aliases for compatibility with existing imports
export type GameType = z.infer<typeof publicGameTypeSchema>;
export type PersonInsert = z.infer<typeof publicPeopleInsertSchema>;
export type GenderType = z.infer<typeof publicGenderTypeSchema>;
`;

// Combine generated and custom content
const finalContent: string = generatedContent + customSchemas;

// Write the final file
try {
  writeFileSync(outputFile, finalContent);
} catch (error) {
  const writeError = error as ProcessingError;
  console.error('Failed to write final file:', writeError.message);
  process.exit(1);
}

// Clean up temp file
try {
  unlinkSync(tempFile);
} catch (error) {
  const unlinkError = error as ProcessingError;
  console.warn('Failed to clean up temp file:', unlinkError.message);
}

console.log('✅ Successfully generated schemas.ts');
