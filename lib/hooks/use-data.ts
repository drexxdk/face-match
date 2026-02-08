'use client';

import useSWR, { SWRConfiguration, mutate } from 'swr';
import { createClient } from '@/lib/supabase/client';
import type { Group, Person } from '@/lib/schemas';

// Global SWR configuration
export const swrConfig: SWRConfiguration = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 5000,
  errorRetryCount: 3,
  errorRetryInterval: 1000,
  // Exponential backoff for retries
  onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
    // Never retry on 404
    if (error.code === 'PGRST116') return;

    // Only retry up to 3 times
    if (retryCount >= 3) return;

    // Exponential backoff: 1s, 2s, 4s
    setTimeout(() => revalidate({ retryCount }), 1000 * Math.pow(2, retryCount));
  },
};

// Fetcher functions
async function fetchGroups(): Promise<Group[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  // Cast to Group[] to include enable_timer field (for backward compatibility with DB)
  return (data || []) as unknown as Group[];
}

async function fetchGroup(id: string): Promise<Group | null> {
  const supabase = createClient();
  const { data, error } = await supabase.from('groups').select('*').eq('id', id).single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  // Cast to Group to include enable_timer field (for backward compatibility with DB)
  return data as unknown as Group;
}

async function fetchPeopleByGroup(groupId: string): Promise<Person[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('people')
    .select('*')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// Hook: Fetch all groups for the current user
export function useGroups() {
  const { data, error, isLoading, isValidating, mutate } = useSWR<Group[]>('groups', fetchGroups, swrConfig);

  return {
    groups: data || [],
    isLoading,
    isValidating,
    error,
    mutate,
  };
}

// Hook: Fetch a single group by ID
export function useGroup(id: string | null) {
  const { data, error, isLoading, isValidating, mutate } = useSWR<Group | null>(
    id ? `group:${id}` : null,
    () => (id ? fetchGroup(id) : null),
    swrConfig,
  );

  return {
    group: data,
    isLoading,
    isValidating,
    error,
    mutate,
  };
}

// Hook: Fetch people for a group
export function usePeople(groupId: string | null) {
  const { data, error, isLoading, isValidating, mutate } = useSWR<Person[]>(
    groupId ? `people:${groupId}` : null,
    () => (groupId ? fetchPeopleByGroup(groupId) : []),
    {
      ...swrConfig,
      // People list can change frequently during editing
      revalidateOnFocus: true,
    },
  );

  return {
    people: data || [],
    isLoading,
    isValidating,
    error,
    mutate,
  };
}

// Utility: Invalidate and refetch groups
export function invalidateGroups() {
  return mutate('groups');
}

// Utility: Invalidate and refetch a specific group
export function invalidateGroup(id: string) {
  return mutate(`group:${id}`);
}

// Utility: Invalidate and refetch people for a group
export function invalidatePeople(groupId: string) {
  return mutate(`people:${groupId}`);
}

// Utility: Optimistically update a group in the cache
export function optimisticUpdateGroup(id: string, updater: (current: Group | null | undefined) => Group | null) {
  return mutate(`group:${id}`, updater, { revalidate: false });
}

// Utility: Optimistically add a person to the cache
export function optimisticAddPerson(groupId: string, person: Person) {
  return mutate(`people:${groupId}`, (current: Person[] | undefined) => [person, ...(current || [])], {
    revalidate: false,
  });
}

// Utility: Optimistically remove a person from the cache
export function optimisticRemovePerson(groupId: string, personId: string) {
  return mutate(
    `people:${groupId}`,
    (current: Person[] | undefined) => (current || []).filter((p) => p.id !== personId),
    { revalidate: false },
  );
}
