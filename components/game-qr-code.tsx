'use client';

import { QRCodeSVG } from 'qrcode.react';

interface GameQRCodeProps {
  gameCode: string;
}

export function GameQRCode({ gameCode }: GameQRCodeProps) {
  // Get the full URL for the join page with the code pre-filled
  const joinUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/game/join?code=${gameCode}`
    : `/game/join?code=${gameCode}`;

  return (
    <QRCodeSVG
      value={joinUrl}
      size={180}
      level="M"
      includeMargin={true}
      bgColor="#ffffff"
      fgColor="#000000"
    />
  );
}
