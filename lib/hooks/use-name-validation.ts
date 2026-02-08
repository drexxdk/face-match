import { useState, useEffect } from 'react';
import type { Person } from '@/lib/schemas';

interface UseNameValidationOptions {
  people: Person[];
  currentName: string;
  excludePersonId?: string; // For edit mode, exclude the person being edited
}

export function useNameValidation({ people, currentName, excludePersonId }: UseNameValidationOptions) {
  const [duplicateError, setDuplicateError] = useState<string>('');

  useEffect(() => {
    const trimmedName = currentName.trim();
    if (!trimmedName) {
      setDuplicateError('');
      return;
    }

    // Find duplicate, excluding the current person if in edit mode
    const duplicate = people.find(
      (person) => person.name.toLowerCase() === trimmedName.toLowerCase() && person.id !== excludePersonId,
    );

    if (duplicate) {
      setDuplicateError(`${duplicate.name} is already in this group`);
    } else {
      setDuplicateError('');
    }
  }, [currentName, people, excludePersonId]);

  return { duplicateError };
}
