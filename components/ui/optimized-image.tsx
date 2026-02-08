'use client';

import Image, { ImageProps } from 'next/image';
import { useState, memo } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends Omit<ImageProps, 'onError' | 'onLoad'> {
  fallbackSrc?: string;
  showLoadingState?: boolean;
}

// Simple blur placeholder - a tiny gray SVG
const blurDataUrl =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMzMzIi8+PC9zdmc+';

/**
 * Optimized Image component with:
 * - Blur placeholder while loading
 * - Fallback image on error
 * - Loading state indicator
 * - Lazy loading by default
 */
export const OptimizedImage = memo(function OptimizedImage({
  src,
  alt,
  fallbackSrc = '/placeholder-person.svg',
  showLoadingState = true,
  className,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imageSrc, setImageSrc] = useState(src);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setError(true);
    setIsLoading(false);
    if (fallbackSrc && imageSrc !== fallbackSrc) {
      setImageSrc(fallbackSrc);
    }
  };

  return (
    <div className={cn('relative overflow-hidden', className)}>
      <Image
        {...props}
        src={error ? fallbackSrc : imageSrc}
        alt={alt}
        className={cn('transition-opacity duration-300', isLoading && showLoadingState ? 'opacity-0' : 'opacity-100')}
        placeholder="blur"
        blurDataURL={blurDataUrl}
        loading="lazy"
        onLoad={handleLoad}
        onError={handleError}
      />
      {isLoading && showLoadingState && <div className="bg-muted absolute inset-0 animate-pulse" />}
    </div>
  );
});

/**
 * Avatar-specific optimized image with circular styling
 */
export const OptimizedAvatar = memo(function OptimizedAvatar({
  src,
  alt,
  size = 48,
  className,
  ...props
}: Omit<OptimizedImageProps, 'width' | 'height'> & { size?: number }) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={cn('rounded-full', className)}
      {...props}
    />
  );
});

/**
 * Card image with aspect ratio preservation
 */
export const OptimizedCardImage = memo(function OptimizedCardImage({
  src,
  alt,
  aspectRatio = 'square',
  className,
  ...props
}: Omit<OptimizedImageProps, 'fill'> & {
  aspectRatio?: 'square' | 'video' | 'portrait';
}) {
  const aspectClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    portrait: 'aspect-[3/4]',
  };

  return (
    <div className={cn('relative', aspectClasses[aspectRatio], className)}>
      <OptimizedImage
        src={src}
        alt={alt}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        {...props}
      />
    </div>
  );
});
