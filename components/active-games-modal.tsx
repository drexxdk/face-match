'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { FaUser, FaImage, FaArrowUpRightFromSquare } from 'react-icons/fa6';
import { useLoading } from '@/lib/loading-context';

interface GameSession {
  id: string;
  game_code: string | null;
  game_type: 'guess_name' | 'guess_face' | 'guess_image';
  time_limit_seconds: number | null;
  options_count: number | null;
  total_questions: number | null;
  started_at: string | null;
  status: string | null;
}

interface ActiveGamesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  groupName: string;
  gameSessions: GameSession[];
}

export function ActiveGamesModal({ open, onOpenChange, groupId, groupName, gameSessions }: ActiveGamesModalProps) {
  const router = useRouter();
  const { setLoading: setGlobalLoading } = useLoading();
  const [loadingSessionId, setLoadingSessionId] = useState<string | null>(null);

  // Reset loading state when modal opens
  useEffect(() => {
    if (open) {
      setLoadingSessionId(null);
    }
  }, [open]);

  const handleOpenGame = (sessionId: string) => {
    setLoadingSessionId(sessionId);
    setGlobalLoading(true);
    router.push(`/admin/groups/${groupId}/host/${sessionId}/play`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Active Games - {groupName}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto">
          {gameSessions.map((session) => (
            <div
              key={session.id}
              className="bg-primary/5 border-primary/10 flex flex-col gap-3 rounded-lg border p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {session.game_type === 'guess_name' ? (
                    <Icon icon={FaUser} size="md" color="primary" />
                  ) : (
                    <Icon icon={FaImage} size="md" color="primary" />
                  )}
                  <span className="text-base font-medium">
                    {session.game_type === 'guess_name' ? 'Guess Name' : 'Guess Face'}
                  </span>
                </div>
                <Badge className="font-mono">{session.game_code || 'N/A'}</Badge>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <p className="text-muted-foreground text-xs">Timer</p>
                  <p className="text-sm font-semibold">{session.time_limit_seconds || 30}s</p>
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-muted-foreground text-xs">Options</p>
                  <p className="text-sm font-semibold">{session.options_count || 4}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-muted-foreground text-xs">Questions</p>
                  <p className="text-sm font-semibold">{session.total_questions || 'All'}</p>
                </div>
              </div>
              <Button
                onClick={() => handleOpenGame(session.id)}
                loading={loadingSessionId === session.id}
                size="default"
                className="w-full gap-2"
              >
                <Icon icon={FaArrowUpRightFromSquare} size="sm" />
                Open Game
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
