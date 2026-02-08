'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InfoListCard } from '@/components/ui/section-card';
import { Badge } from '@/components/ui/badge';
import { ErrorMessage } from '@/components/ui/error-message';
import { endGameSession } from '@/lib/game-utils';
import { useLoading } from '@/lib/loading-context';
import { LoadingLink } from '@/components/ui/loading-link';
import { logger } from '@/lib/logger';
import { use } from 'react';
import type { GameSessionWithGroup } from '@/lib/schemas';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface Player {
  id: string;
  name: string;
  correct: number;
  wrong: number;
  missing: number;
  answered: boolean;
  isActive: boolean;
}

export default function GameControlPage({
  params: paramsPromise,
}: {
  params: Promise<{ id: string; sessionId: string }>;
}) {
  const params = use(paramsPromise);
  const sessionId = params.sessionId;
  const router = useRouter();
  const { setLoading } = useLoading();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gameSession, setGameSession] = useState<GameSessionWithGroup | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameCode, setGameCode] = useState('');

  // Track online players via Presence (Set of joinRecordIds)
  const onlinePlayerIdsRef = useRef<Set<string>>(new Set());
  const presenceChannelRef = useRef<RealtimeChannel | null>(null);

  const loadGameSession = useCallback(
    async (currentOnlineIds?: Set<string>) => {
      const supabase = createClient();

      // Use provided online IDs or fall back to ref (ref always has latest value)
      const activeOnlineIds = currentOnlineIds ?? onlinePlayerIdsRef.current;

      // Get game session
      const { data: session } = await supabase
        .from('game_sessions')
        .select('*, groups(*)')
        .eq('id', sessionId)
        .single();

      if (!session) {
        setError('Game session not found!');
        setIsLoading(false);
        return;
      }

      // Cast to GameSessionWithGroup type to include enable_timer field (for backward compatibility with DB)
      setGameSession(session as unknown as GameSessionWithGroup);
      setGameCode(session.game_code || 'N/A');

      // Get all unique players who have joined (even if they haven't answered yet)
      const { data: answers } = await supabase.from('game_answers').select('*').eq('session_id', sessionId);

      logger.log('Fetched game_answers for sessionId', sessionId, ':', answers);

      // Count occurrences of each player name (only join records where correct_option_id is null)
      // Sort by created_at to maintain join order
      // Note: Append 'Z' to treat timestamps as UTC since Postgres returns timestamp without timezone
      const joinRecords = (answers?.filter((a) => !a.correct_option_id) || []).sort((a, b) => {
        const timeA = a.created_at ? new Date(a.created_at + 'Z').getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at + 'Z').getTime() : 0;
        return timeA - timeB;
      });
      const nameCounts = new Map<string, number>();
      const nameIndices = new Map<string, number>();

      joinRecords.forEach((record) => {
        const playerName = record.player_name || 'Anonymous';
        nameCounts.set(playerName, (nameCounts.get(playerName) || 0) + 1);
      });

      // Track unique players by their join record's join_id (one entry per join record)
      const playerStats = new Map<
        string,
        {
          name: string;
          correct: number;
          wrong: number;
          missing: number;
          isActive: boolean;
          displayName: string;
          dbId: string; // Database ID for presence tracking
        }
      >();

      // First pass: create one player entry for each join record
      joinRecords.forEach((joinRecord) => {
        const playerName = joinRecord.player_name || 'Anonymous';
        const isDuplicate = nameCounts.get(playerName)! > 1;

        const currentIndex = (nameIndices.get(playerName) || 0) + 1;
        nameIndices.set(playerName, currentIndex);

        const displayName = isDuplicate ? `${playerName} (${currentIndex})` : playerName;

        // Check if player is active based on Presence (uses database ID)
        const isActive = activeOnlineIds.has(joinRecord.id);

        // Use join_id as the key since answers reference this field
        const joinId = joinRecord.join_id || joinRecord.id;
        playerStats.set(joinId, {
          name: playerName,
          correct: 0,
          wrong: 0,
          missing: 0,
          isActive,
          displayName,
          dbId: joinRecord.id,
        });
      });

      // Second pass: count answers for each player
      if (answers && answers.length > 0) {
        const joinIds = Array.from(playerStats.keys());
        logger.log('Available join IDs in playerStats:', joinIds);

        const answerRecords = answers.filter((a) => a.correct_option_id);
        logger.log('Answer records found:', answerRecords.length);
        logger.log(
          'Answer records join_ids:',
          answerRecords.map((a) => ({
            join_id: a.join_id,
            is_correct: a.is_correct,
            player_name: a.player_name,
          })),
        );

        answers.forEach((answer) => {
          const playerName = answer.player_name || 'Anonymous';

          // Count actual answers (records where correct_option_id is NOT null)
          if (answer.correct_option_id) {
            logger.log(
              'Processing answer for',
              playerName,
              'with join_id:',
              answer.join_id,
              'has in stats:',
              playerStats.has(answer.join_id || ''),
            );
            if (answer.join_id && playerStats.has(answer.join_id)) {
              const stats = playerStats.get(answer.join_id)!;
              if (answer.is_correct) {
                stats.correct++;
              } else {
                stats.wrong++;
              }
            } else {
              logger.log('Answer skipped - join_id not found in playerStats');
            }
          }
        });
      }

      logger.log(
        'Final player stats:',
        Array.from(playerStats.entries()).map(([, stats]) => ({
          name: stats.displayName,
          isActive: stats.isActive,
        })),
      );

      const totalQuestions = session.total_questions ?? 10;
      const activePlayers: Player[] = Array.from(playerStats.entries()).map(([, stats]) => {
        const total = stats.correct + stats.wrong;
        const missing = Math.max(0, totalQuestions - total);

        return {
          id: stats.dbId, // Use database ID for presence tracking
          name: stats.displayName,
          correct: stats.correct,
          wrong: stats.wrong,
          missing: missing,
          answered: total === totalQuestions,
          isActive: stats.isActive,
        };
      });

      logger.log('Active players found:', activePlayers);

      setPlayers(
        activePlayers.length > 0
          ? activePlayers
          : [
              {
                id: '1',
                name: 'Waiting for players...',
                correct: 0,
                wrong: 0,
                missing: 0,
                answered: false,
                isActive: false,
              },
            ],
      );
      setIsLoading(false);
      setLoading(false); // Reset global loading
    },
    [sessionId, setLoading],
  );

  // Initial load
  useEffect(() => {
    loadGameSession();
  }, [loadGameSession]);

  // Set up Presence tracking for real-time player online/offline status
  useEffect(() => {
    const supabase = createClient();
    const channelName = `presence:game:${sessionId}`;

    logger.log('Host setting up presence channel:', channelName);

    const channel = supabase.channel(channelName);
    presenceChannelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        logger.log('🟢 Presence sync:', state);

        // Extract all online joinRecordIds from presence state
        const onlineIds = new Set<string>();
        Object.values(state).forEach((presences) => {
          (presences as Array<{ joinRecordId?: string }>).forEach((presence) => {
            if (presence.joinRecordId) {
              onlineIds.add(presence.joinRecordId);
            }
          });
        });

        logger.log('Online player IDs:', Array.from(onlineIds));
        onlinePlayerIdsRef.current = onlineIds;

        // Reload game session with new online IDs
        loadGameSession(onlineIds);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        logger.log('🟢 Player joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        logger.log('🔴 Player left:', key, leftPresences);
      })
      .subscribe((status) => {
        logger.log('Presence subscription status:', status);
      });

    return () => {
      logger.log('Cleaning up presence channel');
      supabase.removeChannel(channel);
      presenceChannelRef.current = null;
    };
  }, [sessionId, loadGameSession]);

  // Set up real-time subscription for player answers (DB changes)
  useEffect(() => {
    logger.log('Setting up subscription for sessionId:', sessionId);
    const supabase = createClient();

    const channel = supabase
      .channel(`game:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_answers',
        },
        (payload) => {
          logger.log('🔔 REAL-TIME UPDATE RECEIVED:', payload);
          // Only reload if it's for this session
          const newSessionId = (payload.new as { session_id?: string } | null)?.session_id;
          const oldSessionId = (payload.old as { session_id?: string } | null)?.session_id;
          if (newSessionId === sessionId || oldSessionId === sessionId) {
            logger.log('✅ Update is for this session, reloading...');
            loadGameSession();
          }
        },
      )
      .subscribe((status, err) => {
        logger.log('📡 Subscription status:', status);
        if (err) {
          logger.error('❌ Subscription error:', err);
        }
        if (status === 'SUBSCRIBED') {
          logger.log('✅ Successfully subscribed to game_answers');
        }
      });

    logger.log('Subscription channel created:', channel);

    return () => {
      logger.log('Cleaning up subscription for sessionId:', sessionId);
      supabase.removeChannel(channel);
    };
  }, [sessionId, loadGameSession]);

  const endGame = async () => {
    setLoading(true);
    const supabase = createClient();
    await endGameSession(supabase, sessionId);
    router.push('/admin');
  };

  if (isLoading) {
    return null; // Global loading overlay will show
  }

  if (!gameSession) {
    return (
      <Card className="w-full max-w-md">
        <CardContent>
          <ErrorMessage message={error || 'Game session not found'} size="lg" className="text-center" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">{gameSession.groups?.name || 'Game Session'}</CardTitle>
            <Badge className="px-4 py-2 font-mono text-lg">{gameCode}</Badge>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
            <div className="bg-muted rounded p-3">
              <p className="text-muted-foreground">Type</p>
              <p className="font-semibold">
                {gameSession.game_type === 'guess_name' ? 'Guess the Name' : 'Guess the Face'}
              </p>
            </div>
            <div className="bg-muted rounded p-3">
              <p className="text-muted-foreground">Time Limit</p>
              <p className="font-semibold">{gameSession.time_limit_seconds || 30}s</p>
            </div>
            <div className="bg-muted rounded p-3">
              <p className="text-muted-foreground">Options</p>
              <p className="font-semibold">{gameSession.options_count || 4}</p>
            </div>
            <div className="bg-muted rounded p-3">
              <p className="text-muted-foreground">Questions</p>
              <p className="font-semibold">{gameSession.total_questions}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            <Button onClick={endGame} variant="destructive" className="flex-1">
              End Game
            </Button>
            <LoadingLink
              href="/admin"
              className={buttonVariants({
                variant: 'outline',
                className: 'flex-1',
              })}
            >
              Back to Dashboard
            </LoadingLink>
          </div>
        </CardContent>
      </Card>

      {/* Players List */}
      <Card>
        <CardHeader>
          <CardTitle>Players ({players.length})</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-2">
            {players.map((player) => (
              <div key={player.id} className="bg-muted flex items-center justify-between gap-3 rounded-lg p-3">
                <div className="flex items-center gap-3 overflow-hidden text-ellipsis whitespace-nowrap">
                  <div
                    className={`h-3 w-3 shrink-0 rounded-full ${player.isActive ? 'bg-green-500' : 'bg-gray-300'}`}
                  />
                  <span className="overflow-hidden font-medium text-ellipsis whitespace-nowrap">{player.name}</span>
                </div>
                <div className="text-muted-foreground shrink-0 space-x-2 text-sm">
                  {player.correct > 0 && (
                    <Badge variant="default" className="bg-green-600 hover:bg-green-600">
                      {player.correct} correct
                    </Badge>
                  )}
                  {player.wrong > 0 && (
                    <Badge variant="destructive" className="hover:bg-destructive">
                      {player.wrong} wrong
                    </Badge>
                  )}
                  {player.missing > 0 && (
                    <Badge variant="secondary" className="hover:bg-secondary">
                      {player.missing} missing
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <InfoListCard
        title="How to Play"
        items={[
          `Share the game code ${gameCode} with players`,
          'Players visit your-app.com/game/join and enter the code',
          'Players will see questions and answer in real-time',
          'Monitor player progress from this dashboard',
          'Click "End Game" when everyone is done',
        ]}
        ordered={true}
      />
    </div>
  );
}
