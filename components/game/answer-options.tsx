'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { memo } from 'react';
import { FaCheck, FaXmark } from 'react-icons/fa6';

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
      className={cn(
        'flex-1 justify-center gap-2',
        gameType === 'guess_image' ? 'grid grid-cols-[repeat(auto-fit,minmax(100px,1fr))]' : 'flex flex-col',
      )}
    >
      {options.map((option) => {
        const isSelected = selectedAnswer === option.id;
        const isCorrect = option.id === correctPersonId;

        let buttonClass =
          'text-lg font-semibold disabled:opacity-100 relative overflow-hidden glass-strong border-gradient-subtle shadow-glass rounded-glass transition-all duration-300 hover:bg-card/90 hover:border-primary/20 hover:scale-[1.02] hover:shadow-glass';
        const buttonVariant: 'default' | 'outline' = 'default';

        if (answered) {
          if (isCorrect && isSelected) {
            buttonClass += ' !bg-green-500 hover:!bg-green-500 !text-white !border-green-500';
          } else if (isSelected && !isCorrect) {
            buttonClass += ' !bg-red-500 hover:!bg-red-500 !text-white !border-red-500';
          } else if (isCorrect) {
            buttonClass += ' !bg-green-500 hover:!bg-green-500 !text-white !border-green-500';
          }
        }

        return (
          <div key={option.id} className="relative">
            <Button
              variant={buttonVariant}
              className={cn(buttonClass, gameType === 'guess_name' && 'w-full')}
              onClick={() => onAnswer(option.id)}
              disabled={answered}
              size={gameType === 'guess_image' ? 'default' : 'lg'}
              aria-label={
                gameType === 'guess_name'
                  ? `Select ${option.name}${isSelected ? ' (selected)' : ''}${answered && isCorrect ? ' (correct answer)' : ''}${answered && isSelected && !isCorrect ? ' (incorrect)' : ''}`
                  : `Select option ${options.indexOf(option) + 1}${isSelected ? ' (selected)' : ''}${answered && isCorrect ? ' (correct answer)' : ''}${answered && isSelected && !isCorrect ? ' (incorrect)' : ''}`
              }
              aria-pressed={isSelected}
              aria-disabled={answered}
              tabIndex={answered ? -1 : 0}
            >
              <span className="flex w-full items-center justify-between">
                {gameType === 'guess_name' ? (
                  <span className="flex-1 truncate text-left">{option.name}</span>
                ) : (
                  <div
                    key={`option-image-${currentQuestion}-${option.id}`}
                    className="relative flex max-h-50 min-h-25 min-w-25 flex-1 items-center justify-center"
                  >
                    <Image
                      src={option.image_url || '/placeholder.png'}
                      alt={option.name || 'Option image'}
                      width={200}
                      height={200}
                      priority={true}
                    />
                  </div>
                )}
              </span>
            </Button>
            {answered && gameType === 'guess_image' && (
              <div className="glass-subtle rounded-glass pointer-events-none absolute inset-0 flex items-center justify-center">
                {isCorrect ? (
                  <div className="shadow-glass rounded-full border-4 border-white bg-green-500 p-4">
                    <FaCheck className="h-8 w-8 text-white" />
                  </div>
                ) : isSelected ? (
                  <div className="shadow-glass rounded-full border-4 border-white bg-red-500 p-4">
                    <FaXmark className="h-8 w-8 text-white" />
                  </div>
                ) : null}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
});
