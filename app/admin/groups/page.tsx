import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { GroupsList } from '@/components/groups-list';

export default async function GroupsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/auth/login');
  }

  // Get groups for this user
  const { data: groups } = await supabase
    .from('groups')
    .select(
      `
      *,
      people:people(count)
    `,
    )
    .eq('creator_id', user.id)
    .order('created_at', { ascending: false });

  return <GroupsList groups={groups} />;
}
