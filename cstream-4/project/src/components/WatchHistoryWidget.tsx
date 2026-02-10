import { useState, useEffect, memo, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useWatchHistory, WatchHistoryItem } from "@/hooks/useWatchHistory";
import { tmdbApi } from "@/lib/tmdb";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { History, Play, ChevronRight, Film, Tv, Clock, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface EnrichedItem extends WatchHistoryItem {
  enrichedTitle?: string;
  enrichedPoster?: string;
}

const tmdbCache = new Map<
  string,
  { title?: string; poster?: string; timestamp: number }
>();
const CACHE_DURATION = 1000 * 60 * 30;

const cleanCache = () => {
  const now = Date.now();
  for (const [key, value] of tmdbCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      tmdbCache.delete(key);
    }
  }
};

const HistoryCard = memo(
  ({
    item,
    onRemove,
  }: {
    item: EnrichedItem;
    onRemove?: (id: string) => void;
  }) => {
    const navigate = useNavigate();
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);

    const posterUrl = useMemo(() => {
      const path = item.enrichedPoster || item.poster_path;
      return path ? tmdbApi.getImageUrl(path, "w300") : null;
    }, [item.enrichedPoster, item.poster_path]);

    const title = item.enrichedTitle || item.title || "Titre inconnu";
    const progress = Math.min(item.progress || 0, 100);
    const isTV = item.media_type === "tv";
    
    // Format the time display (e.g., 27:12) if we had that info, 
    // but we can at least show a better progress indicator
    const progressText = progress >= 95 ? "Terminé" : `${Math.round(progress)}%`;

    const formatTimestamp = (progressPercent: number) => {
      // Show actual progress percentage as the primary indicator
      return `${Math.round(progressPercent)}%`;
    };

    const link = isTV
      ? `/tv/${item.tmdb_id}${item.season_number ? `?season=${item.season_number}&episode=${item.episode_number || 1}` : ""}`
      : `/movie/${item.tmdb_id}`;

    const handleCardClick = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        navigate(link);
      },
      [navigate, link],
    );

    const handleRemoveClick = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (onRemove) onRemove(item.id);
      },
      [onRemove, item.id],
    );

    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, x: -100 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="relative group flex-shrink-0 w-[110px] sm:w-[130px] md:w-[120px]"
      >
        <div onClick={handleCardClick} className="block cursor-pointer">
          <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 ring-1 ring-white/5 shadow-2xl group-hover:ring-primary/20 transition-all duration-500">
            {posterUrl && !imageError ? (
              <>
                {!imageLoaded && (
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-900/20 via-fuchsia-900/10 to-purple-900/20 animate-pulse">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent" />
                  </div>
                )}
                <img
                  src={posterUrl}
                  alt={title}
                  className={cn(
                    "w-full h-full object-cover transition-all duration-700",
                    imageLoaded
                      ? "opacity-100 scale-100"
                      : "opacity-0 scale-105",
                    "group-hover:scale-110",
                  )}
                  loading="lazy"
                  onLoad={() => setImageLoaded(true)}
                  onError={() => setImageError(true)}
                />
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 blur-3xl animate-pulse" />
                  {isTV ? (
                    <svg
                      className="relative w-10 h-10 sm:w-12 sm:h-12 text-zinc-700"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414zM11 12a1 1 0 100 2h3a1 1 0 100-2h-3z" />
                    </svg>
                  ) : (
                    <svg
                      className="relative w-10 h-10 sm:w-12 sm:h-12 text-zinc-700"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm12.553 1.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                    </svg>
                  )}
                </div>
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-40 group-hover:opacity-70 transition-opacity duration-500" />

            <div
              className={cn(
                "absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent",
                "opacity-0 group-hover:opacity-100 transition-all duration-500",
              )}
            >
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                initial={{ scale: 0 }}
                whileHover={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-500 via-fuchsia-500 to-purple-600 animate-pulse" />
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-500 via-fuchsia-500 to-purple-600 blur-xl opacity-60" />
                  <div className="relative z-10 w-full h-full rounded-full bg-gradient-to-br from-violet-500 via-fuchsia-500 to-purple-600 flex items-center justify-center shadow-2xl ring-2 ring-white/30">
                    <Play
                      className="w-5 h-5 sm:w-6 sm:h-6 text-white fill-white ml-0.5"
                      strokeWidth={0}
                    />
                  </div>
                </div>
              </motion.div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/60 backdrop-blur-sm">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-purple-600 relative overflow-hidden shadow-lg shadow-violet-500/50"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
              </motion.div>
            </div>

            {isTV && item.season_number && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="absolute top-2 left-2 px-2 py-1 rounded-lg bg-gradient-to-r from-violet-500/95 via-fuchsia-500/95 to-purple-600/95 backdrop-blur-sm text-[10px] sm:text-[11px] font-black text-white shadow-xl ring-1 ring-white/20"
              >
                S{item.season_number}E{item.episode_number || 1}
              </motion.div>
            )}

            {progress > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 400 }}
                className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/90 backdrop-blur-xl text-[10px] sm:text-[11px] font-bold text-white/95 flex items-center gap-1 shadow-lg ring-1 ring-white/10"
              >
                <Clock className="w-3 h-3 text-violet-400" strokeWidth={2.5} />
                {progressText}
              </motion.div>
            )}
          </div>

          <div className="mt-2.5 px-0.5">
            <h4 className="text-xs sm:text-sm font-bold truncate text-white leading-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-violet-300 group-hover:via-fuchsia-300 group-hover:to-purple-300 transition-all duration-500">
              {title}
            </h4>
            {isTV && item.season_number && (
              <p className="text-[10px] sm:text-xs text-zinc-500 truncate mt-1 font-semibold">
                Saison {item.season_number} · Ép. {item.episode_number || 1}
              </p>
            )}
          </div>
        </div>

        {onRemove && (
          <motion.button
            onClick={handleRemoveClick}
            initial={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.15, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            className="absolute -top-1.5 -right-1.5 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-xl shadow-red-500/40 ring-2 ring-white/30 backdrop-blur-sm z-10"
          >
            <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" strokeWidth={2.5} />
          </motion.button>
        )}
      </motion.div>
    );
  },
);

const SkeletonCard = memo(() => (
  <div className="flex-shrink-0 w-[110px] sm:w-[130px] md:w-[120px]">
    <div className="aspect-[2/3] rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 animate-pulse" />
    <div className="h-3.5 w-4/5 mt-2.5 rounded-lg bg-gradient-to-r from-zinc-800 to-zinc-700 animate-pulse" />
    <div className="h-2.5 w-3/5 mt-1.5 rounded-md bg-gradient-to-r from-zinc-800 to-zinc-700 animate-pulse" />
  </div>
));

const WatchHistoryWidget = memo(() => {
  const { user } = useAuth();
  const { history, loading, fetchHistory, removeFromHistory } =
    useWatchHistory();
  const [enrichedHistory, setEnrichedHistory] = useState<EnrichedItem[]>([]);
  const [enriching, setEnriching] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetchHistory();
    cleanCache();
  }, [fetchHistory]);

  const enrichItems = useCallback(async () => {
    if (!history.length) {
      setEnrichedHistory([]);
      return;
    }

    setEnriching(true);

    const itemsToProcess = history.slice(0, 12);
    const enriched: EnrichedItem[] = [];
    const itemsNeedingFetch: { item: WatchHistoryItem; index: number }[] = [];

    itemsToProcess.forEach((item, index) => {
      if (item.title && item.poster_path) {
        enriched[index] = item as EnrichedItem;
      } else {
        const cacheKey = `${item.media_type}-${item.tmdb_id}`;
        const cached = tmdbCache.get(cacheKey);
        const now = Date.now();

        if (cached && now - cached.timestamp < CACHE_DURATION) {
          enriched[index] = {
            ...item,
            enrichedTitle: cached.title || item.title,
            enrichedPoster: cached.poster || item.poster_path,
          } as EnrichedItem;
        } else {
          itemsNeedingFetch.push({ item, index });
        }
      }
    });

    if (itemsNeedingFetch.length > 0) {
      const batchSize = 5;
      for (let i = 0; i < itemsNeedingFetch.length; i += batchSize) {
        const batch = itemsNeedingFetch.slice(i, i + batchSize);
        await Promise.all(
          batch.map(async ({ item, index }) => {
            try {
              const cacheKey = `${item.media_type}-${item.tmdb_id}`;
              const isTV = item.media_type === "tv";
              const details: any = isTV
                ? await tmdbApi.getTVDetails(item.tmdb_id)
                : await tmdbApi.getMovieDetails(item.tmdb_id);

              const enrichedData = {
                title: details?.title || details?.name,
                poster: details?.poster_path,
                timestamp: Date.now(),
              };
              tmdbCache.set(cacheKey, enrichedData);

              enriched[index] = {
                ...item,
                enrichedTitle: enrichedData.title || item.title,
                enrichedPoster: enrichedData.poster || item.poster_path,
              } as EnrichedItem;
            } catch {
              enriched[index] = item as EnrichedItem;
            }
          }),
        );
      }
    }

    setEnrichedHistory(enriched.filter(Boolean));
    setEnriching(false);
  }, [history]);

  useEffect(() => {
    enrichItems();
  }, [enrichItems]);

  const handleRemove = useCallback(
    async (id: string) => {
      await removeFromHistory(id);
    },
    [removeFromHistory],
  );

  const handleDismiss = useCallback(() => {
    setDismissed(true);
  }, []);

  const isLoading = loading || enriching;

  if (isLoading) {
    return (
      <section className="py-6 sm:py-8 relative z-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-3 mb-5 px-4 sm:px-6 py-4 rounded-2xl bg-gradient-to-r from-violet-500/5 via-transparent to-fuchsia-500/5 border border-white/10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/40 via-fuchsia-500/30 to-purple-500/40 flex items-center justify-center shadow-lg shadow-violet-500/20 animate-pulse">
              <History className="w-5 h-5 text-violet-300" />
            </div>
            <div className="space-y-1.5">
              <div className="h-4 w-40 bg-gradient-to-r from-zinc-800 to-zinc-700 rounded animate-pulse" />
              <div className="h-3 w-32 bg-gradient-to-r from-zinc-800 to-zinc-700 rounded animate-pulse" />
            </div>
          </div>
          <div className="flex gap-6 overflow-hidden px-4 sm:px-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!enrichedHistory.length) {
    return (
      <section className="py-8 sm:py-12 relative z-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-3 mb-6 px-4 sm:px-6 py-4 rounded-2xl bg-gradient-to-r from-violet-500/5 via-transparent to-fuchsia-500/5 border border-white/10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/40 via-fuchsia-500/30 to-purple-500/40 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <History className="w-5 h-5 text-violet-300" />
            </div>
            <h3 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-300 via-fuchsia-300 to-purple-300">
              Reprendre la lecture
            </h3>
          </div>
          <div className="text-center py-16 px-6 rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 backdrop-blur-sm">
            <div className="relative inline-block mb-4">
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 blur-3xl animate-pulse" />
              <History
                className="relative w-16 h-16 text-zinc-700"
                strokeWidth={1.5}
              />
            </div>
            <p className="text-zinc-500 text-sm font-medium max-w-md mx-auto leading-relaxed">
              Commencez à regarder des films ou séries pour voir votre
              historique
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (dismissed) {
    return null;
  }

  return (
    <motion.section
      className="py-6 sm:py-8 relative z-20"
      initial={{ opacity: 0, y: -30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -30, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
    >
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
          className="flex items-center justify-between mb-5 px-4 sm:px-6 py-4 rounded-2xl bg-gradient-to-r from-violet-500/5 via-fuchsia-500/3 to-purple-500/5 border border-white/5 backdrop-blur-sm shadow-xl shadow-black/20"
        >
          <div className="flex items-center gap-3 sm:gap-4">
            <motion.div
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-violet-500/50 via-fuchsia-500/40 to-purple-600/50 flex items-center justify-center shadow-xl shadow-violet-500/30 ring-2 ring-white/20"
              whileHover={{ scale: 1.15, rotate: -8 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
            >
              <History
                className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-white"
                strokeWidth={2.5}
              />
            </motion.div>
            <div>
              <h3 className="text-base sm:text-lg font-black bg-clip-text text-transparent bg-gradient-to-r from-violet-200 via-fuchsia-200 to-purple-200 tracking-tight">
                Reprendre la lecture
              </h3>
              <p className="text-[10px] sm:text-xs text-zinc-500 mt-0.5 font-semibold">
                Continuez où vous avez laissé
              </p>
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 400 }}
              className="hidden sm:flex ml-2 px-3 py-1 rounded-full bg-gradient-to-r from-violet-500/40 to-fuchsia-500/40 text-xs font-black text-violet-200 ring-1 ring-violet-400/50 shadow-lg shadow-violet-500/20"
            >
              {enrichedHistory.length}
            </motion.div>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/historique">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-violet-300 hover:text-violet-200 hover:bg-violet-500/20 h-9 px-3 sm:px-4 text-xs font-bold group rounded-xl transition-all border border-violet-500/30 hover:border-violet-400/50 shadow-lg"
              >
                <span className="hidden sm:inline">Tout voir</span>
                <ChevronRight
                  className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                  strokeWidth={2.5}
                />
              </Button>
            </Link>
            <motion.button
              onClick={handleDismiss}
              whileHover={{ scale: 1.15, rotate: 90 }}
              whileTap={{ scale: 0.85 }}
              className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-red-500/20 text-zinc-500 hover:text-red-400 transition-all ring-1 ring-white/5 hover:ring-red-500/30"
              title="Masquer"
            >
              <X className="w-4 h-4" strokeWidth={2.5} />
            </motion.button>
          </div>
        </motion.div>

        <ScrollArea className="w-full rounded-xl">
          <motion.div
            className="flex gap-5 sm:gap-6 pb-6 px-4 sm:px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
          >
            <AnimatePresence mode="popLayout">
              {enrichedHistory.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    delay: index * 0.04,
                    type: "spring",
                    stiffness: 300,
                  }}
                >
                  <HistoryCard
                    item={item}
                    onRemove={user ? handleRemove : undefined}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
          <ScrollBar orientation="horizontal" className="h-2" />
        </ScrollArea>
      </div>
    </motion.section>
  );
});

WatchHistoryWidget.displayName = "WatchHistoryWidget";
HistoryCard.displayName = "HistoryCard";

export { WatchHistoryWidget };
