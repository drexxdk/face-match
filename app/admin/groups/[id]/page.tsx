import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { GroupDetailClient } from '@/components/group-detail-client';
import type { Group } from '@/lib/schemas';

export default async function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/auth/login');
  }

  // Get group details
  const { data: groupData } = await supabase.from('groups').select('*').eq('id', id).eq('creator_id', user.id).single();

  if (!groupData) {
    return redirect('/admin/groups');
  }

  // Get people in this group
  const { data: people } = await supabase
    .from('people')
    .select('*')
    .eq('group_id', id)
    .order('first_name', { ascending: true });

  return <GroupDetailClient groupData={groupData as unknown as Group} initialPeople={people || []} groupId={id} />;
}
