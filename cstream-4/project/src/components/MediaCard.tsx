import { Link } from "react-router-dom";
import { Star, Play, ImageOff, Heart, Bookmark } from "lucide-react";
import { useState, useEffect, useCallback, memo, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface MediaCardProps {
  id: number;
  title: string;
  posterPath: string | null;
  voteAverage?: number;
  releaseDate?: string;
  mediaType: "movie" | "tv" | "person";
  trendingRank?: number;
  isNew?: boolean;
  isHot?: boolean;
  popularity?: number;
  isLoading?: boolean;
}

const STORAGE_KEY = "cstream_favorites_v1";
const MAX_LOCAL_FAVORITES = 100;

const MediaCardSkeleton = memo(() => (
  <div className="animate-pulse">
    <div className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 shadow-2xl">
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/[0.07] via-transparent to-transparent animate-pulse" />
    </div>
    <div className="mt-2.5 space-y-2 px-0.5">
      <div
        className="h-3.5 bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-800 rounded-lg w-4/5 animate-pulse"
        style={{ animationDelay: "150ms" }}
      />
      <div
        className="h-2.5 bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-800 rounded-md w-2/5 animate-pulse"
        style={{ animationDelay: "300ms" }}
      />
    </div>
  </div>
));
MediaCardSkeleton.displayName = "MediaCardSkeleton";

export const MediaCard = memo(
  ({
    id,
    title,
    posterPath,
    voteAverage,
    releaseDate,
    mediaType,
    trendingRank,
    isNew,
    isHot,
    isLoading = false,
  }: MediaCardProps) => {
    const { user } = useAuth();
    const [imageError, setImageError] = useState(false);
    const [isFavorite, setIsFavorite] = useState(false);
    const [isInWatchlist, setIsInWatchlist] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);

    useEffect(() => {
      setImageError(false);
      setImageLoaded(false);
    }, [posterPath]);

    const isPerson = mediaType === "person";
    const linkPath = (mediaType as string) === "anilist" ? `/anilist/${id}` : (isPerson ? `/person/${id}` : (mediaType === "tv" ? `/tv/${id}` : `/movie/${id}`));
    const year = useMemo(() => releaseDate?.split("-")[0] || "", [releaseDate]);
    const rating =
      voteAverage && voteAverage > 0 ? voteAverage.toFixed(1) : null;

    const getLocalFavorites = useCallback(() => {
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      } catch {
        return [];
      }
    }, []);

    const setLocalFavorites = useCallback((favorites: any[]) => {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(favorites.slice(0, MAX_LOCAL_FAVORITES)),
        );
      } catch { }
    }, []);

    useEffect(() => {
      if (isPerson) return;

      let mounted = true;
      const controller = new AbortController();

      const checkStatus = async () => {
        try {
          if (user) {
            const [favResult, watchlistResult] = await Promise.all([
              supabase
                .from("favorites")
                .select("id")
                .eq("user_id", user.id)
                .eq("media_id", String(id))
                .eq("media_type", mediaType)
                .abortSignal(controller.signal)
                .maybeSingle(),
              supabase
                .from("watchlist")
                .select("id")
                .eq("user_id", user.id)
                .eq("tmdb_id", id)
                .eq("media_type", mediaType)
                .abortSignal(controller.signal)
                .maybeSingle(),
            ]);
            if (!mounted) return;
            if (!favResult.error) setIsFavorite(!!favResult.data);
            if (!watchlistResult.error)
              setIsInWatchlist(!!watchlistResult.data);
          } else {
            const localFavs = getLocalFavorites();
            if (mounted) {
              setIsFavorite(
                localFavs.some(
                  (f: any) => f.id === id && f.mediaType === mediaType,
                ),
              );
            }
          }
        } catch { }
      };

      const timeout = setTimeout(checkStatus, 50);
      return () => {
        mounted = false;
        controller.abort();
        clearTimeout(timeout);
      };
    }, [user, user?.id, id, mediaType, isPerson, getLocalFavorites]);

    const toggleFavorite = useCallback(
      async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const prev = isFavorite;
        setIsFavorite(!prev);

        try {
          if (user) {
            if (prev) {
              await supabase
                .from("favorites")
                .delete()
                .eq("user_id", user.id)
                .eq("media_id", String(id))
                .eq("media_type", mediaType);
              toast.success("Retiré des favoris");
            } else {
              await supabase.from("favorites").insert({
                user_id: user.id,
                media_id: String(id),
                media_type: mediaType,
              });
              toast.success("Ajouté aux favoris");
            }
          } else {
            const localFavs = getLocalFavorites();
            if (prev) {
              setLocalFavorites(
                localFavs.filter(
                  (f: any) => !(f.id === id && f.mediaType === mediaType),
                ),
              );
              toast.success("Retiré des favoris");
            } else {
              localFavs.unshift({
                id,
                mediaType,
                title,
                posterPath,
                addedAt: new Date().toISOString(),
              });
              setLocalFavorites(localFavs);
              toast.success("Ajouté aux favoris");
            }
          }
        } catch {
          setIsFavorite(prev);
          toast.error("Erreur");
        }
      },
      [
        user,
        id,
        mediaType,
        isFavorite,
        title,
        posterPath,
        getLocalFavorites,
        setLocalFavorites,
      ],
    );

    const toggleWatchlist = useCallback(
      async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!user) {
          toast.error("Connectez-vous pour utiliser cette fonctionnalité");
          return;
        }

        const prev = isInWatchlist;
        setIsInWatchlist(!prev);

        try {
          if (prev) {
            await supabase
              .from("watchlist")
              .delete()
              .eq("user_id", user.id)
              .eq("tmdb_id", id)
              .eq("media_type", mediaType);
            toast.success("Retiré de la liste");
          } else {
            await supabase.from("watchlist").insert({
              user_id: user.id,
              tmdb_id: id,
              media_type: mediaType,
            });
            toast.success("Ajouté à la liste");
          }
        } catch {
          setIsInWatchlist(prev);
          toast.error("Erreur");
        }
      },
      [user, id, mediaType, isInWatchlist],
    );

    if (isLoading) return <MediaCardSkeleton />;

    const imageUrl =
      posterPath && typeof posterPath === "string" && posterPath.startsWith("/")
        ? `https://image.tmdb.org/t/p/w500${posterPath}`
        : null;
    const hasValidImage = Boolean(imageUrl && !imageError);

    return (
      <Link
        to={linkPath}
        className="group block outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-2xl touch-manipulation transition-all duration-300 ease-out hover:scale-[1.03] active:scale-[0.97]"
        aria-label={title}
      >
        <div className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 shadow-2xl ring-1 ring-white/5 group-hover:ring-primary/20 transition-all duration-300">
          {!imageLoaded && hasValidImage && (
            <div className="absolute inset-0 z-10">
              <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 animate-pulse" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent" />
            </div>
          )}

          {hasValidImage && imageUrl ? (
            <>
              <img
                src={imageUrl}
                alt={title}
                onError={() => setImageError(true)}
                onLoad={() => setImageLoaded(true)}
                className={cn(
                  "absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-out",
                  "group-hover:scale-105",
                  imageLoaded ? "opacity-100" : "opacity-0",
                )}
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-50 group-hover:opacity-70 transition-opacity duration-500" />
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-orange-500/10 blur-3xl animate-pulse" />
                <ImageOff
                  className="relative w-10 h-10 sm:w-14 sm:h-14 md:w-12 md:h-12 text-zinc-700 mb-2"
                  strokeWidth={1.5}
                />
              </div>
              <span className="text-[10px] sm:text-xs md:text-[11px] text-zinc-600 text-center px-3 line-clamp-2 font-medium max-w-[90%]">
                {title}
              </span>
            </div>
          )}

          <div
            className={cn(
              "absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent",
              "opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out backdrop-blur-[1px]",
            )}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className={cn(
                  "relative w-12 h-12 sm:w-16 sm:h-16 md:w-14 md:h-14 rounded-full flex items-center justify-center",
                  "transform scale-0 group-hover:scale-100 transition-all duration-500 ease-out",
                  "before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-br before:from-amber-400 before:via-orange-500 before:to-rose-500",
                  "after:absolute after:inset-0 after:rounded-full after:bg-gradient-to-br after:from-amber-400 after:via-orange-500 after:to-rose-500 after:blur-2xl after:opacity-60 after:animate-pulse",
                )}
              >
                <div className="relative z-10 w-full h-full rounded-full bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 flex items-center justify-center shadow-2xl ring-2 ring-white/20">
                  <Play
                    className="w-5 h-5 sm:w-7 sm:h-7 md:w-6 md:h-6 text-white fill-white ml-0.5"
                    strokeWidth={0}
                  />
                </div>
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 md:p-3.5 bg-gradient-to-t from-black via-black/80 to-transparent">
              <h3 className="font-bold text-white text-xs sm:text-sm md:text-xs leading-tight line-clamp-2 mb-1.5 sm:mb-2 drop-shadow-2xl tracking-tight">
                {title}
              </h3>
              <div className="flex items-center gap-2 sm:gap-2.5 text-[10px] sm:text-xs md:text-[11px]">
                {mediaType === "movie" && (
                  <div className="flex items-center gap-1 text-amber-400/90 font-medium">
                    <svg
                      className="w-3 h-3 sm:w-3.5 sm:h-3.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm12.553 1.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                    </svg>
                    <span>Film</span>
                  </div>
                )}
                {mediaType === "tv" && (
                  <div className="flex items-center gap-1 text-sky-400/90 font-medium">
                    <svg
                      className="w-3 h-3 sm:w-3.5 sm:h-3.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414zM11 12a1 1 0 100 2h3a1 1 0 100-2h-3z" />
                    </svg>
                    <span>Série</span>
                  </div>
                )}
                {year && (
                  <span className="text-white/80 font-semibold">{year}</span>
                )}
              </div>
            </div>

            {!isPerson && (
              <div className="absolute top-2 right-2 sm:top-3 sm:right-3 md:top-2.5 md:right-2.5 flex gap-1.5 sm:gap-2">
                <button
                  onClick={toggleFavorite}
                  className={cn(
                    "group/btn relative w-8 h-8 sm:w-10 sm:h-10 md:w-9 md:h-9 rounded-full flex items-center justify-center transition-all duration-300",
                    "backdrop-blur-xl shadow-2xl ring-1",
                    "before:absolute before:inset-0 before:rounded-full before:transition-all before:duration-300",
                    "hover:scale-110 active:scale-95",
                    isFavorite
                      ? "before:bg-gradient-to-br before:from-rose-500 before:to-pink-600 ring-rose-500/50"
                      : "before:bg-white/10 ring-white/10 hover:before:bg-gradient-to-br hover:before:from-rose-500 hover:before:to-pink-600 hover:ring-rose-500/50",
                  )}
                  aria-label={
                    isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"
                  }
                >
                  <Heart
                    className={cn(
                      "relative z-10 w-4 h-4 sm:w-5 sm:h-5 md:w-4.5 md:h-4.5 transition-all duration-300",
                      isFavorite ? "fill-white text-white" : "text-white",
                    )}
                    strokeWidth={2}
                  />
                  {isFavorite && (
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 blur-lg opacity-50 animate-pulse" />
                  )}
                </button>
                <button
                  onClick={toggleWatchlist}
                  className={cn(
                    "group/btn relative w-8 h-8 sm:w-10 sm:h-10 md:w-9 md:h-9 rounded-full flex items-center justify-center transition-all duration-300",
                    "backdrop-blur-xl shadow-2xl ring-1",
                    "before:absolute before:inset-0 before:rounded-full before:transition-all before:duration-300",
                    "hover:scale-110 active:scale-95",
                    isInWatchlist
                      ? "before:bg-gradient-to-br before:from-amber-500 before:to-orange-600 ring-amber-500/50"
                      : "before:bg-white/10 ring-white/10 hover:before:bg-gradient-to-br hover:before:from-amber-500 hover:before:to-orange-600 hover:ring-amber-500/50",
                  )}
                  aria-label={
                    isInWatchlist ? "Retirer de la liste" : "Ajouter à la liste"
                  }
                >
                  <Bookmark
                    className={cn(
                      "relative z-10 w-4 h-4 sm:w-5 sm:h-5 md:w-4.5 md:h-4.5 transition-all duration-300",
                      isInWatchlist ? "fill-white text-white" : "text-white",
                    )}
                    strokeWidth={2}
                  />
                  {isInWatchlist && (
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 blur-lg opacity-50 animate-pulse" />
                  )}
                </button>
              </div>
            )}
          </div>

          {(rating || trendingRank || isNew || isHot) && (
            <div className="absolute top-2 left-2 sm:top-3 sm:left-3 md:top-2.5 md:left-2.5 flex flex-col gap-1.5 z-20">
              {rating && (
                <div className="relative group/badge">
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg blur-sm opacity-60 group-hover/badge:opacity-100 transition-opacity" />
                  <div className="relative px-2 py-1 sm:px-2.5 sm:py-1.5 md:px-2 md:py-1 bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 backdrop-blur-sm rounded-lg flex items-center gap-1 shadow-2xl ring-1 ring-white/20">
                    <Star
                      className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-2.5 md:h-2.5 text-white fill-white"
                      strokeWidth={0}
                    />
                    <span className="text-[10px] sm:text-xs md:text-[10px] font-bold text-white tracking-tight">
                      {rating}
                    </span>
                  </div>
                </div>
              )}
              {trendingRank && (
                <div className="relative group/badge">
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-purple-600 rounded-lg blur-sm opacity-60 group-hover/badge:opacity-100 transition-opacity" />
                  <div className="relative px-2 py-1 sm:px-2.5 sm:py-1.5 md:px-2 md:py-1 bg-gradient-to-r from-violet-500 via-purple-500 to-purple-600 backdrop-blur-sm rounded-lg shadow-2xl ring-1 ring-white/20">
                    <span className="text-[10px] sm:text-xs md:text-[10px] font-bold text-white tracking-tight">
                      #{trendingRank}
                    </span>
                  </div>
                </div>
              )}
              {isHot && (
                <div className="relative group/badge">
                  <div className="absolute inset-0 bg-gradient-to-r from-rose-500 to-orange-500 rounded-lg blur-sm opacity-60 group-hover/badge:opacity-100 transition-opacity animate-pulse" />
                  <div className="relative px-2 py-1 sm:px-2.5 sm:py-1.5 md:px-2 md:py-1 bg-gradient-to-r from-rose-500 via-orange-500 to-orange-600 backdrop-blur-sm rounded-lg shadow-2xl ring-1 ring-white/20">
                    <span className="text-[9px] sm:text-[10px] md:text-[9px] font-black text-white uppercase tracking-wide">
                      🔥 HOT
                    </span>
                  </div>
                </div>
              )}
              {isNew && (
                <div className="relative group/badge">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg blur-sm opacity-60 group-hover/badge:opacity-100 transition-opacity" />
                  <div className="relative px-2 py-1 sm:px-2.5 sm:py-1.5 md:px-2 md:py-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-teal-600 backdrop-blur-sm rounded-lg shadow-2xl ring-1 ring-white/20">
                    <span className="text-[9px] sm:text-[10px] md:text-[9px] font-black text-white uppercase tracking-wide">
                      ⭐ NEW
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-2.5 px-0.5">
          <h3 className="font-bold text-xs sm:text-sm md:text-xs text-white line-clamp-1 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-amber-300 group-hover:via-orange-400 group-hover:to-rose-400 transition-all duration-500 tracking-tight leading-tight">
            {title}
          </h3>
          {year && (
            <p className="text-[10px] sm:text-xs md:text-[11px] text-zinc-500 mt-1 font-semibold">
              {year}
            </p>
          )}
        </div>
      </Link>
    );
  },
);

MediaCard.displayName = "MediaCard";
