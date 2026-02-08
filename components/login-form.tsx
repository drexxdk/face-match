'use client';

import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Divider } from '@/components/ui/divider';
import { GoogleAuthButton } from '@/components/google-auth-button';
import { useFormState } from '@/lib/hooks/use-form-state';
import { LoadingLink } from '@/components/ui/loading-link';
import { useRouter } from 'next/navigation';
import { useState, memo, useCallback } from 'react';

export const LoginForm = memo(function LoginForm({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { error, isLoading, execute, setError } = useFormState();
  const router = useRouter();

  const handleLogin = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      await execute(async () => {
        const supabase = createClient();
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          // Enhance error message for invalid credentials to hint at OAuth
          if (error.message.includes('Invalid login credentials') || error.message.includes('Invalid')) {
            throw new Error(
              'Invalid email or password. If you signed up with Google, please use "Continue with Google" instead.',
            );
          }
          throw error;
        }
        router.push('/admin');
      });
    },
    [email, password, execute, router],
  );

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>Enter your email below to login to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} suppressHydrationWarning>
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
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <div className="grid gap-2">
                <Button type="submit" className="w-full" loading={isLoading} loadingText="Logging in...">
                  Login
                </Button>
                <LoadingLink href="/auth/forgot-password" className="w-full" tabIndex={-1}>
                  <Button type="button" variant="ghost" className="w-full" disabled={isLoading}>
                    Forgot your password?
                  </Button>
                </LoadingLink>
              </div>
              <Divider />
              <GoogleAuthButton disabled={isLoading} onError={setError} />
            </div>
            <div className="mt-4 text-center text-sm">
              Don&apos;t have an account?{' '}
              <LoadingLink href="/auth/sign-up" className="underline underline-offset-4">
                Sign up
              </LoadingLink>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
});
