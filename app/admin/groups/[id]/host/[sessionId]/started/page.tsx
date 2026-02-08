'use client';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { use } from 'react';
import { FaXmark, FaArrowRight, FaCopy } from 'react-icons/fa6';
import { createClient } from '@/lib/supabase/client';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { endGameSession } from '@/lib/game-utils';
import { getGameSessionWithGroup } from '@/lib/queries';
import { useLoading } from '@/lib/loading-context';
import { LoadingLink } from '@/components/ui/loading-link';
import { GameQRCode } from '@/components/game-qr-code';
import toast from 'react-hot-toast';

export default function GameStartedPage({
  params: paramsPromise,
}: {
  params: Promise<{ id: string; sessionId: string }>;
}) {
  const params = use(paramsPromise);
  const router = useRouter();
  const groupId = params.id;
  const sessionId = params.sessionId;
  const { setLoading } = useLoading();
  const [gameSession, setGameSession] = useState<Awaited<ReturnType<typeof getGameSessionWithGroup>> | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [gameUrl, setGameUrl] = useState('');

  const loadGameSession = useCallback(async () => {
    const supabase = createClient();
    const data = await getGameSessionWithGroup(supabase, sessionId);
    setGameSession(data);
    setInitialized(true);
    setLoading(false);
  }, [sessionId, setLoading]);

  useEffect(() => {
    loadGameSession();
  }, [loadGameSession]);

  // Update game URL when game session loads (client-side only to avoid hydration issues)
  useEffect(() => {
    if (gameSession?.game_code && typeof window !== 'undefined') {
      setGameUrl(`${window.location.origin}/game/join?code=${gameSession.game_code}`);
    }
  }, [gameSession?.game_code]);

  const copyGameCode = () => {
    if (gameSession?.game_code) {
      navigator.clipboard.writeText(gameSession.game_code);
      toast.success('Game code copied!');
    }
  };

  const copyGameUrl = () => {
    if (gameUrl) {
      navigator.clipboard.writeText(gameUrl);
      toast.success('Game link copied!');
    }
  };

  async function cancelGame() {
    if (!gameSession) return;

    const supabase = createClient();
    await endGameSession(supabase, gameSession.id);

    // Navigate back to group
    setLoading(true);
    router.push(`/admin/groups/${groupId}/host`);
  }

  // Show nothing until initialized (global loading overlay handles loading state)
  if (!initialized) {
    return null;
  }

  if (!gameSession) {
    return <p>Game session not found</p>;
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <Card variant="flush" className="bg-linear-to-br from-purple-500/10 via-pink-500/10 to-blue-500/10">
        <CardContent className="flex flex-col gap-8 p-8">
          {/* Header */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-green-500/10 px-4 py-2">
              <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
              <span className="text-sm font-medium text-green-600 dark:text-green-400">Live</span>
            </div>
            <h3 className="text-2xl font-bold">Game Started!</h3>
            <p className="text-muted-foreground text-sm">Players can join using either method below</p>
          </div>

          {/* Code and QR Section */}
          <div className="space-y-4">
            {/* Game Code */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Game Code</label>
              <div className="flex gap-2">
                <div className="bg-muted flex-1 rounded-lg px-4 py-3 text-center font-mono text-2xl font-bold tracking-wider">
                  {gameSession.game_code}
                </div>
                <Button onClick={copyGameCode} variant="outline" size="icon" className="shrink-0">
                  <Icon icon={FaCopy} size="md" />
                </Button>
              </div>
              <p className="text-muted-foreground text-center text-xs">
                Enter at <span className="text-foreground font-mono">/game/join</span>
              </p>
            </div>

            {/* QR Code */}
            {gameSession.game_code && (
              <div className="flex flex-col items-center gap-2">
                <label className="text-sm font-medium">QR Code</label>
                <div className="rounded-lg border bg-white p-4">
                  <GameQRCode gameCode={gameSession.game_code} />
                </div>
                <p className="text-muted-foreground text-center text-xs">Opens with code pre-filled</p>
              </div>
            )}

            {/* Share URL */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Share Link</label>
              <div className="flex gap-2">
                <input type="text" value={gameUrl} readOnly className="bg-muted flex-1 rounded-lg px-3 py-2 text-sm" />
                <Button onClick={copyGameUrl} variant="outline" size="icon" className="shrink-0">
                  <Icon icon={FaCopy} size="md" />
                </Button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-4 sm:flex-row">
            <Button variant="outline" onClick={cancelGame} className="flex flex-1 items-center gap-2">
              <FaXmark className="h-4 w-4" />
              End Game
            </Button>
            <LoadingLink
              href={`/admin/groups/${groupId}/host/${sessionId}/play`}
              className={buttonVariants({ className: 'flex flex-1 items-center gap-2' })}
            >
              <FaArrowRight className="h-4 w-4" />
              Go to Dashboard
            </LoadingLink>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
