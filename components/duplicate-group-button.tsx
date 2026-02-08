'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaCopy } from 'react-icons/fa6';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { duplicateGroup } from '@/app/actions/duplicate-group';
import toast from 'react-hot-toast';

export function DuplicateGroupButton({ groupId }: { groupId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDuplicate = async () => {
    setLoading(true);
    try {
      const result = await duplicateGroup(groupId);

      if (result.success && result.newGroupId) {
        toast.success('Group duplicated successfully!');
        router.push(`/admin/groups/${result.newGroupId}`);
      } else {
        toast.error(result.error || 'Failed to duplicate group');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleDuplicate}
      loading={loading}
      loadingText="Duplicating..."
      className="w-full gap-2"
    >
      <Icon icon={FaCopy} size="md" />
      Duplicate Group
    </Button>
  );
}
