'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCheck, FaXmark } from 'react-icons/fa6';
import { createClient } from '@/lib/supabase/client';
import { markPlayerAsLeft } from '@/app/actions/mark-player-left';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ErrorMessage } from '@/components/ui/error-message';
import { CircularProgress } from '@/components/ui/progress';
import { KeyboardShortcuts } from '@/lib/keyboard-shortcuts';
import { sound, haptic } from '@/lib/sounds';
import { logger, logError, getErrorMessage } from '@/lib/logger';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { Person, GameSession, GameType } from '@/lib/schemas';
import { useLoading } from '@/lib/loading-context';
import { useGameImagePreload } from '@/lib/hooks/use-image-preload';

interface Question {
  person: Person;
  options: Person[];
}

export default function GamePlayPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const gameCode = searchParams?.get('code');
  const playerName = searchParams?.get('name');
  const joinSessionId = searchParams?.get('joinSessionId'); // Unique ID for this join instance
  const retry = searchParams?.get('retry'); // Flag to indicate this is a retry/fresh start

  const [loading, setLoadingState] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const { setLoading: setGlobalLoading } = useLoading();

  // Ref to prevent double execution of loadGame (React StrictMode)
  const isLoadingGameRef = useRef(false);
  const hasLoadedRef = useRef(false);
  const lastJoinSessionIdRef = useRef<string | null>(null);

  // Reset refs when joinSessionId changes (new game session)
  useEffect(() => {
    if (joinSessionId && joinSessionId !== lastJoinSessionIdRef.current) {
      // New session - reset the loading guards
      hasLoadedRef.current = false;
      isLoadingGameRef.current = false;
      lastJoinSessionIdRef.current = joinSessionId;
    }
  }, [joinSessionId]);

  // Sync local loading state with global loading context
  const setLoading = useCallback(
    (value: boolean) => {
      setLoadingState(value);
      setGlobalLoading(value);
    },
    [setGlobalLoading],
  );
  const [error, setError] = useState<string | null>(null);
  const [gameSession, setGameSession] = useState<GameSession | null>(null);
  const [joinRecordId, setJoinRecordId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [answered, setAnswered] = useState(false);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState<boolean | null>(null);

  // Preload next question images for better UX
  useGameImagePreload(currentQuestion, questions);

  // Validate required search params and redirect if missing
  useEffect(() => {
    const hasParams = gameCode && playerName;

    if (!hasParams) {
      setGlobalLoading(false);
      router.replace('/game/join');
    } else {
      setInitialized(true);
    }
  }, [gameCode, playerName, router, setGlobalLoading]);

  // Handle browser back button
  useEffect(() => {
    const handlePopState = () => {
      // When user navigates back, immediately redirect to ensure we don't show loading
      if (!gameCode || !playerName) {
        router.replace('/game/join');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [gameCode, playerName, router]);

  const generateQuestions = useCallback(
    (allPeople: Person[], gameType: GameType, count: number, optionsCount: number): Question[] => {
      if (allPeople.length < 2) {
        setError('Not enough people in this group to play!');
        return [];
      }

      const shuffled = [...allPeople].sort(() => Math.random() - 0.5);
      const questionList: Question[] = [];

      for (let i = 0; i < Math.min(count, shuffled.length); i++) {
        const correctPerson = shuffled[i];

        // Get wrong options based on options_count (e.g., if options_count is 3, we need 2 wrong options + 1 correct)
        const numWrongOptions = Math.max(1, optionsCount - 1);

        // Filter candidates by the same gender as the correct person
        const samGenderPeople = allPeople.filter((p) => p.id !== correctPerson.id && p.gender === correctPerson.gender);

        // If not enough same gender people, fall back to any gender
        const candidates =
          samGenderPeople.length >= numWrongOptions
            ? samGenderPeople
            : allPeople.filter((p) => p.id !== correctPerson.id);

        const wrongOptions = candidates
          .sort(() => Math.random() - 0.5)
          .slice(0, Math.min(numWrongOptions, candidates.length));

        const options = [...wrongOptions, correctPerson].sort(() => Math.random() - 0.5);

        questionList.push({
          person: correctPerson,
          options,
        });
      }

      logger.log('generateQuestions: Created', questionList.length, 'questions');
      return questionList;
    },
    [],
  );

  const loadGame = useCallback(async () => {
    // Guard against null values - early return if missing
    if (!gameCode || !playerName) {
      return;
    }

    // Prevent double execution (React StrictMode or rapid re-renders)
    if (isLoadingGameRef.current) {
      logger.log('[loadGame] Already loading, skipping duplicate call');
      return;
    }

    // For the same joinSessionId, only load once
    if (hasLoadedRef.current && !retry) {
      logger.log('[loadGame] Already loaded for this session, skipping');
      return;
    }

    isLoadingGameRef.current = true;

    try {
      logger.log('[loadGame] Starting loadGame');
      // Reset all game state at the start
      setLoading(true);
      setCurrentQuestion(0);
      setScore(0);
      setAnswered(false);
      setSelectedAnswer(null);
      setTimeLeft(30); // Will be overridden once gameSession loads
      setLastAnswerCorrect(null);

      const supabase = createClient();

      // Store game code and player name for "Play Again" feature
      sessionStorage.setItem('lastGameCode', gameCode);
      sessionStorage.setItem('lastPlayerName', playerName);

      // Find game session by code (allow any status so player can rejoin and try again)
      const { data: session } = await supabase.from('game_sessions').select('*').eq('game_code', gameCode).single();

      if (!session) {
        logError('Game session not found for code:', gameCode);
        setError('Game not found!');
        setLoading(false);
        return;
      }

      // Cast to GameSession type to include enable_timer field (for backward compatibility with DB)
      setGameSession(session as unknown as GameSession);

      // Always clear any leftover data to start fresh
      // This ensures clean state when player rejoins/tries again
      sessionStorage.removeItem(`questionStartTime_${session.id}_${playerName}`);
      sessionStorage.removeItem(`joinRecordId_${gameCode}_${playerName}`);

      // Create or reuse join record for this player instance
      let currentJoinRecordId: string | null = null;

      if (joinSessionId) {
        // If this is a retry, look for existing join record by player name first
        if (retry === 'true') {
          const { data: existingByName } = await supabase
            .from('game_answers')
            .select('id, is_active, join_id')
            .eq('session_id', session.id)
            .eq('player_name', playerName)
            .is('correct_option_id', null)
            .order('created_at', { ascending: false })
            .limit(1);

          const [existingRecord] = existingByName ?? [];
          if (existingRecord) {
            logger.log('Player retrying - reusing existing join record:', existingRecord.id);
            currentJoinRecordId = existingRecord.id;

            // Update the join record to be active AND update join_id to match new joinSessionId
            await supabase
              .from('game_answers')
              .update({
                is_active: true,
                join_id: joinSessionId, // Update to new joinSessionId so answers match
                updated_at: new Date().toISOString(),
              })
              .eq('id', existingRecord.id);
          }
        }

        // If not a retry or no existing record found, check by join_id (joinSessionId stored as join_id)
        if (!currentJoinRecordId) {
          const { data: existingJoins } = await supabase
            .from('game_answers')
            .select('id, is_active')
            .eq('session_id', session.id)
            .eq('join_id', joinSessionId)
            .is('correct_option_id', null)
            .limit(1);

          const [existingJoin] = existingJoins ?? [];
          if (existingJoin) {
            logger.log('Player rejoining - using existing join record:', existingJoin.id);
            currentJoinRecordId = existingJoin.id;

            // Re-mark as active if needed
            if (!existingJoin.is_active) {
              await supabase.from('game_answers').update({ is_active: true }).eq('id', existingJoin.id);
            }
          }
        }

        // Only create a new record if we didn't find an existing one
        if (!currentJoinRecordId) {
          // Create new join record - database has unique constraint to prevent duplicates
          logger.log('Creating new join tracking record:', {
            session_id: session.id,
            player_name: playerName,
            join_id: joinSessionId,
          });
          const { data: joinData, error: insertError } = await supabase
            .from('game_answers')
            .insert({
              session_id: session.id,
              player_name: playerName,
              is_correct: false,
              response_time_ms: 0,
              is_active: true,
              join_id: joinSessionId,
            })
            .select('id');

          if (insertError) {
            // Check if it's a duplicate key error (race condition - record was created by another call)
            if (insertError.code === '23505') {
              logger.log('Duplicate key - fetching existing record created by race condition');
              const { data: raceJoins } = await supabase
                .from('game_answers')
                .select('id')
                .eq('session_id', session.id)
                .eq('join_id', joinSessionId)
                .is('correct_option_id', null)
                .limit(1);
              const [raceJoin] = raceJoins ?? [];
              currentJoinRecordId = raceJoin?.id ?? null;
            } else {
              logError('Error inserting join tracking:', insertError);
            }
          } else {
            const [joinRecord] = joinData ?? [];
            currentJoinRecordId = joinRecord?.id ?? null;
            logger.log('Join tracking inserted successfully, ID:', currentJoinRecordId);
          }
        }
      }

      if (currentJoinRecordId) {
        setJoinRecordId(currentJoinRecordId);
        sessionStorage.setItem(`joinRecordId_${gameCode}_${joinSessionId ?? playerName}`, currentJoinRecordId);
      }

      // Load people from the group
      const { data: peopleData, error: peopleError } = await supabase
        .from('people')
        .select('*')
        .eq('group_id', session.group_id);

      logger.log('People data:', peopleData, 'Error:', peopleError);

      if (!peopleData || peopleData.length === 0) {
        logError('No people found in group');
        setError('This group has no people! Add people to the group first.');
        setLoading(false);
        return;
      }

      // Use options_count from game session (set when host started the game)
      const optionsCount = session.options_count ?? 4;
      const totalQuestions = session.total_questions ?? 10;

      const generatedQuestions = generateQuestions(peopleData, session.game_type, totalQuestions, optionsCount);
      logger.log(
        '[loadGame] generateQuestions called with',
        totalQuestions,
        'questions, got',
        generatedQuestions.length,
        'back',
      );
      setQuestions(generatedQuestions);

      // Check how many questions the player has already answered to resume from the right question
      // Skip this if it's a retry (fresh start)
      let resumeFromQuestion = 0;
      let answeredQuestions: Array<{
        correct_option_id: string | null;
        selected_option_id: string | null;
        id: string;
        response_time_ms: number | null;
      }> = [];

      if (!retry && joinSessionId) {
        // Query by join_id to support multiple players with same name
        const { data: allAnswers } = await supabase
          .from('game_answers')
          .select('id, correct_option_id, selected_option_id, response_time_ms')
          .eq('session_id', session.id)
          .eq('join_id', joinSessionId)
          .order('id', { ascending: true });

        if (allAnswers && allAnswers.length > 0) {
          // Filter answers that have been submitted (both correct_option_id and selected_option_id exist)
          answeredQuestions = allAnswers.filter((a) => a.correct_option_id !== null && a.selected_option_id !== null);

          if (answeredQuestions.length > 0) {
            logger.log(
              'Player has answered',
              answeredQuestions.length,
              'questions, resuming from question',
              answeredQuestions.length,
            );
            resumeFromQuestion = answeredQuestions.length;
            setCurrentQuestion(resumeFromQuestion);
          }
        }
      }

      // Set initial timer based on game session settings
      const timeLimit = session.time_limit_seconds || 30;

      // Check if there's a stored question start time (from before reload)
      // Use session ID in key to isolate different game sessions
      const storedStartTime = sessionStorage.getItem(`questionStartTime_${session.id}_${playerName}`);
      let initialTimeLeft = timeLimit;

      if (storedStartTime && resumeFromQuestion < totalQuestions) {
        const elapsedMs = Date.now() - parseInt(storedStartTime);
        const elapsedSeconds = Math.floor(elapsedMs / 1000);
        initialTimeLeft = Math.max(0, timeLimit - elapsedSeconds);
        logger.log('Resuming question with', initialTimeLeft, 'seconds remaining');
      } else {
        // New question, store the start time
        sessionStorage.setItem(`questionStartTime_${session.id}_${playerName}`, Date.now().toString());
      }

      logger.log('Game loaded successfully, starting game');
      logger.log('Questions generated:', session.total_questions);

      // Ensure all state updates are batched before marking game as started
      setTimeLeft(initialTimeLeft);
      setLoading(false);
      hasLoadedRef.current = true;
      // Don't set gameStarted here - let the useEffect below handle it when questions are ready
    } catch (error) {
      logError('Error loading game:', error);
      setError('Error loading game: ' + getErrorMessage(error));
      setLoading(false);
    } finally {
      isLoadingGameRef.current = false;
    }
  }, [gameCode, playerName, generateQuestions, retry, joinSessionId, setLoading]);

  const finishGame = useCallback(async () => {
    if (!gameSession || !playerName || !joinSessionId) return;

    const supabase = createClient();

    // Query the database to get the actual count of correct answers
    // This is more reliable than using the score state variable
    // Use join_id to support multiple players with same name
    const { data: answers, error: queryError } = await supabase
      .from('game_answers')
      .select('is_correct')
      .eq('session_id', gameSession.id)
      .eq('join_id', joinSessionId)
      .not('correct_option_id', 'is', null); // Exclude join tracking records

    if (queryError) {
      logError('Error querying answers:', queryError);
    }

    // Count correct answers from the database
    const actualScore = answers?.filter((answer) => answer.is_correct).length || 0;

    // Save final score but don't mark session as completed
    // The session will only be marked complete when the host clicks "End Game"
    await supabase
      .from('game_sessions')
      .update({
        score: actualScore,
      })
      .eq('id', gameSession.id);

    // Get join record ID from state or sessionStorage
    const recordId =
      joinRecordId || sessionStorage.getItem(`joinRecordId_${gameSession.game_code}_${joinSessionId || playerName}`);

    // Redirect to results page with the actual score from database
    router.replace(
      `/game/results?session=${gameSession.id}&score=${actualScore}&total=${questions.length}&code=${gameSession.game_code}&name=${encodeURIComponent(playerName || '')}&gameCode=${gameSession.game_code}&joinRecordId=${recordId || ''}`,
    );
  }, [gameSession, questions.length, router, playerName, joinSessionId, joinRecordId]);

  const handleAnswer = useCallback(
    async (answerId: string | null) => {
      if (answered || !gameSession || !joinSessionId) return;

      setAnswered(true);
      setSelectedAnswer(answerId);

      const isCorrect = answerId === questions[currentQuestion].person.id;
      setLastAnswerCorrect(isCorrect);

      // Play sound and haptic feedback
      if (isCorrect) {
        sound.playCorrect();
        haptic.success();
      } else {
        sound.playWrong();
        haptic.error();
      }

      if (isCorrect) {
        setScore(score + 1);
      }

      // Save answer to database
      const supabase = createClient();
      logger.log('Saving answer with join_id:', joinSessionId, 'is_correct:', isCorrect);
      const { error } = await supabase.from('game_answers').insert({
        session_id: gameSession.id,
        correct_option_id: questions[currentQuestion].person.id,
        selected_option_id: answerId,
        is_correct: isCorrect,
        response_time_ms: Math.max(0, (gameSession.time_limit_seconds || 30) - timeLeft) * 1000,
        player_name: playerName,
        join_id: joinSessionId,
      });

      if (error) {
        logError('Error saving answer:', error);
      } else {
        logger.log('Answer saved successfully');
      }

      // Move to next question after animation completes
      setTimeout(() => {
        if (currentQuestion < questions.length - 1) {
          setCurrentQuestion(currentQuestion + 1);
          setSelectedAnswer(null);
          setAnswered(false);
          setTimeLeft(gameSession?.time_limit_seconds || 30);
          setLastAnswerCorrect(null);
          // Store start time for the new question
          sessionStorage.setItem(`questionStartTime_${gameSession?.id}_${playerName}`, Date.now().toString());
        } else {
          // Game finished
          sessionStorage.removeItem(`questionStartTime_${gameSession?.id}_${playerName}`);
          finishGame();
        }
      }, 500);
    },
    [answered, gameSession, questions, currentQuestion, score, timeLeft, playerName, finishGame, joinSessionId],
  );

  useEffect(() => {
    if (gameCode && playerName) {
      loadGame();
    }
  }, [gameCode, playerName, loadGame]);

  // Track presence using Supabase Realtime Presence
  // This allows the host to see when players connect/disconnect instantly
  useEffect(() => {
    if (!gameSession?.id || !joinRecordId || !playerName) return;

    const supabase = createClient();
    const channelName = `presence:game:${gameSession.id}`;

    logger.log('Setting up presence tracking for player:', playerName, 'joinRecordId:', joinRecordId);

    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: joinRecordId, // Use joinRecordId as the unique presence key
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        logger.log('Presence sync:', state);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track this player's presence
          await channel.track({
            joinRecordId,
            playerName,
            joinSessionId,
            online_at: new Date().toISOString(),
          });
          logger.log('Presence tracked successfully');
        }
      });

    return () => {
      logger.log('Cleaning up presence for player:', playerName);
      channel.untrack();
      supabase.removeChannel(channel);
    };
  }, [gameSession?.id, joinRecordId, playerName, joinSessionId]);

  // Mark player as left when they close the window or navigate away
  useEffect(() => {
    if (!gameSession?.id || !playerName) return;

    const handlePlayerLeft = async () => {
      logger.log('Player leaving game:', playerName, 'joinSessionId:', joinSessionId);
      const result = await markPlayerAsLeft(gameSession.id, playerName, joinSessionId ?? undefined);
      logger.log('Mark player as left result:', result);
    };

    const handleBeforeUnload = () => {
      handlePlayerLeft();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Only mark as left if they're actually closing the window (beforeunload was triggered)
      // Don't mark as left on normal navigation away (they might be going to results)
    };
  }, [gameSession?.id, playerName, joinSessionId]);

  // Watch for session status changes (when host ends game)
  useEffect(() => {
    if (!gameSession?.id || !playerName || !joinSessionId) return;

    const supabase = createClient();
    const sessionId = gameSession.id;
    const gameCode = gameSession.game_code;

    const channel = supabase
      .channel(`game:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'game_sessions',
          filter: `id=eq.${sessionId}`,
        },
        async (payload) => {
          const updatedSession = payload.new as { status?: string } | null;
          if (updatedSession?.status === 'completed') {
            // Game ended by host - get actual score from database and redirect to results
            // Use join_id to support multiple players with same name
            const { data: answers, error: queryError } = await supabase
              .from('game_answers')
              .select('is_correct')
              .eq('session_id', sessionId)
              .eq('join_id', joinSessionId)
              .not('correct_option_id', 'is', null); // Exclude join tracking records

            if (queryError) {
              logError('Error querying answers:', queryError);
            }

            // Count correct answers from the database
            const actualScore = answers?.filter((answer) => answer.is_correct).length || 0;

            // Get join record ID
            const recordId =
              joinRecordId || sessionStorage.getItem(`joinRecordId_${gameCode}_${joinSessionId || playerName}`);

            router.replace(
              `/game/results?session=${sessionId}&score=${actualScore}&total=${questions.length}&code=${gameCode}&name=${encodeURIComponent(playerName || '')}&joinRecordId=${recordId || ''}`,
            );
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameSession?.id, gameSession?.game_code, playerName, joinSessionId, questions.length, router, joinRecordId]);

  useEffect(() => {
    // Only run timer if we have questions loaded and active AND timer is enabled
    const timerEnabled = gameSession?.enable_timer !== false;
    if (questions.length > 0 && timeLeft > 0 && !answered && timerEnabled) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !answered && questions.length > 0 && timerEnabled) {
      handleAnswer(null);
    }
  }, [timeLeft, answered, questions.length, handleAnswer, gameSession?.enable_timer]);

  // If we don't have valid params or not initialized yet, return empty while redirecting
  if (!gameCode || !playerName || !initialized) {
    return null;
  }

  return (
    <RenderState
      state={
        loading
          ? { type: 'loading', error }
          : !questions || questions.length === 0
            ? { type: 'waiting-for-start', error }
            : !questions[currentQuestion]
              ? { type: 'loading-question' }
              : {
                  type: 'active',
                  gameType: gameSession!.game_type,
                  playerName: playerName || 'Player',
                  score,
                  question: questions[currentQuestion],
                  currentQuestion,
                  questions,
                  timeLeft,
                  selectedAnswer,
                  answered,
                  handleAnswer,
                  lastAnswerCorrect,
                  gameSession: gameSession!,
                }
      }
    />
  );
}

const Container = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return (
    <div className="w-full max-w-5xl">
      <div className={cn('w-full max-w-5xl', className)}>{children}</div>
    </div>
  );
};

const Message = ({ text }: { text: string }) => {
  return (
    <Card>
      <CardContent>
        <p>{text}</p>
      </CardContent>
    </Card>
  );
};

interface State {
  type: 'loading' | 'waiting-for-start' | 'loading-question' | 'active';
}

interface LoadingState extends State {
  type: 'loading';
  error?: string | null;
}

interface WaitingForStartState extends State {
  type: 'waiting-for-start';
  error?: string | null;
}

interface LoadingQuestionState extends State {
  type: 'loading-question';
}

interface ActiveState extends State {
  type: 'active';
  gameType: GameType;
  playerName: string;
  score: number;
  question: Question;
  currentQuestion: number;
  questions: Question[];
  timeLeft: number;
  selectedAnswer: string | null;
  answered: boolean;
  handleAnswer: (answerId: string | null) => void;
  lastAnswerCorrect: boolean | null;
  gameSession: GameSession;
}

// Component for active game state with keyboard shortcuts
function ActiveGameState({ state }: { state: ActiveState }) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll to top smoothly when question changes
  useEffect(() => {
    if (containerRef.current) {
      const start = containerRef.current.scrollTop;
      const duration = 200; // Fast smooth scroll (200ms)
      const startTime = performance.now();

      const animateScroll = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease out cubic for smooth deceleration
        const easeProgress = 1 - Math.pow(1 - progress, 3);

        if (containerRef.current) {
          containerRef.current.scrollTop = start * (1 - easeProgress);
        }

        if (progress < 1) {
          requestAnimationFrame(animateScroll);
        }
      };

      requestAnimationFrame(animateScroll);
    }
  }, [state.currentQuestion]);

  // Handle answer with event handling
  const handleAnswerWithScrollPreservation = useCallback(
    (answerId: string | null, event?: React.MouseEvent) => {
      // Prevent any scroll behavior from the click
      if (event) {
        event.preventDefault();
        // Blur the button to prevent focus scrolling
        (event.currentTarget as HTMLButtonElement).blur();
      }

      state.handleAnswer(answerId);
    },
    [state],
  );

  // Keyboard shortcuts for answer selection
  KeyboardShortcuts.useAnswerSelection((index) => {
    if (!state.answered && state.question.options[index]) {
      handleAnswerWithScrollPreservation(state.question.options[index].id);
    }
  }, state.question.options.length);

  return (
    <div
      ref={containerRef}
      className={cn(
        'flex grow flex-col items-center gap-2 overflow-x-clip overflow-y-auto bg-linear-to-br p-4 transition-colors duration-700',
        state.lastAnswerCorrect === true
          ? 'from-green-600 to-green-800'
          : state.lastAnswerCorrect === false
            ? 'from-red-600 to-red-800'
            : 'from-purple-500 to-pink-500',
      )}
      role="main"
      aria-label="Game play area"
    >
      {/* Screen reader announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        Question {state.currentQuestion + 1} of {state.questions.length}. Time remaining: {state.timeLeft} seconds.
        {state.answered && (state.lastAnswerCorrect ? 'Correct! ' : 'Incorrect. ')}
        Current score: {state.score} out of {state.questions.length}.
      </div>
      <Container className="my-auto flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-6">
          <div className="flex flex-col gap-1 text-white">
            <p className="text-2xl font-bold">
              Score: {state.score}/{state.questions.length}
            </p>
            <Badge variant="secondary" className="text-xs">
              Question {state.currentQuestion + 1} of {state.questions.length}
            </Badge>
          </div>
          {state.gameSession.enable_timer !== false && (
            <div className="inline-flex shrink-0 rounded-full border border-white/30 bg-black/40 p-2 text-white">
              <CircularProgress value={state.timeLeft} max={30} size={80} strokeWidth={6}>
                <span className="text-2xl font-bold">{state.timeLeft}</span>
              </CircularProgress>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 w-full overflow-hidden rounded-full border border-white/30 bg-black/40">
          <div
            className="bg-gradient-primary h-full transition-all duration-300"
            style={{
              width: `${((state.currentQuestion + 1) / state.questions.length) * 100}%`,
            }}
          />
        </div>

        <div className="relative flex-1 overflow-x-hidden pb-8">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={state.currentQuestion}
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '-100%', opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
              className="min-h-125 w-full"
            >
              <div className={`flex gap-6 ${state.gameType === 'guess_image' ? 'flex-col' : 'flex-col lg:flex-row'}`}>
                <Card className="shrink-0 justify-center">
                  <CardHeader>
                    <CardTitle className="text-center text-2xl">
                      {state.gameType === 'guess_name'
                        ? 'Who is this?'
                        : 'Who is ' + state.question.person.first_name + ' ' + state.question.person.last_name + '?'}
                    </CardTitle>
                  </CardHeader>
                  {state.gameType === 'guess_name' && (
                    <CardContent>
                      <div className="flex justify-center">
                        <div className="aspect-square rounded-lg border-4 border-gray-200">
                          <Image
                            width={256}
                            height={256}
                            key={`person-image-${state.currentQuestion}-${state.question.person.id}`}
                            src={state.question.person.image_url || '/placeholder.png'}
                            alt={`Photo of person for question ${state.currentQuestion + 1}`}
                            priority={true}
                            aria-label={`Question ${state.currentQuestion + 1}: Who is this person?`}
                          />
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
                {/* Question Options */}
                <div
                  className={`flex-1 justify-center gap-2 ${state.gameType === 'guess_image' ? 'grid grid-cols-[repeat(auto-fit,minmax(100px,1fr))]' : 'flex flex-col'}`}
                >
                  {state.question.options.map((option) => {
                    const isSelected = state.selectedAnswer === option.id;
                    const isCorrect = option.id === state.question.person.id;

                    let buttonClass = 'text-lg font-semibold disabled:opacity-100 relative overflow-hidden border-2';
                    let buttonVariant: 'default' | 'outline' = 'outline';

                    if (state.answered) {
                      if (isCorrect && isSelected) {
                        buttonClass += ' bg-green-500 hover:bg-green-500 text-white border-green-500 animate-pulse';
                        buttonVariant = 'default';
                      } else if (isSelected && !isCorrect) {
                        buttonClass += ' bg-red-500 hover:bg-red-500 text-white border-red-500';
                        buttonVariant = 'default';
                      } else if (isCorrect) {
                        buttonClass += ' bg-green-500 hover:bg-green-500 text-white border-green-500';
                        buttonVariant = 'default';
                      }
                    }

                    return (
                      <Button
                        key={option.id}
                        onClick={(e) => handleAnswerWithScrollPreservation(option.id, e)}
                        disabled={state.answered}
                        className={buttonClass}
                        variant={buttonVariant}
                        aria-label={
                          state.gameType === 'guess_name'
                            ? `Select ${option.first_name} ${option.last_name}${isSelected ? ' (selected)' : ''}${state.answered && isCorrect ? ' (correct answer)' : ''}${state.answered && isSelected && !isCorrect ? ' (incorrect)' : ''}`
                            : `Select option ${state.question.options.indexOf(option) + 1}${isSelected ? ' (selected)' : ''}${state.answered && isCorrect ? ' (correct answer)' : ''}${state.answered && isSelected && !isCorrect ? ' (incorrect)' : ''}`
                        }
                        aria-pressed={isSelected}
                        aria-disabled={state.answered}
                        tabIndex={state.answered ? -1 : 0}
                      >
                        <span className="flex w-full items-center justify-between">
                          {state.gameType === 'guess_name' ? (
                            <span className="flex-1 truncate text-left">
                              {option.first_name} {option.last_name}
                            </span>
                          ) : (
                            <div
                              key={`option-image-${state.currentQuestion}-${option.id}`}
                              className="relative flex max-h-50 min-h-25 min-w-25 flex-1 items-center justify-center"
                            >
                              <Image
                                src={option.image_url || '/placeholder.png'}
                                alt={`${option.first_name} ${option.last_name}`}
                                width={200}
                                height={200}
                                priority={true}
                              />
                            </div>
                          )}
                          {state.answered && (isCorrect || isSelected) && (
                            <span className="flex size-6 shrink-0 items-center justify-center">
                              {isCorrect && <Icon icon={FaCheck} size="lg" />}
                              {isSelected && !isCorrect && <Icon icon={FaXmark} size="lg" />}
                            </span>
                          )}
                        </span>
                      </Button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </Container>
    </div>
  );
}

type StateUnion = LoadingState | WaitingForStartState | LoadingQuestionState | ActiveState;

const RenderState = ({ state }: { state: StateUnion }) => {
  switch (state.type) {
    case 'loading':
      // Global loading overlay handles spinner, only show error if present
      if (state.error) {
        return (
          <div className="flex grow flex-col items-center justify-center gap-2 bg-linear-to-br from-purple-500 to-pink-500 p-4">
            <Container>
              <ErrorMessage message={state.error} size="lg" />
            </Container>
          </div>
        );
      }
      // Return empty div to maintain layout while global overlay shows spinner
      return <div className="grow bg-linear-to-br from-purple-500 to-pink-500" />;
    case 'waiting-for-start':
      return (
        <div className="flex grow flex-col items-center justify-center gap-2 bg-linear-to-br from-purple-500 to-pink-500 p-4">
          <Container>
            {state.error ? (
              <ErrorMessage message={state.error} size="lg" />
            ) : (
              <Message text="Waiting for game to start..." />
            )}
          </Container>
        </div>
      );
    case 'loading-question':
      return (
        <div className="flex grow flex-col items-center justify-center gap-2 bg-linear-to-br from-purple-500 to-pink-500 p-4">
          <Container>
            <Message text="Loading question..." />
          </Container>
        </div>
      );
    case 'active':
      return <ActiveGameState state={state} />;
    default:
      const _exhaustiveCheck: undefined = state;
      return _exhaustiveCheck;
  }
};
