'use client';

import { useEffect, useState } from 'react';
import { FaCopy, FaArrowRight, FaChartLine } from 'react-icons/fa6';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button, buttonVariants } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { LoadingLink } from '@/components/ui/loading-link';
import { GameQRCode } from '@/components/game-qr-code';
import toast from 'react-hot-toast';

interface GameStartedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gameCode: string;
  sessionId: string;
  groupId: string;
  groupName: string;
}

export function GameStartedModal({ open, onOpenChange, gameCode, sessionId, groupId, groupName }: GameStartedModalProps) {
  const [gameUrl, setGameUrl] = useState('');

  // Update game URL when modal opens (client-side only to avoid hydration issues)
  useEffect(() => {
    if (open && gameCode && typeof window !== 'undefined') {
      setGameUrl(`${window.location.origin}/game/join?code=${gameCode}`);
    }
  }, [open, gameCode]);

  const copyGameCode = () => {
    if (gameCode) {
      navigator.clipboard.writeText(gameCode);
      toast.success('Game code copied!');
    }
  };

  const copyGameUrl = () => {
    if (gameUrl) {
      navigator.clipboard.writeText(gameUrl);
      toast.success('Game link copied!');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{groupName}&apos;s Game</DialogTitle>
          <DialogDescription>Players can join using either method below</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Game Code */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Game Code</label>
            <div className="flex gap-2">
              <div className="bg-muted flex-1 rounded-lg px-4 py-3 text-center font-mono text-2xl font-bold tracking-wider">
                {gameCode}
              </div>
              <Button onClick={copyGameCode} variant="outline" size="icon" className="shrink-0">
                <Icon icon={FaCopy} size="md" />
              </Button>
            </div>
          </div>

          {/* QR Code */}
          {gameCode && (
            <div className="flex flex-col items-center gap-2">
              <label className="text-sm font-medium">QR Code</label>
              <div className="rounded-lg border bg-white p-4">
                <GameQRCode gameCode={gameCode} />
              </div>
              <p className="text-muted-foreground text-center text-xs">Opens with code pre-filled</p>
            </div>
          )}

          {/* Share URL */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Share Link</label>
            <div className="flex gap-2">
              <input type="text" value={gameUrl} readOnly className="bg-muted flex-1 rounded-lg px-3 py-2 text-sm" />
              <Button onClick={copyGameUrl} variant="outline" size="icon" className="shrink-0">
                <Icon icon={FaCopy} size="md" />
              </Button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 pt-4 sm:flex-row">
          <LoadingLink
            href={`/admin/groups/${groupId}/host/${sessionId}/play`}
            className={buttonVariants({ variant: 'outline', className: 'flex flex-1 items-center gap-2' })}
          >
            <Icon icon={FaChartLine} size="sm" />
            Game Details
          </LoadingLink>
          <LoadingLink
            href={`/game/join?code=${gameCode}`}
            className={buttonVariants({ className: 'flex flex-1 items-center gap-2' })}
          >
            Go to Game
            <Icon icon={FaArrowRight} size="sm" />
          </LoadingLink>
        </div>
      </DialogContent>
    </Dialog>
  );
}
