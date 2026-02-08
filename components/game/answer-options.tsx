'use client';

import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { memo } from 'react';

interface AnswerOption {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
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

export const AnswerOptions = memo(function AnswerOptions({
  gameType,
  options,
  correctPersonId,
  selectedAnswer,
  answered,
  onAnswer,
  currentQuestion,
}: AnswerOptionsProps) {
  return (
    <div
      className={`flex-1 justify-center gap-2 ${
        gameType === 'guess_image' ? 'grid grid-cols-[repeat(auto-fit,minmax(100px,1fr))]' : 'flex flex-col'
      }`}
    >
      {options.map((option, index) => {
        const isSelected = selectedAnswer === option.id;
        const isCorrect = option.id === correctPersonId;

        let buttonClass = 'text-lg font-semibold disabled:opacity-100 relative overflow-hidden';
        let buttonVariant: 'default' | 'outline' = 'outline';

        if (answered) {
          if (isCorrect && isSelected) {
            buttonClass += ' bg-green-500 hover:bg-green-500 text-white animate-pulse';
            buttonVariant = 'default';
          } else if (isSelected && !isCorrect) {
            buttonClass += ' bg-red-500 hover:bg-red-500 text-white';
            buttonVariant = 'default';
          } else if (isCorrect) {
            buttonClass += ' bg-green-500 hover:bg-green-500 text-white';
            buttonVariant = 'default';
          }
        }

        return (
          <Button
            key={option.id}
            variant={buttonVariant}
            className={buttonClass}
            onClick={() => onAnswer(option.id)}
            disabled={answered}
            size={gameType === 'guess_image' ? 'default' : 'lg'}
            aria-label={
              gameType === 'guess_name'
                ? `Answer option ${index + 1}: ${option.first_name} ${option.last_name}. Press ${index + 1} key to select.`
                : `Answer option ${index + 1}: Press ${index + 1} key to select.`
            }
          >
            {gameType === 'guess_name' ? (
              <>
                {option.first_name} {option.last_name}
              </>
            ) : (
              <div className="h-full w-full">
                <Image
                  key={`option-image-${currentQuestion}-${option.id}`}
                  src={option.image_url || '/placeholder.png'}
                  alt={`Option ${index + 1}`}
                  width={128}
                  height={128}
                  className="h-full w-full rounded-lg object-cover"
                  priority={true}
                />
              </div>
            )}
          </Button>
        );
      })}
    </div>
  );
});
