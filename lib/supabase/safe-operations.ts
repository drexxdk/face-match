import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { retryWithCheck } from '@/lib/retry';
import { logger } from '@/lib/logger';

/**
 * Enhanced Supabase operations with retry logic and better error handling
 */

export type SupabaseError = {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
};

export function formatSupabaseError(error: unknown): SupabaseError {
  if (error && typeof error === 'object' && 'message' in error) {
    return {
      message: String(error.message),
      code: 'code' in error ? String(error.code) : undefined,
      details: 'details' in error ? String(error.details) : undefined,
      hint: 'hint' in error ? String(error.hint) : undefined,
    };
  }
  return { message: String(error) };
}

/**
 * Execute a Supabase query with automatic retry on transient failures
 */
export async function withRetry<T>(
  operation: () => Promise<{ data: T | null; error: unknown }>,
  operationName: string = 'Supabase operation',
): Promise<T> {
  return retryWithCheck(async () => {
    const { data, error } = await operation();

    if (error) {
      const formattedError = formatSupabaseError(error);
      logger.error(`${operationName} failed:`, formattedError);
      throw new Error(formattedError.message);
    }

    if (data === null) {
      throw new Error(`${operationName} returned no data`);
    }

    return data;
  });
}

/**
 * Safe query builder that handles errors gracefully
 */
export class SafeQueryBuilder<T> {
  constructor(
    private supabase: SupabaseClient<Database>,
    private tableName: keyof Database['public']['Tables'],
  ) {}

  async select(columns = '*'): Promise<T[] | null> {
    try {
      const { data, error } = await this.supabase.from(this.tableName).select(columns);

      if (error) {
        logger.error(`Select from ${this.tableName} failed:`, error);
        return null;
      }

      return data as T[];
    } catch (error) {
      logger.error(`Unexpected error in select:`, error);
      return null;
    }
  }

  async insert(values: Partial<T>): Promise<T | null> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .insert(values as never)
        .select()
        .single();

      if (error) {
        logger.error(`Insert into ${this.tableName} failed:`, error);
        return null;
      }

      return data as T;
    } catch (error) {
      logger.error(`Unexpected error in insert:`, error);
      return null;
    }
  }

  async update(id: string, values: Partial<T>): Promise<T | null> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .update(values as never)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error(`Update in ${this.tableName} failed:`, error);
        return null;
      }

      return data as T;
    } catch (error) {
      logger.error(`Unexpected error in update:`, error);
      return null;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await this.supabase.from(this.tableName).delete().eq('id', id);

      if (error) {
        logger.error(`Delete from ${this.tableName} failed:`, error);
        return false;
      }

      return true;
    } catch (error) {
      logger.error(`Unexpected error in delete:`, error);
      return false;
    }
  }
}

/**
 * Create a safe query builder for a table
 */
export function createSafeQuery<T>(
  supabase: SupabaseClient<Database>,
  tableName: keyof Database['public']['Tables'],
): SafeQueryBuilder<T> {
  return new SafeQueryBuilder<T>(supabase, tableName);
}
