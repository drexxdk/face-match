'use client';

import Image from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface AvatarImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  fallbackName?: string;
}

// Generate a consistent color based on the name
function getColorFromName(name: string): string {
  const colors = [
    'from-blue-500 to-purple-600',
    'from-green-500 to-teal-600',
    'from-orange-500 to-red-600',
    'from-pink-500 to-rose-600',
    'from-indigo-500 to-blue-600',
    'from-yellow-500 to-orange-600',
    'from-purple-500 to-pink-600',
    'from-teal-500 to-green-600',
  ];

  const hash = name.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);

  return colors[Math.abs(hash) % colors.length];
}

// Get initials from name
function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function AvatarImage({ src, alt, className, fallbackName }: AvatarImageProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const showFallback = !src || imageError;
  const displayName = fallbackName || alt || '??';
  const initials = getInitials(displayName);
  const gradientColors = getColorFromName(displayName);

  if (showFallback) {
    return (
      <div className={cn('relative overflow-hidden bg-linear-to-br', gradientColors, className)}>
        <div className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-white">
          {initials}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('bg-muted relative overflow-hidden', className)}>
      {/* Blur placeholder */}
      {!imageLoaded && <div className={cn('absolute inset-0 animate-pulse bg-linear-to-br', gradientColors)} />}

      {/* Actual image */}
      <Image
        src={src}
        alt={alt}
        fill
        className={cn('object-cover transition-opacity duration-300', imageLoaded ? 'opacity-100' : 'opacity-0')}
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageError(true)}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
    </div>
  );
}
