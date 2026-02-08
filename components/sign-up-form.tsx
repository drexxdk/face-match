'use client';

import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Divider } from '@/components/ui/divider';
import { GoogleAuthButton } from '@/components/google-auth-button';
import { PasswordStrengthMeter, usePasswordStrength } from '@/components/password-strength';
import { useFormState } from '@/lib/hooks/use-form-state';
import { LoadingLink } from '@/components/ui/loading-link';
import { useRouter } from 'next/navigation';
import { useState, memo, useCallback } from 'react';

export const SignUpForm = memo(function SignUpForm({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const { error, isLoading, execute, setError } = useFormState();
  const router = useRouter();
  const passwordStrength = usePasswordStrength(password);

  const handleSignUp = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (password !== repeatPassword) {
        setError('Passwords do not match');
        return;
      }

      if (passwordStrength.score < 2) {
        setError('Please choose a stronger password');
        return;
      }

      await execute(async () => {
        const supabase = createClient();
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/admin`,
          },
        });
        if (error) throw error;

        // Log the response for debugging
        console.log('Sign up response:', {
          user: data.user,
          session: data.session,
          identities: data.user?.identities?.length,
          providers: data.user?.identities?.map((i) => i.provider),
          app_metadata: data.user?.app_metadata,
        });

        // CRITICAL CHECK: If identities array is empty (length 0), the email provider wasn't added
        // This means the user already exists with a different provider (like Google)
        if (data.user && data.user.identities && data.user.identities.length === 0) {
          // Check app_metadata to see what provider they originally used
          const providers = (data.user.app_metadata?.providers as string[]) || [];
          console.log('User exists with providers:', providers);

          // Find the OAuth provider (anything that's not 'email')
          const oauthProvider = providers.find((p) => p !== 'email');

          if (oauthProvider) {
            const providerName =
              oauthProvider === 'google' ? 'Google' : oauthProvider.charAt(0).toUpperCase() + oauthProvider.slice(1);
            throw new Error(
              `This email is already registered with ${providerName}. Please sign in using the "Continue with ${providerName}" button instead.`,
            );
          } else {
            // If we can't determine the provider, give a generic message
            throw new Error(
              'This email is already registered with a different sign-in method. Please try signing in with Google or another method.',
            );
          }
        }

        // Check if email confirmation is required
        // If user exists but session is null, email confirmation is required
        if (data.user && !data.session) {
          console.log('Email confirmation required for user:', data.user.email);
          router.push('/auth/sign-up-success');
        } else if (data.session) {
          // User is immediately logged in (email confirmation disabled)
          console.log('User logged in immediately (no email confirmation required)');
          router.push('/admin');
        } else {
          // Fallback
          router.push('/auth/sign-up-success');
        }
      });
    },
    [email, password, repeatPassword, passwordStrength.score, execute, setError, router],
  );

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Sign up</CardTitle>
          <CardDescription>
            Create an account to host icebreaker games that help people get to know each other
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp} suppressHydrationWarning>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
                <PasswordStrengthMeter password={password} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="repeat-password">Repeat Password</Label>
                <Input
                  id="repeat-password"
                  type="password"
                  required
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full" loading={isLoading} loadingText="Creating an account...">
                Sign up
              </Button>
              <Divider />
              <GoogleAuthButton label="Sign up with Google" disabled={isLoading} onError={setError} />
            </div>
            <div className="mt-4 text-center text-sm">
              Already have an account?{' '}
              <LoadingLink href="/auth/login" className="underline underline-offset-4">
                Login
              </LoadingLink>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
});
