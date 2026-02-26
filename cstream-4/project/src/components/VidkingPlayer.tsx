import { useEffect, useRef, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Loader2, AlertTriangle, ExternalLink, RefreshCw, Maximize, Minimize, Server, Check, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { IFRAME_ALLOW_PERMISSIONS } from '@/lib/iframeSecurity';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface VidkingPlayerProps {
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  season?: number;
  episode?: number;
  autoPlay?: boolean;
  progress?: number;
  onProgressUpdate?: (data: VidkingProgressData) => void;
  onVideoEnd?: () => void;
  className?: string;
}

export interface VidkingProgressData {
  event: 'timeupdate' | 'play' | 'pause' | 'ended' | 'seeked';
  currentTime: number;
  duration: number;
  progress: number;
  id: string;
  mediaType: string;
  season?: number;
  episode?: number;
  timestamp: number;
}

const VIDKING_BASE_URL = 'https://www.vidking.net/embed';
const PRIMARY_COLOR = '8B5CF6';

const AVAILABLE_SERVERS = ['auto', 'vidsrc', 'vidsrcpro', 'embedsu', 'superembed', 'moviee'];

const getServerTranslations = (lang: string) => ({
  auto: { name: 'Auto', description: lang === 'fr' ? 'Sélection automatique' : 'Automatic selection' },
  vidsrc: { name: 'VidSrc', description: lang === 'fr' ? 'Serveur principal' : 'Main server' },
  vidsrcpro: { name: 'VidSrc Pro', description: lang === 'fr' ? 'Qualité HD' : 'HD Quality' },
  embedsu: { name: 'EmbedSU', description: lang === 'fr' ? 'Alternative rapide' : 'Fast alternative' },
  superembed: { name: 'SuperEmbed', description: lang === 'fr' ? 'Multi-sources' : 'Multi-sources' },
  moviee: { name: 'Moviee', description: lang === 'fr' ? 'Serveur stable' : 'Stable server' },
});

interface VidkingPlayerPropsExtended extends VidkingPlayerProps {
  server?: string;
  hideServer?: boolean;
}

export const VidkingPlayer = ({
  tmdbId,
  mediaType,
  season,
  episode,
  autoPlay = true,
  progress,
  onProgressUpdate,
  onVideoEnd,
  className = '',
  server,
  hideServer = false,
}: VidkingPlayerPropsExtended) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { language } = useI18n();
  
  const [currentServer, setCurrentServer] = useState(server || 'auto');
  const [iframeKey, setIframeKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const serverTranslations = getServerTranslations(language);

  const buildVidkingUrl = useCallback(() => {
    let url = '';
    
    if (mediaType === 'movie') {
      url = `${VIDKING_BASE_URL}/movie/${tmdbId}`;
    } else {
      const s = season || 1;
      const e = episode || 1;
      url = `${VIDKING_BASE_URL}/tv/${tmdbId}/${s}/${e}`;
    }

    const params = new URLSearchParams();
    params.set('color', PRIMARY_COLOR);
    params.set('autoplay', '1');
    
    if (mediaType === 'tv') {
      params.set('nextEpisode', 'true');
      params.set('episodeSelector', 'true');
    }
    
    if (progress && progress > 0) {
      params.set('progress', String(Math.round(progress)));
    }

    if (currentServer && currentServer !== 'auto') {
      params.set('server', currentServer);
    }
    
    if (hideServer) {
      params.set('hideServer', 'true');
    }

    return `${url}?${params.toString()}`;
  }, [tmdbId, mediaType, season, episode, autoPlay, progress, currentServer, hideServer]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        if (typeof event.data !== 'string') return;
        
        const data = JSON.parse(event.data);
        
        if (data.type === 'PLAYER_EVENT' && data.data) {
          const progressData: VidkingProgressData = {
            event: data.data.event,
            currentTime: data.data.currentTime || 0,
            duration: data.data.duration || 0,
            progress: data.data.progress || 0,
            id: data.data.id || String(tmdbId),
            mediaType: data.data.mediaType || mediaType,
            season: data.data.season,
            episode: data.data.episode,
            timestamp: data.data.timestamp || Date.now(),
          };

          if (onProgressUpdate) {
            onProgressUpdate(progressData);
          }

          if (data.data.event === 'ended' && onVideoEnd) {
            onVideoEnd();
          }
        }
      } catch (e) {}
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [tmdbId, mediaType, onProgressUpdate, onVideoEnd]);

  const togglePlayerFullscreen = useCallback(() => {
    if (containerRef.current) {
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    }
  }, []);

  const handleServerChange = useCallback((serverId: string) => {
    setCurrentServer(serverId);
    setIframeKey(prev => prev + 1);
    setIsLoaded(false);
  }, []);

  const handleOpenExternal = useCallback(() => {
    window.open(buildVidkingUrl(), '_blank', 'noopener,noreferrer');
  }, [buildVidkingUrl]);

  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  }, []);

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  const videoUrl = buildVidkingUrl();
  const serverButtonLabel = language === 'fr' ? 'Serveur' : 'Server';
  const selectServerLabel = language === 'fr' ? 'Choisir un serveur' : 'Select server';

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setShowControls(false)}
      className={cn(
        "relative w-full aspect-video bg-black rounded-xl overflow-hidden group shadow-2xl",
        "ring-1 ring-white/10 hover:ring-white/20 transition-all duration-300",
        className
      )}
    >
      <iframe
        key={iframeKey}
        ref={iframeRef}
        src={videoUrl}
        className="w-full h-full border-0"
        allowFullScreen
        allow={IFRAME_ALLOW_PERMISSIONS}
        referrerPolicy="no-referrer-when-downgrade"
        loading="eager"
        onLoad={() => setIsLoaded(true)}
      />
      
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: showControls ? 1 : 0 }}
        className="absolute top-0 left-0 right-0 p-2 sm:p-3 bg-gradient-to-b from-black/80 to-transparent z-10 pointer-events-none"
      >
        <div className="flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-2">
            <div className="px-2 py-1 rounded-lg bg-purple-500/20 border border-purple-500/30">
              <span className="text-xs font-medium text-purple-400">VidKing</span>
            </div>
            {mediaType === 'tv' && (
              <span className="px-2 py-1 text-xs font-medium bg-white/10 backdrop-blur-sm rounded-lg text-white/80">
                S{season} E{episode}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-white/50">
            <Wifi className={cn("w-3 h-3", isLoaded ? "text-green-400" : "animate-pulse")} />
            <span className="hidden sm:inline">{isLoaded ? 'Connecté' : 'Connexion...'}</span>
          </div>
        </div>
      </motion.div>
      
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: showControls ? 1 : 0 }}
        className="absolute bottom-0 left-0 right-0 p-2 sm:p-3 bg-gradient-to-t from-black/90 via-black/60 to-transparent z-10"
      >
        <div className="flex items-center justify-end gap-1 sm:gap-2">
          <Button 
            size="sm" 
            variant="ghost"
            onClick={handleOpenExternal}
            className="h-7 sm:h-8 px-2 gap-1.5 text-white/80 hover:text-white hover:bg-white/10"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-xs">Externe</span>
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                size="sm" 
                variant="ghost"
                className="h-7 sm:h-8 px-2 gap-1.5 text-white/80 hover:text-white hover:bg-white/10"
              >
                <Server className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-xs">{serverButtonLabel}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-zinc-900/95 backdrop-blur-xl border-white/10">
              <DropdownMenuLabel className="text-xs text-white/50 uppercase tracking-wider">
                {selectServerLabel}
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10" />
              {AVAILABLE_SERVERS.map((serverId) => {
                const srv = serverTranslations[serverId as keyof typeof serverTranslations];
                return (
                  <DropdownMenuItem
                    key={serverId}
                    onClick={() => handleServerChange(serverId)}
                    className={cn(
                      "cursor-pointer transition-colors",
                      currentServer === serverId ? "bg-purple-500/20 text-purple-400" : "hover:bg-white/10"
                    )}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        currentServer === serverId ? "bg-purple-500 animate-pulse" : "bg-white/30"
                      )} />
                      <div className="flex flex-col flex-1">
                        <span className="font-medium text-sm">{srv.name}</span>
                        <span className="text-xs text-white/50">{srv.description}</span>
                      </div>
                      {currentServer === serverId && (
                        <Check className="w-4 h-4 text-purple-400" />
                      )}
                    </div>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button 
            size="sm" 
            variant="ghost"
            onClick={togglePlayerFullscreen}
            className="h-7 sm:h-8 px-2 text-white/80 hover:text-white hover:bg-white/10"
          >
            {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </motion.div>

      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500/50 via-purple-500 to-purple-500/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </div>
  );
};

interface VidkingPlayerWithLoadingProps extends VidkingPlayerProps {
  isLoading?: boolean;
  hasError?: boolean;
  onRetry?: () => void;
  onOpenExternal?: () => void;
  title?: string;
}

export const VidkingPlayerWithLoading = ({
  isLoading = false,
  hasError = false,
  onRetry,
  onOpenExternal,
  title,
  ...playerProps
}: VidkingPlayerWithLoadingProps) => {
  const { t, language } = useI18n();

  if (isLoading) {
    return (
      <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden">
        <motion.div 
          className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-black via-purple-950/20 to-black p-4 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="relative mb-4 sm:mb-6"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-purple-500/20 flex items-center justify-center">
              <motion.div
                className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-4 border-t-purple-500 border-r-purple-500/60 border-b-transparent border-l-transparent"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
            </div>
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Play className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500 fill-purple-500" />
            </motion.div>
          </motion.div>
          
          <motion.div
            className="text-center mb-4"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="text-white font-medium text-base sm:text-lg mb-1">
              {t('common.loading')}
            </h3>
            <p className="text-purple-400 text-sm font-medium">VidKing Player</p>
            {title && (
              <p className="text-white/60 text-xs sm:text-sm mt-2 max-w-xs truncate">{title}</p>
            )}
          </motion.div>

          <motion.div
            className="w-48 sm:w-64 h-1 sm:h-1.5 bg-white/10 rounded-full overflow-hidden"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "100%", opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <motion.div
              className="h-full bg-gradient-to-r from-purple-600 via-purple-500 to-purple-600 rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 2.5, ease: "easeInOut" }}
            />
          </motion.div>
        </motion.div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden">
        <motion.div 
          className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-red-950/30 via-zinc-900/50 to-black p-4 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <motion.div
            className="bg-zinc-900/90 backdrop-blur-sm border border-yellow-500/20 rounded-xl sm:rounded-2xl p-4 sm:p-8 max-w-md w-full text-center shadow-2xl"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
          >
            <motion.div
              className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full bg-yellow-500/10 flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
            >
              <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500" />
            </motion.div>
            
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 sm:mb-3">
              {t('player.error')}
            </h3>
            
            <p className="text-xs sm:text-sm text-white/60 mb-4 sm:mb-6">
              {t('player.errorDesc')}
            </p>
            
            <div className="flex flex-col gap-2 sm:gap-3">
              {onOpenExternal && (
                <Button 
                  variant="default"
                  size="lg"
                  className="w-full gap-2 bg-purple-600 hover:bg-purple-700"
                  onClick={onOpenExternal}
                >
                  <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5" />
                  {t('player.openExternal')}
                </Button>
              )}
              {onRetry && (
                <Button 
                  variant="outline" 
                  size="sm"
                  className="gap-2 border-white/20 text-white hover:bg-white/10"
                  onClick={onRetry}
                >
                  <RefreshCw className="w-4 h-4" />
                  {t('player.retry')}
                </Button>
              )}
            </div>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return <VidkingPlayer {...playerProps} />;
};

export const getVidkingDirectUrl = (
  tmdbId: number, 
  mediaType: 'movie' | 'tv', 
  season?: number, 
  episode?: number
): string => {
  if (mediaType === 'movie') {
    return `${VIDKING_BASE_URL}/movie/${tmdbId}?color=${PRIMARY_COLOR}&autoPlay=true`;
  }
  return `${VIDKING_BASE_URL}/tv/${tmdbId}/${season || 1}/${episode || 1}?color=${PRIMARY_COLOR}&autoPlay=true&nextEpisode=true&episodeSelector=true`;
};

export default VidkingPlayer;
