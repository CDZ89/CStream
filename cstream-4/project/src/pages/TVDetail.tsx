import { useState, useEffect, useCallback, useRef } from "react";
import {
  useParams,
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { tmdbApi } from "@/lib/tmdb";
import { useI18n } from "@/lib/i18n";
import { anilistApi } from "@/lib/anilist";
import { Navbar } from "@/components/Navbar";
import { MediaGrid } from "@/components/MediaGrid";
import { TrailerModal } from "@/components/TrailerModal";
import { UniversalPlayer, SOURCES } from "@/components/UniversalPlayer";
import { SourceSelectorList } from "@/components/SourceSelectorList";
import { cn } from "@/lib/utils";
import { CinemaosPlayer } from "@/components/CinemaosPlayer";
import { CSPlayer } from "@/components/CSPlayer";
import { DualVotingSystem } from "@/components/DualVotingSystem";
import { ImportedSourceSelector } from "@/components/ImportedSourceSelector";
import { RealStreamingProviders } from "@/components/RealStreamingProviders";
import { EndOfEpisodeOverlay } from "@/components/EndOfEpisodeOverlay";
import { SEO } from "@/components/SEO";
import { PosterOverlay } from "@/components/PosterOverlay";
import { ReviewsSection } from "@/components/ReviewsSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Play,
  Star,
  Clock,
  Calendar,
  Heart,
  Bookmark,
  Share2,
  ChevronLeft,
  X,
  Loader2,
  ThumbsUp,
  Eye,
  MessageSquare,
  Send,
  Globe,
  User,
  ChevronDown,
  ExternalLink,
  AlertTriangle,
  RefreshCw,
  RotateCcw,
  Film,
  Image as ImageIcon,
  Layers,
  Download,
  Tv,
  Zap,
  Server
} from "lucide-react";
import { useLocalAndSyncSources } from "@/hooks/useLocalAndSyncSources";
import { ScoreCircle } from "@/components/ScoreCircle";
import { StreamingProvidersModal } from "@/components/StreamingProvidersModal";
import { motion, AnimatePresence } from "framer-motion";
import { parseHTML } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useWatchHistory } from "@/hooks/useWatchHistory";
import { useAuth } from "@/hooks/useAuth";

interface Reader {
  id: string;
  label: string;
  url: string;
  media_type: string;
  language: string;
  tmdb_id?: number | null;
  season_number?: number | null;
  episode_number?: number | null;
  enabled?: boolean | null;
  order_index?: number | null;
}

interface Review {
  id: string;
  user_id: string;
  username: string;
  avatar_url?: string | null;
  comment: string;
  rating: number;
  created_at: string;
  media_id: string;
  is_admin?: boolean;
}

interface TMDBSeason {
  id: number;
  name: string;
  season_number: number;
  episode_count: number;
  air_date?: string;
  poster_path?: string;
  overview?: string;
}

interface TMDBEpisode {
  id: number;
  name: string;
  episode_number: number;
  season_number: number;
  air_date?: string;
  still_path?: string;
  overview?: string;
  vote_average?: number;
  runtime?: number;
}

interface TMDBShow {
  id: number;
  name: string;
  tagline?: string;
  overview?: string;
  poster_path?: string;
  backdrop_path?: string;
  vote_average?: number;
  vote_count?: number;
  first_air_date?: string;
  last_air_date?: string;
  episode_run_time?: number[];
  number_of_seasons?: number;
  number_of_episodes?: number;
  status?: string;
  genres?: Array<{ id: number; name: string }>;
  created_by?: Array<{ id: number; name: string; profile_path?: string }>;
  credits?: {
    crew?: Array<{ job: string; name: string; id: number }>;
    cast?: Array<{
      id: number;
      name: string;
      character: string;
      profile_path?: string;
    }>;
  };
  videos?: {
    results?: Array<{
      key: string;
      type: string;
      site: string;
    }>;
  };
  recommendations?: {
    results?: any[];
  };
  images?: {
    backdrops?: Array<{ file_path: string; width: number; height: number }>;
    posters?: Array<{ file_path: string; width: number; height: number }>;
  };
  seasons?: TMDBSeason[];
  networks?: Array<{
    id: number;
    name: string;
    logo_path?: string;
    origin_country?: string;
  }>;
  production_companies?: Array<{
    id: number;
    name: string;
    logo_path?: string;
    origin_country?: string;
  }>;
  original_language?: string;
  origin_country?: string[];
}

const PROXY_BASE =
  typeof import.meta.env?.VITE_PROXY_BASE === "string"
    ? import.meta.env.VITE_PROXY_BASE
    : "";

const normalizeBaseUrl = (url: string): string => {
  if (!url) return url;
  return url.endsWith("/") ? url.slice(0, -1) : url;
};

const buildFinalUrl = (
  baseUrl: string,
  reader: Reader,
  show: TMDBShow,
  seasonNum?: number,
  episodeNum?: number,
): string => {
  let base = normalizeBaseUrl(baseUrl);
  const lowerBase = base.toLowerCase();

  const hasSeasonPlaceholder =
    lowerBase.includes("{season}") || lowerBase.includes("{saison}");
  const hasEpisodePlaceholder =
    lowerBase.includes("{episode}") ||
    lowerBase.includes("{ep}") ||
    lowerBase.includes("{episodenumber}");

  const season = seasonNum ?? reader?.season_number ?? null;
  const episode = episodeNum ?? reader?.episode_number ?? null;

  if (hasSeasonPlaceholder || hasEpisodePlaceholder) {
    if (season !== null) {
      base = base.replace(/\{season\}/gi, String(season));
      base = base.replace(/\{saison\}/gi, String(season));
    }
    if (episode !== null) {
      base = base.replace(/\{episode\}/gi, String(episode));
      base = base.replace(/\{ep\}/gi, String(episode));
      base = base.replace(/\{episodenumber\}/gi, String(episode));
    }
    return base;
  }

  if (reader?.episode_number !== null && reader?.episode_number !== undefined) {
    return base;
  }

  if (!season && !episode) return base;

  const parts: string[] = [base];
  if (season) parts.push(`season/${season}`);
  if (episode) parts.push(`episode/${episode}`);
  return parts.join("/");
};

const formatDuration = (minutes?: number | number[] | null): string => {
  const mins = Array.isArray(minutes) ? minutes[0] : minutes;
  if (!mins || mins <= 0) return "—";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}min` : `${m}min`;
};

const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) return `Il y a ${minutes}min`;
  if (hours < 24) return `Il y a ${hours}h`;
  if (days < 7) return `Il y a ${days}j`;
  return date.toLocaleDateString("fr-FR");
};

const TVDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language } = useI18n();
  const { history, saveProgress } = useWatchHistory();
  const lastProgressSaveRef = useRef<number>(0);
  const playbackStartTimeRef = useRef<number | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const initialSeasonFromUrl = searchParams.get("season");
  const initialEpisodeFromUrl = searchParams.get("episode");

  const [show, setShow] = useState<TMDBShow | null>(null);
  const [showLogos, setShowLogos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [findingSource, setFindingSource] = useState(false);

  const [isWatching, setIsWatching] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string>("");
  const [videoLoading, setVideoLoading] = useState(true);
  const [iframeError, setIframeError] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [currentSource, setCurrentSource] = useState<Reader | null>(null);

  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [candidates, setCandidates] = useState<Reader[]>([]);
  const [sourcesLoading, setSourcesLoading] = useState(false);
  const [currentImportedSource, setCurrentImportedSource] = useState<any>(null);
  const [sourceLoadError, setSourceLoadError] = useState(false);

  const [playerLoading, setPlayerLoading] = useState(false);
  const [savedProgress, setSavedProgress] = useState<number>(0);
  const [showResumePrompt, setShowResumePrompt] = useState(false);

  const [isFavorite, setIsFavorite] = useState(false);
  const [userLiked, setUserLiked] = useState(false);

  const [trailerOpen, setTrailerOpen] = useState(false);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [newRating, setNewRating] = useState(5);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);

  const [likes, setLikes] = useState(0);
  const [views, setViews] = useState(0);
  const [zoomedPoster, setZoomedPoster] = useState<string | null>(null);

  const [selectedSeason, setSelectedSeason] = useState<number>(
    initialSeasonFromUrl ? parseInt(initialSeasonFromUrl) : 1,
  );
  const [selectedEpisode, setSelectedEpisode] = useState<number>(
    initialEpisodeFromUrl ? parseInt(initialEpisodeFromUrl) : 1,
  );
  const [episodes, setEpisodes] = useState<TMDBEpisode[]>([]);
  const [episodesLoading, setEpisodesLoading] = useState(false);
  const [seasonData, setSeasonData] = useState<any>(null);
  const [episodesCount, setEpisodesCount] = useState<number>(12);
  const [showEndOverlay, setShowEndOverlay] = useState(false);

  const episodesToDisplay = episodes.slice(0, episodesCount);
  const hasMoreEpisodes = episodes.length > episodesCount;

  const handleEpisodeClick = (seasonNum: number, episodeNum: number) => {
    const isAnilist = window.location.pathname.startsWith("/anilist/");
    const mediaType = isAnilist ? "anilist" : "tv";
    const link =
      mediaType === "anilist"
        ? `/player/${id}?type=anilist&episode=${episodeNum}`
        : `/player/${id}?type=tv&season=${seasonNum}&episode=${episodeNum}`;

    if (isWatching) {
      setSelectedEpisode(episodeNum);
      setIframeKey((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      navigate(link);
    }
  };

  const handleShowMoreEpisodes = () => {
    setEpisodesCount((prev) => prev + 12);
    toast.success("Épisodes supplémentaires chargés");
  };

  useEffect(() => {
    const fetchShow = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const tmdbLang = language === "fr" ? "fr-FR" : "en-US";
        const isAnilist = window.location.pathname.startsWith("/anilist/");

        if (isAnilist) {
          const aniData = await anilistApi.getInfo(parseInt(id || "0"));
          if (aniData?.data?.Media) {
            const media = aniData.data.Media;
            const mappedShow: TMDBShow = {
              id: media.id,
              name:
                media.title.english || media.title.romaji || media.title.native,
              overview: media.description,
              poster_path: media.coverImage.large,
              backdrop_path: media.bannerImage || media.coverImage.extraLarge,
              vote_average: media.averageScore / 10,
              vote_count: media.popularity,
              first_air_date: media.startDate?.year
                ? `${media.startDate.year}-${String(media.startDate.month || 1).padStart(2, "0")}-${String(media.startDate.day || 1).padStart(2, "0")}`
                : undefined,
              status: media.status,
              genres: media.genres?.map((g: string, i: number) => ({
                id: i,
                name: g,
              })),
              number_of_seasons: 1,
              number_of_episodes: media.episodes,
              seasons: [
                {
                  id: media.id,
                  name: "Saison 1",
                  season_number: 1,
                  episode_count: media.episodes || 0,
                  poster_path: media.coverImage.large,
                },
              ],
            };
            setShow(mappedShow);
            setLikes(media.popularity / 10);
            setViews(media.popularity);
            if (!initialSeasonFromUrl) setSelectedSeason(1);
            setLoading(false);
            return;
          }
        }

        const data = (await tmdbApi.getTVDetails(
          parseInt(id || "0"),
          tmdbLang,
        )) as TMDBShow;
        setShow(data);

        // Fetch logos separately to handle language-specific logos
        const imageData = await tmdbApi.getMediaImages(
          parseInt(id || "0"),
          "tv",
          tmdbLang,
        );
        if (imageData?.logos) {
          setShowLogos(imageData.logos);
        }

        setLikes(data.vote_count ? data.vote_count * 10 : 156);
        setViews(data.vote_count ? data.vote_count * 100 : 2847);

        if (data.seasons && data.seasons.length > 0) {
          const firstRegularSeason =
            data.seasons.find((s) => s.season_number > 0) || data.seasons[0];
          if (!initialSeasonFromUrl) {
            setSelectedSeason(firstRegularSeason.season_number);
          }
        }
      } catch (err) {
        console.error("Failed to fetch show:", err);
        toast.error("Impossible de charger les détails de la série.");
      } finally {
        setLoading(false);
      }
    };
    fetchShow();
  }, [id, initialSeasonFromUrl, language]);

  useEffect(() => {
    const fetchSeasonEpisodes = async () => {
      if (!id || !selectedSeason) return;
      setEpisodesLoading(true);
      try {
        const isAnilist = window.location.pathname.startsWith("/anilist/");
        if (isAnilist) {
          const aniData = await anilistApi.getInfo(parseInt(id || "0"));
          const media = aniData?.data?.Media;
          if (media) {
            const aniEpisodes = Array.from(
              { length: media.episodes || 0 },
              (_, i) => ({
                id: media.id * 1000 + (i + 1),
                name: `Épisode ${i + 1}`,
                episode_number: i + 1,
                season_number: 1,
                overview: `Regarder l'épisode ${i + 1} de ${media.title.romaji}`,
                still_path: media.coverImage.large,
              }),
            );
            setEpisodes(aniEpisodes as any);
            setEpisodesLoading(false);
            return;
          }
        }
        const data = (await tmdbApi.getTVSeasonDetails(
          parseInt(id),
          selectedSeason,
        )) as any;
        setSeasonData(data);
        setEpisodes((data && data.episodes) || []);
      } catch (err) {
        console.error("Failed to fetch season episodes:", err);
        setEpisodes([]);
      } finally {
        setEpisodesLoading(false);
      }
    };
    fetchSeasonEpisodes();
  }, [id, selectedSeason]);

  // Auto-load sources for selector
  useEffect(() => {
    if (!show?.id) return;
    fetchCandidates(show);
  }, [show?.id]);

  useEffect(() => {
    const fetchReviews = async () => {
      if (!id) return;
      setReviewsLoading(true);
      try {
        const pageUrl = `/tv/${id}`;
        const { data, error } = await supabase
          .from("reviews")
          .select(
            `
            id,
            user_id,
            comment,
            rating,
            created_at
          `,
          )
          .order("created_at", { ascending: false });

        if (error) throw error;

        const reviewsWithUsernames: Review[] = await Promise.all(
          (data || []).map(async (review) => {
            let username = "Utilisateur";
            let avatarUrl = null;
            let isAdmin = false;

            try {
              const { data: profile } = await supabase
                .from("profiles")
                .select("username, avatar_url")
                .eq("id", review.user_id)
                .maybeSingle();

              if (profile) {
                username = profile.username || "Utilisateur";
                avatarUrl = profile.avatar_url;
              }

              const { data: userData } = await supabase
                .from("users")
                .select("is_admin")
                .eq("auth_id", review.user_id)
                .maybeSingle();

              isAdmin = !!userData?.is_admin;
            } catch (e) {
              console.error("Error fetching profile:", e);
            }

            return {
              id: review.id,
              user_id: review.user_id,
              username,
              avatar_url: avatarUrl,
              comment: review.comment,
              rating: review.rating,
              created_at: review.created_at || new Date().toISOString(),
              media_id: pageUrl,
              is_admin: isAdmin,
            };
          }),
        );

        setReviews(reviewsWithUsernames);
      } catch (err) {
        console.error("Failed to fetch reviews:", err);
      } finally {
        setReviewsLoading(false);
      }
    };
    fetchReviews();
  }, [id]);

  useEffect(() => {
    if (!id || !history.length) return;
    const tmdbId = parseInt(id);
    const existingProgress = history.find(
      (h) =>
        h.tmdb_id === tmdbId &&
        (h.media_type === "tv" || h.media_type === "anime"),
    );
    if (
      existingProgress?.progress &&
      existingProgress.progress > 5 &&
      existingProgress.progress < 95
    ) {
      setSavedProgress(existingProgress.progress);
      setShowResumePrompt(true);
      if (existingProgress.season_number)
        setSelectedSeason(existingProgress.season_number);
      if (existingProgress.episode_number)
        setSelectedEpisode(existingProgress.episode_number);
    }
  }, [id, history]);

  // Auto-save progress while watching episodes
  useEffect(() => {
    if (!id || !episodes.length) return;

    playbackStartTimeRef.current = Date.now();

    const isAnilist = window.location.pathname.startsWith("/anilist/");
    const mediaType = isAnilist ? "anilist" : "tv";

    // Save initial progress
    saveProgress(
      parseInt(id),
      mediaType as any,
      selectedSeason,
      selectedEpisode,
      0,
    ).catch((err) => console.error("Save start:", err));

    // Save every 5 seconds
    const avgEpisodeDuration = 45 * 60 * 1000; // 45 minutes in ms

    progressIntervalRef.current = setInterval(() => {
      if (!playbackStartTimeRef.current) return;

      const elapsed = Date.now() - playbackStartTimeRef.current;
      const progressPercent = Math.min(
        (elapsed / avgEpisodeDuration) * 100,
        99,
      );

      saveProgress(
        parseInt(id),
        mediaType as any,
        selectedSeason,
        selectedEpisode,
        Math.round(progressPercent),
      ).catch((err) => console.error("Save interval:", err));
    }, 5000);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }

      if (playbackStartTimeRef.current) {
        const elapsed = Date.now() - playbackStartTimeRef.current;
        const progressPercent = Math.min(
          (elapsed / avgEpisodeDuration) * 100,
          100,
        );
        saveProgress(
          parseInt(id),
          mediaType as any,
          selectedSeason,
          selectedEpisode,
          Math.round(progressPercent),
        ).catch((err) => console.error("Save final:", err));
      }
    };
  }, [id, selectedSeason, selectedEpisode, episodes.length, saveProgress]);

  const handleProgressUpdate = useCallback(
    (progress: number, currentTime: number, duration: number) => {
      if (!id) return;
      const now = Date.now();
      if (now - lastProgressSaveRef.current < 5000) return;
      const isAnilist = window.location.pathname.startsWith("/anilist/");
      const mediaType = isAnilist ? "anilist" : "tv";
      if (progress > 0) {
        lastProgressSaveRef.current = now;
        saveProgress(
          parseInt(id),
          mediaType as any,
          selectedSeason,
          selectedEpisode,
          progress,
        );
      }
    },
    [id, saveProgress, selectedSeason, selectedEpisode],
  );

  const handleVideoEnd = useCallback(() => {
    if (!id) return;
    const isAnilist = window.location.pathname.startsWith("/anilist/");
    const mediaType = isAnilist ? "anilist" : "tv";
    saveProgress(
      parseInt(id),
      mediaType as any,
      selectedSeason,
      selectedEpisode,
      100,
    );
    setShowEndOverlay(true);
  }, [id, saveProgress, selectedSeason, selectedEpisode, setShowEndOverlay]);

  const handleNextEpisode = useCallback(() => {
    if (!episodes.length) return;
    const currentIdx = episodes.findIndex(
      (ep) => ep.episode_number === selectedEpisode,
    );
    if (currentIdx < episodes.length - 1) {
      setSelectedEpisode(episodes[currentIdx + 1].episode_number);
      setShowEndOverlay(false);
      setIframeKey((prev) => prev + 1);
      toast.success(
        `Lecture de l'épisode ${episodes[currentIdx + 1].episode_number}`,
      );
    } else if (show?.seasons) {
      const nextSeason = show.seasons.find(
        (s) => s.season_number === selectedSeason + 1,
      );
      if (nextSeason) {
        setSelectedSeason(nextSeason.season_number);
        setSelectedEpisode(1);
        setShowEndOverlay(false);
        toast.success(`Passage à la saison ${nextSeason.season_number}`);
      } else {
        toast.info("Vous avez terminé la série !");
      }
    }
  }, [episodes, selectedEpisode, selectedSeason, show, setShowEndOverlay]);

  const handlePreviousEpisode = useCallback(() => {
    if (!episodes.length) return;
    const currentIdx = episodes.findIndex(
      (ep) => ep.episode_number === selectedEpisode,
    );
    if (currentIdx > 0) {
      setSelectedEpisode(episodes[currentIdx - 1].episode_number);
      setIframeKey((prev) => prev + 1);
      toast.success(
        `Lecture de l'épisode ${episodes[currentIdx - 1].episode_number}`,
      );
    }
  }, [episodes, selectedEpisode]);

  const hasNextEpisode =
    episodes.length > 0 &&
    (episodes.findIndex((ep) => ep.episode_number === selectedEpisode) <
      episodes.length - 1 ||
      show?.seasons?.some((s) => s.season_number === selectedSeason + 1));

  const hasPreviousEpisode =
    episodes.length > 0 &&
    episodes.findIndex((ep) => ep.episode_number === selectedEpisode) > 0;

  useEffect(() => {
    if (!id) return;

    const loadFavoriteAndLikeStatus = async () => {
      try {
        if (user) {
          const [favResult, likeResult] = await Promise.all([
            supabase
              .from("favorites")
              .select("id")
              .eq("user_id", user.id)
              .eq("media_id", id)
              .eq(
                "media_type",
                window.location.pathname.startsWith("/anilist/")
                  ? "anilist"
                  : "tv",
              )
              .maybeSingle(),
            supabase
              .from("user_likes")
              .select("id")
              .eq("user_id", user.id)
              .eq("media_id", id)
              .eq(
                "media_type",
                window.location.pathname.startsWith("/anilist/")
                  ? "anilist"
                  : "tv",
              )
              .maybeSingle(),
          ]);

          if (!favResult.error) setIsFavorite(!!favResult.data);
          if (!likeResult.error) setUserLiked(!!likeResult.data);
        } else {
          const localFavs = JSON.parse(
            localStorage.getItem("cstream_favorites_v1") || "[]",
          ) as Array<{ id: number; mediaType: string }>;
          setIsFavorite(
            localFavs.some(
              (fav) => fav.id === parseInt(id) && fav.mediaType === "tv",
            ),
          );
          const liked = localStorage.getItem(`liked_tv_${id}`) === "true";
          setUserLiked(liked);
        }
      } catch {
        setIsFavorite(false);
        setUserLiked(false);
      }
    };

    loadFavoriteAndLikeStatus();
  }, [id, user]);

  const toggleFavorite = useCallback(async () => {
    if (!id) return;

    if (user) {
      try {
        const isAnilist = window.location.pathname.startsWith("/anilist/");
        const mediaType = isAnilist ? "anilist" : "tv";
        if (isFavorite) {
          const { error } = await supabase
            .from("favorites")
            .delete()
            .eq("user_id", user.id)
            .eq("media_id", id)
            .eq("media_type", mediaType);

          if (error) throw error;
          setIsFavorite(false);
          toast.success("Retiré des favoris");
        } else {
          const { error } = await supabase.from("favorites").insert({
            user_id: user.id,
            media_id: id,
            media_type: mediaType,
          });

          if (error) throw error;
          setIsFavorite(true);
          toast.success("Ajouté aux favoris");
        }
      } catch (error) {
        console.error("Error toggling favorite:", error);
        toast.error("Impossible de mettre à jour les favoris");
      }
    } else {
      try {
        const isAnilist = window.location.pathname.startsWith("/anilist/");
        const localFavs = JSON.parse(
          localStorage.getItem("cstream_favorites_v1") || "[]",
        ) as Array<{
          id: number;
          mediaType: string;
          title: string;
          posterPath: string | null;
          addedAt: string;
        }>;
        if (isFavorite) {
          const filtered = localFavs.filter(
            (fav) =>
              !(
                fav.id === parseInt(id) &&
                fav.mediaType === (isAnilist ? "anilist" : "tv")
              ),
          );
          localStorage.setItem(
            "cstream_favorites_v1",
            JSON.stringify(filtered),
          );
          setIsFavorite(false);
          toast.success("Retiré des favoris");
        } else {
          localFavs.unshift({
            id: parseInt(id),
            mediaType: isAnilist ? "anilist" : "tv",
            title: show?.name || "",
            posterPath: show?.poster_path || null,
            addedAt: new Date().toISOString(),
          });
          localStorage.setItem(
            "cstream_favorites_v1",
            JSON.stringify(localFavs.slice(0, 100)),
          );
          setIsFavorite(true);
          toast.success("Ajouté aux favoris");
        }
      } catch {
        toast.error("Impossible de mettre à jour les favoris");
      }
    }
  }, [id, user, isFavorite, show]);

  const toggleLike = useCallback(async () => {
    if (!id) return;

    if (user) {
      try {
        const isAnilist = window.location.pathname.startsWith("/anilist/");
        const mediaType = isAnilist ? "anilist" : "tv";
        if (userLiked) {
          const { error } = await supabase
            .from("user_likes")
            .delete()
            .eq("user_id", user.id)
            .eq("media_id", id)
            .eq("media_type", mediaType);

          if (error) throw error;
          setUserLiked(false);
          setLikes((prev) => prev - 1);
          toast.success("Like retiré");
        } else {
          const { error } = await supabase.from("user_likes").upsert(
            {
              user_id: user.id,
              media_id: id,
              media_type: mediaType,
            },
            {
              onConflict: "user_id,media_id,media_type",
              ignoreDuplicates: true,
            },
          );

          if (error) throw error;
          setUserLiked(true);
          setLikes((prev) => prev + 1);
          toast.success("Liked !");
        }
      } catch (error) {
        console.error("Error toggling like:", error);
        toast.error("Erreur lors de la mise à jour du like");
      }
    } else {
      if (userLiked) {
        localStorage.removeItem(`liked_tv_${id}`);
        setUserLiked(false);
        setLikes((prev) => prev - 1);
        toast.success("Like retiré");
      } else {
        localStorage.setItem(`liked_tv_${id}`, "true");
        setUserLiked(true);
        setLikes((prev) => prev + 1);
        toast.success("Liked !");
      }
    }
  }, [id, user, userLiked]);

  const { fetchAllSources } = useLocalAndSyncSources();

  const fetchCandidates = useCallback(
    async (showObj: TMDBShow): Promise<Reader[]> => {
      setSourcesLoading(true);
      try {
        const tmdbIdNum = parseInt(id || "0");
        if (isNaN(tmdbIdNum)) return [];
        const result = (await fetchAllSources("tv", tmdbIdNum)) as any;
        setCandidates(result);
        return result;
      } catch (err) {
        console.error("Error fetching candidates:", err);
        return [];
      } finally {
        setSourcesLoading(false);
      }
    },
    [fetchAllSources],
  );

  const handleChooseAndWatch = useCallback(
    (reader: Reader) => {
      const finalUrl = buildFinalUrl(
        reader.url,
        reader,
        show!,
        selectedSeason,
        selectedEpisode,
      );
      setCurrentVideoUrl(finalUrl);
      setCurrentSource(reader);
      setVideoLoading(true);
      setIsWatching(true);
      setSourcesOpen(false);
      setIframeError(false);
      toast.success(`Lecture via ${reader.label}`);
      setTimeout(() => setVideoLoading(false), 1500);
    },
    [show, selectedSeason, selectedEpisode],
  );

  const handleWatchQuick = useCallback(async () => {
    setFindingSource(true);
    try {
      setIsWatching(true);
      toast.success(`Lecture de S${selectedSeason}E${selectedEpisode}`);
    } catch (err) {
      console.error("Watch error:", err);
      toast.error("Erreur lors du lancement de la lecture");
    } finally {
      setFindingSource(false);
    }
  }, [selectedSeason, selectedEpisode]);

  const handleShare = useCallback(() => {
    const url = window.location.href;
    if (navigator.share) {
      navigator
        .share({
          title: show?.name || "CStream",
          text: `Regarde ${show?.name} sur CStream !`,
          url: url,
        })
        .catch(console.error);
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Lien copié dans le presse-papier !");
    }
  }, [show]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!show) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Série introuvable</h2>
          <Button onClick={() => navigate("/")}>Retour à l'accueil</Button>
        </div>
      </div>
    );
  }

  const creators = show.created_by || [];
  const genres = show.genres || [];
  const castList = show.credits?.cast || [];
  const trailer = show.videos?.results?.find(
    (v) => v.type === "Trailer" && v.site === "YouTube",
  );

  return (
    <div className="min-h-screen bg-background text-foreground pb-20 overflow-x-hidden">
      <SEO
        title={`${show.name} en streaming HD - CStream`}
        description={
          show.overview ||
          `Regardez ${show.name} en streaming HD gratuit sur CStream.`
        }
        image={
          show.poster_path
            ? `https://image.tmdb.org/t/p/w500${show.poster_path}`
            : undefined
        }
        type="video.tv_show"
      />
      <Navbar />

      <AnimatePresence>
        {zoomedPoster && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 md:p-8 cursor-zoom-out"
            onClick={() => setZoomedPoster(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-full max-h-full"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={tmdbApi.getImageUrl(zoomedPoster, "original")}
                alt="Poster zoomé"
                className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] ring-1 ring-white/10"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md text-white z-[110]"
                onClick={() => setZoomedPoster(null)}
              >
                <X className="w-6 h-6" />
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {isWatching ? (
        <main className="container mx-auto px-4 py-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 lg:gap-8">
            <div className="lg:col-span-9 space-y-6">
              {/* Watch Hub - Player & Sources */}
              <div className="bg-[#0a0a0f] border border-white/10 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl ring-1 ring-purple-500/20">
                {/* Premium Header inside player area */}
                <div className="px-4 py-3 sm:px-6 sm:py-4 bg-gradient-to-r from-purple-900/20 to-[#0a0a0f] border-b border-white/5 flex flex-wrap items-center justify-between gap-3 relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsWatching(false)}
                    className="absolute -top-12 left-0 z-20 text-muted-foreground hover:text-white transition-all group-hover:translate-x-[-4px]"
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Retour aux détails
                  </Button>
                  <div className="flex items-center gap-3">
                    <div className="relative flex h-2 sm:h-3 w-2 sm:w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 sm:h-3 w-2 sm:w-3 bg-purple-500"></span>
                    </div>
                    <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-white/90">
                      Console de Visionnage
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded-full">
                      HD 1080P
                    </Badge>
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded-full">
                      SÉCURISÉ
                    </Badge>
                  </div>
                </div>

                {/* Player Container */}
                <div className="relative w-full bg-black aspect-video border-b border-white/5 flex items-center justify-center">
                  {show ? (
                    <UniversalPlayer
                      tmdbId={show.id}
                      mediaType={
                        (window.location.pathname.startsWith("/anilist/")
                          ? "anilist"
                          : "tv") as "tv"
                      }
                      season={selectedSeason}
                      episode={selectedEpisode}
                      title={`${show.name} - S${selectedSeason}E${selectedEpisode}`}
                      posterPath={show.poster_path || undefined}
                      onVideoEnd={handleVideoEnd}
                      onNextEpisode={handleNextEpisode}
                      onPreviousEpisode={handlePreviousEpisode}
                      hasNextEpisode={hasNextEpisode}
                      hasPreviousEpisode={hasPreviousEpisode}
                      onProgressUpdate={handleProgressUpdate}
                      currentSource={currentSource?.id as any}
                      setCurrentSource={(sourceId) => {
                        const src = SOURCES.find((s) => s.id === sourceId);
                        if (src) {
                          setCurrentSource({
                            id: src.id as any,
                            label: src.name,
                            url: '',
                            media_type: 'tv',
                            language: 'FR',
                          });
                        } else {
                          setCurrentSource(undefined as any);
                        }
                      }}
                      className="rounded-none w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-gray-400 text-center">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                      <p className="text-sm">Chargement du lecteur...</p>
                    </div>
                  )}
                </div>

                {/* Hero Actions Bar */}
                <div className="flex border-b border-white/5 bg-zinc-950/80 px-4 py-3 sm:px-6">
                  <Button
                    variant="secondary"
                    onClick={() => setShowDownloadModal(true)}
                    className="h-10 px-4 rounded-xl font-semibold bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 backdrop-blur-md transition-all text-sm w-full sm:w-auto"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Télécharger
                  </Button>
                </div>

                {/* Sources Hub Container */}
                <div className="p-4 sm:p-6 lg:p-8 bg-zinc-950/80 relative overflow-hidden">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-purple-500/10 blur-[60px] pointer-events-none" />

                  <div className="relative z-10 flex flex-col gap-6">
                    <div className="flex items-center justify-between border-b border-white/5 pb-4">
                      <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                        <Server className="w-4 h-4 text-purple-400" />
                        Sélection de Source
                      </h3>
                    </div>

                    <SourceSelectorList
                      currentSource={currentSource?.id as any}
                      onSelect={(sourceId) => {
                        const src = SOURCES.find(s => s.id === sourceId);
                        if (src) {
                          setCurrentSource({
                            id: src.id as any,
                            label: src.name,
                            url: '',
                            media_type: 'tv',
                            language: 'FR',
                          });
                          setIframeKey(prev => prev + 1);
                          toast.success(`Lecture via ${src.name}`);
                        }
                      }}
                    />

                    {/* Actions Row */}
                    <div className="pt-4 flex flex-wrap items-center justify-between gap-4 mt-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setCurrentSource(undefined as any);
                          }}
                          className="text-[10px] sm:text-xs font-bold bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 h-9 sm:h-10 px-4 rounded-xl transition-all"
                        >
                          <AlertTriangle className="w-3 h-3 mr-2 sm:w-3.5 sm:h-3.5 text-yellow-500" />
                          RÉPARER L'AFFICHAGE
                        </Button>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setIframeKey(prev => prev + 1);
                          toast.info('Lecteur rafraîchi');
                        }}
                        className="text-[10px] sm:text-xs font-bold text-white/50 hover:text-white hover:bg-white/5 h-9 sm:h-10 rounded-xl"
                      >
                        <RefreshCw className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-2" />
                        RECHARGER LE FLUX
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-secondary/20 p-6 rounded-2xl border border-white/5 backdrop-blur-sm shadow-xl">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-xl md:text-2xl font-bold truncate tracking-tight">
                      {show.name}
                    </h1>
                    <Badge
                      variant="outline"
                      className="border-primary/30 text-primary bg-primary/5 uppercase text-[10px] tracking-widest font-bold"
                    >
                      S{selectedSeason} E{selectedEpisode}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {episodes.find((e) => e.episode_number === selectedEpisode)
                      ?.name || "Chargement..."}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setSourcesOpen(true)}
                    className="gap-2 rounded-xl bg-white/5 hover:bg-white/10 border-white/10 hover:border-primary/50 transition-all duration-300 group shadow-md"
                  >
                    <Globe className="w-4 h-4 text-primary group-hover:rotate-12 transition-transform" />
                    <span className="hidden sm:inline">Changer de source</span>
                    <span className="sm:hidden text-xs">Sources</span>
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <Tabs defaultValue="episodes" className="w-full">
                    <TabsList className="bg-secondary/30 p-1 rounded-xl mb-6 w-full flex overflow-x-auto sm:overflow-visible no-scrollbar">
                      <TabsTrigger
                        value="episodes"
                        className="flex-1 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-300 py-2.5"
                      >
                        Épisodes
                      </TabsTrigger>
                      <TabsTrigger
                        value="info"
                        className="flex-1 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-300 py-2.5"
                      >
                        Synopsis
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="episodes" className="mt-0">
                      <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Tv className="w-5 h-5 text-primary" />
                            Liste des épisodes
                          </h3>
                          <Select
                            value={String(selectedSeason)}
                            onValueChange={(val) => {
                              setSelectedSeason(parseInt(val));
                              setSelectedEpisode(1);
                              setEpisodesCount(12);
                            }}
                          >
                            <SelectTrigger className="w-full sm:w-[180px] bg-secondary/30 border-white/10 rounded-xl focus:ring-primary/50">
                              <SelectValue placeholder="Saison" />
                            </SelectTrigger>
                            <SelectContent className="bg-secondary border-white/10 text-foreground rounded-xl shadow-2xl">
                              {show.seasons
                                ?.filter((s) => s.season_number > 0)
                                .map((s) => (
                                  <SelectItem
                                    key={s.id}
                                    value={String(s.season_number)}
                                    className="focus:bg-primary/20 hover:bg-primary/10 transition-colors"
                                  >
                                    Saison {s.season_number} ({s.episode_count}{" "}
                                    eps)
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {episodesLoading ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                              <div
                                key={i}
                                className="aspect-video bg-secondary/20 animate-pulse rounded-xl"
                              />
                            ))}
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {episodesToDisplay.map((episode) => (
                              <button
                                key={episode.id}
                                onClick={() =>
                                  handleEpisodeClick(
                                    selectedSeason,
                                    episode.episode_number,
                                  )
                                }
                                className={`group relative aspect-video rounded-xl overflow-hidden border-2 transition-all duration-500 shadow-lg hover:shadow-primary/10 ${selectedEpisode === episode.episode_number
                                  ? "border-primary ring-4 ring-primary/20 scale-[0.98]"
                                  : "border-white/5 hover:border-white/20"
                                  }`}
                              >
                                {episode.still_path ? (
                                  <img
                                    src={tmdbApi.getImageUrl(
                                      episode.still_path,
                                      "w300",
                                    )}
                                    alt={episode.name}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    loading="lazy"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-secondary/50 flex items-center justify-center">
                                    <Tv className="w-8 h-8 text-muted-foreground opacity-20" />
                                  </div>
                                )}
                                <div
                                  className={`absolute inset-0 bg-gradient-to-t transition-opacity duration-500 ${selectedEpisode === episode.episode_number
                                    ? "from-primary/90 via-primary/20 to-transparent"
                                    : "from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-100"
                                    }`}
                                />
                                <div className="absolute bottom-3 left-3 right-3 text-left">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <Badge className="bg-white/20 backdrop-blur-md text-white text-[9px] h-4 px-1.5 uppercase font-black border-none">
                                      EP {episode.episode_number}
                                    </Badge>
                                    {episode.vote_average && (
                                      <span className="text-[10px] text-yellow-400 flex items-center gap-0.5 font-bold drop-shadow-md">
                                        <Star className="w-2.5 h-2.5 fill-current" />
                                        {episode.vote_average.toFixed(1)}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-white text-xs font-bold line-clamp-1 group-hover:text-primary transition-colors">
                                    {episode.name}
                                  </p>
                                </div>
                                {selectedEpisode === episode.episode_number && (
                                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-2xl animate-pulse">
                                      <Play className="w-5 h-5 text-white fill-white ml-1" />
                                    </div>
                                  </div>
                                )}
                              </button>
                            ))}
                          </div>
                        )}

                        {hasMoreEpisodes && (
                          <div className="flex justify-center py-6">
                            <Button
                              variant="outline"
                              onClick={handleShowMoreEpisodes}
                              className="px-8 rounded-xl bg-secondary/30 border-white/10 hover:bg-primary hover:border-primary transition-all duration-300"
                            >
                              Charger plus d'épisodes
                            </Button>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="info" className="mt-0">
                      <div className="bg-secondary/20 p-8 rounded-2xl border border-white/5 backdrop-blur-sm shadow-xl">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                          <Tv className="w-5 h-5 text-primary" />
                          Synopsis de l'épisode {selectedEpisode}
                        </h3>
                        <p className="text-muted-foreground leading-relaxed italic text-lg line-clamp-[10]">
                          {episodes.find(
                            (e) => e.episode_number === selectedEpisode,
                          )?.overview ||
                            "Aucun synopsis disponible pour cet épisode."}
                        </p>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>

                <div className="space-y-6">
                  <div className="bg-secondary/20 p-6 rounded-2xl border border-white/5 backdrop-blur-sm shadow-xl">
                    <h3 className="text-lg font-semibold mb-4">Interactions</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <Button
                        variant="outline"
                        className={`w-full gap-2 rounded-xl h-12 transition-all duration-300 ${userLiked ? "bg-primary/10 border-primary text-primary shadow-lg shadow-primary/10" : "hover:border-primary/50"}`}
                        onClick={toggleLike}
                      >
                        <ThumbsUp
                          className={`w-5 h-5 ${userLiked ? "fill-current" : ""}`}
                        />
                        <span>{likes} Likes</span>
                      </Button>
                      <Button
                        variant="outline"
                        className={`w-full gap-2 rounded-xl h-12 transition-all duration-300 ${isFavorite ? "bg-primary/10 border-primary text-primary shadow-lg shadow-primary/10" : "hover:border-primary/50"}`}
                        onClick={toggleFavorite}
                      >
                        <Bookmark
                          className={`w-5 h-5 ${isFavorite ? "fill-current" : ""}`}
                        />
                        <span>Watchlist</span>
                      </Button>
                    </div>
                  </div>

                  <Card className="bg-secondary/20 border-white/10 shadow-2xl backdrop-blur-sm rounded-2xl overflow-hidden">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-500" />
                        Conseils
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-muted-foreground space-y-2">
                      <p>
                        • Si le lecteur ne fonctionne pas, essayez un autre
                        onglet (Cinemaos ou CSPlayer)
                      </p>
                      <p>
                        • Utilisez le sélecteur d'épisodes pour naviguer
                        rapidement
                      </p>
                      <p>• Le lecteur principal offre 31 sources différentes</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>

            <aside className="lg:col-span-3 space-y-6">
              <div className="sticky top-24 space-y-6">
                <Card className="bg-secondary/20 border-white/10 shadow-2xl backdrop-blur-sm rounded-2xl overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Tv className="w-5 h-5 text-primary" />
                      Prochainement
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {episodes
                      .filter((e) => e.episode_number > selectedEpisode)
                      .slice(0, 3)
                      .map((ep) => (
                        <div
                          key={ep.id}
                          className="flex gap-3 group cursor-pointer hover:bg-white/5 p-2 rounded-xl transition-all"
                          onClick={() => {
                            setSelectedEpisode(ep.episode_number);
                            setIframeKey((prev) => prev + 1);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                        >
                          <div className="w-24 aspect-video rounded-lg overflow-hidden bg-secondary/50 flex-shrink-0 relative">
                            {ep.still_path ? (
                              <img
                                src={tmdbApi.getImageUrl(ep.still_path, "w200")}
                                alt={ep.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Tv className="w-4 h-4 text-muted-foreground opacity-20" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <Play className="w-6 h-6 text-white fill-white scale-75" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-primary mb-0.5">
                              Épisode {ep.episode_number}
                            </p>
                            <p className="text-xs text-white font-medium line-clamp-1 group-hover:text-primary transition-colors">
                              {ep.name}
                            </p>
                          </div>
                        </div>
                      ))}
                    {episodes.filter((e) => e.episode_number > selectedEpisode)
                      .length === 0 && (
                        <p className="text-xs text-muted-foreground italic text-center py-4">
                          Dernier épisode de la saison atteint
                        </p>
                      )}
                  </CardContent>
                </Card>

                <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 text-center space-y-3">
                  <p className="text-sm font-bold text-primary">
                    Soutenir CStream
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Ton aide nous permet de maintenir nos lecteurs et de garder
                    le site 100% gratuit.
                  </p>
                  <Button
                    variant="outline"
                    className="w-full rounded-xl border-primary/30 hover:bg-primary hover:text-white transition-all text-xs h-10"
                    onClick={() =>
                      window.open("https://paypal.me/CDZ68", "_blank")
                    }
                  >
                    Faire un don
                  </Button>
                </div>
              </div>
            </aside>
          </div>
        </main>
      ) : (
        <>
          <section className="relative min-h-[70vh] overflow-hidden">
            <div className="absolute inset-0 bg-[#050508]" />
            {show.backdrop_path && (
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: `url(${tmdbApi.getImageUrl(show.backdrop_path, "original")})`,
                  filter: "blur(25px) brightness(0.4)",
                  transform: "scale(1.2)",
                }}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#050508] via-[#050508]/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#050508]/40 via-transparent to-transparent" />

            <div className="relative container mx-auto px-4 py-8">
              <Link
                to="/tv"
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Retour aux séries
              </Link>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="lg:col-span-2 flex justify-center lg:justify-start"
                >
                  <div className="relative group max-w-[200px] lg:max-w-[180px]">
                    {show.vote_average && show.vote_average > 0 && (
                      <div className="absolute -top-2 -left-2 z-10 scale-90">
                        <ScoreCircle score={show.vote_average} size="sm" />
                      </div>
                    )}

                    <div
                      className="w-full aspect-[2/3] overflow-hidden rounded-xl shadow-2xl cursor-zoom-in transition-transform duration-300 hover:scale-105 bg-black"
                      onClick={() => setZoomedPoster(show.poster_path || null)}
                    >
                      <img
                        src={
                          show.poster_path?.startsWith("http")
                            ? show.poster_path
                            : tmdbApi.getImageUrl(
                              show.poster_path || "",
                              "w500",
                            )
                        }
                        className="w-full h-full object-cover opacity-100"
                        alt={show.name}
                        onError={(e) =>
                        (e.currentTarget.src =
                          "https://via.placeholder.com/500x750?text=No+Poster")
                        }
                      />
                    </div>

                    <div className="mt-3 text-center">
                      <h2 className="text-sm font-semibold text-white tracking-wide leading-tight line-clamp-2">
                        {show.name}
                      </h2>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="lg:col-span-7 space-y-4"
                >
                  {/* Titre principal ou Logo TMDB */}
                  {showLogos && showLogos.length > 0 ? (
                    (() => {
                      const langCode = language.split("-")[0];
                      const logo =
                        showLogos.find((l) => l.iso_639_1 === langCode) ||
                        showLogos.find((l) => l.iso_639_1 === "en") ||
                        showLogos[0];

                      return logo ? (
                        <div className="relative mb-6 h-32 md:h-48 flex items-center justify-center md:justify-start">
                          <motion.img
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            src={tmdbApi.getLogoUrl(logo.file_path, "w500")!}
                            alt={show.name}
                            className="max-w-[80%] max-h-full object-contain filter drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)]"
                          />
                        </div>
                      ) : (
                        <h1
                          className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight mb-6"
                          style={{ textShadow: "2px 2px 24px rgba(0,0,0,0.8)" }}
                        >
                          {show.name}
                        </h1>
                      );
                    })()
                  ) : (
                    <h1
                      className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight mb-6"
                      style={{ textShadow: "2px 2px 24px rgba(0,0,0,0.8)" }}
                    >
                      {show.name}
                    </h1>
                  )}

                  {show.networks && show.networks.length > 0 && (
                    <div className="flex items-center gap-3">
                      {show.networks[0].logo_path ? (
                        <div className="bg-white/10 backdrop-blur rounded-lg px-3 py-2">
                          <img
                            src={tmdbApi.getImageUrl(
                              show.networks[0].logo_path,
                              "w200",
                            )}
                            alt={show.networks[0].name}
                            className="h-6 w-auto object-contain invert opacity-80"
                            loading="lazy"
                          />
                        </div>
                      ) : (
                        <div className="bg-white/10 backdrop-blur rounded-lg px-3 py-2">
                          <span className="text-sm font-medium text-white/70">
                            {show.networks[0].name}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    {show.first_air_date && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {new Date(show.first_air_date).toLocaleDateString(
                            "fr-FR",
                            {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            },
                          )}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Tv className="w-4 h-4" />
                      <span>
                        {show.number_of_seasons} saisons •{" "}
                        {show.number_of_episodes} épisodes
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {show.genres?.map((genre) => (
                      <Link key={genre.id} to={`/tv?genre=${genre.id}`}>
                        <Badge
                          variant="outline"
                          className="border-white/30 hover:bg-white/10 hover:border-white/50 transition-all cursor-pointer px-4 py-1"
                        >
                          {genre.name}
                        </Badge>
                      </Link>
                    ))}
                  </div>

                  {creators.length > 0 && (
                    <div className="flex items-center gap-3 py-2">
                      <div className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center overflow-hidden ring-2 ring-primary/30">
                        {creators[0].profile_path ? (
                          <img
                            src={tmdbApi.getImageUrl(
                              creators[0].profile_path,
                              "w200",
                            )}
                            alt={creators[0].name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                          Créateur
                        </p>
                        <p className="text-sm font-medium">
                          {creators[0].name}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-3 pt-4">
                    <div className="flex items-center gap-3 flex-wrap">
                      <Select
                        value={String(selectedSeason)}
                        onValueChange={(val) => {
                          const seasonNum = parseInt(val);
                          setSelectedSeason(seasonNum);
                          setSelectedEpisode(1);
                          setEpisodesCount(12);
                          // Enregistrer la progression lors du changement de saison
                          if (id)
                            saveProgress(parseInt(id), "tv", seasonNum, 1, 0);
                        }}
                      >
                        <SelectTrigger className="w-[180px] bg-secondary/30 border-white/10 rounded-full h-12 focus:ring-primary/50">
                          <SelectValue placeholder="Saison" />
                        </SelectTrigger>
                        <SelectContent className="bg-secondary border-white/10 text-foreground rounded-xl shadow-2xl">
                          {show.seasons
                            ?.filter((s) => s.season_number > 0)
                            .map((s) => (
                              <SelectItem
                                key={s.id}
                                value={String(s.season_number)}
                                className="focus:bg-primary/20 hover:bg-primary/10 transition-colors"
                              >
                                S{s.season_number} ({s.episode_count} eps)
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>

                      <Select
                        value={String(selectedEpisode)}
                        onValueChange={(val) =>
                          setSelectedEpisode(parseInt(val))
                        }
                      >
                        <SelectTrigger className="w-[180px] bg-secondary/30 border-white/10 rounded-full h-12 focus:ring-primary/50">
                          <SelectValue placeholder="Épisode" />
                        </SelectTrigger>
                        <SelectContent className="bg-secondary border-white/10 text-foreground rounded-xl shadow-2xl max-h-[300px]">
                          {episodes.map((ep) => (
                            <SelectItem
                              key={ep.id}
                              value={String(ep.episode_number)}
                              className="focus:bg-primary/20 hover:bg-primary/10 transition-colors"
                            >
                              Ep {ep.episode_number}: {ep.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      size="lg"
                      onClick={handleWatchQuick}
                      className="gap-2 bg-primary hover:bg-primary/90 text-white font-bold h-12 rounded-full px-8 shadow-lg shadow-primary/20 group overflow-hidden relative"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                      {findingSource ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Play className="w-5 h-5 fill-current" />
                          Regarder
                        </>
                      )}
                    </Button>
                    {trailer && (
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={() => setTrailerOpen(true)}
                        className="gap-2 rounded-full border-primary/50 text-primary hover:bg-primary/10 hover:border-primary h-12 px-8 shadow-lg shadow-primary/5"
                      >
                        <Film className="w-5 h-5" />
                        Trailer
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleFavorite}
                      className={`gap-2 rounded-full border-white/20 hover:border-white/40 ${isFavorite ? "bg-primary/20 border-primary/50" : ""}`}
                    >
                      <Bookmark
                        className={`w-4 h-4 ${isFavorite ? "fill-current" : ""}`}
                      />
                      Watchlist
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleShare}
                      className="gap-2 rounded-full border-white/20 hover:border-white/40"
                    >
                      <Share2 className="w-4 h-4" />
                      Share
                    </Button>
                  </div>

                  <div className="pt-3">
                    <h3 className="text-base font-semibold mb-2 text-white/90">
                      Synopsis
                    </h3>
                    <p className="text-muted-foreground leading-relaxed text-sm line-clamp-6">
                      {parseHTML(show.overview)}
                    </p>
                  </div>
                </motion.div>

                <motion.aside
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="lg:col-span-3 hidden lg:block"
                >
                  <div className="sticky top-24 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Casts & Credits</h3>
                    </div>

                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
                      {castList.slice(0, 6).map((actor) => (
                        <Link
                          key={actor.id}
                          to={`/person/${actor.id}`}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors group"
                        >
                          <div className="w-12 h-12 rounded-full overflow-hidden bg-secondary/50 flex-shrink-0 ring-2 ring-transparent group-hover:ring-primary/50 transition-all">
                            {actor.profile_path ? (
                              <img
                                src={tmdbApi.getImageUrl(
                                  actor.profile_path,
                                  "w200",
                                )}
                                alt={actor.name}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <User className="w-5 h-5 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-white group-hover:text-primary transition-colors truncate">
                              {actor.name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {actor.character}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>

                    {castList.length > 6 && (
                      <button
                        onClick={() => {
                          const castSection =
                            document.getElementById("cast-section");
                          castSection?.scrollIntoView({ behavior: "smooth" });
                        }}
                        className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
                      >
                        Show All
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    )}

                    <div className="pt-4 border-t border-white/10 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-2">
                          <ThumbsUp className="w-4 h-4" /> Likes
                        </span>
                        <span className="font-medium">
                          {likes.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-2">
                          <Eye className="w-4 h-4" /> Views
                        </span>
                        <span className="font-medium">
                          {views.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-2">
                          <MessageSquare className="w-4 h-4" /> Reviews
                        </span>
                        <span className="font-medium">{reviews.length}</span>
                      </div>
                    </div>
                  </div>
                </motion.aside>
              </div>
            </div>
          </section>

          {castList.length > 0 && (
            <section id="cast-section" className="py-12">
              <div className="container mx-auto px-4">
                <h2 className="text-2xl font-bold mb-6">Distribution</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                  {castList.map((person) => (
                    <Link
                      key={person.id}
                      to={`/person/${person.id}`}
                      className="group"
                    >
                      <div className="aspect-[2/3] rounded-lg overflow-hidden bg-secondary mb-2">
                        {person.profile_path ? (
                          <img
                            src={tmdbApi.getImageUrl(
                              person.profile_path,
                              "w300",
                            )}
                            alt={person.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            <User className="w-8 h-8" />
                          </div>
                        )}
                      </div>
                      <p className="font-medium text-sm group-hover:text-primary transition-colors">
                        {person.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {person.character}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          )}

          {show.production_companies &&
            show.production_companies.length > 0 && (
              <section className="py-12 bg-secondary/20">
                <div className="container mx-auto px-4">
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <Layers className="w-6 h-6" />
                    Production
                  </h2>
                  <div className="flex flex-wrap gap-6">
                    {show.production_companies.map((company) => (
                      <div
                        key={company.id}
                        className="flex items-center gap-3 bg-secondary/50 rounded-lg p-4"
                      >
                        {company.logo_path ? (
                          <img
                            src={tmdbApi.getImageUrl(company.logo_path, "w200")}
                            alt={company.name}
                            className="h-8 w-auto object-contain bg-white rounded p-1"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                            <Film className="w-5 h-5 text-muted-foreground" />
                          </div>
                        )}
                        <span className="text-sm font-medium">
                          {company.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

          {/* Image Gallery */}
          {show.images &&
            ((show.images.backdrops && show.images.backdrops.length > 0) ||
              (show.images.posters && show.images.posters.length > 0)) && (
              <section className="py-12">
                <div className="container mx-auto px-4">
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <ImageIcon className="w-6 h-6" />
                    Galerie
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {show.images.backdrops?.slice(0, 4).map((img, index) => (
                      <div
                        key={`backdrop-${index}`}
                        className="aspect-video rounded-xl overflow-hidden border border-white/10 shadow-lg bg-secondary/30"
                      >
                        <PosterOverlay
                          posterPath={img.file_path}
                          title={`Backdrop ${index + 1}`}
                          mediaType="tv"
                        />
                      </div>
                    ))}
                    {show.images.posters?.slice(0, 4).map((img, index) => (
                      <div
                        key={`poster-${index}`}
                        className="aspect-[2/3] rounded-xl overflow-hidden border border-white/10 shadow-lg max-w-[200px] mx-auto bg-secondary/30"
                      >
                        <PosterOverlay
                          posterPath={img.file_path}
                          title={`Poster ${index + 1}`}
                          mediaType="tv"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

          {show.seasons &&
            show.seasons.filter((s) => s.season_number > 0).length > 0 && (
              <section className="py-12">
                <div className="container mx-auto px-4">
                  <h2 className="text-2xl font-bold mb-6">Saisons</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {show.seasons
                      .filter((s) => s.season_number > 0)
                      .map((season) => (
                        <button
                          key={season.id}
                          onClick={() => {
                            setSelectedSeason(season.season_number);
                            setSelectedEpisode(1);
                            handleWatchQuick();
                          }}
                          className={`group text-left ${season.season_number === selectedSeason
                            ? "ring-2 ring-primary rounded-lg"
                            : ""
                            }`}
                        >
                          <div className="aspect-[2/3] rounded-lg overflow-hidden bg-secondary mb-2">
                            {season.poster_path ? (
                              <img
                                src={tmdbApi.getImageUrl(
                                  season.poster_path,
                                  "w300",
                                )}
                                alt={season.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                <Tv className="w-8 h-8" />
                              </div>
                            )}
                          </div>
                          <p className="font-medium text-sm group-hover:text-primary transition-colors">
                            {season.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {season.episode_count} épisodes
                          </p>
                        </button>
                      ))}
                  </div>
                </div>
              </section>
            )}

          {show.recommendations?.results &&
            show.recommendations.results.length > 0 && (
              <section className="py-12 bg-secondary/30">
                <div className="container mx-auto px-4">
                  <h2 className="text-2xl font-bold mb-6">Recommandations</h2>
                  <MediaGrid
                    items={show.recommendations.results.slice(0, 12)}
                    mediaType="tv"
                  />
                </div>
              </section>
            )}

          {/* Section Reviews */}
          <section id="reviews" className="py-12 relative z-10">
            <div className="container mx-auto px-4">
              <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
                <MessageSquare className="w-6 h-6 text-primary" />
                Avis Utilisateurs
              </h2>
              <ReviewsSection mediaType="tv" mediaId={id!} />
            </div>
          </section>

          <Dialog open={sourcesOpen} onOpenChange={setSourcesOpen}>
            <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh] flex flex-col p-0">
              <DialogHeader className="p-4 sm:p-6 pb-2 sm:pb-4 border-b border-border/50 flex-shrink-0">
                <div className="flex items-center justify-between gap-2">
                  <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Globe className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                    <span className="truncate">
                      Sources disponibles - S{selectedSeason}E{selectedEpisode}
                    </span>
                  </DialogTitle>
                </div>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto p-4 sm:p-6 pt-2 sm:pt-4">
                {sourcesLoading ? (
                  <div className="p-8 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-primary" />
                    <p className="text-muted-foreground">
                      Recherche des sources...
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Vérification des lecteurs compatibles avec cette série
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2 pb-3 border-b border-border/50">
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                        Lecteurs universels
                      </p>
                      <button
                        onClick={() => {
                          setSourcesOpen(false);
                          setIsWatching(true);
                          setVideoLoading(true);
                          toast.success(
                            "Lecture lancée - Lecteur universel (11 sources)",
                          );
                          setTimeout(() => setVideoLoading(false), 1000);
                        }}
                        className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-lg bg-gradient-to-r from-purple-500/10 to-green-500/10 hover:from-purple-500/20 hover:to-green-500/20 border border-purple-500/30 transition-all text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-green-500 flex items-center justify-center flex-shrink-0">
                            <Play className="w-5 h-5 text-white fill-white" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-white">
                              Lecteur Universel
                            </p>
                            <p className="text-xs text-muted-foreground">
                              31 sources - VidFast, VidKing, SuperEmbed...
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className="border-primary/50 text-primary flex-shrink-0"
                        >
                          Recommandé
                        </Badge>
                      </button>
                    </div>

                    {candidates.length > 0 && (
                      <>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                          Autres sources ({candidates.length})
                        </p>
                        <div className="grid gap-3">
                          {candidates.map((r, index) => (
                            <motion.div
                              key={r.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border rounded-lg p-3 sm:p-4 hover:bg-secondary/50 transition-colors"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                  <span className="font-semibold text-sm sm:text-base">
                                    {r.label}
                                  </span>
                                  <Badge variant="outline" className="text-xs">
                                    {r.language}
                                  </Badge>
                                  {(r as any).source_type === "local" ? (
                                    <Badge className="text-xs bg-yellow-500/20 text-yellow-600 border border-yellow-500/30">
                                      <Zap className="w-3 h-3 mr-1" /> LOCAL
                                    </Badge>
                                  ) : (
                                    <Badge className="text-xs bg-blue-500/20 text-blue-600 border border-blue-500/30">
                                      Synchronisée
                                    </Badge>
                                  )}
                                  {r.tmdb_id === show.id && (
                                    <Badge
                                      variant="default"
                                      className="text-xs"
                                    >
                                      Spécifique
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground truncate">
                                  {r.url}
                                </div>
                              </div>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleChooseAndWatch(r)}
                                className="gap-2 w-full sm:w-auto min-h-[44px]"
                              >
                                <Play className="w-4 h-4" />
                                Regarder
                              </Button>
                            </motion.div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="sticky bottom-0 p-4 sm:p-6 pt-3 border-t border-border/50 bg-background flex-shrink-0">
                <Button
                  variant="outline"
                  onClick={() => setSourcesOpen(false)}
                  className="w-full min-h-[44px]"
                  aria-label="Fermer"
                >
                  <X className="w-4 h-4 mr-2" />
                  Fermer
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <TrailerModal
            open={trailerOpen}
            onOpenChange={setTrailerOpen}
            trailerKey={trailer?.key || null}
            title={`${show.name} - Bande-annonce`}
          />
        </>
      )}

      {showEndOverlay && (
        <EndOfEpisodeOverlay
          isVisible={showEndOverlay}
          tvId={show?.id || null}
          currentSeason={selectedSeason}
          currentEpisode={selectedEpisode}
          nextSeason={hasNextEpisode ? selectedSeason : null}
          nextEpisode={hasNextEpisode ? selectedEpisode + 1 : null}
          showTitle={show?.name || "Episode"}
          autoPlayDelay={15}
          onWatchNext={handleNextEpisode}
          onReplay={() => {
            setIframeKey((prev) => prev + 1);
            setShowEndOverlay(false);
          }}
          onChangeSource={() => setSourcesOpen(true)}
          onDismiss={() => setShowEndOverlay(false)}
        />
      )}

      <MediaDownloadModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        mediaItem={show}
        mediaType="tv"
      />
    </div>
  );
};

export default TVDetail;
