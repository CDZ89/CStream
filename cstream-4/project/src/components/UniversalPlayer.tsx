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
  Server,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { SubtitleSelector } from "./SubtitleSelector";
import { SubtitleResult } from "@/lib/wyzieSubs";

export type PlayerSource =
  | "vidplus"
  | "bludclart"
  | "rivestream"
  | "vidzee"
  | "vidking"
  | "smashy"
  | "primesrc"
  | "vidfast"
  | "multiembed"
  | "superembed"
  | "vidsrc"
  | "videasy"
  | "autoembed"
  | "frembed"
  | "embedsu"
  | "vidlink"
  | "embed2"
  | "moviesapi"
  | "vidnest"
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
  | "cinesrc"
  | "vidstorm"
  | "vidora"
  | "zxcstream"
  | "quickwatch"
  | "pstream"
  | "videasy"
  | "xpass"
  | "hexa"
  | "madplay"
  | "yflix"
  | "moviebox";

interface UniversalPlayerProps {
  tmdbId: string | number;
  mediaType: "movie" | "tv";
  season?: number;
  episode?: number;
  title?: string;
  posterPath?: string;
  className?: string;
  currentSource?: PlayerSource;
  setCurrentSource?: (source: PlayerSource) => void;
  defaultSource?: PlayerSource;
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
  languages?: string[];
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
    id: "vidplus",
    name: "VidPlus",
    description: "Source Anime Ultra-Stable",
    color: "from-orange-500 to-red-600",
    reliable: true,
    priority: 0,
    icon: "✨",
    buildUrl: (tmdbId, mediaType, season, episode) => {
      if ((mediaType as any) === "anilist") {
        return `https://player.vidplus.to/embed/anime/${tmdbId}/${episode || 1}?dub=false`;
      }
      if (mediaType === "movie") {
        return `https://player.vidplus.to/embed/movie/${tmdbId}`;
      }
      return `https://player.vidplus.to/embed/tv/${tmdbId}/${season || 1}/${episode || 1}`;
    },
  },
  {
    id: "frembed",
    name: "Frembed",
    description: "TOP - VF/VOSTFR - Lecteur français optimisé",
    color: "from-pink-500 to-rose-600",
    reliable: true,
    priority: 0,
    icon: "🇫🇷",
    buildUrl: (tmdbId, mediaType, season, episode) => {
      const s = season || 1;
      const e = episode || 1;
      return mediaType === "movie"
        ? `https://frembed.work/api/film.php?id=${tmdbId}`
        : `https://frembed.work/api/serie.php?id=${tmdbId}&sa=${s}&epi=${e}`;
    },
  },
  {
    id: "rivestream",
    name: "RiveStream",
    description: "Ultra fiable - Recommandé",
    color: "from-blue-600 to-indigo-600",
    reliable: true,
    priority: 1,
    icon: "🚀",
    buildUrl: (tmdbId, mediaType, season, episode) => {
      const s = season || 1;
      const e = episode || 1;
      return mediaType === "movie"
        ? `https://rivestream.net/embed?type=movie&id=${tmdbId}`
        : `https://rivestream.net/embed?type=tv&id=${tmdbId}&season=${s}&episode=${e}`;
    },
  },
  {
    id: "vidzee",
    name: "VidZee",
    description: "TOP - Excellent qualité",
    color: "from-purple-500 to-pink-500",
    reliable: true,
    priority: 2,
    icon: "⭐",
    buildUrl: (tmdbId, mediaType, season, episode) => {
      const s = season || 1;
      const e = episode || 1;
      return mediaType === "movie"
        ? `https://player.vidzee.wtf/embed/movie/${tmdbId}`
        : `https://player.vidzee.wtf/embed/tv/${tmdbId}/${s}/${e}`;
    },
  },
  {
    id: "smashy",
    name: "Smashy",
    description: "HD sans bug",
    color: "from-orange-500 to-red-600",
    reliable: true,
    priority: 3,
    icon: "🔥",
    buildUrl: (tmdbId, mediaType, season, episode) => {
      const s = season || 1;
      const e = episode || 1;
      return mediaType === "movie"
        ? `https://player.smashy.stream/movie/${tmdbId}?playerList=D|SU|F|FMD|J`
        : `https://player.smashy.stream/tv/${tmdbId}?s=${s}&e=${e}&playerList=D|SU|F|FMD|J`;
    },
  },
  {
    id: "bludclart",
    name: "Bludclart",
    description: "Lecteur TMDB optimisé",
    color: "from-zinc-700 to-zinc-900",
    reliable: true,
    priority: 4,
    icon: "🎬",
    buildUrl: (tmdbId, mediaType, season, episode) => {
      const s = season || 1;
      const e = episode || 1;
      return mediaType === "movie"
        ? `https://watch.bludclart.com/movie/${tmdbId}/watch`
        : `https://watch.bludclart.com/tv/${tmdbId}/watch?season=${s}&episode=${e}`;
    },
  },
  {
    id: "vidking",
    name: "VidKing",
    description: "Multi-serveurs VF/VOSTFR",
    color: "from-yellow-600 to-amber-700",
    reliable: true,
    priority: 5,
    icon: "👑",
    buildUrl: (tmdbId, mediaType, season, episode) => {
      const s = season || 1;
      const e = episode || 1;
      return mediaType === "movie"
        ? `https://vidking.online/embed/movie/${tmdbId}?autoplay=1`
        : `https://vidking.online/embed/tv/${tmdbId}/${s}/${e}?autoplay=1`;
    },
  },
  {
    id: "primesrc",
    name: "PrimeSrc",
    description: "Multi-serveurs premium",
    color: "from-emerald-500 to-teal-600",
    reliable: true,
    priority: 6,
    icon: "⭐",
    buildUrl: (tmdbId, mediaType, season, episode) => {
      const s = season || 1;
      const e = episode || 1;
      return mediaType === "movie"
        ? `https://primesrc.me/embed/movie?tmdb=${tmdbId}&fallback=true`
        : `https://primesrc.me/embed/tv?tmdb=${tmdbId}&season=${s}&episode=${e}&fallback=true`;
    },
  },
  {
    id: "vidfast",
    name: "VidFast",
    description: "Serveur rapide",
    color: "from-blue-400 to-blue-600",
    reliable: true,
    priority: 7,
    icon: "⚡",
    buildUrl: (tmdbId, mediaType, season, episode) => {
      const s = season || 1;
      const e = episode || 1;
      return mediaType === "movie"
        ? `https://vidfast.pro/movie/${tmdbId}?theme=${PRIMARY_COLOR}&autoPlay=true&title=true&poster=true`
        : `https://vidfast.pro/tv/${tmdbId}/${s}/${e}?theme=${PRIMARY_COLOR}&autoPlay=true&title=true&poster=true`;
    },
  },
  {
    id: "multiembed",
    name: "MultiEmbed",
    description: "Streaming HLS",
    color: "from-zinc-800 to-black",
    reliable: true,
    priority: 8,
    icon: "🎬",
    buildUrl: (tmdbId, mediaType, season, episode) => {
      const s = season || 1;
      const e = episode || 1;
      return mediaType === "movie"
        ? `https://multiembed.mov/directstream.php?video_id=${tmdbId}&tmdb=1`
        : `https://multiembed.mov/directstream.php?video_id=${tmdbId}&tmdb=1&s=${s}&e=${e}`;
    },
  },
  {
    id: "superembed",
    name: "SuperEmbed",
    description: "Ultra stable",
    color: "from-blue-500 to-cyan-600",
    reliable: true,
    priority: 9,
    icon: "💎",
    buildUrl: (tmdbId, mediaType, season, episode) => {
      const s = season || 1;
      const e = episode || 1;
      return mediaType === "movie"
        ? `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1`
        : `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1&s=${s}&e=${e}`;
    },
  },
  {
    id: "vidsrc",
    name: "VidSrc",
    description: "Stable et fiable - Progress Sync",
    color: "from-indigo-500 to-blue-600",
    reliable: true,
    priority: 10,
    icon: "🎯",
    buildUrl: (tmdbId, mediaType, season, episode) => {
      const s = season || 1;
      const e = episode || 1;
      return mediaType === "movie"
        ? `https://vidsrc.wtf/api/2/movie/?id=${tmdbId}&color=${PRIMARY_COLOR}`
        : `https://vidsrc.wtf/api/2/tv/?id=${tmdbId}&s=${s}&e=${e}&color=${PRIMARY_COLOR}`;
    },
  },
  {
    id: "videasy",
    name: "Videasy",
    description: "Leger et rapide",
    color: "from-sky-400 to-sky-600",
    reliable: true,
    priority: 11,
    icon: "🚀",
    buildUrl: (tmdbId, mediaType, season, episode) => {
      const s = season || 1;
      const e = episode || 1;
      return mediaType === "movie"
        ? `https://player.videasy.net/movie/${tmdbId}?color=${PRIMARY_COLOR}`
        : `https://player.videasy.net/tv/${tmdbId}/${s}/${e}?color=${PRIMARY_COLOR}&nextEpisode=true&autoplayNextEpisode=true&episodeSelector=true`;
    },
  },
  {
    id: "autoembed",
    name: "AutoEmbed",
    description: "Multi-sources HD",
    color: "from-violet-500 to-purple-600",
    reliable: true,
    priority: 12,
    icon: "🔮",
    buildUrl: (tmdbId, mediaType, season, episode) => {
      const s = season || 1;
      const e = episode || 1;
      return mediaType === "movie"
        ? `https://player.autoembed.cc/embed/movie/${tmdbId}`
        : `https://player.autoembed.cc/embed/tv/${tmdbId}/${s}/${e}`;
    },
  },
  {
    id: "embedsu",
    name: "EmbedSU",
    description: "Multi-serveurs premium",
    color: "from-rose-500 to-pink-600",
    reliable: true,
    priority: 13,
    icon: "📡",
    buildUrl: (tmdbId, mediaType, season, episode) => {
      const s = season || 1;
      const e = episode || 1;
      return mediaType === "movie"
        ? `https://embedsu.com/embed/movie/${tmdbId}`
        : `https://embedsu.com/embed/tv/${tmdbId}/${s}/${e}`;
    },
  },
  {
    id: "vidlink",
    name: "VidLink",
    description: "HD/4K rapide",
    color: "from-blue-600 to-cyan-500",
    reliable: true,
    priority: 14,
    icon: "🔗",
    buildUrl: (tmdbId, mediaType, season, episode) => {
      const s = season || 1;
      const e = episode || 1;
      return mediaType === "movie"
        ? `https://vidlink.pro/movie/${tmdbId}?primaryColor=${PRIMARY_COLOR}&autoplay=true`
        : `https://vidlink.pro/tv/${tmdbId}/${s}/${e}?primaryColor=${PRIMARY_COLOR}&autoplay=true`;
    },
  },
  {
    id: "embed2",
    name: "2Embed",
    description: "Multi-serveurs stable",
    color: "from-zinc-600 to-zinc-400",
    reliable: true,
    priority: 15,
    icon: "📺",
    buildUrl: (tmdbId, mediaType, season, episode) => {
      const s = season || 1;
      const e = episode || 1;
      return mediaType === "movie"
        ? `https://www.2embed.cc/embed/${tmdbId}`
        : `https://www.2embed.cc/embedtv/${tmdbId}?s=${s}&e=${e}`;
    },
  },
  {
    id: "moviesapi",
    name: "MoviesAPI",
    description: "HLS Premium",
    color: "from-red-500 to-orange-500",
    reliable: true,
    priority: 16,
    icon: "🎥",
    buildUrl: (tmdbId, mediaType, season, episode) => {
      const s = season || 1;
      const e = episode || 1;
      return mediaType === "movie"
        ? `https://moviesapi.club/movie/${tmdbId}`
        : `https://moviesapi.club/tv/${tmdbId}-${s}-${e}`;
    },
  },
  {
    id: "cinesrc",
    name: "CineSrc",
    description: "Premium - Haute Qualité - Auto-Next",
    color: "from-red-600 to-rose-700",
    reliable: true,
    priority: 17,
    icon: "🎬",
    buildUrl: (tmdbId, mediaType, season, episode) => {
      const s = season || 1;
      const e = episode || 1;
      if (mediaType === "movie") {
        return `https://cinesrc.st/embed/movie/${tmdbId}?autoplay=true&color=%238B5CF6&back=close`;
      }
      return `https://cinesrc.st/embed/tv/${tmdbId}?s=${s}&e=${e}&autoplay=true&autonext=true&color=%238B5CF6&back=close`;
    },
  },
  {
    id: "vidstorm",
    name: "VidStorm",
    description: "Premium - Rapide & Progress Sync",
    color: "from-blue-600 to-indigo-700",
    reliable: true,
    priority: 18,
    icon: "🌪️",
    buildUrl: (tmdbId, mediaType, season, episode) => {
      const s = season || 1;
      const e = episode || 1;
      return mediaType === "movie"
        ? `https://vidstorm.ru/movie/${tmdbId}?autoplay=true&theme=8b5cf6&download=false`
        : `https://vidstorm.ru/tv/${tmdbId}/${s}/${e}?autoplay=true&autonext=true&theme=8b5cf6&download=false`;
    },
  },
  {
    id: "vidora",
    name: "Vidora",
    description: "Stable - Très Haute Qualité",
    color: "from-purple-500 to-fuchsia-600",
    reliable: true,
    priority: 19,
    icon: "💎",
    buildUrl: (tmdbId, mediaType, season, episode) => {
      const s = season || 1;
      const e = episode || 1;
      return mediaType === "movie"
        ? `https://vidora.su/movie/${tmdbId}?autoplay=true&colour=8b5cf6&backbutton=https://cstream--trte11.replit.app`
        : `https://vidora.su/tv/${tmdbId}/${s}/${e}?autoplay=true&autonextepisode=true&colour=8b5cf6&backbutton=https://cstream--trte11.replit.app`;
    },
  },
  {
    id: "zxcstream",
    name: "ZxcStream",
    description: "Serveur Rapide (Auto-FR)",
    color: "from-teal-500 to-emerald-600",
    reliable: true,
    priority: 20,
    icon: "⚡",
    buildUrl: (tmdbId, mediaType, season, episode) => {
      // Passes 'fr' language code so UI loads in French.
      const s = season || 1;
      const e = episode || 1;
      return mediaType === "movie"
        ? `https://zxcstream.xyz/player/movie/${tmdbId}/fr?autoplay=true&back=true&server=0`
        : `https://zxcstream.xyz/player/tv/${tmdbId}/${s}/${e}/fr?autoplay=true&back=true&server=0`;
    },
  },
  {
    id: "quickwatch",
    name: "QuickWatch",
    description: "Multi-hébergeurs Ultra",
    color: "from-rose-500 to-red-600",
    reliable: true,
    priority: 21,
    icon: "⏱️",
    buildUrl: (tmdbId, mediaType, season, episode) => {
      const s = season || 1;
      const e = episode || 1;
      return mediaType === "movie"
        ? `https://www.quickwatch.co/embed/${tmdbId}`
        : `https://www.quickwatch.co/embed/${tmdbId}/${s}/${e}`;
    },
  },
  {
    id: "vidnest",
    name: "VidNest",
    description: "Multi-serveurs",
    color: "from-green-500 to-emerald-600",
    reliable: true,
    priority: 18,
    icon: "🪺",
    buildUrl: (tmdbId, mediaType, season, episode) => {
      const s = season || 1;
      const e = episode || 1;
      return mediaType === "movie"
        ? `https://vidnest.fun/movie/${tmdbId}`
        : `https://vidnest.fun/tv/${tmdbId}/${s}/${e}`;
    },
  },
  {
    id: "vidrock",
    name: "VidRock",
    description: "Premium 4K",
    color: "from-purple-600 to-indigo-700",
    reliable: true,
    priority: 19,
    icon: "🎸",
    buildUrl: (tmdbId, mediaType, season, episode) => {
      const s = season || 1;
      const e = episode || 1;
      return mediaType === "movie"
        ? `https://vidrock.net/movie/${tmdbId}?autoplay=true&theme=${PRIMARY_COLOR}`
        : `https://vidrock.net/tv/${tmdbId}/${s}/${e}?autoplay=true&autonext=true&theme=${PRIMARY_COLOR}`;
    },
  },
  {
    id: "streamwish",
    name: "StreamWish",
    description: "Ultra-rapide multisource",
    color: "from-blue-500 to-blue-300",
    reliable: true,
    priority: 20,
    icon: "⚙️",
    buildUrl: (tmdbId, mediaType, season, episode) => {
      const s = season || 1;
      const e = episode || 1;
      return mediaType === "movie"
        ? `https://streamwish.to/embed-${tmdbId}-640x360.html`
        : `https://streamwish.to/embed-${tmdbId}-s${s}e${e}-640x360.html`;
    },
  },
  {
    id: "flixhq",
    name: "FlixHQ",
    description: "Premium sans restrictions",
    color: "from-zinc-100 to-white",
    reliable: true,
    priority: 21,
    icon: "✨",
    buildUrl: (tmdbId, mediaType, season, episode) => {
      const s = season || 1;
      const e = episode || 1;
      return mediaType === "movie"
        ? `https://flixhq.to/movie/${tmdbId}`
        : `https://flixhq.to/tv/${tmdbId}/${s}/${e}`;
    },
  },
  {
    id: "soap2day",
    name: "Soap2Day",
    description: "Catalogue complet",
    color: "from-cyan-400 to-blue-400",
    reliable: true,
    priority: 22,
    icon: "🎭",
    buildUrl: (tmdbId, mediaType, season, episode) => {
      const s = season || 1;
      const e = episode || 1;
      return mediaType === "movie"
        ? `https://soap2day.to/movie/${tmdbId}`
        : `https://soap2day.to/tv/${tmdbId}/${s}/${e}`;
    },
  },
  {
    id: "cinebb",
    name: "CineBB",
    description: "Français/International",
    color: "from-blue-700 to-blue-900",
    reliable: true,
    priority: 23,
    icon: "🎬",
    buildUrl: (tmdbId, mediaType, season, episode) => {
      const s = season || 1;
      const e = episode || 1;
      return mediaType === "movie"
        ? `https://cinebb.com/movie/${tmdbId}`
        : `https://cinebb.com/tv/${tmdbId}/${s}/${e}`;
    },
  },
  {
    id: "lookmovie",
    name: "LookMovie",
    description: "Catalogue extensif",
    color: "from-yellow-400 to-orange-500",
    reliable: true,
    priority: 24,
    icon: "🔍",
    buildUrl: (tmdbId, mediaType, season, episode) => {
      const s = season || 1;
      const e = episode || 1;
      return mediaType === "movie"
        ? `https://lookmovie.io/movies/view/${tmdbId}`
        : `https://lookmovie.io/shows/view/${tmdbId}/${s}/${e}`;
    },
  },
  {
    id: "putlockers",
    name: "PutLocker",
    description: "Multisources stable",
    color: "from-green-600 to-emerald-700",
    reliable: true,
    priority: 25,
    icon: "🔐",
    buildUrl: (tmdbId, mediaType, season, episode) => {
      const s = season || 1;
      const e = episode || 1;
      return mediaType === "movie"
        ? `https://putlockers.movie/watch/movie/${tmdbId}`
        : `https://putlockers.movie/watch/tv/${tmdbId}/${s}/${e}`;
    },
  },
  {
    id: "nontongo",
    name: "Nontongo",
    description: "Multi-langues stable",
    color: "from-red-600 to-red-800",
    reliable: true,
    priority: 26,
    icon: "🌏",
    buildUrl: (tmdbId, mediaType, season, episode) => {
      const s = season || 1;
      const e = episode || 1;
      return mediaType === "movie"
        ? `https://www.NontonGo.win/embed/movie/${tmdbId}`
        : `https://www.NontonGo.win/embed/tv/${tmdbId}/${s}/${e}`;
    },
  },
  {
    id: "111movies",
    name: "111Movies",
    description: "HD/4K streaming",
    color: "from-zinc-500 to-zinc-700",
    reliable: true,
    priority: 27,
    icon: "🎞️",
    buildUrl: (tmdbId, mediaType, season, episode) => {
      const s = season || 1;
      const e = episode || 1;
      return mediaType === "movie"
        ? `https://111movies.com/movie/${tmdbId}`
        : `https://111movies.com/tv/${tmdbId}/${s}/${e}`;
    },
  },
  {
    id: "vidsrc2",
    name: "VidSrc CX",
    description: "Alternative VidSrc",
    color: "from-blue-600 to-indigo-700",
    reliable: true,
    priority: 28,
    icon: "📡",
    buildUrl: (tmdbId, mediaType, season, episode) => {
      const s = season || 1;
      const e = episode || 1;
      return mediaType === "movie"
        ? `https://vidsrc.cx/embed/movie/${tmdbId}`
        : `https://vidsrc.cx/embed/tv/${tmdbId}/${s}/${e}`;
    },
  },
  {
    id: "videasy",
    name: "Videasy",
    description: "Lightweight - Episode Selector",
    color: "from-teal-500 to-cyan-600",
    reliable: true,
    priority: 29,
    icon: "🎧",
    buildUrl: (tmdbId, mediaType, season, episode) => {
      const s = season || 1;
      const e = episode || 1;
      return mediaType === "movie"
        ? `https://player.videasy.net/movie/${tmdbId}`
        : `https://player.videasy.net/tv/${tmdbId}/${s}/${e}?episodeSelector=true`;
    },
  },
  {
    id: "xpass",
    name: "XPass",
    description: "Premium Multi-Source",
    color: "from-violet-600 to-purple-700",
    reliable: true,
    priority: 30,
    icon: "🔑",
    buildUrl: (tmdbId, mediaType, season, episode) => {
      const s = season || 1;
      const e = episode || 1;
      // XPass uses a standard embed page
      return mediaType === "movie"
        ? `https://embed.smashystream.com/playere.php?tmdb=${tmdbId}`
        : `https://embed.smashystream.com/playere.php?tmdb=${tmdbId}&season=${s}&episode=${e}`;
    },
  },
  {
    id: "hexa",
    name: "Hexa",
    description: "Encrypted HLS Source",
    color: "from-green-800 to-emerald-900",
    reliable: true,
    priority: 31,
    icon: "🔐",
    buildUrl: (tmdbId, mediaType, season, episode) => {
      const s = season || 1;
      const e = episode || 1;
      return mediaType === "movie"
        ? `https://player.smashy.stream/movie/${tmdbId}?playerList=FMD|SU|D|F|J`
        : `https://player.smashy.stream/tv/${tmdbId}?s=${s}&e=${e}&playerList=FMD|SU|D|F|J`;
    },
  },
  {
    id: "madplay",
    name: "MadPlay",
    description: "HLS - Multiple Languages",
    color: "from-red-700 to-rose-800",
    reliable: true,
    priority: 32,
    icon: "🎭",
    buildUrl: (tmdbId, mediaType, season, episode) => {
      const s = season || 1;
      const e = episode || 1;
      return mediaType === "movie"
        ? `https://madplay.site/embed/movie/${tmdbId}`
        : `https://madplay.site/embed/tv/${tmdbId}/${s}/${e}`;
    },
  },
  {
    id: "yflix",
    name: "YFlix",
    description: "Premium VF/VOSTFR",
    color: "from-yellow-600 to-orange-700",
    reliable: true,
    priority: 33,
    icon: "🌟",
    buildUrl: (tmdbId, mediaType, season, episode) => {
      const s = season || 1;
      const e = episode || 1;
      return mediaType === "movie"
        ? `https://yflix.to/movie/${tmdbId}`
        : `https://yflix.to/tv/${tmdbId}/${s}/${e}`;
    },
  },
  {
    id: "moviebox",
    name: "MovieBox",
    description: "HD Multi-Serveur",
    color: "from-sky-600 to-blue-700",
    reliable: true,
    priority: 34,
    icon: "📦",
    buildUrl: (tmdbId, mediaType, season, episode) => {
      const s = season || 1;
      const e = episode || 1;
      return mediaType === "movie"
        ? `https://moviebox.ng/movies/watch/${tmdbId}`
        : `https://moviebox.ng/tv/watch/${tmdbId}/${s}/${e}`;
    },
  },
];

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
  currentSource: propCurrentSource,
  setCurrentSource: propSetCurrentSource,
  defaultSource,
}: UniversalPlayerProps) => {
  const { language: lang } = useI18n();

  const detectFrench = () => {
    try {
      const isFrLang = typeof navigator !== "undefined" && (navigator.language || (navigator as any).userLanguage)?.toLowerCase().startsWith("fr");
      const isFrTimezone = typeof Intl !== "undefined" && Intl.DateTimeFormat().resolvedOptions().timeZone.includes("Paris");
      return isFrLang || isFrTimezone;
    } catch {
      return false;
    }
  };

  const [internalSource, setInternalSource] = useState<PlayerSource>(() => {
    try {
      if (defaultSource) return defaultSource;
      const preferred = localStorage.getItem("cstream_preferred_player") as PlayerSource;
      if (preferred && SOURCES.find(s => s.id === preferred)) return preferred;

      return detectFrench() ? "frembed" : "vidplus";
    } catch {
      return "vidplus";
    }
  });

  const currentSource = propCurrentSource || internalSource;
  const setCurrentSourceFn = propSetCurrentSource || setInternalSource;

  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [iframeKey, setIframeKey] = useState(0);
  const [autoSwitching, setAutoSwitching] = useState(false);
  const [selectedSubtitle, setSelectedSubtitle] = useState<SubtitleResult | null>(null);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);

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

  const handleSourceChange = useCallback((sourceId: PlayerSource) => {
    setCurrentSourceFn(sourceId);
    if (!propSetCurrentSource) {
      try {
        localStorage.setItem("cstream_preferred_player", sourceId);
      } catch { }
    }
    setIframeKey((prev) => prev + 1);
    setStatus("loading");
    setLoadingProgress(0);
    setSourcesOpen(false);
  }, [setCurrentSourceFn, propSetCurrentSource]);

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
  }, [currentSource, clearTimers, handleSourceChange]);

  useEffect(() => {
    if (!isPlayerReady) return;

    clearTimers();
    setStatus("loading");
    setLoadingProgress(0);

    // Simulate initial loading progress ultra-fast
    const interval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 95) return prev;
        return prev + 25;
      });
    }, 150);
    progressIntervalRef.current = interval;

    // Timeout fallback: if iframe still loading after 3.5s, trigger error/switch
    const timeout = setTimeout(() => {
      setStatus(prev => {
        if (prev === "loading") {
          setTimeout(handleIframeError, 10);
        }
        return prev;
      });
    }, 3500);
    loadTimeoutRef.current = timeout;

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [videoUrl, clearTimers, handleIframeError, isPlayerReady]);

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
  const { antiPubBeta } = useBetaSettings();

  return (
    <div className={cn("flex flex-col w-full gap-4", className)}>
      <div className="flex-1 flex flex-col min-w-0 shadow-2xl rounded-2xl overflow-hidden ring-1 ring-white/10">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative flex items-center justify-between gap-2 p-3 sm:p-4 
            bg-gradient-to-r from-zinc-900/98 via-zinc-900/95 to-zinc-900/98
            backdrop-blur-2xl border-b border-white/10"
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
                  <Server className="w-4 h-4 text-purple-400" />
                  <span className="hidden sm:inline">Sources</span>
                  <ChevronDown className="w-4 h-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 max-h-[300px] overflow-y-auto">
                <DropdownMenuLabel>Sélection de la source</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {SOURCES.map((s) => (
                  <DropdownMenuItem
                    key={s.id}
                    onClick={() => handleSourceChange(s.id)}
                    className={cn(
                      "flex items-center gap-2 cursor-pointer",
                      currentSource === s.id && "bg-purple-500/10 text-purple-400 font-bold"
                    )}
                  >
                    <span className="flex-1">{s.name}</span>
                    {currentSource === s.id && <Check className="w-4 h-4" />}
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
          className="relative w-full aspect-video bg-black rounded-none overflow-hidden"
        >
          <AnimatePresence>
            {!isPlayerReady ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-30 cursor-pointer flex items-center justify-center bg-zinc-900 group"
                onClick={() => setIsPlayerReady(true)}
              >
                {posterPath && (
                  <img
                    src={posterPath.startsWith('http') ? posterPath : `https://image.tmdb.org/t/p/w1280${posterPath}`}
                    alt="Video Poster"
                    className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-40 transition-opacity"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
                <div className="relative z-10 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-purple-600/90 flex items-center justify-center transform group-hover:scale-110 transition-transform shadow-[0_0_30px_rgba(139,92,246,0.5)] backdrop-blur-sm">
                  <Play className="w-8 h-8 sm:w-10 sm:h-10 text-white fill-white ml-1 sm:ml-2" />
                </div>
              </motion.div>
            ) : null}

            {isPlayerReady && autoSwitching && (
              <motion.div
                key="switching"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-zinc-950/90 backdrop-blur-sm pointer-events-none"
              >
                <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4 shadow-[0_0_15px_rgba(168,85,247,0.5)]" />
                <p className="text-white font-medium text-sm animate-pulse">{translations.switching}</p>
                <p className="text-zinc-500 text-xs mt-2 max-w-xs text-center pointer-events-auto">Test de la connexion... Si cela échoue, nous passerons automatiquement à la source suivante.</p>
              </motion.div>
            )}

            {isPlayerReady && status === "error" && (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-zinc-950 p-6 text-center"
              >
                <AlertTriangle className="w-12 h-12 text-red-500 mb-4 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
                <h3 className="text-white font-bold mb-2">{translations.blocked}</h3>
                <p className="text-white/60 text-sm mb-6 max-w-sm">{translations.blockedDesc}</p>
                <Button onClick={switchToNextSource} className="bg-purple-600 hover:bg-purple-700">{translations.nextSource}</Button>
              </motion.div>
            )}
          </AnimatePresence>

          {isPlayerReady && (
            <iframe
              ref={iframeRef}
              key={iframeKey}
              src={videoUrl}
              className="absolute inset-0 w-full h-full border-0 z-10"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
              sandbox={antiPubBeta ? "allow-scripts allow-forms allow-same-origin allow-presentation" : undefined}
              referrerPolicy="no-referrer-when-downgrade"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              loading="lazy"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default UniversalPlayer;
