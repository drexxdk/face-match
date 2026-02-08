'use client';

import { useCallback, useEffect } from 'react';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorMessage } from '@/components/ui/error-message';
import { getActiveGameSessionByCode } from '@/lib/queries';
import { useLoading } from '@/lib/loading-context';
import { sanitizeGameCode, sanitizeName, validateLength } from '@/lib/security';
import { sound, haptic } from '@/lib/sounds';

export default function JoinGamePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const codeFromUrl = searchParams.get('code');
  const [gameCode, setGameCode] = useState(codeFromUrl?.toUpperCase() || '');
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setLoading } = useLoading();

  // Reset loading state and form when returning to this page via back button or history navigation
  useEffect(() => {
    // Reset on mount in case we're returning from a navigation
    setLoading(false);
    setIsSubmitting(false);
    setError(null);
    // Only reset form fields if not coming from QR code
    if (!codeFromUrl) {
      setGameCode('');
      setPlayerName('');
    }

    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        setLoading(false);
        setIsSubmitting(false);
        setError(null);
        setGameCode('');
        setPlayerName('');
      }
    };

    const handlePopState = () => {
      setLoading(false);
      setIsSubmitting(false);
      setError(null);
    };

    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [setLoading, codeFromUrl]);

  const handleJoin = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (isSubmitting) return;

      // Sanitize inputs
      const sanitizedCode = sanitizeGameCode(gameCode);
      const sanitizedName = sanitizeName(playerName);

      if (!sanitizedCode || sanitizedCode.length !== 6) {
        setError('Please enter a valid 6-character game code');
        return;
      }

      if (!sanitizedName || !validateLength(sanitizedName, 50, 1)) {
        setError('Please enter a valid name (1-50 characters)');
        return;
      }

      setError(null);
      setIsSubmitting(true);

      try {
        const supabase = createClient();
        const session = await getActiveGameSessionByCode(supabase, sanitizedCode);

        if (!session) {
          setError('Game not found');
          setIsSubmitting(false);
          return;
        }

        // Game code is valid, redirect to play page
        const joinSessionId = crypto.randomUUID();
        sound.playJoin();
        haptic.medium();
        router.push(
          `/game/play?code=${sanitizedCode}&name=${encodeURIComponent(sanitizedName)}&joinSessionId=${joinSessionId}`,
        );
        // Keep loading state active during navigation - will be reset on unmount or back navigation
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setIsSubmitting(false);
      }
    },
    [gameCode, playerName, router, isSubmitting],
  );

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 bg-linear-to-br from-purple-500 to-pink-500 p-4">
      <Card className="flex w-full max-w-lg flex-col gap-6">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Join Game</CardTitle>
          <CardDescription>Enter the game code to join the fun!</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleJoin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Input
                placeholder="Game Code"
                value={gameCode}
                onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="text-center text-2xl font-bold tracking-widest"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Input
                placeholder="Your Name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                maxLength={20}
                required
                disabled={isSubmitting}
              />
            </div>

            <ErrorMessage message={error} />

            <Button
              type="submit"
              disabled={isSubmitting || !gameCode || !playerName}
              className="w-full"
              size="lg"
              loading={isSubmitting}
              loadingText="Joining..."
            >
              Join Game
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
