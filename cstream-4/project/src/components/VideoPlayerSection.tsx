import { useState, useCallback, useRef, useEffect, useMemo, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Server, Check, ExternalLink, Maximize, Minimize, 
  ChevronDown, Globe, Zap, Wifi, Shield, Tv, Play, RefreshCw,
  AlertTriangle, Loader2, Info, X, Image as ImageIcon, Cpu
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import { IFRAME_ALLOW_PERMISSIONS } from '@/lib/iframeSecurity';
import { VideoPlayerInfoOverlay } from '@/components/VideoPlayerInfoOverlay';
import { SourceSelector } from '@/components/SourceSelector';
import { CloudHint } from './player/CloudHint';
import BackendPlayer from '@/components/BackendPlayer';
import { SecurityBanner } from '@/components/SecurityBanner';

interface ServerOption {
  id: string;
  name: string;
  description: string;
  icon?: React.ReactNode;
  quality?: 'high' | 'medium' | 'low';
}

interface VideoPlayerSectionProps {
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  season?: number;
  episode?: number;
  showName?: string;
  playerType?: 'vidking' | 'vidfast' | 'videasy' | 'bludclart';
  autoPlay?: boolean;
  progress?: number;
  onProgressUpdate?: (data: any) => void;
  onVideoEnd?: () => void;
  onPlayerTypeChange?: (type: 'vidking' | 'vidfast' | 'videasy' | 'bludclart') => void;
  className?: string;
}

const PRIMARY_COLOR = '8B5CF6';
const GREEN_THEME = '10B981';
const BLUE_THEME = '3B82F6';

// Cache pour les URLs de lecteurs
const urlCache = new Map<string, string>();
const CACHE_TTL = 3600000; // 1 heure
const cacheTimestamps = new Map<string, number>();

const ALL_SOURCES = [
  { id: 'bludclart', name: 'Bludclart', description: 'Nouveau - Lecteur TMDB optimisé', icon: '🎬', reliable: true },
  { id: 'rivestream', name: 'Rive Stream', description: 'Ultra fiable - Recommandé', icon: '🚀', reliable: true },
  { id: 'vidzee', name: 'VidZee', description: 'TOP - Excellent qualité', icon: '⭐', reliable: true },
  { id: 'vidking', name: 'VidKing', description: 'Multi-serveurs VF/VOSTFR', icon: '👑', reliable: true },
  { id: 'smashy', name: 'Smashy', description: 'HD sans bug', icon: '🔥', reliable: true },
  { id: 'primesrc', name: 'PrimeSrc', description: 'Multi-serveurs premium', icon: '⭐', reliable: true },
  { id: 'vidfast', name: 'VidFast', description: 'Serveur rapide', icon: '⚡', reliable: true },
  { id: 'multiembed', name: 'MultiEmbed', description: 'Streaming HLS', icon: '🎬', reliable: true },
  { id: 'superembed', name: 'SuperEmbed', description: 'Ultra stable', icon: '💎', reliable: true },
  { id: 'vidsrc', name: 'VidSrc', description: 'Stable et fiable', icon: '🎯', reliable: true },
  { id: 'videasy', name: 'Videasy', description: 'Leger et rapide', icon: '🚀', reliable: true },
  { id: 'autoembed', name: 'AutoEmbed', description: 'Multi-sources HD', icon: '🔮', reliable: true },
  { id: 'frembed', name: 'Frembed', description: 'VF/VOSTFR francais', icon: '🇫🇷', reliable: true },
  { id: 'embedsu', name: 'EmbedSU', description: 'Multi-serveurs premium', icon: '📡', reliable: true },
  { id: 'vidlink', name: 'VidLink', description: 'HD/4K rapide', icon: '🔗', reliable: true },
  { id: 'embed2', name: '2Embed', description: 'Multi-serveurs', icon: '📺', reliable: true },
  { id: 'moviesapi', name: 'MoviesAPI', description: 'HLS Premium', icon: '🎥', reliable: true },
  { id: 'vidnest', name: 'VidNest', description: 'Multi-serveurs', icon: '🪺', reliable: true },
  { id: 'vidrock', name: 'VidRock', description: 'Premium 4K', icon: '🎸', reliable: true },
  { id: 'streamwish', name: 'StreamWish', description: 'Ultra-rapide multisource', icon: '⚙️', reliable: true },
  { id: 'flixhq', name: 'FlixHQ', description: 'Premium sans restrictions', icon: '✨', reliable: true },
  { id: 'soap2day', name: 'Soap2Day', description: 'Catalogue complet', icon: '🎭', reliable: true },
  { id: 'cinebb', name: 'CineBB', description: 'Français/International', icon: '🎬', reliable: true },
  { id: 'lookmovie', name: 'LookMovie', description: 'Catalogue extensif', icon: '🔍', reliable: true },
  { id: 'putlockers', name: 'PutLocker', description: 'Multisources stable', icon: '🔐', reliable: true },
  { id: 'nontongo', name: 'Nontongo', description: 'Multi-langues stable', icon: '🌏', reliable: true },
  { id: '111movies', name: '111Movies', description: 'HD/4K streaming', icon: '🎞️', reliable: true },
  { id: 'vidsrc2', name: 'VidSrc CX', description: 'Alternative VidSrc', icon: '📡', reliable: true },
];

// Fonction de cache optimisée
function buildSourceUrl(sourceId: string, tmdbId: number, mediaType: 'movie' | 'tv', season?: number, episode?: number): string {
  const cacheKey = `${sourceId}-${tmdbId}-${mediaType}-${season}-${episode}`;
  const now = Date.now();
  
  // Vérifier le cache
  if (urlCache.has(cacheKey)) {
    const timestamp = cacheTimestamps.get(cacheKey) || 0;
    if (now - timestamp < CACHE_TTL) {
      return urlCache.get(cacheKey) || '';
    }
  }

  const s = season || 1;
  const e = episode || 1;
  
  let url = '';
  switch(sourceId) {
    case 'bludclart':
      url = mediaType === 'movie' 
        ? `https://watch.bludclart.com/movie/${tmdbId}/watch`
        : `https://watch.bludclart.com/tv/${tmdbId}/watch?season=${s}&episode=${e}`;
      break;
    case 'rivestream':
      url = mediaType === 'movie' 
        ? `https://rivestream.net/embed?type=movie&id=${tmdbId}`
        : `https://rivestream.net/embed?type=tv&id=${tmdbId}&season=${s}&episode=${e}`;
      break;
    case 'vidzee':
      url = mediaType === 'movie'
        ? `https://player.vidzee.wtf/embed/movie/${tmdbId}`
        : `https://player.vidzee.wtf/embed/tv/${tmdbId}/${s}/${e}`;
      break;
    case 'vidking':
      url = mediaType === 'movie'
        ? `https://vidking.online/embed/movie/${tmdbId}?autoplay=1`
        : `https://vidking.online/embed/tv/${tmdbId}/${s}/${e}?autoplay=1`;
      break;
    case 'smashy':
      url = mediaType === 'movie'
        ? `https://player.smashy.stream/movie/${tmdbId}?playerList=D|SU|F|FMD|J`
        : `https://player.smashy.stream/tv/${tmdbId}?s=${s}&e=${e}&playerList=D|SU|F|FMD|J`;
      break;
    case 'primesrc':
      url = mediaType === 'movie'
        ? `https://primesrc.me/embed/movie?tmdb=${tmdbId}&fallback=true`
        : `https://primesrc.me/embed/tv?tmdb=${tmdbId}&season=${s}&episode=${e}&fallback=true`;
      break;
    case 'vidfast':
      url = mediaType === 'movie'
        ? `https://vidfast.pro/movie/${tmdbId}?theme=${PRIMARY_COLOR}&autoPlay=true&title=true&poster=true`
        : `https://vidfast.pro/tv/${tmdbId}/${s}/${e}?theme=${PRIMARY_COLOR}&autoPlay=true&title=true&poster=true`;
      break;
    case 'multiembed':
      url = mediaType === 'movie'
        ? `https://multiembed.mov/directstream.php?video_id=${tmdbId}&tmdb=1`
        : `https://multiembed.mov/directstream.php?video_id=${tmdbId}&tmdb=1&s=${s}&e=${e}`;
      break;
    case 'superembed':
      url = mediaType === 'movie'
        ? `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1`
        : `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1&s=${s}&e=${e}`;
      break;
    case 'vidsrc':
      url = mediaType === 'movie'
        ? `https://vidsrc.cc/v2/embed/movie/${tmdbId}`
        : `https://vidsrc.cc/v2/embed/tv/${tmdbId}/${s}/${e}`;
      break;
    case 'videasy':
      url = mediaType === 'movie'
        ? `https://player.videasy.net/movie/${tmdbId}?color=${PRIMARY_COLOR}`
        : `https://player.videasy.net/tv/${tmdbId}/${s}/${e}?color=${PRIMARY_COLOR}&nextEpisode=true&autoplayNextEpisode=true&episodeSelector=true`;
      break;
    case 'autoembed':
      url = mediaType === 'movie'
        ? `https://player.autoembed.cc/embed/movie/${tmdbId}`
        : `https://player.autoembed.cc/embed/tv/${tmdbId}/${s}/${e}`;
      break;
    case 'frembed':
      url = mediaType === 'movie'
        ? `https://api.frembed.best/movies/check?id=${tmdbId}`
        : `https://api.frembed.best/tv/check?id=${tmdbId}&sa=${s}&epi=${e}`;
      break;
    case 'embedsu':
      url = mediaType === 'movie'
        ? `https://embedsu.com/embed/movie/${tmdbId}`
        : `https://embedsu.com/embed/tv/${tmdbId}/${s}/${e}`;
      break;
    case 'vidlink':
      url = mediaType === 'movie'
        ? `https://vidlink.pro/movie/${tmdbId}?primaryColor=${PRIMARY_COLOR}&autoplay=true`
        : `https://vidlink.pro/tv/${tmdbId}/${s}/${e}?primaryColor=${PRIMARY_COLOR}&autoplay=true`;
      break;
    case 'embed2':
      url = mediaType === 'movie'
        ? `https://www.2embed.cc/embed/${tmdbId}`
        : `https://www.2embed.cc/embedtv/${tmdbId}?s=${s}&e=${e}`;
      break;
    case 'moviesapi':
      url = mediaType === 'movie'
        ? `https://moviesapi.club/movie/${tmdbId}`
        : `https://moviesapi.club/tv/${tmdbId}-${s}-${e}`;
      break;
    case 'vidnest':
      url = mediaType === 'movie'
        ? `https://vidnest.fun/movie/${tmdbId}`
        : `https://vidnest.fun/tv/${tmdbId}/${s}/${e}`;
      break;
    case 'vidrock':
      url = mediaType === 'movie'
        ? `https://vidrock.net/movie/${tmdbId}?autoplay=true&theme=${PRIMARY_COLOR}`
        : `https://vidrock.net/tv/${tmdbId}/${s}/${e}?autoplay=true&autonext=true&theme=${PRIMARY_COLOR}`;
      break;
    case 'streamwish':
      url = mediaType === 'movie'
        ? `https://streamwish.to/embed-${tmdbId}-640x360.html`
        : `https://streamwish.to/embed-${tmdbId}-s${s}e${e}-640x360.html`;
      break;
    case 'flixhq':
      url = mediaType === 'movie'
        ? `https://flixhq.to/movie/${tmdbId}`
        : `https://flixhq.to/tv/${tmdbId}/${s}/${e}`;
      break;
    case 'soap2day':
      url = mediaType === 'movie'
        ? `https://soap2day.to/movie/${tmdbId}`
        : `https://soap2day.to/tv/${tmdbId}/${s}/${e}`;
      break;
    case 'cinebb':
      url = mediaType === 'movie'
        ? `https://cinebb.com/movie/${tmdbId}`
        : `https://cinebb.com/tv/${tmdbId}/${s}/${e}`;
      break;
    case 'lookmovie':
      url = mediaType === 'movie'
        ? `https://lookmovie.io/movies/view/${tmdbId}`
        : `https://lookmovie.io/shows/view/${tmdbId}/${s}/${e}`;
      break;
    case 'putlockers':
      url = mediaType === 'movie'
        ? `https://putlockers.movie/watch/movie/${tmdbId}`
        : `https://putlockers.movie/watch/tv/${tmdbId}/${s}/${e}`;
      break;
    case 'nontongo':
      url = mediaType === 'movie'
        ? `https://www.NontonGo.win/embed/movie/${tmdbId}`
        : `https://www.NontonGo.win/embed/tv/${tmdbId}/${s}/${e}`;
      break;
    case '111movies':
      url = mediaType === 'movie'
        ? `https://111movies.com/movie/${tmdbId}`
        : `https://111movies.com/tv/${tmdbId}/${s}/${e}`;
      break;
    case 'vidsrc2':
      url = mediaType === 'movie'
        ? `https://vidsrc.cx/embed/movie/${tmdbId}`
        : `https://vidsrc.cx/embed/tv/${tmdbId}/${s}/${e}`;
      break;
    default:
      url = '';
  }
  
  // Stocker en cache
  urlCache.set(cacheKey, url);
  cacheTimestamps.set(cacheKey, now);
  
  return url;
}

export const VideoPlayerSection = ({
  tmdbId,
  mediaType,
  season,
  episode,
  showName,
  playerType = 'vidking',
  autoPlay = true,
  progress,
  onProgressUpdate,
  onVideoEnd,
  onPlayerTypeChange,
  className,
}: VideoPlayerSectionProps) => {
  const { language } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  const [currentSource, setCurrentSource] = useState(() => {
    // Force Frembed by default for French users
    if (language === 'fr') return 'frembed';
    
    if (playerType === 'bludclart') return 'bludclart';
    if (playerType === 'vidking') return 'vidking';
    if (playerType === 'vidfast') return 'vidfast';
    if (playerType === 'videasy') return 'videasy';
    return 'rivestream';
  });
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [shouldRenderIframe, setShouldRenderIframe] = useState(false);

  // Lazy loading: afficher iframe après 100ms seulement (optimisé)
  useEffect(() => {
    const timer = setTimeout(() => setShouldRenderIframe(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const playerUrl = useMemo(() => {
    const source = ALL_SOURCES.find(s => s.id === currentSource);
    if (!source) return '';
    return buildSourceUrl(currentSource, tmdbId, mediaType, season, episode);
  }, [tmdbId, mediaType, season, episode, currentSource]);

  const handleSourceChange = useCallback((sourceId: string) => {
    if (sourceId === 'bludclart') {
      onPlayerTypeChange?.('bludclart');
      setCurrentSource('bludclart');
    } else {
      setCurrentSource(sourceId);
    }
    setIframeKey(prev => prev + 1);
    setIsLoading(true);
    setHasError(false);
    setSourcesOpen(false);
  }, [onPlayerTypeChange]);

  const handleRefresh = useCallback(() => {
    setIframeKey(prev => prev + 1);
    setIsLoading(true);
    setHasError(false);
  }, []);

  const handleIframeLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
  }, []);

  const handleIframeError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
  }, []);

  const selectServerLabel = language === 'fr' ? 'Serveur' : 'Server';
  const loadingText = language === 'fr' ? 'Chargement...' : 'Loading...';

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn("flex flex-col gap-0 relative", className)}
    >
      <SecurityBanner />
      {/* Cloud Hint Banner */}
      <CloudHint />

      {/* Sources Modal */}
      <AnimatePresence>
        {sourcesOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSourcesOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 5 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            >
              <div 
                className="absolute inset-0 bg-black/80 backdrop-blur-md" 
                onClick={() => setSourcesOpen(false)}
              />
              <div className="relative w-full max-w-2xl max-h-[85vh] bg-zinc-950 border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl pointer-events-auto">
                <div className="relative p-8 space-y-8 flex flex-col h-full">
                  <button
                    onClick={() => setSourcesOpen(false)}
                    className="absolute top-8 right-8 p-2.5 rounded-full bg-white/5 hover:bg-white/10 transition-all active:scale-90 z-[110]"
                  >
                    <X className="w-5 h-5 text-zinc-400 hover:text-white" />
                  </button>
                  
                  <div className="text-center sm:text-left space-y-1">
                    <h2 className="text-3xl font-bold text-white tracking-tight">Serveurs de Streaming</h2>
                    <p className="text-sm text-zinc-500">Sélectionnez une source pour commencer la lecture</p>
                  </div>

                  <div className="overflow-y-auto pr-2 custom-scrollbar flex-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4">
                      {ALL_SOURCES.map((source) => (
                        <button
                          key={source.id}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleSourceChange(source.id);
                          }}
                          className={cn(
                            "group p-5 rounded-2xl text-left transition-all duration-300 border relative overflow-hidden cursor-pointer",
                            currentSource === source.id
                              ? "bg-white/10 border-white/20 shadow-[inset_0_0_20px_rgba(255,255,255,0.05)]"
                              : "bg-zinc-900/40 border-zinc-800/50 hover:bg-zinc-900/60 hover:border-zinc-700"
                          )}
                        >
                          <div className="flex items-center justify-between gap-4 relative z-10 pointer-events-none">
                            <div className="flex items-center gap-4">
                              <div className={cn(
                                "w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all duration-500",
                                currentSource === source.id ? "bg-white text-black scale-110" : "bg-zinc-800/50 grayscale group-hover:grayscale-0"
                              )}>
                                {source.icon}
                              </div>
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className={cn(
                                    "font-bold tracking-wide transition-colors",
                                    currentSource === source.id ? "text-white" : "text-zinc-400 group-hover:text-zinc-200"
                                  )}>
                                    {source.name}
                                  </span>
                                  {source.reliable && (
                                    <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                  )}
                                </div>
                                <p className="text-[10px] uppercase tracking-widest font-medium text-zinc-500 group-hover:text-zinc-400 transition-colors">
                                  {source.description}
                                </p>
                              </div>
                            </div>
                            {currentSource === source.id && (
                              <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-lg">
                                <Check className="w-3.5 h-3.5 text-black stroke-[3]" />
                              </div>
                            )}
                          </div>
                          
                          {/* Hover effect highlight */}
                          <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-white/5 text-center">
                    <p className="text-[10px] text-zinc-600 uppercase tracking-[0.2em]">
                      CStream v3.9 Premium Engine
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bludclart Player logic handled via currentSource switcher above */}
      {/* Player Container */}
        <div className="relative w-full aspect-video bg-black rounded-t-xl sm:rounded-t-2xl overflow-hidden border border-white/10 border-b-0 z-10">

          {/* Loading State */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-30">
              <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-3" />
                <p className="text-white/80 text-sm">{loadingText}</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {hasError && !isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-30">
              <div className="text-center max-w-xs px-4">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                <p className="text-white font-semibold mb-3">Erreur de lecture</p>
                <p className="text-white/60 text-sm mb-4">Impossible de charger la vidéo. Essayez un autre serveur.</p>
                <Button
                  onClick={handleRefresh}
                  size="sm"
                  className="bg-primary hover:bg-primary/90"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Réessayer
                </Button>
              </div>
            </div>
          )}

        {/* Player Iframe - Lazy loaded */}
        {!hasError && shouldRenderIframe && (
          <iframe
            key={iframeKey}
            ref={iframeRef}
            src={playerUrl}
            className="absolute inset-0 w-full h-full border-0"
            allowFullScreen
            allow={IFRAME_ALLOW_PERMISSIONS}
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            loading="lazy"
          />
        )}
      </div>

      {/* Controls Bar */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-zinc-950/40 backdrop-blur-md border border-white/5 border-t-0 rounded-b-3xl z-10 shadow-xl">
        <Button
          onClick={() => setSourcesOpen(true)}
          variant="ghost"
          size="sm"
          className="h-11 px-5 gap-3 bg-white/5 hover:bg-white/10 text-white border-white/5 rounded-2xl transition-all active:scale-95 group shadow-lg"
        >
          <div className="w-6 h-6 rounded-lg bg-zinc-800 flex items-center justify-center group-hover:bg-zinc-700 transition-colors">
            <Server className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white" />
          </div>
          <div className="flex flex-col items-start leading-tight">
            <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Serveur Actif</span>
            <span className="text-sm font-semibold">{ALL_SOURCES.find(s => s.id === currentSource)?.name || 'Sélectionner'}</span>
          </div>
          <ChevronDown className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 ml-1 transition-transform group-hover:translate-y-0.5" />
        </Button>

        {mediaType === 'tv' && season && episode && (
          <span className="px-2.5 py-1 text-xs font-medium bg-white/10 rounded-lg text-white/80 border border-white/5">
            S{String(season).padStart(2, '0')} E{String(episode).padStart(2, '0')}
          </span>
        )}

        {showName && (
          <span className="text-sm text-white/60 truncate hidden lg:block">
            {showName}
          </span>
        )}

        <div className="flex-1" />

        <Button 
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          className="h-8 px-3 text-xs"
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
};
