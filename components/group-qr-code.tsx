'use client';

import { QRCodeSVG } from 'qrcode.react';

interface GroupQRCodeProps {
  shareCode: string;
}

export function GroupQRCode({ shareCode }: GroupQRCodeProps) {
  // Get the full URL for the import page with the code pre-filled
  const importUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/admin/import?code=${shareCode}`
      : `/admin/import?code=${shareCode}`;

  return <QRCodeSVG value={importUrl} size={180} level="M" includeMargin={true} bgColor="#ffffff" fgColor="#000000" />;
}
