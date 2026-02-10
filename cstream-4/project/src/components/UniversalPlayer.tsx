// src/components/UniversalPlayer.tsx
import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Loader2,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  Check,
  Maximize,
  Minimize,
  ChevronDown,
  Wifi,
  SkipForward,
  SkipBack,
  Monitor,
  Zap,
  Crown,
  Sparkles,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";
import { useGeoLocation } from "@/hooks/useGeoLocation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { SubtitleSelector } from "./SubtitleSelector";
import type { SubtitleResult } from "@/lib/wyzieSubs";

export type PlayerSource =
  | "vidplus"
  | "rivestream"
  | "vidsync"
  | "smashy"
  | "primesrc"
  | "vidfast"
  | "vidking"
  | "superembed"
  | "vidsrc"
  | "videasy"
  | "multiembed"
  | "autoembed"
  | "frembed"
  | "embedsu"
  | "vidlink"
  | "embed2"
  | "moviesapi"
  | "vidnest"
  | "vidzee"
  | "vidrock"
  | "streamwish"
  | "flixhq"
  | "soap2day"
  | "cinebb"
  | "lookmovie"
  | "putlockers"
  | "nontongo"
  | "111movies"
  | "vidsrc2"
  | "pstream";

interface UniversalPlayerProps {
  tmdbId: number;
  mediaType: "movie" | "tv" | "anilist";
  season?: number;
  episode?: number;
  title?: string;
  posterPath?: string;
  autoPlay?: boolean;
  defaultSource?: PlayerSource;
  preferredSource?: PlayerSource;
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
  className?: string;
  renderOnlySwitcher?: boolean;
  currentSource?: PlayerSource;
  setCurrentSource?: (source: PlayerSource) => void;
}

const PRIMARY_COLOR = "8B5CF6";

export interface SourceConfig {
  id: PlayerSource;
  name: string;
  description: string;
  buildUrl: (
    tmdbId: number,
    mediaType: "movie" | "tv",
    season?: number,
    episode?: number,
  ) => string;
  color: string;
  reliable: boolean;
  priority: number;
  icon?: string;
}

export const SOURCES: SourceConfig[] = [
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
        return `https://frembed.best/api/film.php?id=${tmdbId}`;
      }
      return `https://frembed.best/api/serie.php?id=${tmdbId}&sa=${season || 1}&epi=${episode || 1}`;
    },
  },
  {
    id: "vidplus",
    name: "VidPlus",
    description: "Source Anime Ultra-Stable",
    color: "from-orange-500 to-red-600",
    reliable: true,
    priority: 0,
    icon: "✨",
    buildUrl: (id, mediaType, season, episode) => {
      if ((mediaType as any) === "anilist") {
        return `https://player.vidplus.to/embed/anime/${id}/${episode || 1}?dub=false`;
      }
      if (mediaType === "movie") {
        return `https://player.vidplus.to/embed/movie/${id}`;
      }
      return `https://player.vidplus.to/embed/tv/${id}/${season || 1}/${episode || 1}`;
    },
  },
  {
    id: "rivestream",
    name: "CSlplayer",
    description: "Lecteur principal CStream - Ultra rapide",
    color: "from-blue-600 to-purple-600",
    reliable: true,
    priority: 0,
    icon: "🚀",
    buildUrl: (tmdbId, mediaType, season, episode) => {
      if (mediaType === "movie") {
        return `https://rivestream.net/embed?type=movie&id=${tmdbId}`;
      }
      return `https://rivestream.net/embed?type=tv&id=${tmdbId}&season=${season || 1}&episode=${episode || 1}`;
    },
  },
  {
    id: "vidzee",
    name: "CINEMAOS",
    description: "Source Premium - Haute Qualité",
    color: "from-purple-500 to-pink-500",
    reliable: true,
    priority: 1,
    icon: "🎬",
    buildUrl: (tmdbId, mediaType, season, episode) => {
      if (mediaType === "movie") {
        return `https://player.vidzee.wtf/embed/movie/${tmdbId}`;
      }
      return `https://player.vidzee.wtf/embed/tv/${tmdbId}/${season || 1}/${episode || 1}`;
    },
  },
  {
    id: "vidsync",
    name: "VidSync",
    description: "HD Premium sans bug",
    color: "from-cyan-500 to-teal-500",
    reliable: true,
    priority: 1,
    icon: "⚡",
    buildUrl: (tmdbId, mediaType, season, episode) => {
      if (mediaType === "movie") {
        return `https://vidsync.xyz/embed/movie/${tmdbId}?autoPlay=true`;
      }
      return `https://vidsync.xyz/embed/tv/${tmdbId}/${season || 1}/${episode || 1}?autoPlay=true&autoNext=true`;
    },
  },
  {
    id: "vidking",
    name: "VidKing",
    description: "Multi-serveurs VF/VOSTFR - Ultra Stable",
    color: "from-purple-500 to-indigo-500",
    reliable: true,
    priority: 2,
    icon: "👑",
    buildUrl: (tmdbId, mediaType, season, episode) => {
      if (mediaType === "movie") {
        return `https://vidking.online/embed/movie/${tmdbId}?autoplay=1&theme=${PRIMARY_COLOR}`;
      }
      return `https://vidking.online/embed/tv/${tmdbId}/${season || 1}/${episode || 1}?autoplay=1&theme=${PRIMARY_COLOR}`;
    },
  },
  {
    id: "smashy",
    name: "Smashy",
    description: "HD sans bug",
    color: "from-rose-500 to-pink-600",
    reliable: true,
    priority: 3,
    icon: "🔥",
    buildUrl: (tmdbId, mediaType, season, episode) => {
      if (mediaType === "movie") {
        return `https://player.smashy.stream/movie/${tmdbId}?playerList=D|SU|F|FMD|J`;
      }
      return `https://player.smashy.stream/tv/${tmdbId}?s=${season || 1}&e=${episode || 1}&playerList=D|SU|F|FMD|J`;
    },
  },
  {
    id: "primesrc",
    name: "PrimeSrc",
    description: "Multi-serveurs premium",
    color: "from-amber-500 to-orange-600",
    reliable: true,
    priority: 4,
    icon: "⭐",
    buildUrl: (tmdbId, mediaType, season, episode) => {
      if (mediaType === "movie") {
        return `https://primesrc.me/embed/movie?tmdb=${tmdbId}&fallback=true`;
      }
      return `https://primesrc.me/embed/tv?tmdb=${tmdbId}&season=${season || 1}&episode=${episode || 1}&fallback=true`;
    },
  },
  {
    id: "vidfast",
    name: "VidFast",
    description: "Serveur rapide",
    color: "from-green-500 to-emerald-500",
    reliable: true,
    priority: 5,
    icon: "⚡",
    buildUrl: (tmdbId, mediaType, season, episode) => {
      const base =
        mediaType === "movie"
          ? `https://vidfast.pro/movie/${tmdbId}`
          : `https://vidfast.pro/tv/${tmdbId}/${season || 1}/${episode || 1}`;
      return `${base}?theme=${PRIMARY_COLOR}&autoPlay=true&title=true&poster=true&nextButton=true&autoNext=true`;
    },
  },
  {
    id: "multiembed",
    name: "MultiEmbed",
    description: "Streaming HLS",
    color: "from-violet-500 to-purple-600",
    reliable: true,
    priority: 5,
    icon: "🎬",
    buildUrl: (tmdbId, mediaType, season, episode) => {
      if (mediaType === "movie") {
        return `https://multiembed.mov/directstream.php?video_id=${tmdbId}&tmdb=1`;
      }
      return `https://multiembed.mov/directstream.php?video_id=${tmdbId}&tmdb=1&s=${season || 1}&e=${episode || 1}`;
    },
  },
  {
    id: "superembed",
    name: "SuperEmbed",
    description: "Ultra stable",
    color: "from-yellow-500 to-orange-500",
    reliable: true,
    priority: 6,
    icon: "💎",
    buildUrl: (tmdbId, mediaType, season, episode) => {
      if (mediaType === "movie") {
        return `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1`;
      }
      return `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1&s=${season || 1}&e=${episode || 1}`;
    },
  },
  {
    id: "vidsrc",
    name: "VidSrc",
    description: "Stable et fiable",
    color: "from-blue-500 to-cyan-500",
    reliable: true,
    priority: 7,
    icon: "🎯",
    buildUrl: (tmdbId, mediaType, season, episode) => {
      if (mediaType === "movie") {
        return `https://vidsrc.cc/v2/embed/movie/${tmdbId}`;
      }
      return `https://vidsrc.cc/v2/embed/tv/${tmdbId}/${season || 1}/${episode || 1}`;
    },
  },
  {
    id: "videasy",
    name: "Videasy",
    description: "Leger et rapide",
    color: "from-teal-500 to-cyan-500",
    reliable: true,
    priority: 8,
    icon: "🚀",
    buildUrl: (tmdbId, mediaType, season, episode) => {
      if (mediaType === "movie") {
        return `https://player.videasy.net/movie/${tmdbId}?color=${PRIMARY_COLOR}`;
      }
      return `https://player.videasy.net/tv/${tmdbId}/${season || 1}/${episode || 1}?color=${PRIMARY_COLOR}&nextEpisode=true&autoplayNextEpisode=true&episodeSelector=true`;
    },
  },
  {
    id: "autoembed",
    name: "AutoEmbed",
    description: "Multi-sources HD",
    color: "from-indigo-500 to-blue-600",
    reliable: true,
    priority: 9,
    icon: "🔮",
    buildUrl: (tmdbId, mediaType, season, episode) => {
      if (mediaType === "movie") {
        return `https://player.autoembed.cc/embed/movie/${tmdbId}`;
      }
      return `https://player.autoembed.cc/embed/tv/${tmdbId}/${season || 1}/${episode || 1}`;
    },
  },
  {
    id: "embedsu",
    name: "EmbedSU",
    description: "Multi-serveurs premium",
    color: "from-red-500 to-pink-600",
    reliable: true,
    priority: 10,
    icon: "📡",
    buildUrl: (tmdbId, mediaType, season, episode) => {
      if (mediaType === "movie") {
        return `https://embed.su/embed/movie/${tmdbId}`;
      }
      return `https://embed.su/embed/tv/${tmdbId}/${season || 1}/${episode || 1}`;
    },
  },
  {
    id: "vidlink",
    name: "VidLink",
    description: "HD/4K rapide",
    color: "from-blue-600 to-sky-500",
    reliable: true,
    priority: 11,
    icon: "🔗",
    buildUrl: (tmdbId, mediaType, season, episode) => {
      if (mediaType === "movie") {
        return `https://vidlink.pro/movie/${tmdbId}?primaryColor=${PRIMARY_COLOR}&secondaryColor=EC4899&autoplay=true`;
      }
      return `https://vidlink.pro/tv/${tmdbId}/${season || 1}/${episode || 1}?primaryColor=${PRIMARY_COLOR}&secondaryColor=EC4899&autoplay=true`;
    },
  },
  {
    id: "embed2",
    name: "2Embed",
    description: "Multi-serveurs",
    color: "from-emerald-500 to-teal-500",
    reliable: true,
    priority: 12,
    icon: "📺",
    buildUrl: (tmdbId, mediaType, season, episode) => {
      if (mediaType === "movie") {
        return `https://www.2embed.cc/embed/${tmdbId}`;
      }
      return `https://www.2embed.cc/embedtv/${tmdbId}?s=${season || 1}&e=${episode || 1}`;
    },
  },
  {
    id: "moviesapi",
    name: "MoviesAPI",
    description: "HLS Premium",
    color: "from-pink-500 to-rose-500",
    reliable: true,
    priority: 13,
    icon: "🎥",
    buildUrl: (tmdbId, mediaType, season, episode) => {
      if (mediaType === "movie") {
        return `https://moviesapi.club/movie/${tmdbId}`;
      }
      return `https://moviesapi.club/tv/${tmdbId}/${season || 1}/${episode || 1}`;
    },
  },
  {
    id: "vidnest",
    name: "VidNest",
    description: "Multi-serveurs",
    color: "from-cyan-500 to-blue-600",
    reliable: true,
    priority: 14,
    icon: "🪺",
    buildUrl: (tmdbId, mediaType, season, episode) => {
      if (mediaType === "movie") {
        return `https://vidnest.fun/movie/${tmdbId}`;
      }
      return `https://vidnest.fun/tv/${tmdbId}/${season || 1}/${episode || 1}`;
    },
  },
  {
    id: "vidrock",
    name: "VidRock",
    description: "Premium 4K",
    color: "from-red-500 to-orange-500",
    reliable: true,
    priority: 15,
    icon: "🎸",
    buildUrl: (tmdbId, mediaType, season, episode) => {
      if (mediaType === "movie") {
        return `https://vidrock.net/movie/${tmdbId}?autoplay=true&theme=${PRIMARY_COLOR}`;
      }
      return `https://vidrock.net/tv/${tmdbId}/${season || 1}/${episode || 1}?autoplay=true&autonext=true&theme=${PRIMARY_COLOR}`;
    },
  },
  {
    id: "streamwish",
    name: "StreamWish",
    description: "Ultra-rapide multisource",
    color: "from-blue-400 to-indigo-500",
    reliable: true,
    priority: 16,
    icon: "⚙️",
    buildUrl: (tmdbId, mediaType, season, episode) => {
      if (mediaType === "movie") {
        return `https://streamwish.to/embed-${tmdbId}-640x360.html`;
      }
      return `https://streamwish.to/embed-${tmdbId}-s${season || 1}e${episode || 1}-640x360.html`;
    },
  },
  {
    id: "flixhq",
    name: "FlixHQ",
    description: "Premium sans restrictions",
    color: "from-orange-400 to-red-500",
    reliable: true,
    priority: 17,
    icon: "✨",
    buildUrl: (tmdbId, mediaType, season, episode) => {
      if (mediaType === "movie") {
        return `https://flixhq.to/movie/${tmdbId}`;
      }
      return `https://flixhq.to/tv/${tmdbId}/${season || 1}/${episode || 1}`;
    },
  },
  {
    id: "soap2day",
    name: "Soap2Day",
    description: "Catalogue complet",
    color: "from-zinc-400 to-zinc-600",
    reliable: true,
    priority: 18,
    icon: "🎭",
    buildUrl: (tmdbId, mediaType, season, episode) => {
      if (mediaType === "movie") {
        return `https://soap2day.to/movie/${tmdbId}`;
      }
      return `https://soap2day.to/tv/${tmdbId}/${season || 1}/${episode || 1}`;
    },
  },
  {
    id: "cinebb",
    name: "CineBB",
    description: "Français/International",
    color: "from-blue-500 to-cyan-600",
    reliable: true,
    priority: 19,
    icon: "🎬",
    buildUrl: (tmdbId, mediaType, season, episode) => {
      if (mediaType === "movie") {
        return `https://cinebb.com/movie/${tmdbId}`;
      }
      return `https://cinebb.com/tv/${tmdbId}/${season || 1}/${episode || 1}`;
    },
  },
  {
    id: "lookmovie",
    name: "LookMovie",
    description: "Catalogue extensif",
    color: "from-amber-400 to-yellow-600",
    reliable: true,
    priority: 20,
    icon: "🔍",
    buildUrl: (tmdbId, mediaType, season, episode) => {
      if (mediaType === "movie") {
        return `https://lookmovie.io/movies/view/${tmdbId}`;
      }
      return `https://lookmovie.io/shows/view/${tmdbId}/${season || 1}/${episode || 1}`;
    },
  },
  {
    id: "putlockers",
    name: "PutLocker",
    description: "Multisources stable",
    color: "from-green-400 to-emerald-600",
    reliable: true,
    priority: 21,
    icon: "🔐",
    buildUrl: (tmdbId, mediaType, season, episode) => {
      if (mediaType === "movie") {
        return `https://putlockers.movie/watch/movie/${tmdbId}`;
      }
      return `https://putlockers.movie/watch/tv/${tmdbId}/${season || 1}/${episode || 1}`;
    },
  },
  {
    id: "nontongo",
    name: "Nontongo",
    description: "Multi-langues stable",
    color: "from-purple-400 to-indigo-600",
    reliable: true,
    priority: 22,
    icon: "🌏",
    buildUrl: (tmdbId, mediaType, season, episode) => {
      if (mediaType === "movie") {
        return `https://www.NontonGo.win/embed/movie/${tmdbId}`;
      }
      return `https://www.NontonGo.win/embed/tv/${tmdbId}/${season || 1}/${episode || 1}`;
    },
  },
  {
    id: "111movies",
    name: "111Movies",
    description: "HD/4K streaming",
    color: "from-rose-400 to-pink-600",
    reliable: true,
    priority: 23,
    icon: "🎞️",
    buildUrl: (tmdbId, mediaType, season, episode) => {
      if (mediaType === "movie") {
        return `https://111movies.com/movie/${tmdbId}`;
      }
      return `https://111movies.com/tv/${tmdbId}/${season || 1}/${episode || 1}`;
    },
  },
  {
    id: "vidsrc2",
    name: "VidSrc CX",
    description: "Alternative VidSrc",
    color: "from-sky-400 to-blue-600",
    reliable: true,
    priority: 24,
    icon: "📡",
    buildUrl: (tmdbId, mediaType, season, episode) => {
      if (mediaType === "movie") {
        return `https://vidsrc.cx/embed/movie/${tmdbId}`;
      }
      return `https://vidsrc.cx/embed/tv/${tmdbId}/${season || 1}/${episode || 1}`;
    },
  },
];

type PlayerStatus = "loading" | "ready" | "timeout" | "error";

const getTranslations = (lang: string) => ({
  loading:
    lang === "fr"
      ? "Chargement..."
      : lang === "es"
        ? "Cargando..."
        : "Loading...",
  ready: lang === "fr" ? "Prêt" : lang === "es" ? "Listo" : "Ready",
  error: lang === "fr" ? "Erreur" : lang === "es" ? "Error" : "Error",
  timeout:
    lang === "fr"
      ? "Délai dépassé"
      : lang === "es"
        ? "Tiempo agotado"
        : "Timeout",
  retry: lang === "fr" ? "Réessayer" : lang === "es" ? "Reintentar" : "Retry",
  openExternal:
    lang === "fr"
      ? "Nouvel onglet"
      : lang === "es"
        ? "Nueva pestaña"
        : "New tab",
  selectSource:
    lang === "fr"
      ? "Sélectionner un lecteur"
      : lang === "es"
        ? "Seleccionar reproductor"
        : "Select Player",
  nextSource:
    lang === "fr"
      ? "Autre source"
      : lang === "es"
        ? "Otra fuente"
        : "Next source",
  switching:
    lang === "fr"
      ? "Changement..."
      : lang === "es"
        ? "Cambiando..."
        : "Switching...",
  blocked:
    lang === "fr"
      ? "Lecture bloquée"
      : lang === "es"
        ? "Reproducción bloqueada"
        : "Playback blocked",
  blockedDesc:
    lang === "fr"
      ? "Ce lecteur ne répond pas. Essayez une autre source."
      : lang === "es"
        ? "Este reproductor no responde. Prueba otra fuente."
        : "This player is not responding. Try another source.",
  recommended:
    lang === "fr"
      ? "Recommandé"
      : lang === "es"
        ? "Recomendado"
        : "Recommended",
  fast: lang === "fr" ? "Rapide" : lang === "es" ? "Rápido" : "Fast",
  connecting:
    lang === "fr"
      ? "Connexion en cours..."
      : lang === "es"
        ? "Conectando..."
        : "Connecting...",
});

const VidzeeLogoSVG = () => (
  <svg
    viewBox="0 0 24 24"
    className="w-5 h-5"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="vidzeeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#a855f7" />
        <stop offset="50%" stopColor="#ec4899" />
        <stop offset="100%" stopColor="#8b5cf6" />
      </linearGradient>
    </defs>
    <path
      d="M4 8L12 16L20 8"
      stroke="url(#vidzeeGrad)"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M4 4L12 12L20 4"
      stroke="url(#vidzeeGrad)"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity="0.5"
    />
  </svg>
);

const PremiumButton = ({
  children,
  onClick,
  className = "",
  variant = "default",
  size = "default",
  title,
  ...props
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: "default" | "ghost" | "outline";
  size?: "default" | "sm" | "icon";
  title?: string;
  [key: string]: any;
}) => (
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    title={title}
    className={cn(
      "relative overflow-hidden transition-all duration-300",
      "backdrop-blur-xl border border-white/10",
      "hover:border-white/20 hover:shadow-lg hover:shadow-purple-500/20",
      "active:shadow-inner group",
      size === "sm"
        ? "h-8 px-3 text-xs"
        : size === "icon"
          ? "h-8 w-8 sm:h-9 sm:w-9 p-0"
          : "h-10 px-4",
      variant === "ghost"
        ? "bg-white/5 hover:bg-white/10"
        : variant === "outline"
          ? "bg-transparent hover:bg-white/5"
          : "bg-gradient-to-r from-purple-600/80 to-pink-600/80 hover:from-purple-500/90 hover:to-pink-500/90",
      "rounded-xl flex items-center justify-center gap-2",
      className,
    )}
    {...props}
  >
    <span className="relative z-10 flex items-center gap-2">{children}</span>
    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
  </motion.button>
);

export const UniversalPlayer = ({
  tmdbId,
  mediaType,
  season,
  episode,
  title,
  posterPath,
  autoPlay = true,
  defaultSource,
  onProgressUpdate,
  onVideoEnd,
  onNextEpisode,
  onPreviousEpisode,
  hasNextEpisode = false,
  hasPreviousEpisode = false,
  className = "",
  renderOnlySwitcher = false,
  currentSource: externalCurrentSource,
  setCurrentSource: externalSetCurrentSource,
}: UniversalPlayerProps) => {
  const { language, getTMDBLanguage, t } = useI18n();
  const lang = getTMDBLanguage();
  const { country } = useGeoLocation();

  const effectiveDefaultSource = useMemo(() => {
    if (mediaType === "anilist") return "vidplus";
    if (lang === "fr" || country === "FR") return "frembed";
    return defaultSource || SOURCES[0].id;
  }, [mediaType, lang, country, defaultSource]);

  const [internalCurrentSource, setInternalCurrentSource] =
    useState<PlayerSource>(effectiveDefaultSource);

  const currentSource =
    externalCurrentSource !== undefined
      ? externalCurrentSource
      : internalCurrentSource;
  const setCurrentSourceFn = (id: PlayerSource) => {
    console.log("[UniversalPlayer] Setting source to:", id);
    if (externalSetCurrentSource) {
      externalSetCurrentSource(id);
    } else {
      setInternalCurrentSource(id);
    }
    setIframeKey((prev) => prev + 1);
    setStatus("loading");
    setLoadingProgress(0);
    clearTimers();
    toast.success(`Source sélectionnée : ${id}`);
  };

  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const autoSwitchAttemptRef = useRef(0);

  const [status, setStatus] = useState<PlayerStatus>("loading");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [autoSwitching, setAutoSwitching] = useState(false);
  const [selectedSubtitle, setSelectedSubtitle] =
    useState<SubtitleResult | null>(null);

  if (renderOnlySwitcher) {
    return (
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 px-1">
        {SOURCES.map((s) => (
          <motion.button
            key={s.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              console.log("[UniversalPlayer] Source button clicked:", s.id);
              setCurrentSourceFn(s.id);
            }}
            className={cn(
              "flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl transition-all duration-300 whitespace-nowrap border text-xs sm:text-sm font-medium",
              currentSource === s.id
                ? "bg-gradient-to-r from-purple-600 to-pink-600 border-white/20 text-white shadow-lg shadow-purple-500/20"
                : "bg-white/5 border-white/5 text-white/40 hover:text-white hover:bg-white/10",
            )}
          >
            <span className="text-base sm:text-lg">{s.icon}</span>
            <span className="hidden sm:inline">{s.name}</span>
          </motion.button>
        ))}
      </div>
    );
  }

  const currentSourceConfig =
    SOURCES.find((s) => s.id === currentSource) || SOURCES[0];
  const videoUrl = currentSourceConfig.buildUrl(
    tmdbId,
    mediaType as any,
    season,
    episode,
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

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (defaultSource && defaultSource !== currentSource) {
      clearTimers();
      setCurrentSourceFn(defaultSource);
      setIframeKey((prev) => prev + 1);
      setStatus("loading");
      setLoadingProgress(0);
      autoSwitchAttemptRef.current = 0;
      setAutoSwitching(false);
    }
  }, [defaultSource, clearTimers]);

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

        if (data.event === "onEnd" || data.type === "ended") {
          if (onVideoEnd) onVideoEnd();
        }
      } catch (e) {
        // Silently ignore malformed messages
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onProgressUpdate, onVideoEnd]);

  useEffect(() => {
    clearTimers();
    setStatus("ready");
    setLoadingProgress(100);

    const progressInterval = setInterval(() => {
      if (onProgressUpdate) {
        onProgressUpdate(-1, 0, 0);
      }
    }, 20000);

    return () => {
      clearTimers();
      clearInterval(progressInterval);
    };
  }, [
    currentSource,
    tmdbId,
    season,
    episode,
    iframeKey,
    clearTimers,
    onProgressUpdate,
  ]);

  const handleIframeLoad = useCallback(() => {
    clearTimers();
    setStatus("ready");
    setLoadingProgress(100);
    setAutoSwitching(false);
    autoSwitchAttemptRef.current = 0;
  }, [clearTimers]);

  const handleIframeError = useCallback(() => {
    clearTimers();
    console.warn(
      `[UniversalPlayer] Iframe error with ${currentSource}, attempting to switch...`,
    );

    if (autoSwitchAttemptRef.current < Math.min(5, SOURCES.length - 1)) {
      autoSwitchAttemptRef.current++;
      const currentIndex = SOURCES.findIndex((s) => s.id === currentSource);
      const nextIndex = (currentIndex + 1) % SOURCES.length;
      const nextSource = SOURCES[nextIndex];

      setAutoSwitching(true);
      setCurrentSourceFn(nextSource.id);
      setIframeKey((prev) => prev + 1);
      setStatus("loading");
      setLoadingProgress(0);

      toast.info(`Basculement vers ${nextSource.name}...`, { duration: 1500 });
    } else {
      setStatus("error");
      toast.error("Lecteur indisponible", {
        description:
          "Les sources ne répondent pas. Réessayez dans quelques secondes.",
        duration: 4000,
      });
    }
  }, [currentSource, clearTimers]);

  const handleSourceChange = useCallback((sourceId: PlayerSource) => {
    const source = SOURCES.find((s) => s.id === sourceId);
    setCurrentSourceFn(sourceId);
    setIframeKey((prev) => prev + 1);
    autoSwitchAttemptRef.current = 0;
    setAutoSwitching(false);
    setStatus("loading");

    try {
      localStorage.setItem("cstream_preferred_player", sourceId);
    } catch { }

    if (source) {
      toast.success(`${source.name}`, {
        description: source.description,
        duration: 2000,
      });
    }
  }, []);

  const handleRetry = useCallback(() => {
    setStatus("loading");
    setIframeKey((prev) => prev + 1);
    autoSwitchAttemptRef.current = 0;
    setLoadingProgress(0);
  }, []);

  const handleOpenExternal = useCallback(() => {
    const isInternal =
      videoUrl.startsWith("/") || videoUrl.startsWith(window.location.origin);
    if (isInternal) {
      window.open(videoUrl, "_blank", "noopener,noreferrer");
    } else {
      console.warn("🛡️ Manual external opening blocked for security");
    }
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

  return (
    <div className={cn("flex flex-col w-full", className)}>
      {/* Player Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative flex items-center justify-between gap-2 p-3 sm:p-4 
          bg-gradient-to-r from-zinc-900/98 via-zinc-900/95 to-zinc-900/98
          backdrop-blur-2xl border border-white/10 border-b-0 rounded-t-2xl
          shadow-[0_-10px_40px_-10px_rgba(139,92,246,0.15)]"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-transparent to-pink-500/5 rounded-t-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />

        {/* Left Section: Source Info */}
        <div className="relative flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <motion.div
            className={cn(
              "flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl border shadow-lg font-bold tracking-wider",
              currentSourceConfig.id === "rivestream"
                ? "from-blue-500/30 to-cyan-500/20 border-blue-500/40 shadow-blue-500/20 bg-gradient-to-r"
                : currentSourceConfig.id === "vidsync"
                  ? "from-cyan-500/30 to-teal-500/20 border-cyan-500/40 shadow-cyan-500/20 bg-gradient-to-r"
                  : "from-purple-500/20 to-pink-500/15 border-purple-500/30 shadow-purple-500/10 bg-gradient-to-r",
            )}
            whileHover={{ scale: 1.05 }}
          >
            {currentSourceConfig.icon && (
              <span className="text-sm sm:text-base">
                {currentSourceConfig.icon}
              </span>
            )}
            <span
              className="text-[10px] sm:text-xs font-extrabold bg-gradient-to-r bg-clip-text text-transparent tracking-wider hidden sm:block uppercase"
              style={{
                backgroundImage:
                  currentSourceConfig.id === "rivestream"
                    ? "linear-gradient(90deg, #0ea5e9, #06b6d4, #0ea5e9)"
                    : currentSourceConfig.id === "vidsync"
                      ? "linear-gradient(90deg, #22d3ee, #14b8a6, #22d3ee)"
                      : "linear-gradient(90deg, #a855f7, #ec4899, #a855f7)",
              }}
            >
              {currentSourceConfig.name}
            </span>
          </motion.div>

          {mediaType === "tv" && season && episode && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 
                bg-gradient-to-r from-white/5 to-white/10 
                rounded-xl border border-white/10 shadow-inner"
            >
              <Monitor className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-purple-400" />
              <span className="text-[10px] sm:text-xs font-semibold text-white/90 tracking-wide">
                S{String(season).padStart(2, "0")}E
                {String(episode).padStart(2, "0")}
              </span>
            </motion.div>
          )}

          {title && (
            <span className="text-xs sm:text-sm text-white/50 truncate hidden lg:block font-medium max-w-[150px] xl:max-w-[200px]">
              {title}
            </span>
          )}
        </div>

        {/* Right Section: Controls */}
        <div className="relative flex items-center gap-1 sm:gap-1.5">
          {/* Source Selector Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="h-8 sm:h-9 px-2 sm:px-3 lg:px-4 gap-1.5 sm:gap-2 flex items-center
                  bg-gradient-to-r from-white/5 to-white/10 
                  hover:from-white/10 hover:to-white/15
                  backdrop-blur-xl border border-white/10 hover:border-white/20 
                  rounded-xl transition-all duration-300
                  shadow-lg shadow-black/20 hover:shadow-purple-500/10 group"
              >
                <motion.div
                  className={cn(
                    "w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-gradient-to-r shadow-lg",
                    currentSourceConfig.color,
                  )}
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span className="text-[10px] sm:text-xs font-semibold text-white/90 hidden md:block">
                  {currentSourceConfig.name}
                </span>
                <ChevronDown className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-white/50 group-hover:text-white/70 transition-colors" />
              </motion.button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={12}
              className="w-72 sm:w-80 p-2 
                bg-zinc-900/98 backdrop-blur-2xl 
                border border-white/10 
                max-h-[350px] sm:max-h-[400px] overflow-y-auto 
                shadow-2xl shadow-purple-500/10
                rounded-2xl z-[100]"
            >
              <div className="flex items-center justify-between px-3 py-2 mb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-purple-400" />
                  <span className="text-[10px] sm:text-xs font-semibold text-white/70 uppercase tracking-wider">
                    {translations.selectSource}
                  </span>
                </div>
                <span className="text-[9px] sm:text-[10px] text-white/40 bg-white/5 px-1.5 sm:px-2 py-0.5 rounded-full">
                  {SOURCES.length} sources
                </span>
              </div>
              <DropdownMenuSeparator className="bg-gradient-to-r from-transparent via-white/10 to-transparent mb-2" />

              <div className="space-y-1">
                {SOURCES.map((source) => (
                  <DropdownMenuItem
                    key={source.id}
                    onClick={() => handleSourceChange(source.id)}
                    className={cn(
                      "cursor-pointer py-2 sm:py-2.5 px-2 sm:px-3 rounded-xl transition-all duration-200",
                      "focus:bg-white/10 focus:outline-none",
                      currentSource === source.id
                        ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 shadow-lg shadow-purple-500/10"
                        : "hover:bg-white/5 border border-transparent hover:border-white/10",
                    )}
                  >
                    <motion.div
                      className="flex items-center gap-2 sm:gap-3 w-full"
                      initial={false}
                      whileHover={{ x: 2 }}
                    >
                      <div
                        className={cn(
                          "w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-sm sm:text-base",
                          "bg-gradient-to-br shadow-lg",
                          source.color,
                          "shadow-black/20",
                        )}
                      >
                        {source.icon || source.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5">
                          <span className="text-xs sm:text-sm font-semibold text-white truncate">
                            {source.name}
                          </span>
                          {source.priority <= 2 && (
                            <span
                              className="px-1 sm:px-1.5 py-0.5 text-[8px] sm:text-[9px] font-bold uppercase tracking-wider
                              bg-gradient-to-r from-amber-500/20 to-orange-500/20 
                              text-amber-400 rounded-md border border-amber-500/30
                              flex items-center gap-1 shrink-0"
                            >
                              <Crown className="w-2 sm:w-2.5 h-2 sm:h-2.5" />
                              {translations.recommended}
                            </span>
                          )}
                          {source.priority > 2 && source.priority <= 5 && (
                            <span
                              className="px-1 sm:px-1.5 py-0.5 text-[8px] sm:text-[9px] font-bold uppercase tracking-wider
                              bg-gradient-to-r from-green-500/20 to-emerald-500/20 
                              text-green-400 rounded-md border border-green-500/30
                              flex items-center gap-1 shrink-0"
                            >
                              <Zap className="w-2 sm:w-2.5 h-2 sm:h-2.5" />
                              {translations.fast}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] sm:text-[11px] text-white/40 truncate block">
                          {source.description}
                        </span>
                      </div>
                      {currentSource === source.id && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 
                            flex items-center justify-center shadow-lg shadow-purple-500/30 shrink-0"
                        >
                          <Check className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-white" />
                        </motion.div>
                      )}
                    </motion.div>
                  </DropdownMenuItem>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Episode Navigation (TV Only) */}
          {mediaType === "tv" && (
            <>
              {hasPreviousEpisode && onPreviousEpisode && (
                <PremiumButton
                  variant="ghost"
                  size="icon"
                  onClick={onPreviousEpisode}
                  title="Previous Episode"
                >
                  <SkipBack className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-white/70" />
                </PremiumButton>
              )}
              {hasNextEpisode && onNextEpisode && (
                <PremiumButton
                  variant="ghost"
                  size="icon"
                  onClick={onNextEpisode}
                  title="Next Episode"
                >
                  <SkipForward className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-white/70" />
                </PremiumButton>
              )}
            </>
          )}

          {/* Retry Button */}
          <PremiumButton
            variant="ghost"
            size="icon"
            onClick={handleRetry}
            title={translations.retry}
          >
            <RefreshCw className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-white/70" />
          </PremiumButton>

          {/* Subtitle Selector */}
          <SubtitleSelector
            tmdbId={tmdbId}
            mediaType={mediaType as any}
            season={season}
            episode={episode}
            selectedSubtitle={selectedSubtitle}
            onSubtitleSelect={setSelectedSubtitle}
          />

          {/* External Link Button */}
          <PremiumButton
            variant="ghost"
            size="icon"
            onClick={handleOpenExternal}
            title={translations.openExternal}
            className="hidden sm:flex"
          >
            <ExternalLink className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-white/70" />
          </PremiumButton>

          {/* Fullscreen Button */}
          <PremiumButton
            variant="ghost"
            size="icon"
            onClick={togglePlayerFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? (
              <Minimize className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-white/70" />
            ) : (
              <Maximize className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-white/70" />
            )}
          </PremiumButton>
        </div>
      </motion.div>

      {/* Player Container */}
      <div
        ref={containerRef}
        className="relative w-full aspect-video bg-black rounded-b-2xl overflow-hidden 
          shadow-2xl shadow-purple-500/10 ring-1 ring-white/10"
      >
        <AnimatePresence mode="wait">
          {/* Loading State */}
          {(status === "loading" || autoSwitching) && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.3 } }}
              className="absolute inset-0 z-20 flex flex-col items-center justify-center 
                bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950"
            >
              {posterPath && (
                <motion.div
                  initial={{ scale: 1.1, opacity: 0 }}
                  animate={{ scale: 1, opacity: 0.2 }}
                  className="absolute inset-0 bg-cover bg-center"
                  style={{
                    backgroundImage: `url(https://image.tmdb.org/t/p/w1280${posterPath})`,
                  }}
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/60" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)]" />

              <motion.div
                initial={{ scale: 0.8, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative z-10 flex flex-col items-center px-4 sm:px-6"
              >
                <div className="relative mb-5 sm:mb-6">
                  <motion.div
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 blur-xl"
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />

                  <div
                    className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full 
                    bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 
                    backdrop-blur-xl border border-white/10 
                    flex items-center justify-center shadow-2xl shadow-purple-500/20"
                  >
                    <svg
                      className="absolute inset-0 w-full h-full"
                      viewBox="0 0 100 100"
                    >
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth="3"
                      />
                      <motion.circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="url(#progressGradient)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray={`${loadingProgress * 2.83} 283`}
                        transform="rotate(-90 50 50)"
                      />
                      <defs>
                        <linearGradient
                          id="progressGradient"
                          x1="0%"
                          y1="0%"
                          x2="100%"
                          y2="0%"
                        >
                          <stop offset="0%" stopColor="#a855f7" />
                          <stop offset="100%" stopColor="#ec4899" />
                        </linearGradient>
                      </defs>
                    </svg>

                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <Play className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-white fill-white/90" />
                    </motion.div>
                  </div>
                </div>

                <motion.div
                  className="text-center mb-5 sm:mb-6"
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <h3 className="text-white font-bold text-base sm:text-lg md:text-xl mb-2 tracking-wide">
                    {autoSwitching
                      ? translations.switching
                      : translations.loading}
                  </h3>
                  <div className="flex items-center justify-center gap-2">
                    <span
                      className={cn(
                        "text-xs sm:text-sm font-semibold bg-gradient-to-r bg-clip-text text-transparent",
                        currentSourceConfig.color,
                      )}
                    >
                      {currentSourceConfig.icon} {currentSourceConfig.name}
                    </span>
                  </div>
                </motion.div>

                <div
                  className="w-48 sm:w-56 md:w-64 h-1.5 bg-white/5 rounded-full overflow-hidden 
                  border border-white/10 shadow-inner"
                >
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 
                      shadow-lg shadow-purple-500/50"
                    style={{ width: `${loadingProgress}%` }}
                    transition={{ duration: 0.2 }}
                  />
                </div>

                <motion.div
                  className="flex items-center justify-center gap-2 mt-4 sm:mt-5"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <div
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 
                    border border-purple-500/30 flex items-center justify-center"
                  >
                    <Wifi className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-purple-400" />
                  </div>
                  <span className="text-[10px] sm:text-xs text-white/50 font-medium">
                    {translations.connecting}
                  </span>
                </motion.div>
              </motion.div>

              <motion.div
                className="absolute bottom-4 sm:bottom-6 flex items-center gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <VidzeeLogoSVG />
                <span
                  className="text-[10px] sm:text-xs font-bold bg-gradient-to-r from-purple-400 to-pink-400 
                  bg-clip-text text-transparent tracking-widest"
                >
                  VIDZEE PLAYER
                </span>
              </motion.div>
            </motion.div>
          )}

          {/* Error State */}
          {status === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 flex flex-col items-center justify-center p-4 sm:p-6"
            >
              {posterPath && (
                <div
                  className="absolute inset-0 opacity-10 bg-cover bg-center blur-2xl"
                  style={{
                    backgroundImage: `url(https://image.tmdb.org/t/p/w780${posterPath})`,
                  }}
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-br from-red-950/40 via-zinc-900/95 to-zinc-950" />

              <motion.div
                initial={{ scale: 0.9, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="relative z-10 bg-gradient-to-br from-zinc-800/60 to-zinc-900/80 
                  backdrop-blur-2xl border border-white/10 rounded-3xl 
                  p-5 sm:p-6 md:p-8 max-w-sm sm:max-w-md w-full text-center
                  shadow-2xl shadow-red-500/10"
              >
                <motion.div
                  className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 mx-auto mb-4 sm:mb-5 rounded-2xl 
                    bg-gradient-to-br from-red-500/20 to-orange-500/20 
                    border border-red-500/30
                    flex items-center justify-center shadow-lg shadow-red-500/20"
                  animate={{ rotate: [0, -5, 5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <AlertTriangle className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-red-400" />
                </motion.div>

                <h3 className="text-white font-bold text-lg sm:text-xl md:text-2xl mb-2">
                  {translations.blocked}
                </h3>
                <p className="text-white/50 text-xs sm:text-sm mb-5 sm:mb-6 leading-relaxed">
                  {translations.blockedDesc}
                </p>

                <div className="flex flex-col gap-2 sm:gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={switchToNextSource}
                    className="w-full py-2.5 sm:py-3 px-4 rounded-xl font-semibold text-xs sm:text-sm
                      bg-gradient-to-r from-purple-600 to-pink-600 
                      hover:from-purple-500 hover:to-pink-500
                      text-white shadow-lg shadow-purple-500/30
                      flex items-center justify-center gap-2 transition-all"
                  >
                    <RefreshCw className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                    {translations.nextSource}
                  </motion.button>

                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleRetry}
                      className="flex-1 py-2 sm:py-2.5 px-3 sm:px-4 rounded-xl font-medium text-xs sm:text-sm
                        bg-white/5 hover:bg-white/10 
                        border border-white/10 hover:border-white/20
                        text-white/80 hover:text-white
                        flex items-center justify-center gap-2 transition-all"
                    >
                      <RefreshCw className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                      {translations.retry}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleOpenExternal}
                      className="flex-1 py-2 sm:py-2.5 px-3 sm:px-4 rounded-xl font-medium text-xs sm:text-sm
                        bg-white/5 hover:bg-white/10 
                        border border-white/10 hover:border-white/20
                        text-white/80 hover:text-white
                        flex items-center justify-center gap-2 transition-all"
                    >
                      <ExternalLink className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                      {translations.openExternal}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Video Iframe */}
        <iframe
          ref={iframeRef}
          key={iframeKey}
          src={videoUrl}
          className="absolute inset-0 w-full h-full border-0 z-10"
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
          referrerPolicy="no-referrer-when-downgrade"
          loading="eager"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          title={title || "Video Player"}
        />
      </div>
    </div>
  );
};

export default UniversalPlayer;
