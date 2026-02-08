'use client';

import { useState, memo } from 'react';
import { FaTrash, FaSpinner, FaCheck, FaXmark, FaUser } from 'react-icons/fa6';
import { AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { StaggeredGrid, StaggeredGridItem } from '@/components/ui/staggered-list';
import { AvatarImage } from '@/components/ui/avatar-image';
import toast from 'react-hot-toast';
import { deletePersonImage } from '@/lib/game-utils';
import { getErrorMessage } from '@/lib/logger';
import type { Person } from '@/lib/schemas';

// Memoized person card to prevent unnecessary re-renders
const PersonCard = memo(function PersonCard({
  person,
  isDeleting,
  isConfirming,
  onDeleteClick,
  onConfirmDelete,
  onCancelDelete,
}: {
  person: Person;
  isDeleting: boolean;
  isConfirming: boolean;
  onDeleteClick: (person: Person) => void;
  onConfirmDelete: (person: Person) => void;
  onCancelDelete: () => void;
}) {
  return (
    <Card
      hover
      variant="compact"
      role="article"
      aria-label={`Person: ${person.first_name} ${person.last_name}`}
      className="relative"
    >
      <div className="flex items-center gap-4">
        <AvatarImage
          src={person.image_url}
          alt={`Photo of ${person.first_name} ${person.last_name}`}
          fallbackName={`${person.first_name} ${person.last_name}`}
          className="size-12"
        />
        <div className="flex-1">
          <p className="font-medium" id={`person-name-${person.id}`}>
            {person.first_name} {person.last_name}
          </p>
          <p className="text-muted-foreground text-sm capitalize">{person.gender}</p>
        </div>
        <Button
          variant="destructive"
          onClick={() => onDeleteClick(person)}
          disabled={isDeleting}
          size="icon"
          aria-label={`Delete ${person.first_name} ${person.last_name}`}
        >
          <Icon icon={FaTrash} size="sm" />
        </Button>
      </div>

      {/* Confirmation overlay */}
      {isConfirming && (
        <div className="absolute inset-0 flex items-center justify-end gap-2 rounded-lg bg-black/60 px-4">
          <Button variant="outline" onClick={onCancelDelete} disabled={isDeleting} size="icon" aria-label="Cancel">
            <Icon icon={FaXmark} size="sm" />
          </Button>
          <Button
            onClick={() => onConfirmDelete(person)}
            disabled={isDeleting}
            size="icon"
            aria-label="Confirm delete"
            className="bg-green-600 text-white hover:bg-green-700"
          >
            {isDeleting ? (
              <Icon icon={FaSpinner} size="sm" className="animate-spin" />
            ) : (
              <Icon icon={FaCheck} size="sm" />
            )}
          </Button>
        </div>
      )}
    </Card>
  );
});

export function PeopleList({ people }: { people: Person[] }) {
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);

  const handleDeleteClick = (person: Person) => {
    setConfirmingDelete(person.id);
  };

  const handleCancelDelete = () => {
    setConfirmingDelete(null);
  };

  const handleConfirmDelete = async (person: Person) => {
    setDeleting(person.id);
    try {
      const supabase = createClient();

      // Delete image from storage if it exists
      if (person.image_url) {
        const result = await deletePersonImage(supabase, person.image_url);
        if (!result.success) {
          // Continue with person deletion even if image deletion fails
        }
      }

      // Delete person from database
      const { error } = await supabase.from('people').delete().eq('id', person.id);

      if (error) throw error;

      toast.success('Person deleted successfully');
      setConfirmingDelete(null);
      // Let real-time subscription handle the removal
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(null);
    }
  };

  if (people.length === 0) {
    return (
      <EmptyState
        icon={<Icon icon={FaUser} size="xl" />}
        title="No people yet"
        description="Add your first person to get started with this group"
      />
    );
  }

  return (
    <StaggeredGrid className="grid gap-3">
      <AnimatePresence mode="popLayout">
        {people.map((person) => (
          <StaggeredGridItem key={person.id}>
            <PersonCard
              person={person}
              isDeleting={deleting === person.id}
              isConfirming={confirmingDelete === person.id}
              onDeleteClick={handleDeleteClick}
              onConfirmDelete={handleConfirmDelete}
              onCancelDelete={handleCancelDelete}
            />
          </StaggeredGridItem>
        ))}
      </AnimatePresence>
    </StaggeredGrid>
  );
}
