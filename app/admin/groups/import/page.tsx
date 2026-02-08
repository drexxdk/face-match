'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorMessage } from '@/components/ui/error-message';
import { useLoading } from '@/lib/loading-context';
import { sanitizeGameCode } from '@/lib/security';
import toast from 'react-hot-toast';
import { logError } from '@/lib/logger';
import type { User } from '@supabase/supabase-js';

export default function ImportGroupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const codeFromUrl = searchParams.get('code');
  const [shareCode, setShareCode] = useState(codeFromUrl?.toUpperCase() || '');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [groupPreview, setGroupPreview] = useState<{
    name: string;
    creator_id: string;
    people_count: number;
  } | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const { setLoading } = useLoading();

  // Check auth status
  const [user, setUser] = useState<User | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setIsCheckingAuth(false);
    };
    checkAuth();
  }, []);

  // Load group preview when code is available
  useEffect(() => {
    if (shareCode.length === 6) {
      loadGroupPreview(shareCode);
    } else {
      setGroupPreview(null);
    }
  }, [shareCode]);

  const loadGroupPreview = async (code: string) => {
    setIsLoadingPreview(true);
    setError(null);
    try {
      const supabase = createClient();
      const sanitizedCode = sanitizeGameCode(code);

      const { data: group } = await supabase
        .from('groups')
        .select('id, name, creator_id')
        .eq('share_code', sanitizedCode)
        .single();

      if (!group) {
        setError('Group not found');
        setGroupPreview(null);
        setIsLoadingPreview(false);
        return;
      }

      // Get people count
      const { count } = await supabase
        .from('people')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', group.id);

      setGroupPreview({
        name: group.name,
        creator_id: group.creator_id,
        people_count: count || 0,
      });
    } catch (err) {
      logError('Failed to load group preview', err);
      setError('Failed to load group details');
      setGroupPreview(null);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleImport = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (isSubmitting) return;

      // Check if user is logged in
      if (!user) {
        // Redirect to login with return URL
        router.push(`/auth/login?redirect=/admin/groups/import?code=${shareCode}`);
        return;
      }

      const sanitizedCode = sanitizeGameCode(shareCode);

      if (!sanitizedCode || sanitizedCode.length !== 6) {
        setError('Please enter a valid 6-character share code');
        return;
      }

      setError(null);
      setIsSubmitting(true);
      setLoading(true);

      try {
        const supabase = createClient();

        // Get the source group
        const { data: sourceGroup, error: groupError } = await supabase
          .from('groups')
          .select('*')
          .eq('share_code', sanitizedCode)
          .single();

        if (groupError || !sourceGroup) {
          setError('Group not found');
          setIsSubmitting(false);
          setLoading(false);
          return;
        }

        // Check if user already has this group (by comparing some unique data)
        const { data: existingGroups } = await supabase
          .from('groups')
          .select('id, name')
          .eq('creator_id', user.id)
          .eq('name', sourceGroup.name);

        if (existingGroups && existingGroups.length > 0) {
          const confirmDuplicate = confirm(
            `You already have a group named "${sourceGroup.name}". Import anyway as a new copy?`,
          );
          if (!confirmDuplicate) {
            setIsSubmitting(false);
            setLoading(false);
            return;
          }
        }

        // Create new group with copied settings
        const { data: newGroup, error: createError } = await supabase
          .from('groups')
          .insert({
            name: `${sourceGroup.name} (Imported)`,
            creator_id: user.id,
            options_count: sourceGroup.options_count,
            time_limit_seconds: sourceGroup.time_limit_seconds,
            enable_timer: sourceGroup.enable_timer,
          })
          .select()
          .single();

        if (createError || !newGroup) {
          throw new Error('Failed to create group');
        }

        // Get all people from source group via junction table
        const { data: sourceGroupPeople, error: peopleError } = await supabase
          .from('group_people')
          .select('person_id')
          .eq('group_id', sourceGroup.id);

        if (peopleError) {
          throw new Error('Failed to fetch people from source group');
        }

        // Link existing people to the new group (shares references, no duplication)
        if (sourceGroupPeople && sourceGroupPeople.length > 0) {
          const groupPeopleToInsert = sourceGroupPeople.map((gp) => ({
            group_id: newGroup.id,
            person_id: gp.person_id,
          }));

          const { error: linkError } = await supabase.from('group_people').insert(groupPeopleToInsert);

          if (linkError) {
            // If people linking fails, we should clean up the group
            await supabase.from('groups').delete().eq('id', newGroup.id);
            throw new Error('Failed to link people to imported group');
          }
        }

        toast.success(
          `Group "${sourceGroup.name}" imported successfully with ${sourceGroupPeople?.length || 0} people!`,
        );
        router.push(`/admin/groups/${newGroup.id}`);
      } catch (err) {
        logError('Failed to import group', err);
        setError(err instanceof Error ? err.message : 'Failed to import group');
        setIsSubmitting(false);
        setLoading(false);
      }
    },
    [shareCode, user, router, isSubmitting, setLoading],
  );

  if (isCheckingAuth) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Checking authentication...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Group</CardTitle>
        <CardDescription>Enter the share code to import a group with all its people</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleImport} className="flex flex-col gap-4" suppressHydrationWarning>
          <div className="flex flex-col gap-2">
            <Input
              placeholder="Share Code"
              value={shareCode}
              onChange={(e) => setShareCode(e.target.value.toUpperCase())}
              maxLength={6}
              className="text-center text-2xl font-bold tracking-widest"
              required
              disabled={isSubmitting}
            />
          </div>

          {isLoadingPreview && (
            <div className="bg-muted/50 flex items-center justify-center rounded-lg p-4">
              <div className="text-muted-foreground text-sm">Loading group details...</div>
            </div>
          )}

          {groupPreview && !isLoadingPreview && (
            <div className="bg-muted/50 flex flex-col gap-2 rounded-lg p-4">
              <div className="font-semibold">{groupPreview.name}</div>
              <div className="text-muted-foreground text-sm">{groupPreview.people_count} people</div>
            </div>
          )}

          <ErrorMessage message={error} />

          {!user && shareCode.length === 6 && (
            <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-3 text-sm text-blue-700 dark:text-blue-400">
              You need to log in to import this group. Click below to continue.
            </div>
          )}

          <Button
            type="submit"
            disabled={isSubmitting || !shareCode || shareCode.length !== 6}
            className="w-full"
            size="lg"
            loading={isSubmitting}
            loadingText={user ? 'Importing...' : 'Redirecting to login...'}
          >
            {user ? 'Import Group' : 'Log In to Import'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
