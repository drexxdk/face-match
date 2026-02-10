'use client';

import { ImageAnswerOptions } from './image-answer-options';
import { TextAnswerOptions } from './text-answer-options';

interface AnswerOption {
  id: string;
  name?: string | null;
  image_url?: string | null;
}

interface AnswerOptionsProps {
  gameType: 'guess_name' | 'guess_image';
  options: AnswerOption[];
  correctPersonId: string;
  selectedAnswer: string | null;
  answered: boolean;
  onAnswer: (answerId: string | null) => void;
  currentQuestion: number;
}

export function AnswerOptions({
  gameType,
  options,
  correctPersonId,
  selectedAnswer,
  answered,
  onAnswer,
  currentQuestion,
}: AnswerOptionsProps) {
  if (gameType === 'guess_name') {
    return (
      <TextAnswerOptions
        options={options}
        correctPersonId={correctPersonId}
        selectedAnswer={selectedAnswer}
        answered={answered}
        onAnswer={onAnswer}
      />
    );
  }

  return (
    <ImageAnswerOptions
      options={options}
      correctPersonId={correctPersonId}
      selectedAnswer={selectedAnswer}
      answered={answered}
      onAnswer={onAnswer}
      currentQuestion={currentQuestion}
    />
  );
}
