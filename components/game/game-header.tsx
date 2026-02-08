'use client';

import { CircularProgress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { memo } from 'react';

interface GameHeaderProps {
  playerName: string;
  score: number;
  totalQuestions: number;
  currentQuestion: number;
  timeLeft: number;
  timerEnabled: boolean;
  timeLimit: number;
}

export const GameHeader = memo(function GameHeader({
  playerName,
  score,
  totalQuestions,
  currentQuestion,
  timeLeft,
  timerEnabled,
  timeLimit,
}: GameHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-col gap-1 text-white">
        <p className="text-sm opacity-80">{playerName}</p>
        <p className="text-2xl font-bold">
          Score: {score}/{totalQuestions}
        </p>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            Question {currentQuestion + 1} of {totalQuestions}
          </Badge>
          <div className="h-1.5 w-32 overflow-hidden rounded-full border border-white/30 bg-black/40">
            <div
              className="bg-gradient-primary h-full transition-all duration-300"
              style={{
                width: `${((currentQuestion + 1) / totalQuestions) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>
      {timerEnabled && (
        <div className="inline-flex rounded-full border border-white/30 bg-black/40 p-2 text-white">
          <CircularProgress value={timeLeft} max={timeLimit} size={80} strokeWidth={6}>
            <span className="text-2xl font-bold">{timeLeft}</span>
          </CircularProgress>
        </div>
      )}
    </div>
  );
});
