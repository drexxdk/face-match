import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { logError } from '@/lib/logger';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const origin = requestUrl.origin;

  // Handle OAuth errors from provider
  if (error) {
    return NextResponse.redirect(`${origin}/auth/error?error=${encodeURIComponent(error)}`);
  }

  if (code) {
    const supabase = await createClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      logError('Session exchange error:', exchangeError);
      return NextResponse.redirect(`${origin}/auth/error?error=${encodeURIComponent(exchangeError.message)}`);
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(`${origin}/admin`);
}
