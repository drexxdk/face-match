import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AdminPageClient } from '@/components/admin-page-client';

export default async function AdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Get all user's groups with people count and game sessions
  const { data: groups } = await supabase
    .from('groups')
    .select(
      `
      id,
      name,
      created_at,
      group_people(count),
      game_sessions(
        id,
        game_code,
        game_type,
        time_limit_seconds,
        options_count,
        total_questions,
        started_at,
        status
      )
    `,
    )
    .eq('creator_id', user.id)
    .order('created_at', { ascending: false });

  // Filter game sessions to only active ones
  const groupsWithData = (groups || []).map((group) => ({
    ...group,
    game_sessions: (group.game_sessions || []).filter(
      (session) => session.status === 'active',
    ),
  }));

  return <AdminPageClient groups={groupsWithData} />;
}
