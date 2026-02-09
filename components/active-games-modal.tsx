'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button, buttonVariants } from '@/components/ui/button';
import { LoadingLink } from '@/components/ui/loading-link';
import { Icon } from '@/components/ui/icon';
import { Tooltip } from '@/components/ui/tooltip';
import { GameStartedModal } from '@/components/game-started-modal';
import { FaUser, FaImage, FaShareNodes, FaGear, FaClock } from 'react-icons/fa6';

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

function formatTimeAgo(timestamp: string | null): string {
  if (!timestamp) return 'Unknown';
  
  const now = new Date();
  const startTime = new Date(timestamp);
  const diffMs = now.getTime() - startTime.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins === 1) return '1 minute ago';
  if (diffMins < 60) return `${diffMins} minutes ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours === 1) return '1 hour ago';
  if (diffHours < 24) return `${diffHours} hours ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return '1 day ago';
  return `${diffDays} days ago`;
}

function formatFullTimestamp(timestamp: string | null): string {
  if (!timestamp) return 'Unknown time';
  
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

export function ActiveGamesModal({ open, onOpenChange, groupId, groupName, gameSessions }: ActiveGamesModalProps) {
  const [selectedSession, setSelectedSession] = useState<GameSession | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setSelectedSession(null);
      setShowShareModal(false);
    }
  }, [open]);

  const handleOpenGame = (session: GameSession) => {
    setSelectedSession(session);
    setShowShareModal(true);
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
                <Tooltip content={formatFullTimestamp(session.started_at)}>
                  <div className="flex items-center gap-1.5 text-muted-foreground text-sm cursor-help">
                    <Icon icon={FaClock} size="xs" />
                    <span>{formatTimeAgo(session.started_at)}</span>
                  </div>
                </Tooltip>
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
              <div className="flex gap-2">
                <LoadingLink
                  href={`/admin/groups/${groupId}/host/${session.id}/play`}
                  className={buttonVariants({ variant: 'secondary', className: 'flex-1 gap-2' })}
                >
                  <Icon icon={FaGear} size="sm" />
                  Game Details
                </LoadingLink>
                <Button
                  onClick={() => handleOpenGame(session)}
                  size="default"
                  className="flex-1 gap-2"
                >
                  <Icon icon={FaShareNodes} size="sm" />
                  Share
                </Button>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>

      {/* Game Started Modal for sharing */}
      {selectedSession && (
        <GameStartedModal
          open={showShareModal}
          onOpenChange={setShowShareModal}
          gameCode={selectedSession.game_code || ''}
          sessionId={selectedSession.id}
          groupId={groupId}
          groupName={groupName}
        />
      )}
    </Dialog>
  );
}
