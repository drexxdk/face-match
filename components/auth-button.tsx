import Link from 'next/link';
import { buttonVariants } from './ui/button';
import { createClient } from '@/lib/supabase/server';
import { LogoutButton } from './logout-button';
import { Suspense } from 'react';

export async function AuthButton() {
  const supabase = await createClient();

  // You can also use getUser() which will be slower.
  const { data } = await supabase.auth.getClaims();

  const user = data?.claims;

  return (
    <Suspense>
      {user ? (
        <div className="flex items-center gap-4">
          {/* user */}
          <span className="hidden md:inline">Hey, {user.email}!</span>
          <LogoutButton />
        </div>
      ) : (
        <div className="flex gap-2">
          <Link href="/auth/login" className={buttonVariants({ variant: 'outline' })}>
            Sign in
          </Link>
          <Link href="/auth/sign-up" className={buttonVariants({ variant: 'default' })}>
            Sign up
          </Link>
        </div>
      )}
    </Suspense>
  );
}
