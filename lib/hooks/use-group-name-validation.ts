'use client';

import { useState, useEffect } from 'react';

type Group = {
  id: string;
  name: string;
};

/**
 * Hook to validate group name for duplicates
 * @param groups - Array of existing groups
 * @param currentName - The name being validated
 * @param excludeGroupId - Group ID to exclude (for edit mode)
 * @returns Object with duplicateError string
 */
export function useGroupNameValidation(
  groups: Group[],
  currentName: string,
  excludeGroupId?: string
) {
  const [duplicateError, setDuplicateError] = useState<string>('');

  useEffect(() => {
    const trimmedName = currentName.trim();
    
    if (!trimmedName) {
      setDuplicateError('');
      return;
    }

    // Check for duplicate (case-insensitive)
    const duplicate = groups.find(
      (group) =>
        group.name.toLowerCase() === trimmedName.toLowerCase() &&
        group.id !== excludeGroupId
    );

    if (duplicate) {
      setDuplicateError(`A group named "${duplicate.name}" already exists`);
    } else {
      setDuplicateError('');
    }
  }, [currentName, groups, excludeGroupId]);

  return { duplicateError };
}
