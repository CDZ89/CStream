import { useEffect, useRef, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Loader2, AlertTriangle, ExternalLink, RefreshCw, Server, Check, Maximize, MonitorPlay } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { useUserSettings } from '@/hooks/useUserSettings';
import { IFRAME_ALLOW_PERMISSIONS } from '@/lib/iframeSecurity';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

interface VidFastPlayerProps {
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  season?: number;
  episode?: number;
  autoPlay?: boolean;
  progress?: number;
  theme?: string;
  server?: string;
  subtitleLanguage?: string;
  hideServer?: boolean;
  chromecast?: boolean;
  fullscreenButton?: boolean;
  onProgressUpdate?: (data: VidFastProgressData) => void;
  onVideoEnd?: () => void;
  className?: string;
}

export interface VidFastProgressData {
  event: 'timeupdate' | 'play' | 'pause' | 'ended' | 'seeked' | 'playerstatus';
  currentTime: number;
  duration: number;
  progress: number;
  id: string;
  mediaType: string;
  season?: number;
  episode?: number;
  playing?: boolean;
  muted?: boolean;
  volume?: number;
  timestamp: number;
}

const VIDFAST_BASE_URL = 'https://vidfast.pro';
const VIDFAST_ORIGINS = [
  'https://vidfast.pro',
  'https://vidfast.in',
  'https://vidfast.io',
  'https://vidfast.me',
  'https://vidfast.net',
  'https://vidfast.pm',
  'https://vidfast.xyz'
];
const PRIMARY_COLOR = '8B5CF6';

const getServerTranslations = (lang: string) => ({
  auto: {
    name: 'Auto',
    description: lang === 'fr' ? 'Serveur automatique' : lang === 'es' ? 'Servidor automático' : lang === 'de' ? 'Automatischer Server' : 'Automatic server'
  },
  vidcloud: {
    name: 'VidCloud',
    description: lang === 'fr' ? 'Serveur rapide' : lang === 'es' ? 'Servidor rápido' : lang === 'de' ? 'Schneller Server' : 'Fast server'
  },
  upcloud: {
    name: 'UpCloud',
    description: lang === 'fr' ? 'Haute qualité' : lang === 'es' ? 'Alta calidad' : lang === 'de' ? 'Hohe Qualität' : 'High quality'
  },
  mixdrop: {
    name: 'MixDrop',
    description: lang === 'fr' ? 'Alternative stable' : lang === 'es' ? 'Alternativa estable' : lang === 'de' ? 'Stabile Alternative' : 'Stable alternative'
  },
  filemoon: {
    name: 'FileMoon',
    description: lang === 'fr' ? 'Serveur fiable' : lang === 'es' ? 'Servidor confiable' : lang === 'de' ? 'Zuverlässiger Server' : 'Reliable server'
  }
});

const AVAILABLE_SERVERS = ['auto', 'vidcloud', 'upcloud', 'mixdrop', 'filemoon'];

export const VidFastPlayer = ({
  tmdbId,
  mediaType,
  season,
  episode,
  autoPlay = true,
  progress,
  theme = PRIMARY_COLOR,
  server,
  subtitleLanguage,
  hideServer = false,
  chromecast = true,
  fullscreenButton = true,
  onProgressUpdate,
  onVideoEnd,
  className = '',
}: VidFastPlayerProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { language, t } = useI18n();
  const { settings } = useUserSettings();
  const [currentServer, setCurrentServer] = useState(server || 'auto');
  const [iframeKey, setIframeKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSandboxed, setIsSandboxed] = useState(false);
  const [showExternalPrompt, setShowExternalPrompt] = useState(false);

  // Ne plus bloquer automatiquement - laisser le lecteur fonctionner
  // L'utilisateur peut ouvrir en externe si nécessaire via le bouton

  const serverTranslations = getServerTranslations(language);

  const playerTheme = theme || PRIMARY_COLOR;

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const togglePlayerFullscreen = useCallback(() => {
    if (containerRef.current) {
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    }
  }, []);

  const buildVidFastUrl = useCallback(() => {
    let url = '';
    
    if (mediaType === 'movie') {
      url = `${VIDFAST_BASE_URL}/movie/${tmdbId}`;
    } else {
      const s = season || 1;
      const e = episode || 1;
      url = `${VIDFAST_BASE_URL}/tv/${tmdbId}/${s}/${e}`;
    }

    const params = new URLSearchParams();
    params.set('theme', theme);
    
    if (autoPlay) {
      params.set('autoPlay', 'true');
    }
    
    params.set('title', 'true');
    params.set('poster', 'true');
    
    const subLang = subtitleLanguage || language;
    if (subLang) {
      params.set('sub', subLang);
    }
    
    if (chromecast) {
      params.set('chromecast', 'true');
    }
    
    if (fullscreenButton) {
      params.set('fullscreenButton', 'true');
    }
    
    if (hideServer) {
      params.set('hideServer', 'true');
    }
    
    if (mediaType === 'tv') {
      params.set('nextButton', 'true');
      params.set('autoNext', 'true');
    }
    
    if (currentServer && currentServer !== 'auto') {
      params.set('server', currentServer);
    }

    return `${url}?${params.toString()}`;
  }, [tmdbId, mediaType, season, episode, autoPlay, theme, currentServer, subtitleLanguage, language, hideServer, chromecast, fullscreenButton]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        if (!VIDFAST_ORIGINS.includes(event.origin) || !event.data) return;
        
        const data = event.data;
        
        if (data.type === 'PLAYER_EVENT' && data.data) {
          const progressData: VidFastProgressData = {
            event: data.data.event,
            currentTime: data.data.currentTime || 0,
            duration: data.data.duration || 0,
            progress: data.data.duration > 0 
              ? (data.data.currentTime / data.data.duration) * 100 
              : 0,
            id: String(data.data.tmdbId || tmdbId),
            mediaType: data.data.mediaType || mediaType,
            season: data.data.season,
            episode: data.data.episode,
            playing: data.data.playing,
            muted: data.data.muted,
            volume: data.data.volume,
            timestamp: Date.now(),
          };

          if (onProgressUpdate) {
            onProgressUpdate(progressData);
          }

          if (data.data.event === 'ended' && onVideoEnd) {
            onVideoEnd();
          }
        }

        if (data.type === 'MEDIA_DATA' && data.data) {
          try {
            localStorage.setItem('vidFastProgress', JSON.stringify(data.data));
          } catch {}
        }
      } catch (e) {}
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [tmdbId, mediaType, onProgressUpdate, onVideoEnd]);

  const handleServerChange = useCallback((serverId: string) => {
    setCurrentServer(serverId);
    setIframeKey(prev => prev + 1);
  }, []);

  const sendCommand = useCallback((command: string, params?: Record<string, any>) => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        command,
        ...params
      }, '*');
    }
  }, []);

  const videoUrl = buildVidFastUrl();

  const serverButtonLabel = language === 'fr' ? 'Serveur' : language === 'es' ? 'Servidor' : language === 'de' ? 'Server' : 'Server';
  const selectServerLabel = language === 'fr' ? 'Choisir un serveur' : language === 'es' ? 'Elegir servidor' : language === 'de' ? 'Server wählen' : 'Select server';

  const handleOpenExternal = useCallback(() => {
    window.open(videoUrl, '_blank', 'noopener,noreferrer');
  }, [videoUrl]);

  const externalPromptText = {
    fr: {
      title: 'Lecteur VidFast',
      desc: 'Pour une meilleure expérience, ouvrez le lecteur dans un nouvel onglet',
      button: 'Ouvrir le lecteur',
      dismiss: 'Essayer quand même'
    },
    en: {
      title: 'VidFast Player',
      desc: 'For a better experience, open the player in a new tab',
      button: 'Open Player',
      dismiss: 'Try anyway'
    },
    es: {
      title: 'Reproductor VidFast',
      desc: 'Para una mejor experiencia, abre el reproductor en una nueva pestaña',
      button: 'Abrir reproductor',
      dismiss: 'Intentar de todos modos'
    },
    de: {
      title: 'VidFast Player',
      desc: 'Für ein besseres Erlebnis öffnen Sie den Player in einem neuen Tab',
      button: 'Player öffnen',
      dismiss: 'Trotzdem versuchen'
    }
  };

  const promptText = externalPromptText[language as keyof typeof externalPromptText] || externalPromptText.en;

  return (
    <div 
      ref={containerRef}
      className={`relative w-full aspect-video bg-black rounded-xl overflow-hidden group shadow-2xl ring-1 ring-white/10 ${className}`}
    >
      <AnimatePresence>
        {showExternalPrompt && isSandboxed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="text-center max-w-md"
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 flex items-center justify-center">
                <MonitorPlay className="w-10 h-10 text-green-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{promptText.title}</h3>
              <p className="text-gray-400 text-sm mb-6">{promptText.desc}</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={handleOpenExternal}
                  className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                >
                  <ExternalLink className="w-4 h-4" />
                  {promptText.button}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowExternalPrompt(false)}
                  className="text-gray-400 border-gray-600 hover:bg-gray-800"
                >
                  {promptText.dismiss}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <iframe
        key={iframeKey}
        ref={iframeRef}
        src={videoUrl}
        className="w-full h-full border-0"
        allowFullScreen
        allow={IFRAME_ALLOW_PERMISSIONS}
        referrerPolicy="no-referrer-when-downgrade"
        loading="eager"
        style={{ border: 'none' }}
      />
      
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 flex items-center gap-2">
        <Button 
          size="sm" 
          variant="secondary" 
          onClick={handleOpenExternal}
          className="gap-2 bg-green-600/90 hover:bg-green-700 backdrop-blur-md border border-green-500/30 text-white shadow-lg transition-all duration-200 hover:scale-105"
          title={promptText.button}
        >
          <ExternalLink className="w-4 h-4" />
          <span className="hidden sm:inline text-sm">{language === 'fr' ? 'Externe' : 'External'}</span>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              size="sm" 
              variant="secondary" 
              className="gap-2 bg-black/70 hover:bg-black/90 backdrop-blur-md border border-white/20 text-white shadow-lg transition-all duration-200 hover:scale-105"
            >
              <Server className="w-4 h-4" />
              <span className="hidden sm:inline text-sm">{serverButtonLabel}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-black/95 backdrop-blur-xl border-white/20">
            <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wider">
              {selectServerLabel}
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/10" />
            {AVAILABLE_SERVERS.map((serverId) => {
              const srv = serverTranslations[serverId as keyof typeof serverTranslations];
              return (
                <DropdownMenuItem
                  key={serverId}
                  onClick={() => handleServerChange(serverId)}
                  className={`cursor-pointer transition-colors ${currentServer === serverId ? 'bg-primary/30 text-primary' : 'hover:bg-white/10'}`}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className={`w-2 h-2 rounded-full ${currentServer === serverId ? 'bg-primary animate-pulse' : 'bg-white/30'}`} />
                    <div className="flex flex-col flex-1">
                      <span className="font-medium text-sm">{srv.name}</span>
                      <span className="text-xs text-muted-foreground">{srv.description}</span>
                    </div>
                    {currentServer === serverId && (
                      <Check className="w-4 h-4 text-primary" />
                    )}
                  </div>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

          <Button 
            size="sm" 
            variant="secondary" 
            onClick={togglePlayerFullscreen}
            className="bg-black/70 hover:bg-black/90 backdrop-blur-md border border-white/20 text-white shadow-lg transition-all duration-200 hover:scale-105"
          >
            <Maximize className="w-4 h-4" />
          </Button>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </div>
  );
};

interface VidFastPlayerWithLoadingProps extends VidFastPlayerProps {
  isLoading?: boolean;
  hasError?: boolean;
  onRetry?: () => void;
  onOpenExternal?: () => void;
  title?: string;
}

export const VidFastPlayerWithLoading = ({
  isLoading = false,
  hasError = false,
  onRetry,
  onOpenExternal,
  title,
  ...playerProps
}: VidFastPlayerWithLoadingProps) => {
  const { t } = useI18n();

  if (isLoading) {
    return (
      <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
        <motion.div 
          className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="relative mb-6"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            <div className="w-20 h-20 rounded-full border-4 border-green-500/20 flex items-center justify-center">
              <motion.div
                className="w-16 h-16 rounded-full border-4 border-t-green-500 border-r-green-500 border-b-transparent border-l-transparent"
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
              <Play className="w-6 h-6 text-green-500 fill-green-500" />
            </motion.div>
          </motion.div>
          
          <motion.div
            className="text-center mb-4"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="text-white font-medium text-lg mb-1">
              {t('common.loading')}
            </h3>
            <p className="text-green-400 text-sm font-medium">VidFast Player</p>
            {title && (
              <p className="text-white/70 text-sm mt-1">{title}</p>
            )}
          </motion.div>

          <motion.div
            className="w-64 h-1.5 bg-white/10 rounded-full overflow-hidden"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 256, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <motion.div
              className="h-full bg-gradient-to-r from-green-500 via-green-400 to-green-500 rounded-full"
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
      <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
        <motion.div 
          className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-red-950/30 via-gray-900/50 to-black p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <motion.div
            className="bg-card/90 backdrop-blur-sm border border-yellow-500/20 rounded-2xl p-8 max-w-md text-center shadow-2xl"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
          >
            <motion.div
              className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-500/10 flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
            >
              <AlertTriangle className="w-8 h-8 text-yellow-500" />
            </motion.div>
            
            <h3 className="text-xl font-semibold text-foreground mb-3">
              {t('player.error')}
            </h3>
            
            <p className="text-sm text-muted-foreground mb-6">
              {t('player.errorDesc')}
            </p>
            
            <div className="flex flex-col gap-3">
              {onOpenExternal && (
                <Button 
                  variant="default"
                  size="lg"
                  className="w-full gap-2 bg-green-600 hover:bg-green-700"
                  onClick={onOpenExternal}
                >
                  <ExternalLink className="w-5 h-5" />
                  {t('player.openExternal')}
                </Button>
              )}
              {onRetry && (
                <Button 
                  variant="outline" 
                  size="sm"
                  className="gap-2"
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

  return <VidFastPlayer {...playerProps} />;
};

export const getVidFastDirectUrl = (
  tmdbId: number, 
  mediaType: 'movie' | 'tv', 
  season?: number, 
  episode?: number
): string => {
  if (mediaType === 'movie') {
    return `${VIDFAST_BASE_URL}/movie/${tmdbId}?theme=${PRIMARY_COLOR}&autoPlay=true&title=true&poster=true`;
  }
  return `${VIDFAST_BASE_URL}/tv/${tmdbId}/${season || 1}/${episode || 1}?theme=${PRIMARY_COLOR}&autoPlay=true&title=true&poster=true&nextButton=true&autoNext=true`;
};

export default VidFastPlayer;
