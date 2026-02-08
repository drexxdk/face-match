'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface RetryImageProps {
  src: string | null | undefined;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  fallbackSrc?: string;
  maxRetries?: number;
  onError?: () => void;
  fill?: boolean;
  priority?: boolean;
  sizes?: string;
}

export function RetryImage({
  src,
  alt,
  width,
  height,
  className,
  fallbackSrc = '/default-avatar.svg',
  maxRetries = 2,
  onError,
  fill = false,
  priority = false,
  sizes,
}: RetryImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src || fallbackSrc);
  const [retryCount, setRetryCount] = useState(0);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (retryCount < maxRetries && src) {
      // Retry loading the original image with a cache-busting parameter
      setRetryCount((prev) => prev + 1);
      setCurrentSrc(`${src}${src.includes('?') ? '&' : '?'}retry=${retryCount + 1}`);
    } else {
      // After max retries, fall back to the fallback image
      if (currentSrc !== fallbackSrc) {
        setCurrentSrc(fallbackSrc);
        setHasError(true);
        onError?.();
      }
    }
  };

  if (fill) {
    return (
      <Image
        src={currentSrc}
        alt={alt}
        fill
        className={cn(hasError && 'opacity-50', className)}
        onError={handleError}
        priority={priority}
        sizes={sizes}
      />
    );
  }

  return (
    <Image
      src={currentSrc}
      alt={alt}
      width={width || 100}
      height={height || 100}
      className={cn(hasError && 'opacity-50', className)}
      onError={handleError}
      priority={priority}
      sizes={sizes}
    />
  );
}
