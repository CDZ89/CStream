import { useState, useCallback, memo } from 'react';
import { tmdbApi } from '@/lib/tmdb';

interface ImageOptimizerProps {
  src: string | null;
  alt: string;
  className?: string;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

export const ImageOptimizer = memo(({
  src,
  alt,
  className = '',
  priority = false,
  onLoad,
  onError,
}: ImageOptimizerProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setHasError(true);
    onError?.();
  }, [onError]);

  const imageUrl = src ? tmdbApi.getImageUrl(src, 'w500') : '/placeholder.svg';
  const srcSet = src ? tmdbApi.getBackdropSrcSet(src) : undefined;

  return (
    <img
      src={imageUrl}
      srcSet={srcSet}
      alt={alt}
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      onLoad={handleLoad}
      onError={handleError}
      className={`${className} ${!isLoaded ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300 ${
        hasError ? 'opacity-30' : ''
      }`}
    />
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.src === nextProps.src &&
    prevProps.alt === nextProps.alt &&
    prevProps.className === nextProps.className
  );
});

ImageOptimizer.displayName = 'ImageOptimizer';
