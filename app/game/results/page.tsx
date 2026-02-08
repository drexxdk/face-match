'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Confetti } from '@/components/ui/confetti';
import { sound } from '@/lib/sounds';
import { createClient } from '@/lib/supabase/client';
import { logger, logError } from '@/lib/logger';
import { useRealtimeSubscription, getPayloadNew } from '@/lib/hooks/use-realtime';
import { getGameSessionStatus, getPlayerJoinRecord } from '@/lib/queries';
import { useLoading } from '@/lib/loading-context';

interface GameSessionStatus extends Record<string, unknown> {
  status: string;
}

export default function GameResultsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [gameEnded, setGameEnded] = useState<boolean>(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const { setLoading } = useLoading();

  // Reset navigation state when returning to this page
  useEffect(() => {
    setIsNavigating(false);
    setLoading(false);

    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        setIsNavigating(false);
        setLoading(false);
      }
    };

    const handlePopState = () => {
      setIsNavigating(false);
      setLoading(false);
    };

    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [setLoading]);

  const score = parseInt(searchParams?.get('score') || '0');
  const total = parseInt(searchParams?.get('total') || '0');
  const sessionId = searchParams?.get('session') || '';
  const gameCode = searchParams?.get('code') || sessionStorage.getItem('lastGameCode') || '';
  const playerName = searchParams?.get('name') || sessionStorage.getItem('lastPlayerName') || '';
  const joinRecordId = searchParams?.get('joinRecordId') || '';
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

  // Play success sound for good scores
  useEffect(() => {
    if (percentage >= 75) {
      setTimeout(() => sound.playSuccess(), 500);
    }
  }, [percentage]);

  // Track presence on results page so host still sees player as active
  useEffect(() => {
    if (!sessionId || !joinRecordId || !playerName) return;

    const supabase = createClient();
    const channelName = `presence:game:${sessionId}`;

    logger.log('Setting up presence tracking on results page for player:', playerName, 'joinRecordId:', joinRecordId);

    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: joinRecordId,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        logger.log('Results page presence sync:', state);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            joinRecordId,
            playerName,
            status: 'finished',
            online_at: new Date().toISOString(),
          });
          logger.log('Results page presence tracked successfully');
        }
      });

    return () => {
      logger.log('Cleaning up results page presence for player:', playerName);
      channel.untrack();
      supabase.removeChannel(channel);
    };
  }, [sessionId, joinRecordId, playerName]);

  // Check initial game session status
  useEffect(() => {
    if (!sessionId) return;

    const checkGameStatus = async () => {
      try {
        const supabase = createClient();
        const session = await getGameSessionStatus(supabase, sessionId);
        setGameEnded(session?.status === 'completed');
      } catch (error) {
        logError('Error checking game status:', error);
      }
    };

    checkGameStatus();
  }, [sessionId]);

  // Watch for game session status changes
  const handleSessionUpdate = useCallback((payload: Parameters<typeof getPayloadNew<GameSessionStatus>>[0]) => {
    const newData = getPayloadNew<GameSessionStatus>(payload);
    if (newData?.status) {
      setGameEnded(newData.status === 'completed');
    }
  }, []);

  const realtimeConfig = useMemo(
    () =>
      sessionId
        ? {
            channelName: `game-results:${sessionId}`,
            table: 'game_sessions',
            event: 'UPDATE' as const,
            filter: `id=eq.${sessionId}`,
            onEvent: handleSessionUpdate,
          }
        : null,
    [sessionId, handleSessionUpdate],
  );

  useRealtimeSubscription<GameSessionStatus>(realtimeConfig);

  const handlePlayAgain = async () => {
    if (isNavigating) return;
    setIsNavigating(true);

    if (gameEnded) {
      // Game has been ended by host, send them back to join
      router.replace('/game/join');
      return;
    }

    if (gameCode && playerName) {
      try {
        // Clear all previous data for this player in this session before restarting
        const supabase = createClient();

        logger.log('[handlePlayAgain] Starting retry for:', playerName);

        // First, find the join record for this player
        const joinRecord = await getPlayerJoinRecord(supabase, sessionId, playerName);
        const joinRecordId = joinRecord?.id;
        logger.log('[handlePlayAgain] Found join record:', joinRecordId);

        // Delete only the actual answers (not the join tracking record)
        // Join tracking records have correct_option_id = null, so we only delete where it's not null
        const { error: deleteError } = await supabase
          .from('game_answers')
          .delete()
          .eq('session_id', sessionId)
          .eq('player_name', playerName)
          .not('correct_option_id', 'is', null);

        if (deleteError) {
          logError('Error deleting answers:', deleteError);
        } else {
          logger.log('[handlePlayAgain] Answers deleted successfully');
        }

        // Touch the join record by updating it to trigger host's real-time subscription
        // This ensures the host sees the updated player list immediately
        if (joinRecordId) {
          logger.log('[handlePlayAgain] Touching join record to trigger host update');
          const { error: touchError } = await supabase
            .from('game_answers')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', joinRecordId);

          if (touchError) {
            logError('Error touching join record:', touchError);
          } else {
            logger.log('[handlePlayAgain] Join record touched successfully');
          }
        }

        // Clear all sessionStorage entries for this game/player
        Object.keys(sessionStorage).forEach((key) => {
          if (key.includes(gameCode) && key.includes(playerName)) {
            logger.log('[handlePlayAgain] Clearing sessionStorage:', key);
            sessionStorage.removeItem(key);
          }
        });

        // Wait a brief moment to ensure Supabase has fully processed the updates
        // and broadcasted the changes to subscribed clients
        await new Promise((resolve) => setTimeout(resolve, 300));

        logger.log('[handlePlayAgain] Redirecting to play page with retry flag');

        // Generate a new joinSessionId for the retry
        const newJoinSessionId = crypto.randomUUID();

        // Redirect to play page with retry flag to force fresh start
        router.replace(
          `/game/play?code=${gameCode}&name=${encodeURIComponent(playerName)}&joinSessionId=${newJoinSessionId}&retry=true`,
        );
      } catch (err) {
        logError('Error in handlePlayAgain:', err);
        // Even if there's an error, still try to navigate with retry flag
        const newJoinSessionId = crypto.randomUUID();
        router.replace(
          `/game/play?code=${gameCode}&name=${encodeURIComponent(playerName)}&joinSessionId=${newJoinSessionId}&retry=true`,
        );
      }
    } else {
      router.replace('/game/join');
    }
  };

  const getGrade = () => {
    if (percentage >= 90)
      return {
        emoji: '🌟',
        text: 'You Know Everyone!',
        color: 'text-yellow-500',
      };
    if (percentage >= 75) return { emoji: '🎉', text: 'Great Memory!', color: 'text-green-500' };
    if (percentage >= 60) return { emoji: '👍', text: 'Getting There!', color: 'text-blue-500' };
    if (percentage >= 40) return { emoji: '📚', text: 'Learning!', color: 'text-orange-500' };
    return { emoji: '💪', text: 'Keep Learning!', color: 'text-red-500' };
  };

  const grade = getGrade();

  return (
    <div className="flex grow flex-col items-center justify-center gap-2 bg-linear-to-br from-purple-500 to-pink-500 p-4">
      {percentage >= 75 && <Confetti />}
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mt-8 mb-4 animate-bounce text-6xl">{grade.emoji}</div>
          <CardTitle className={`text-4xl font-bold ${grade.color}`}>{grade.text}</CardTitle>
          <CardDescription className="mt-2 text-lg">
            You know {score} out of {total} people
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="text-center">
            <div className="mb-2 text-6xl font-bold">{percentage}%</div>
            <p className="text-muted-foreground">Accuracy</p>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">{score}</div>
              <p className="text-muted-foreground text-sm">Correct</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{total - score}</div>
              <p className="text-muted-foreground text-sm">Wrong</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{total}</div>
              <p className="text-muted-foreground text-sm">Total</p>
            </div>
          </div>

          {total - score > 0 && (
            <div className="rounded-lg border border-purple-200 bg-linear-to-r from-purple-50 to-pink-50 p-4">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-900">
                <span>💬</span>
                Keep the Conversation Going!
              </h3>
              <p className="mb-2 text-xs text-gray-700">
                Great opportunity to connect with {total - score > 1 ? 'the people' : 'the person'} you didn&apos;t
                recognize:
              </p>
              <ul className="flex flex-col gap-1 text-xs text-gray-700">
                <li>• Introduce yourself and share something interesting about you</li>
                <li>• Ask about their hobbies or background</li>
                <li>• Find common interests or connections</li>
                {percentage >= 50 && <li>• Help others make connections too!</li>}
              </ul>
            </div>
          )}

          {score === total && total > 0 && (
            <div className="rounded-lg border border-green-200 bg-linear-to-r from-green-50 to-emerald-50 p-4">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-900">
                <span>🌟</span>
                You&apos;re a Connection Pro!
              </h3>
              <p className="text-xs text-gray-700">
                Now that you know everyone, help others feel welcome! Introduce people who don&apos;t know each other
                and share fun facts you&apos;ve learned.
              </p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            {gameEnded ? (
              <>
                <div className="mb-2 rounded-lg bg-orange-50 p-3 text-center text-black">
                  <p className="text-sm font-medium">Game has ended</p>
                </div>
                <Button
                  onClick={() => {
                    setIsNavigating(true);
                    router.push('/game/join');
                  }}
                  disabled={isNavigating}
                  loading={isNavigating}
                  className="w-full"
                >
                  Join New Game
                </Button>
                <Link
                  href="/game/join"
                  className={buttonVariants({
                    variant: 'outline',
                    className: 'w-full',
                  })}
                >
                  Back to Home
                </Link>
              </>
            ) : (
              <>
                <Button
                  onClick={handlePlayAgain}
                  disabled={isNavigating}
                  loading={isNavigating}
                  loadingText="Starting..."
                  className="w-full"
                >
                  Play Again
                </Button>
                <Link
                  href="/game/join"
                  className={buttonVariants({
                    variant: 'outline',
                    className: 'w-full',
                  })}
                >
                  Back to Home
                </Link>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
