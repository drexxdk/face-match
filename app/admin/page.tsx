import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AdminPageClient } from '@/components/admin-page-client';
import type { GameSessionWithGroup } from '@/lib/schemas';

export default async function AdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Get user's active game sessions
  const { data: sessions } = await supabase
    .from('game_sessions')
    .select('*, groups(id, name)')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('started_at', { ascending: false })
    .limit(3);

  const activeSessions = sessions || [];

  // Cast to GameSessionWithGroup[] to include enable_timer field (for backward compatibility with DB)
  return <AdminPageClient activeSessions={activeSessions as unknown as GameSessionWithGroup[]} />;
}
