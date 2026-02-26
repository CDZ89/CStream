import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Loader2, RefreshCw, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IFRAME_ALLOW_PERMISSIONS, getPlayerFromUrl } from '@/lib/iframeSecurity';

interface PureIframePlayerProps {
  src: string;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
  aspectRatio?: 'video' | 'custom';
  playerType?: 'vidking' | 'vidfast';
  allowPopup?: boolean;
  posterPath?: string;
}

export const PureIframePlayer = ({
  src,
  className,
  onLoad,
  onError,
  aspectRatio = 'video',
  playerType = 'vidking',
  allowPopup = false,
  posterPath,
}: PureIframePlayerProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  const iframeProps = useMemo(() => {
    const player = getPlayerFromUrl(src);

    return {
      // Added sandbox to block top-navigation and popups while keeping scripts and same-origin
      sandbox: "allow-scripts allow-same-origin allow-forms allow-presentation",
      allow: IFRAME_ALLOW_PERMISSIONS.replace('autoplay;', 'autoplay;'),
      referrerPolicy: 'no-referrer-when-downgrade' as const,
      loading: 'eager' as const,
      playerName: player?.name || 'Player',
    };
  }, [src]);

  const handleIframeClick = useCallback((e: React.MouseEvent) => {
    // Intercept clicks to prevent external redirects
    e.stopPropagation();
  }, []);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  }, [onError]);

  const handleRetry = useCallback(() => {
    setIsLoading(true);
    setHasError(false);
    setRetryCount(prev => prev + 1);
  }, []);

  const openInNewTab = useCallback(() => {
    const isInternal = src.startsWith('/') || src.startsWith(window.location.origin);
    if (isInternal) {
      window.open(src, '_blank', 'noopener,noreferrer');
    } else {
      console.warn('🛡️ Manual external opening blocked for security');
    }
  }, [src]);

  // Prevent programmatic redirects and popups
  useEffect(() => {
    const originalOpen = window.open;
    window.open = function () {
      console.warn('🛡️ Popup blocked for security');
      return null;
    };

    return () => {
      window.open = originalOpen;
    };
  }, []);

  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
    setRetryCount(0);
  }, [src]);

  const accentColor = playerType === 'vidfast' ? 'emerald' : 'purple';

  return (
    <div className="flex flex-col w-full">
      <div
        className={cn(
          "relative w-full bg-black overflow-hidden",
          aspectRatio === 'video' ? "aspect-video" : "",
          "rounded-xl sm:rounded-2xl",
          "ring-1 ring-white/10",
          "shadow-2xl shadow-black/50",
          className
        )}
      >
        {/* Transparent overlay to catch clicks that might trigger redirects */}
        <div
          className="absolute inset-0 z-[5] pointer-events-auto cursor-pointer"
          onClick={(e) => {
            if (!isPlayerReady) setIsPlayerReady(true);
            else handleIframeClick(e);
          }}
        />

        <AnimatePresence>
          {!isPlayerReady ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-30 cursor-pointer flex items-center justify-center bg-zinc-900 group"
              onClick={() => setIsPlayerReady(true)}
            >
              {posterPath ? (
                <img
                  src={posterPath.startsWith('http') ? posterPath : `https://image.tmdb.org/t/p/w1280${posterPath}`}
                  alt="Video Poster"
                  className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-40 transition-opacity"
                />
              ) : (
                <div className="absolute inset-0 bg-black/50 group-hover:bg-black/40 transition-colors" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
              <div className={cn(
                "relative z-10 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center transform group-hover:scale-110 transition-transform shadow-[0_0_30px_rgba(0,0,0,0.5)] backdrop-blur-sm",
                playerType === 'vidfast' ? "bg-emerald-600/90 shadow-emerald-500/50" : "bg-purple-600/90 shadow-purple-500/50"
              )}>
                <Play className="w-8 h-8 sm:w-10 sm:h-10 text-white fill-white ml-1 sm:ml-2" />
              </div>
            </motion.div>
          ) : null}

          {isPlayerReady && isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
              className={cn(
                "absolute inset-0 z-10 flex flex-col items-center justify-center",
                "bg-gradient-to-br from-black via-zinc-900/80 to-black"
              )}
            >
              <motion.div
                className="relative mb-4"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.05, duration: 0.3 }}
              >
                <div className={cn(
                  "w-16 h-16 rounded-full border-4 flex items-center justify-center",
                  playerType === 'vidfast' ? "border-emerald-500/25" : "border-purple-500/25"
                )}>
                  <motion.div
                    className={cn(
                      "w-12 h-12 rounded-full border-4 border-t-transparent border-l-transparent",
                      playerType === 'vidfast'
                        ? "border-r-emerald-500 border-b-emerald-500/70"
                        : "border-r-purple-500 border-b-purple-500/70"
                    )}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                  />
                </div>
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.15 }}
                >
                  <Play className={cn(
                    "w-5 h-5 fill-current",
                    playerType === 'vidfast' ? "text-emerald-500" : "text-purple-500"
                  )} />
                </motion.div>
              </motion.div>

              <motion.div
                className="text-center"
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <p className={cn(
                  "text-sm font-medium",
                  playerType === 'vidfast' ? "text-emerald-400" : "text-purple-400"
                )}>
                  Chargement du lecteur...
                </p>
              </motion.div>

              <motion.div
                className="w-48 h-1 bg-white/10 rounded-full overflow-hidden mt-4"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 192, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.4 }}
              >
                <motion.div
                  className={cn(
                    "h-full rounded-full",
                    playerType === 'vidfast'
                      ? "bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600"
                      : "bg-gradient-to-r from-purple-600 via-purple-500 to-purple-600"
                  )}
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 3, ease: "easeInOut" }}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {hasError && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/95 backdrop-blur-sm">
            <div className="text-center p-6 max-w-sm">
              <div className={cn(
                "w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center",
                playerType === 'vidfast' ? "bg-emerald-500/20" : "bg-purple-500/20"
              )}>
                <RefreshCw className={cn(
                  "w-8 h-8",
                  playerType === 'vidfast' ? "text-emerald-400" : "text-purple-400"
                )} />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Lecteur indisponible</h3>
              <p className="text-sm text-white/60 mb-4">
                Ce lecteur ne peut pas s'afficher. Essayez de recharger ou d'ouvrir dans un nouvel onglet.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleRetry}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-all",
                    playerType === 'vidfast'
                      ? "bg-emerald-500 hover:bg-emerald-400 text-white"
                      : "bg-purple-500 hover:bg-purple-400 text-white"
                  )}
                >
                  <RefreshCw className="w-4 h-4" />
                  Réessayer
                </button>
                <button
                  onClick={openInNewTab}
                  className="px-4 py-2 rounded-xl text-sm font-medium bg-white/10 hover:bg-white/20 text-white flex items-center gap-2 transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                  Nouvel onglet
                </button>
              </div>
            </div>
          </div>
        )}

        {isPlayerReady && (
          <iframe
            ref={iframeRef}
            key={`${src}-${retryCount}`}
            src={src}
            className="w-full h-full border-0 relative z-[1]"
            allowFullScreen
            sandbox={iframeProps.sandbox}
            allow={iframeProps.allow}
            referrerPolicy={iframeProps.referrerPolicy}
            loading={iframeProps.loading}
            onLoad={handleLoad}
            onError={handleError}
          />
        )}
      </div>
    </div>
  );
};

export default PureIframePlayer;
