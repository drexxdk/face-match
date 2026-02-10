'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import Image from 'next/image';
import { FaCheck, FaXmark } from 'react-icons/fa6';

interface AnswerOption {
  id: string;
  name?: string | null;
  image_url?: string | null;
}

interface ImageAnswerOptionsProps {
  options: AnswerOption[];
  correctPersonId: string;
  selectedAnswer: string | null;
  answered: boolean;
  onAnswer: (answerId: string | null) => void;
  currentQuestion: number;
}

const imageAnswerButtonVariants = cva(
  'relative text-lg font-semibold disabled:opacity-100 overflow-hidden shadow-glass rounded-glass transition-all duration-300 hover:shadow-primary/20 hover:scale-[1.02] hover:shadow-glass group',
  {
    variants: {
      selectionState: {
        unselected: 'glass-strong border-gradient-subtle',
        selected: 'bg-green-500 border-green-500 text-white ring-green-400',
        correct: 'bg-green-600 border-green-600 text-white ring-green-500',
        incorrect: 'bg-red-500 border-red-500 text-white ring-red-400',
      },
    },
    defaultVariants: {
      selectionState: 'unselected',
    },
  },
);

type ImageAnswerButtonVariants = VariantProps<typeof imageAnswerButtonVariants>;

export function ImageAnswerOptions({
  options,
  correctPersonId,
  selectedAnswer,
  answered,
  onAnswer,
  currentQuestion,
}: ImageAnswerOptionsProps) {
  // Determine grid layout based on option count
  const getGridClasses = () => {
    const count = options.length;

    // For image guessing, maintain at least 2 columns on mobile and allow full expansion
    if (count === 2) {
      return 'grid grid-cols-2 gap-4 w-full px-4 place-items-center';
    } else if (count === 3) {
      return 'grid grid-cols-2 md:grid-cols-3 gap-4 w-full px-4 place-items-center';
    } else if (count === 4) {
      return 'grid grid-cols-2 gap-6 w-full px-4 place-items-center';
    } else {
      return 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full px-4 place-items-center';
    }
  };

  const getButtonVariant = (option: AnswerOption): ImageAnswerButtonVariants['selectionState'] => {
    const isSelected = selectedAnswer === option.id;
    const isCorrect = option.id === correctPersonId;

    if (!answered) {
      return isSelected ? 'selected' : 'unselected';
    }

    if (isCorrect && isSelected) return 'correct';
    if (isSelected && !isCorrect) return 'incorrect';
    return 'unselected';
  };

  return (
    <div className={cn('flex-1 justify-center', getGridClasses())}>
      {options.map((option, index) => {
        const isSelected = selectedAnswer === option.id;
        const isCorrect = option.id === correctPersonId;
        const shortcutKey = (index + 1).toString();
        const buttonVariant = getButtonVariant(option);

        return (
          <Button
            key={option.id}
            variant="default"
            className={imageAnswerButtonVariants({ selectionState: buttonVariant })}
            onClick={() => onAnswer(option.id)}
            disabled={answered}
            size="default"
            aria-label={`Select option ${shortcutKey}${isSelected ? ' (selected)' : ''}${answered && isCorrect ? ' (correct answer)' : ''}${answered && isSelected && !isCorrect ? ' (incorrect)' : ''}`}
            aria-pressed={isSelected}
            aria-disabled={answered}
            tabIndex={answered ? -1 : 0}
          >
            <div className="relative flex w-full flex-col items-center gap-2">
              <div
                key={`option-image-${currentQuestion}-${option.id}`}
                className="relative flex aspect-square w-full items-center justify-center"
              >
                <Image
                  src={option.image_url || '/placeholder.png'}
                  alt={option.name || 'Option image'}
                  fill
                  className="rounded-lg object-cover"
                  priority={true}
                />
                {!answered && selectedAnswer === null && (
                  <span className="bg-primary text-primary-foreground absolute right-2 bottom-2 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold shadow-md md:flex">
                    {shortcutKey}
                  </span>
                )}
                {answered && isSelected && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/90 shadow-lg">
                      {isCorrect ? (
                        <FaCheck size={40} className="text-green-600" />
                      ) : (
                        <FaXmark size={40} className="text-red-600" />
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Button>
        );
      })}
    </div>
  );
}
