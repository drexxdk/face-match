'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  FaPlay,
  FaUserGroup,
  FaXmark,
  FaArrowRight,
  FaWandMagicSparkles,
  FaUser,
  FaCheck,
  FaImage,
  FaGear,
  FaArrowLeft,
  FaTriangleExclamation,
} from 'react-icons/fa6';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { use } from 'react';
import { Badge } from '@/components/ui/badge';
import { ErrorMessage } from '@/components/ui/error-message';
import { generateGameCode, endGameSession } from '@/lib/game-utils';
import { useLoading } from '@/lib/loading-context';
import type { Group, Person, GameSession, GameType } from '@/lib/schemas';
import { logError } from '@/lib/logger';
import { GameQRCode } from '@/components/game-qr-code';

export default function GameHostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: groupId } = use(params);
  const router = useRouter();
  const { setLoading } = useLoading();
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [groupData, setGroupData] = useState<Group | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [gameSession, setGameSession] = useState<GameSession | null>(null);
  const [gameCode, setGameCode] = useState<string>('');
  const [selectedGameType, setSelectedGameType] = useState<GameType>('guess_name');
  const [enableTimer, setEnableTimer] = useState<boolean>(true);
  const [timeLimitSeconds, setTimeLimitSeconds] = useState<number>(30);
  const [optionsCount, setOptionsCount] = useState<number>(4);
  const [totalQuestions, setTotalQuestions] = useState<number>(1);

  const loadGroupData = useCallback(async () => {
    try {
      const supabase = createClient();

      // Get group
      const { data: groupInfo, error: groupError } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .single();

      if (groupError) throw groupError;

      // Get people
      const { data: peopleData, error: peopleError } = await supabase
        .from('people')
        .select('*')
        .eq('group_id', groupId);

      if (peopleError) throw peopleError;

      // Cast to Group type to include enable_timer field (for backward compatibility with DB)
      const group = groupInfo as unknown as Group;
      setGroupData(group);
      setPeople(peopleData || []);
      // Set default values from group settings
      setEnableTimer(group.enable_timer ?? true);
      setTimeLimitSeconds(group.time_limit_seconds || 30);
      setOptionsCount(group.options_count || 4);
      setTotalQuestions(Math.min((peopleData || []).length || 1, 10));
    } catch (error) {
      logError('Error loading group data:', error);
    } finally {
      setInitialized(true);
      setLoading(false);
    }
  }, [groupId, setLoading]);

  useEffect(() => {
    loadGroupData();
  }, [groupId, loadGroupData]);

  const cancelGame = async () => {
    if (!gameSession) return;

    const supabase = createClient();
    await endGameSession(supabase, gameSession.id);

    // Reset local state
    setGameSession(null);
    setGameCode('');
  };

  const startGame = async () => {
    if (!groupData) return;

    if (people.length < optionsCount) {
      setError(`You need at least ${optionsCount} people to start a game with ${optionsCount} options!`);
      return;
    }

    setLoading(true);
    setError(null);
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    // Allow multiple games to run simultaneously - don't mark existing sessions as completed

    const code = generateGameCode();

    // Create game session with game-specific settings
    const { data: session, error: createError } = await supabase
      .from('game_sessions')
      .insert({
        user_id: user.id,
        group_id: groupId,
        game_type: selectedGameType,
        total_questions: totalQuestions,
        game_code: code,
        status: 'active',
        time_limit_seconds: timeLimitSeconds,
        options_count: optionsCount,
        enable_timer: enableTimer,
      })
      .select()
      .single();

    if (createError) {
      logError(createError);
      setError('Failed to create game session');
      setLoading(false);
      return;
    }

    // Navigate to game started screen
    router.push(`/admin/groups/${groupId}/host/${session.id}/started`);
  };

  // Show nothing until initialized (global loading overlay handles loading state)
  if (!initialized) {
    return null;
  }

  const icebreakerTips = [
    "Introduce yourself and explain the game's purpose: helping everyone learn names and faces",
    "Remind participants this isn't about winning - it's about making connections",
    "Encourage players to chat with people they didn't recognize after the game",
    'Keep the atmosphere light and fun - laugh together at mistakes!',
    'Consider doing a quick round of introductions before starting',
  ];

  if (!groupData) {
    return <p>Group not found</p>;
  }

  const initializedContent =
    gameSession && gameCode ? (
      <GameStartedContent
        gameCode={gameCode}
        gameSession={gameSession}
        groupId={groupId}
        cancelGame={cancelGame}
        router={router}
        setLoading={setLoading}
      />
    ) : (
      <GameSetupContent
        selectedGameType={selectedGameType}
        setSelectedGameType={setSelectedGameType}
        enableTimer={enableTimer}
        setEnableTimer={setEnableTimer}
        timeLimitSeconds={timeLimitSeconds}
        setTimeLimitSeconds={setTimeLimitSeconds}
        optionsCount={optionsCount}
        setOptionsCount={setOptionsCount}
        totalQuestions={totalQuestions}
        setTotalQuestions={setTotalQuestions}
        people={people}
        router={router}
        startGame={startGame}
        groupData={groupData}
        error={error}
      />
    );

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      {/* Hero Header */}
      <Card variant="flush">
        <div className="relative overflow-hidden">
          <div className="from-primary/10 absolute inset-0 bg-linear-to-br via-purple-500/10 to-pink-500/10" />
          <div className="relative flex flex-col gap-2 p-8">
            <div className="flex items-start gap-6">
              <div className="from-primary flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br to-purple-600 shadow-lg">
                <Icon icon={FaPlay} size="xl" color="white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Start a New Game</h1>
                <div className="flex items-center gap-2">
                  <Icon icon={FaUserGroup} size="md" color="primary" />
                  <p className="text-muted-foreground text-lg">
                    <span className="text-foreground font-semibold">{groupData.name}</span> • {people.length} people
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card variant="compact">
        <CardContent className="flex flex-col gap-6">{initializedContent}</CardContent>
      </Card>

      <Card variant="compact" className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <span className="text-2xl">💡</span>
            Icebreaker Tips for Hosts
          </CardTitle>
          <CardDescription className="text-gray-700 dark:text-gray-300">
            Make everyone feel comfortable and set the right tone
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <ul className="flex flex-col gap-2 text-sm text-gray-900 dark:text-gray-100">
            {icebreakerTips.map((tip, index) => (
              <li key={index} className="flex gap-2">
                <span className="font-bold text-gray-900 dark:text-gray-100">{index + 1}.</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function GameStartedContent({
  gameCode,
  gameSession,
  groupId,
  cancelGame,
  router,
  setLoading,
}: {
  gameCode: string;
  gameSession: GameSession;
  groupId: string;
  cancelGame: () => Promise<void>;
  router: ReturnType<typeof useRouter>;
  setLoading: (loading: boolean) => void;
}) {
  return (
    <div className="flex flex-col gap-6 rounded-xl bg-linear-to-br from-purple-500/10 via-pink-500/10 to-blue-500/10 p-6">
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
      <div className="grid gap-6 md:grid-cols-2">
        {/* Game Code */}
        <div className="bg-background/50 flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-6">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Game Code</p>
          <Badge className="bg-primary hover:bg-primary px-8 py-4 font-mono text-5xl shadow-lg">{gameCode}</Badge>
          <p className="text-muted-foreground text-center text-xs">
            Enter at <span className="text-foreground font-mono">/game/join</span>
          </p>
        </div>

        {/* QR Code */}
        {gameCode && (
          <div className="bg-background/50 flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-6">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Or Scan QR Code</p>
            <div className="rounded-lg bg-white p-2">
              <GameQRCode gameCode={gameCode} />
            </div>
            <p className="text-muted-foreground text-center text-xs">Opens with code pre-filled</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button variant="outline" onClick={cancelGame} className="flex-1 gap-2">
          <Icon icon={FaXmark} size="sm" />
          End Game
        </Button>
        <Button
          onClick={() => {
            setLoading(true);
            router.push(`/admin/groups/${groupId}/host/${gameSession.id}/play`);
          }}
          className="flex-1 gap-2"
        >
          <Icon icon={FaArrowRight} size="sm" />
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
}

function GameSetupContent({
  selectedGameType,
  setSelectedGameType,
  enableTimer,
  setEnableTimer,
  timeLimitSeconds,
  setTimeLimitSeconds,
  optionsCount,
  setOptionsCount,
  totalQuestions,
  setTotalQuestions,
  people,
  router,
  startGame,
  groupData,
  error,
}: {
  selectedGameType: GameType;
  setSelectedGameType: (type: GameType) => void;
  enableTimer: boolean;
  setEnableTimer: (value: boolean) => void;
  timeLimitSeconds: number;
  setTimeLimitSeconds: (value: number) => void;
  optionsCount: number;
  setOptionsCount: (value: number) => void;
  totalQuestions: number;
  setTotalQuestions: (value: number) => void;
  people: Person[];
  router: ReturnType<typeof useRouter>;
  startGame: () => Promise<void>;
  groupData: Group | null;
  error: string | null;
}) {
  return (
    <>
      <div>
        <div className="mb-4 flex items-center gap-2">
          <Icon icon={FaWandMagicSparkles} size="md" color="primary" />
          <h3 className="text-lg font-semibold">Select Game Mode</h3>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {/* Guess the Name */}
          <Card
            variant="flush"
            className={`group cursor-pointer overflow-hidden transition-all ${
              selectedGameType === 'guess_name' ? 'ring-primary ring-2' : 'hover:shadow-lg'
            }`}
            onClick={() => setSelectedGameType('guess_name')}
          >
            <div className="relative overflow-hidden bg-linear-to-br from-blue-500/10 to-cyan-500/10 p-6">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-500/20">
                    <Icon icon={FaUser} size="lg" color="info" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold">Guess the Name</h4>
                    <p className="text-muted-foreground text-sm">Show a photo, players pick the correct name</p>
                  </div>
                </div>
                <div
                  className={`bg-primary flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-opacity ${
                    selectedGameType === 'guess_name' ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <Icon icon={FaCheck} size="sm" color="white" />
                </div>
              </div>

              {/* Visual Example */}
              <div className="bg-background/50 relative space-y-3 rounded-lg border p-4">
                <div className="absolute -top-1 -right-1 rotate-12 rounded-lg bg-yellow-400 px-2 py-1 text-xs font-bold text-yellow-900 shadow-sm">
                  Example
                </div>
                {/* Question - Image shown */}
                <div className="flex flex-col gap-2 text-center">
                  <p className="text-muted-foreground mb-2 text-xs font-medium">QUESTION:</p>
                  <div className="bg-muted mx-auto flex h-20 w-20 items-center justify-center rounded-lg border-2">
                    <Icon icon={FaUser} size="2xl" color="muted" />
                  </div>
                </div>
                {/* Answer Options - Names */}
                <div className="flex flex-col gap-2">
                  <p className="text-muted-foreground text-xs font-medium">PICK NAME:</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-muted/50 rounded border px-2 py-1.5 text-center text-xs">John</div>
                    <div className="bg-muted/50 rounded border px-2 py-1.5 text-center text-xs">Sarah</div>
                    <div className="bg-muted/50 rounded border px-2 py-1.5 text-center text-xs">Mike</div>
                    <div className="bg-muted/50 rounded border px-2 py-1.5 text-center text-xs">Lisa</div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Guess the Face */}
          <Card
            variant="flush"
            className={`group cursor-pointer overflow-hidden transition-all ${
              selectedGameType === 'guess_image' ? 'ring-primary ring-2' : 'hover:shadow-lg'
            }`}
            onClick={() => setSelectedGameType('guess_image')}
          >
            <div className="relative overflow-hidden bg-linear-to-br from-purple-500/10 to-pink-500/10 p-6">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-500/20">
                    <Icon icon={FaImage} size="lg" className="text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold">Guess the Face</h4>
                    <p className="text-muted-foreground text-sm">Show a name, players pick the correct photo</p>
                  </div>
                </div>
                <div
                  className={`bg-primary flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-opacity ${
                    selectedGameType === 'guess_image' ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <Icon icon={FaCheck} size="sm" color="white" />
                </div>
              </div>

              {/* Visual Example */}
              <div className="bg-background/50 relative space-y-3 rounded-lg border p-4">
                <div className="absolute -top-1 -right-1 rotate-12 rounded-lg bg-yellow-400 px-2 py-1 text-xs font-bold text-yellow-900 shadow-sm">
                  Example
                </div>
                {/* Question - Name shown */}
                <div className="flex flex-col gap-2 text-center">
                  <p className="text-muted-foreground mb-2 text-xs font-medium">QUESTION:</p>
                  <div className="bg-primary/10 rounded-lg border px-3 py-2">
                    <p className="text-sm font-bold">John Smith</p>
                  </div>
                </div>
                {/* Answer Options - Photos */}
                <div className="flex flex-col gap-2">
                  <p className="text-muted-foreground mb-2 text-xs font-medium">PICK PHOTO:</p>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="bg-muted flex aspect-square items-center justify-center rounded-lg border-2">
                      <Icon icon={FaUser} size="lg" color="muted" />
                    </div>
                    <div className="bg-muted flex aspect-square items-center justify-center rounded-lg border-2">
                      <Icon icon={FaUser} size="lg" color="muted" />
                    </div>
                    <div className="bg-muted flex aspect-square items-center justify-center rounded-lg border-2">
                      <Icon icon={FaUser} size="lg" color="muted" />
                    </div>
                    <div className="bg-muted flex aspect-square items-center justify-center rounded-lg border-2">
                      <Icon icon={FaUser} size="lg" color="muted" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2">
          <Icon icon={FaGear} size="md" color="primary" />
          <h3 className="text-lg font-semibold">Game Settings</h3>
        </div>
        <div className="mt-4 flex flex-col gap-6">
          <div className="flex items-center gap-2">
            <input
              id="enable-timer-host"
              type="checkbox"
              checked={enableTimer}
              onChange={(e) => setEnableTimer(e.target.checked)}
              className="text-primary focus:ring-primary h-4 w-4 cursor-pointer rounded border-gray-300 focus:ring-2 focus:ring-offset-2"
            />
            <label htmlFor="enable-timer-host" className="cursor-pointer text-sm leading-none font-medium">
              Enable countdown timer
            </label>
          </div>
          {enableTimer && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Time per question (seconds)</label>
                <span className="bg-muted rounded px-3 py-1 text-sm font-medium">{timeLimitSeconds}s</span>
              </div>
              <input
                type="range"
                min="5"
                max="120"
                step="1"
                value={timeLimitSeconds}
                onChange={(e) => setTimeLimitSeconds(Number(e.target.value))}
                className="bg-secondary accent-primary h-2 w-full cursor-pointer appearance-none rounded-lg"
              />
            </div>
          )}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Options per question</label>
              <span className="bg-muted rounded px-3 py-1 text-sm font-medium">{optionsCount}</span>
            </div>
            <input
              type="range"
              min="2"
              max={Math.min(people.length, 10)}
              step="1"
              value={optionsCount}
              onChange={(e) => setOptionsCount(Number(e.target.value))}
              className="bg-secondary accent-primary h-2 w-full cursor-pointer appearance-none rounded-lg"
            />
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Amount of questions</label>
              <span className="bg-muted rounded px-3 py-1 text-sm font-medium">{totalQuestions}</span>
            </div>
            <input
              type="range"
              min="1"
              max={people.length}
              step="1"
              value={totalQuestions}
              onChange={(e) => setTotalQuestions(Number(e.target.value))}
              className="bg-secondary accent-primary h-2 w-full cursor-pointer appearance-none rounded-lg"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <Button variant="outline" onClick={() => router.back()} className="flex-1 gap-2">
          <Icon icon={FaArrowLeft} size="sm" />
          Cancel
        </Button>
        <Button onClick={startGame} disabled={!groupData || people.length < optionsCount} className="flex-1 gap-2">
          <Icon icon={FaPlay} size="sm" />
          Start Game
        </Button>
      </div>

      <ErrorMessage message={error} />

      {people.length < optionsCount && !error && (
        <div className="bg-destructive/10 border-destructive/20 flex items-start gap-2 rounded-lg border p-3">
          <Icon icon={FaTriangleExclamation} size="md" color="error" className="shrink-0" />
          <p className="text-destructive text-sm">You need at least {optionsCount} people to start a game</p>
        </div>
      )}
    </>
  );
}
