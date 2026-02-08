'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { memo } from 'react';
import type { Person } from '@/lib/schemas';

interface QuestionDisplayProps {
  gameType: 'guess_name' | 'guess_image';
  person: Person;
  currentQuestion: number;
}

export const QuestionDisplay = memo(function QuestionDisplay({
  gameType,
  person,
  currentQuestion,
}: QuestionDisplayProps) {
  return (
    <Card className="flex-shrink-0 justify-center">
      <CardHeader>
        <CardTitle className="text-center text-2xl">
          {gameType === 'guess_name' ? 'Who is this?' : `Who is ${person.first_name} ${person.last_name}?`}
        </CardTitle>
      </CardHeader>
      {gameType === 'guess_name' && (
        <CardContent>
          <div className="flex justify-center">
            <div className="aspect-square rounded-lg border-4 border-gray-200">
              <Image
                width={256}
                height={256}
                key={`person-image-${currentQuestion}-${person.id}`}
                src={person.image_url || '/placeholder.png'}
                alt={`Photo of person for question ${currentQuestion + 1}`}
                priority={true}
                aria-label={`Question ${currentQuestion + 1}: Who is this person?`}
              />
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
});
