'use client';

import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFormState } from '@/lib/hooks/use-form-state';
import { LoadingLink } from '@/components/ui/loading-link';
import { useState, memo, useCallback } from 'react';

export const ForgotPasswordForm = memo(function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState(false);
  const { error, isLoading, execute } = useFormState();

  const handleForgotPassword = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      await execute(async () => {
        const supabase = createClient();
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/update-password`,
        });
        if (error) throw error;
        setSuccess(true);
      });
    },
    [email, execute],
  );

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      {success ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Check Your Email</CardTitle>
            <CardDescription>Password reset instructions sent</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              If you registered using your email and password, you will receive a password reset email.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Reset Your Password</CardTitle>
            <CardDescription>Type in your email and we&apos;ll send you a link to reset your password</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleForgotPassword} suppressHydrationWarning>
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
                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button type="submit" className="w-full" loading={isLoading} loadingText="Sending...">
                  Send reset email
                </Button>
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
      )}
    </div>
  );
});
