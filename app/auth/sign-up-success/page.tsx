'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ErrorMessage } from '@/components/ui/error-message';

export default function Page() {
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [error, setError] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  // Try to get the user's email on mount
  useEffect(() => {
    const getUserEmail = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.email) {
        setUserEmail(user.email);
      } else {
        // If we can't get the email automatically, show manual input
        setShowManualInput(true);
      }
    };

    getUserEmail();
  }, []);

  const handleResendEmail = async () => {
    setIsResending(true);
    setError('');
    setResendMessage('');

    try {
      const supabase = createClient();
      const emailToUse = showManualInput ? manualEmail : userEmail;

      if (!emailToUse) {
        setError('Please enter your email address.');
        return;
      }

      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: emailToUse,
      });

      if (resendError) {
        setError(resendError.message);
      } else {
        setResendMessage('Confirmation email sent! Please check your inbox and spam folder.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend email');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Check your email</CardTitle>
          <CardDescription>We&apos;ve sent you a confirmation link</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-3">
            <p className="text-sm">
              We&apos;ve sent a confirmation email to your inbox. Please click the link in the email to verify your
              account.
            </p>

            <div className="bg-muted rounded-lg p-4">
              <p className="mb-2 text-sm font-medium">📧 Check these locations:</p>
              <ul className="text-muted-foreground list-inside list-disc space-y-1 text-sm">
                <li>Your inbox</li>
                <li>Spam or junk folder</li>
                <li>Promotions tab (Gmail)</li>
              </ul>
            </div>

            <div className="bg-muted rounded-lg p-4">
              <p className="mb-2 text-sm font-medium">⚠️ Didn&apos;t receive an email?</p>
              <ul className="text-muted-foreground list-inside list-disc space-y-1 text-sm">
                <li>Wait a few minutes - emails can take time to arrive</li>
                <li>Check that you entered your email correctly</li>
                <li>Look in your spam folder</li>
                <li>Try resending the confirmation email below</li>
              </ul>
            </div>
          </div>

          {showManualInput && (
            <div className="space-y-2">
              <Label htmlFor="email">Your email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email to resend confirmation"
                value={manualEmail}
                onChange={(e) => setManualEmail(e.target.value)}
                disabled={isResending}
              />
            </div>
          )}

          <ErrorMessage message={error} />
          {resendMessage && <p className="text-sm text-green-600">{resendMessage}</p>}

          <Button onClick={handleResendEmail} disabled={isResending} variant="outline" className="w-full">
            {isResending ? 'Sending...' : 'Resend confirmation email'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
