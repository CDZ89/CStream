import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Loader2, AlertTriangle, ExternalLink, RefreshCw, 
  Wifi, WifiOff, Clock, CheckCircle2, XCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { IFRAME_ALLOW_PERMISSIONS } from '@/lib/iframeSecurity';

export type SafeIframeStatus = 'idle' | 'loading' | 'ready' | 'blocked' | 'timeout' | 'fallback';

export interface SafeIframeSource {
  id: string;
  label: string;
  src: string;
  color?: string;
  priority?: number;
}

interface SafeIframeProps {
  sources: SafeIframeSource[];
  title?: string;
  timeoutMs?: number;
  posterPath?: string;
  onReady?: (src: string) => void;
  onBlocked?: (src: string, reason: string) => void;
  onFallback?: (fromSrc: string, toSrc: string, reason: string) => void;
  onStatusChange?: (status: SafeIframeStatus) => void;
  onSourceChange?: (source: SafeIframeSource) => void;
  className?: string;
}

export const SafeIframe = ({
  sources,
  title = 'Lecteur video',
  timeoutMs = 5000,
  posterPath,
  onReady,
  onBlocked,
  onFallback,
  onStatusChange,
  onSourceChange,
  className,
}: SafeIframeProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [status, setStatus] = useState<SafeIframeStatus>('idle');
  const [reason, setReason] = useState<string>('');
  const [loadProgress, setLoadProgress] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [handshakeReceived, setHandshakeReceived] = useState(false);
  
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const progressRef = useRef<NodeJS.Timeout | null>(null);
  
  const currentSource = sources[currentIndex];
  const hasMoreSources = currentIndex < sources.length - 1;

  const updateStatus = useCallback((newStatus: SafeIframeStatus) => {
    setStatus(newStatus);
    onStatusChange?.(newStatus);
  }, [onStatusChange]);

  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (progressRef.current) {
      clearInterval(progressRef.current);
      progressRef.current = null;
    }
  }, []);

  const switchToNextSource = useCallback((switchReason: string) => {
    if (!hasMoreSources) {
      updateStatus('blocked');
      setReason('Aucune source disponible');
      onBlocked?.(currentSource?.src || '', 'no_sources_left');
      return;
    }

    const fromSrc = currentSource?.src || '';
    const nextIndex = currentIndex + 1;
    const toSrc = sources[nextIndex]?.src || '';
    
    setCurrentIndex(nextIndex);
    updateStatus('fallback');
    setReason(switchReason);
    onFallback?.(fromSrc, toSrc, switchReason);
    onSourceChange?.(sources[nextIndex]);
  }, [currentIndex, currentSource, hasMoreSources, sources, onBlocked, onFallback, onSourceChange, updateStatus]);

  const handleRetry = useCallback(() => {
    setRetryCount(prev => prev + 1);
    setLoadProgress(0);
    setHandshakeReceived(false);
    updateStatus('loading');
    setReason('');
  }, [updateStatus]);

  const handleOpenExternal = useCallback(() => {
    if (currentSource?.src) {
      const url = currentSource.src;
      const isInternal = url.startsWith('/') || url.startsWith(window.location.origin);
      if (isInternal) {
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        console.warn('🛡️ Manual external opening blocked for security');
      }
    }
  }, [currentSource]);

  useEffect(() => {
    if (!currentSource || !currentSource.src) {
      if (hasMoreSources) {
        switchToNextSource('invalid_source');
      } else {
        updateStatus('blocked');
        setReason('Aucune source valide');
      }
      return;
    }
    
    clearTimers();
    setLoadProgress(0);
    setHandshakeReceived(false);
    updateStatus('loading');
    setReason('');

    progressRef.current = setInterval(() => {
      setLoadProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 8 + 2;
      });
    }, 150);

    const checkAndTimeout = () => {
      updateStatus('timeout');
      setReason('Délai de chargement dépassé');
      
      if (hasMoreSources) {
        setTimeout(() => {
          switchToNextSource('timeout');
        }, 1500);
      } else {
        onBlocked?.(currentSource.src, 'timeout');
      }
    };

    timerRef.current = setTimeout(checkAndTimeout, timeoutMs);

    return clearTimers;
  }, [currentIndex, retryCount, currentSource, hasMoreSources, switchToNextSource, timeoutMs, onBlocked, clearTimers, updateStatus]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = typeof event.data === 'string' ? event.data : event.data?.type;
        
        if (data === 'PLAYER_READY' || data?.includes?.('PLAYER_READY')) {
          clearTimers();
          setHandshakeReceived(true);
          setLoadProgress(100);
          updateStatus('ready');
          onReady?.(currentSource?.src || '');
        } else if (data === 'PLAYER_ERROR' || data?.includes?.('PLAYER_ERROR')) {
          clearTimers();
          updateStatus('blocked');
          setReason('Le lecteur a signale une erreur');
          onBlocked?.(currentSource?.src || '', 'player_error');
        }
      } catch {}
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [currentSource, clearTimers, updateStatus, onReady, onBlocked]);

  const handleIframeLoad = useCallback(() => {
    clearTimers();
    setLoadProgress(100);
    
    setTimeout(() => {
      if (!handshakeReceived) {
        updateStatus('ready');
        onReady?.(currentSource?.src || '');
      }
    }, 500);
  }, [clearTimers, currentSource, handshakeReceived, updateStatus, onReady]);

  const handleIframeError = useCallback(() => {
    clearTimers();
    updateStatus('blocked');
    setReason('Impossible de charger le lecteur');
    
    if (hasMoreSources) {
      setTimeout(() => {
        switchToNextSource('load_error');
      }, 1000);
    } else {
      onBlocked?.(currentSource?.src || '', 'load_error');
    }
  }, [clearTimers, currentSource, hasMoreSources, switchToNextSource, updateStatus, onBlocked]);

  if (!currentSource) {
    return (
      <div className="w-full aspect-video bg-zinc-900 rounded-2xl flex items-center justify-center">
        <p className="text-white/60">Aucune source disponible</p>
      </div>
    );
  }

  return (
    <div className={cn("relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10", className)}>
      <AnimatePresence mode="wait">
        {(status === 'loading' || status === 'fallback') && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative z-10 flex flex-col items-center"
            >
              <div className="relative w-16 h-16 mb-4">
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-transparent border-t-purple-500 border-r-purple-400/60"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                />
              </div>

              <p className="text-white/80 text-sm font-medium">
                {status === 'fallback' ? 'Changement source...' : 'Chargement...'}
              </p>
            </motion.div>
          </motion.div>
        )}

        {status === 'timeout' && (
          <motion.div
            key="timeout"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-gradient-to-br from-amber-950/30 via-zinc-900 to-zinc-950 p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl"
            >
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Clock className="w-7 h-7 text-amber-400" />
              </div>
              
              <h3 className="text-white font-semibold text-lg mb-2">Chargement lent</h3>
              <p className="text-white/60 text-sm mb-5">
                Le lecteur met du temps a repondre.
                {hasMoreSources && ' Bascule automatique vers une autre source...'}
              </p>
              
              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleRetry}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium bg-amber-500 hover:bg-amber-400 text-black flex items-center gap-2 transition-all"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reessayer
                </button>
                <button
                  onClick={handleOpenExternal}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium bg-white/10 hover:bg-white/20 text-white flex items-center gap-2 transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                  Ouvrir externe
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {status === 'blocked' && (
          <motion.div
            key="blocked"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-gradient-to-br from-red-950/30 via-zinc-900 to-zinc-950 p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl"
            >
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                <XCircle className="w-7 h-7 text-red-400" />
              </div>
              
              <h3 className="text-white font-semibold text-lg mb-2">Lecture bloquee</h3>
              <p className="text-white/60 text-sm mb-2">{reason || 'Ce lecteur ne peut pas s\'afficher.'}</p>
              <p className="text-white/40 text-xs mb-5">Essayez une autre source ou ouvrez dans un nouvel onglet.</p>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {hasMoreSources && (
                  <button
                    onClick={() => switchToNextSource('manual_switch')}
                    className="px-4 py-2.5 rounded-xl text-sm font-medium bg-purple-500 hover:bg-purple-400 text-white flex items-center justify-center gap-2 transition-all"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Autre source
                  </button>
                )}
                <button
                  onClick={handleRetry}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium bg-white/10 hover:bg-white/20 text-white flex items-center justify-center gap-2 transition-all"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reessayer
                </button>
                <button
                  onClick={handleOpenExternal}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium bg-white/10 hover:bg-white/20 text-white flex items-center justify-center gap-2 transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                  Nouvel onglet
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <iframe
        ref={iframeRef}
        key={`${currentSource.src}-${retryCount}`}
        src={currentSource.src}
        title={title}
        className="w-full h-full border-0"
        allow={IFRAME_ALLOW_PERMISSIONS}
        referrerPolicy="no-referrer-when-downgrade"
        loading="eager"
        allowFullScreen
        onLoad={handleIframeLoad}
        onError={handleIframeError}
      />

      {status === 'ready' && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="absolute top-4 right-4 z-10 px-3 py-1.5 rounded-full bg-green-500/20 border border-green-500/30 flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 text-green-400" />
          <span className="text-green-400 text-xs font-medium">Pret</span>
        </motion.div>
      )}
    </div>
  );
};

export default SafeIframe;
