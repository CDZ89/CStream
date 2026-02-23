// src/components/UniversalPlayer.tsx
import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useBetaSettings } from "@/hooks/useBetaSettings";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  RotateCcw,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  Monitor,
  Check,
  Zap,
  Crown,
  Wifi,
  AlertTriangle,
  Maximize,
  Minimize,
  SkipForward,
  SkipBack,
  Sparkles,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";
import { SubtitleSelector } from "./SubtitleSelector";
import { SubtitleResult } from "@/lib/wyzieSubs";

export type PlayerSource =
  | "vidsync"
  | "rivestream"
  | "frembed"
  | "vidsrc"
  | "superembed"
  | "2embed"
  | "multiembed"
  | "embedsu"
  | "nontongo"
  | "111movies"
  | "vidsrc2"
  | "cinesrc"
  | "pstream";

interface UniversalPlayerProps {
  tmdbId: string | number;
  mediaType: "movie" | "tv";
  season?: number;
  episode?: number;
  title?: string;
  posterPath?: string;
  className?: string;
  onProgressUpdate?: (
    progress: number,
    currentTime: number,
    duration: number,
  ) => void;
  onVideoEnd?: () => void;
  onNextEpisode?: () => void;
  onPreviousEpisode?: () => void;
  hasNextEpisode?: boolean;
  hasPreviousEpisode?: boolean;
}

interface PlayerSourceConfig {
  id: PlayerSource;
  name: string;
  description: string;
  icon: string;
  color: string;
  priority: number;
  reliable: boolean;
  buildUrl: (
    tmdbId: string | number,
    mediaType: "movie" | "tv",
    season?: number,
    episode?: number,
  ) => string;
}

const PRIMARY_COLOR = "8B5CF6"; // Purple 500

export const SOURCES: PlayerSourceConfig[] = [
  {
    id: "frembed",
    name: "Frembed",
    description: "TOP - VF/VOSTFR - Lecteur français optimisé",
    color: "from-pink-500 to-rose-600",
    reliable: true,
    priority: 0,
    icon: "🇫🇷",
    buildUrl: (tmdbId, mediaType, season, episode) => {
      if (mediaType === "movie") {
        return `https://api.frembed.work/movies/check?id=${tmdbId}`;
      }
      return `https://api.frembed.work/tv/check?id=${tmdbId}&s=${season || 1}&e=${episode || 1}`;
    },
  },
  {
    id: "rivestream",
    name: "RiveStream",
    description: "Premium - Rapide et sans pub (Recommandé)",
    color: "from-blue-600 to-indigo-600",
    reliable: true,
    priority: 1,
    icon: "💎",
    buildUrl: (tmdbId, mediaType, season, episode) => {
      if (mediaType === "movie") {
        return `https://rivestream.live/embed?type=movie&id=${tmdbId}`;
      }
      return `https://rivestream.live/embed?type=tv&id=${tmdbId}&s=${season || 1}&e=${episode || 1}`;
    },
  },
  {
    id: "cinesrc",
    name: "CineSrc",
    description: "Premium - Haute Qualité - Auto-Next",
    color: "from-red-600 to-orange-600",
    reliable: true,
    priority: 2,
    icon: "🎬",
    buildUrl: (tmdbId, mediaType, season, episode) => {
      if (mediaType === "movie") {
        return `https://cinesrc.st/embed/movie/${tmdbId}?autoplay=true&color=%238B5CF6&back=close`;
      }
      return `https://cinesrc.st/embed/tv/${tmdbId}?s=${season || 1}&e=${episode || 1}&autoplay=true&autonext=true&color=%238B5CF6&back=close`;
    },
  },
  {
    id: "vidsync",
    name: "VidSync",
    description: "Haute Performance - Sources Multiples",
    color: "from-cyan-500 to-blue-500",
    reliable: true,
    priority: 3,
    icon: "⚡",
    buildUrl: (tmdbId, mediaType, season, episode) => {
      if (mediaType === "movie") {
        return `https://vidsrc.me/embed/movie?tmdb=${tmdbId}`;
      }
      return `https://vidsrc.me/embed/tv?tmdb=${tmdbId}&sea=${season || 1}&epi=${episode || 1}`;
    },
  },
  {
    id: "vidsrc",
    name: "VidSrc",
    description: "Stable et fiable - Progress Sync",
    color: "from-blue-500 to-cyan-500",
    reliable: true,
    priority: 7,
    icon: "🎯",
    buildUrl: (tmdbId, mediaType, season, episode) => {
      if (mediaType === "movie") {
        return `https://vidsrc.wtf/api/2/movie?id=${tmdbId}&color=${PRIMARY_COLOR}`;
      }
      return `https://vidsrc.wtf/api/2/tv?id=${tmdbId}&s=${season || 1}&e=${episode || 1}&color=${PRIMARY_COLOR}`;
    },
  },
  {
    id: "superembed",
    name: "SuperEmbed",
    description: "Multilingue - Plusieurs serveurs",
    color: "from-amber-500 to-orange-600",
    reliable: true,
    priority: 8,
    icon: "🌐",
    buildUrl: (tmdbId, mediaType, season, episode) => {
      if (mediaType === "movie") {
        return `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1`;
      }
      return `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1&s=${season || 1}&e=${episode || 1}`;
    },
  },
];

const VidzeeLogoSVG = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="40" height="40" rx="12" fill="url(#vidzee_grad)" />
    <path
      d="M28 20L16 27V13L28 20Z"
      fill="white"
      fillOpacity="0.9"
      stroke="white"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <defs>
      <linearGradient
        id="vidzee_grad"
        x1="0"
        y1="0"
        x2="40"
        y2="40"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#a855f7" />
        <stop offset="100%" stopColor="#ec4899" />
      </linearGradient>
    </defs>
  </svg>
);

const getTranslations = (lang: string) => {
  const t: Record<string, any> = {
    fr: {
      selectSource: "SÉLECTIONNER LA SOURCE",
      recommended: "RECOMMANDÉ",
      fast: "RAPIDE",
      loading: "PRÉPARATION DU STREAM...",
      switching: "BASCULEMENT DE SOURCE...",
      connecting: "CONNEXION SÉCURISÉE...",
      retry: "RÉESSAYER",
      openExternal: "OUVRIR EXTERNE",
      blocked: "LECTURE BLOQUÉE ?",
      blockedDesc:
        "Certaines sources peuvent être bloquées par votre navigateur ou extensions. Essayez de changer de source ou utilisez un VPN.",
      nextSource: "SOURCE SUIVANTE",
    },
    en: {
      selectSource: "SELECT SOURCE",
      recommended: "RECOMMENDED",
      fast: "FAST",
      loading: "PREPARING STREAM...",
      switching: "SWITCHING SOURCE...",
      connecting: "SECURE CONNECTION...",
      retry: "RETRY",
      openExternal: "OPEN EXTERNAL",
      blocked: "PLAYBACK BLOCKED?",
      blockedDesc:
        "Some sources may be blocked by your browser or extensions. Try switching sources or using a VPN.",
      nextSource: "NEXT SOURCE",
    },
  };
  return t[lang] || t.en;
};

export const UniversalPlayer = ({
  tmdbId,
  mediaType,
  season,
  episode,
  title,
  posterPath,
  className,
  onProgressUpdate,
  onVideoEnd,
  onNextEpisode,
  onPreviousEpisode,
  hasNextEpisode,
  hasPreviousEpisode,
}: UniversalPlayerProps) => {
  const { language: lang } = useI18n();
  const [currentSource, setCurrentSource] = useState<PlayerSource>(() => {
    try {
      return (
        (localStorage.getItem("cstream_preferred_player") as PlayerSource) ||
        SOURCES[0].id
      );
    } catch {
      return SOURCES[0].id;
    }
  });

  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [iframeKey, setIframeKey] = useState(0);
  const [autoSwitching, setAutoSwitching] = useState(false);
  const [selectedSubtitle, setSelectedSubtitle] = useState<SubtitleResult | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const progressIntervalRef = useRef<any>(null);
  const loadTimeoutRef = useRef<any>(null);
  const autoSwitchAttemptRef = useRef(0);

  const currentSourceConfig =
    SOURCES.find((s) => s.id === currentSource) || SOURCES[0];

  const videoUrl = useMemo(
    () => currentSourceConfig.buildUrl(tmdbId, mediaType, season, episode),
    [currentSourceConfig, tmdbId, mediaType, season, episode],
  );

  const clearTimers = useCallback(() => {
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  const setCurrentSourceFn = useCallback((source: PlayerSource) => {
    setCurrentSource(source);
    try {
      localStorage.setItem("cstream_preferred_player", source);
    } catch { }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data) return;

      try {
        if (
          data.event === "onProgress" ||
          data.type === "progress" ||
          data.event === "timeupdate"
        ) {
          const progress =
            data.progress || (data.currentTime / data.duration) * 100;
          if (onProgressUpdate && !isNaN(progress)) {
            onProgressUpdate(
              progress,
              data.currentTime || 0,
              data.duration || 0,
            );
          }
        }

        if (data.event === "onEnd" || data.type === "ended" || data.type === "cinesrc:ended") {
          if (onVideoEnd) onVideoEnd();
        }

        // Vidsrc.wtf Progress Tracking
        if (event.origin === "https://www.vidsrc.wtf" && data?.type === "MEDIA_DATA") {
          localStorage.setItem("vidsrcwtf-Progress", JSON.stringify(data.data));
          console.log("[VidSrc] Progress saved");
        }

        // CineSrc Progress Tracking
        if (event.origin === "https://cinesrc.st") {
          if (data.type === "cinesrc:timeupdate") {
            if (onProgressUpdate) {
              onProgressUpdate((data.currentTime / data.duration) * 100, data.currentTime, data.duration);
            }
          }
          if (data.type === "cinesrc:nextepisode") {
            if (onNextEpisode) onNextEpisode();
          }
          if (data.type === "cinesrc:close") {
            // Handle back button from CineSrc
          }
        }
      } catch (e) {
        // Silently ignore
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onProgressUpdate, onVideoEnd, onNextEpisode]);

  useEffect(() => {
    clearTimers();
    setStatus("loading");
    setLoadingProgress(0);

    // Simulate initial loading progress
    const interval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 90) return prev;
        return prev + 10;
      });
    }, 500);

    return () => {
      clearInterval(interval);
    };
  }, [videoUrl, clearTimers]);

  const handleIframeLoad = useCallback(() => {
    clearTimers();
    setStatus("ready");
    setLoadingProgress(100);
    setAutoSwitching(false);
    autoSwitchAttemptRef.current = 0;
  }, [clearTimers]);

  const handleIframeError = useCallback(() => {
    clearTimers();
    if (autoSwitchAttemptRef.current < Math.min(3, SOURCES.length - 1)) {
      autoSwitchAttemptRef.current++;
      const currentIndex = SOURCES.findIndex((s) => s.id === currentSource);
      const nextIndex = (currentIndex + 1) % SOURCES.length;
      handleSourceChange(SOURCES[nextIndex].id);
      setAutoSwitching(true);
      toast.info(`Tentative de basculement...`);
    } else {
      setStatus("error");
    }
  }, [currentSource, clearTimers]);

  const handleSourceChange = useCallback((sourceId: PlayerSource) => {
    setCurrentSourceFn(sourceId);
    setIframeKey((prev) => prev + 1);
    setStatus("loading");
    setLoadingProgress(0);
  }, [setCurrentSourceFn]);

  const handleRetry = useCallback(() => {
    setStatus("loading");
    setIframeKey((prev) => prev + 1);
    setLoadingProgress(0);
  }, []);

  const handleOpenExternal = useCallback(() => {
    window.open(videoUrl, "_blank", "noopener,noreferrer");
  }, [videoUrl]);

  const togglePlayerFullscreen = useCallback(() => {
    if (containerRef.current) {
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen().catch(() => { });
      } else {
        document.exitFullscreen().catch(() => { });
      }
    }
  }, []);

  const switchToNextSource = useCallback(() => {
    const currentIndex = SOURCES.findIndex((s) => s.id === currentSource);
    const nextIndex = (currentIndex + 1) % SOURCES.length;
    handleSourceChange(SOURCES[nextIndex].id);
  }, [currentSource, handleSourceChange]);

  const translations = getTranslations(lang);
  const { antiPubEnabled } = useBetaSettings();

  return (
    <div className={cn("flex flex-col w-full", className)}>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative flex items-center justify-between gap-2 p-3 sm:p-4 
          bg-gradient-to-r from-zinc-900/98 via-zinc-900/95 to-zinc-900/98
          backdrop-blur-2xl border border-white/10 border-b-0 rounded-t-2xl"
      >
        <div className="flex items-center gap-2 sm:gap-3 flex-1">
          <Badge variant="outline" className={cn("px-2 py-1", currentSourceConfig.color)}>
            {currentSourceConfig.icon} {currentSourceConfig.name}
          </Badge>
          {mediaType === "tv" && season && episode && (
            <span className="text-xs text-white/60 font-mono">S{season} E{episode}</span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-zinc-900 border-white/10">
              {SOURCES.map(s => (
                <DropdownMenuItem key={s.id} onClick={() => handleSourceChange(s.id)}>
                  {s.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="icon" onClick={handleRetry} title={translations.retry}>
            <RotateCcw className="w-4 h-4" />
          </Button>

          <SubtitleSelector
            tmdbId={Number(tmdbId)}
            mediaType={mediaType as any}
            season={season}
            episode={episode}
            selectedSubtitle={selectedSubtitle}
            onSubtitleSelect={setSelectedSubtitle}
          />

          <Button variant="ghost" size="icon" onClick={togglePlayerFullscreen}>
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </Button>
        </div>
      </motion.div>

      <div
        ref={containerRef}
        className="relative w-full aspect-video bg-black rounded-b-2xl overflow-hidden ring-1 ring-white/10"
      >
        <AnimatePresence mode="wait">
          {(status === "loading" || autoSwitching) && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-zinc-950"
            >
              <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-white font-medium text-sm">{translations.loading}</p>
            </motion.div>
          )}

          {status === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-zinc-950 p-6 text-center"
            >
              <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
              <h3 className="text-white font-bold mb-2">{translations.blocked}</h3>
              <p className="text-white/60 text-sm mb-6 max-w-xs">{translations.blockedDesc}</p>
              <Button onClick={switchToNextSource}>{translations.nextSource}</Button>
            </motion.div>
          )}
        </AnimatePresence>

        <iframe
          ref={iframeRef}
          key={iframeKey}
          src={videoUrl}
          className="absolute inset-0 w-full h-full border-0 z-10"
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
          sandbox={antiPubEnabled ? "allow-scripts allow-forms allow-same-origin allow-presentation" : undefined}
          referrerPolicy="no-referrer-when-downgrade"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
        />
      </div>
    </div>
  );
};

export default UniversalPlayer;
