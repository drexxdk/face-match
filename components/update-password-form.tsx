'use client';

import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordStrengthMeter, usePasswordStrength } from '@/components/password-strength';
import { useFormState } from '@/lib/hooks/use-form-state';
import { useRouter } from 'next/navigation';
import { useState, memo, useCallback, useEffect } from 'react';

export const UpdatePasswordForm = memo(function UpdatePasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const { error, isLoading, execute, setError } = useFormState();
  const router = useRouter();
  const passwordStrength = usePasswordStrength(password);

  // Fetch user email for password manager
  useEffect(() => {
    const fetchUserEmail = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.email) {
        setEmail(user.email);
      }
    };
    fetchUserEmail();
  }, []);

  const handleUpdatePassword = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (passwordStrength.score < 2) {
        setError('Please choose a stronger password');
        return;
      }

      await execute(async () => {
        const supabase = createClient();
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        router.push('/admin');
      });
    },
    [password, passwordStrength.score, execute, setError, router],
  );

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Reset Your Password</CardTitle>
          <CardDescription>Please enter your new password below.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdatePassword} suppressHydrationWarning>
            <div className="flex flex-col gap-6">
              {/* Hidden email field for password managers */}
              <input
                type="email"
                name="email"
                value={email}
                autoComplete="username"
                readOnly
                aria-hidden="true"
                tabIndex={-1}
                style={{ position: 'absolute', left: '-9999px' }}
              />
              <div className="grid gap-2">
                <Label htmlFor="password">New password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="New password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
                <PasswordStrengthMeter password={password} />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full" loading={isLoading} loadingText="Saving...">
                Save new password
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
});
