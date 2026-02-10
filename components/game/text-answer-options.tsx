'use client';

import { Button } from '@/components/ui/button';
import { cva, type VariantProps } from 'class-variance-authority';
import { FaCheck, FaXmark } from 'react-icons/fa6';

interface AnswerOption {
  id: string;
  name?: string | null;
  image_url?: string | null;
}

interface TextAnswerOptionsProps {
  options: AnswerOption[];
  correctPersonId: string;
  selectedAnswer: string | null;
  answered: boolean;
  onAnswer: (answerId: string | null) => void;
}

const textAnswerButtonVariants = cva(
  'relative text-lg font-semibold disabled:opacity-100 overflow-hidden shadow-glass rounded-glass transition-all duration-300 hover:shadow-primary/20 hover:scale-[1.02] hover:shadow-glass group w-full',
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

type TextAnswerButtonVariants = VariantProps<typeof textAnswerButtonVariants>;

export function TextAnswerOptions({
  options,
  correctPersonId,
  selectedAnswer,
  answered,
  onAnswer,
}: TextAnswerOptionsProps) {
  const getButtonVariant = (option: AnswerOption): TextAnswerButtonVariants['selectionState'] => {
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
    <div className="flex flex-1 flex-col justify-center gap-3">
      {options.map((option, index) => {
        const isSelected = selectedAnswer === option.id;
        const isCorrect = option.id === correctPersonId;
        const shortcutKey = (index + 1).toString();
        const buttonVariant = getButtonVariant(option);

        return (
          <Button
            key={option.id}
            variant="default"
            className={textAnswerButtonVariants({ selectionState: buttonVariant })}
            onClick={() => onAnswer(option.id)}
            disabled={answered}
            size="lg"
            aria-label={`Select ${option.name}${isSelected ? ' (selected)' : ''}${answered && isSelected && isCorrect ? ' (correct answer)' : ''}${answered && isSelected && !isCorrect ? ' (incorrect)' : ''}`}
            aria-pressed={isSelected}
            aria-disabled={answered}
            tabIndex={answered ? -1 : 0}
          >
            <span className="flex w-full items-center justify-between">
              <span className="flex-1 truncate text-left">{option.name}</span>
              {answered && isSelected ? (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center">
                  {isCorrect ? (
                    <div className="shadow-glass rounded-full border-2 border-white bg-green-500 p-1">
                      <FaCheck className="h-4 w-4 text-white" />
                    </div>
                  ) : (
                    <div className="shadow-glass rounded-full border-2 border-white bg-red-500 p-1">
                      <FaXmark className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
              ) : (
                <span
                  className={`bg-primary text-primary-foreground ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold shadow-md ${selectedAnswer === null ? 'hidden md:flex' : 'hidden'}`}
                >
                  {shortcutKey}
                </span>
              )}
            </span>
          </Button>
        );
      })}
    </div>
  );
}
