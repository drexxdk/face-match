'use client';

import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export function LogoutButton() {
  const router = useRouter();

  const logout = async () => {
    // Set flag to indicate intentional logout (not session expiration)
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('intentional_logout', 'true');
    }
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  };

  return <Button onClick={logout}>Logout</Button>;
}
