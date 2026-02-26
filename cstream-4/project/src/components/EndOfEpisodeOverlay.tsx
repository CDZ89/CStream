import { useState, useEffect, useCallback } from 'react';
import { tmdbApi } from '@/lib/tmdb';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  RotateCcw, 
  Monitor, 
  Star, 
  Clock, 
  ChevronRight,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface NextEpisodeInfo {
  id: number;
  name: string;
  overview: string;
  episode_number: number;
  season_number: number;
  still_path: string | null;
  vote_average: number;
  runtime: number | null;
  air_date: string | null;
}

interface EndOfEpisodeOverlayProps {
  isVisible: boolean;
  tvId: number | null;
  currentSeason: number;
  currentEpisode: number;
  nextSeason: number | null;
  nextEpisode: number | null;
  showTitle: string;
  autoPlayDelay?: number;
  timeBeforeEnd?: number;
  onWatchNext: () => void;
  onReplay: () => void;
  onChangeSource: () => void;
  onDismiss: () => void;
}

export function EndOfEpisodeOverlay({
  isVisible,
  tvId,
  currentSeason,
  currentEpisode,
  nextSeason,
  nextEpisode,
  showTitle,
  autoPlayDelay = 15,
  timeBeforeEnd = 120,
  onWatchNext,
  onReplay,
  onChangeSource,
  onDismiss,
}: EndOfEpisodeOverlayProps) {
  const [nextEpisodeInfo, setNextEpisodeInfo] = useState<NextEpisodeInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(autoPlayDelay);
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(true);

  const hasNextEpisode = nextSeason !== null && nextEpisode !== null;

  useEffect(() => {
    const fetchNextEpisode = async () => {
      if (!isVisible || !tvId || !hasNextEpisode) return;
      
      setLoading(true);
      try {
        const episodeData = await tmdbApi.getTVEpisodeDetails(
          tvId,
          nextSeason!,
          nextEpisode!
        ) as NextEpisodeInfo;
        setNextEpisodeInfo(episodeData);
      } catch (error) {
        console.error('Failed to fetch next episode info:', error);
        setNextEpisodeInfo(null);
      } finally {
        setLoading(false);
      }
    };

    fetchNextEpisode();
  }, [isVisible, tvId, nextSeason, nextEpisode, hasNextEpisode]);

  useEffect(() => {
    if (!isVisible) {
      setCountdown(autoPlayDelay);
      setAutoPlayEnabled(true);
      return;
    }

    if (!hasNextEpisode || !autoPlayEnabled) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onWatchNext();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isVisible, hasNextEpisode, autoPlayEnabled, autoPlayDelay, onWatchNext]);

  const handleCancelAutoPlay = useCallback(() => {
    setAutoPlayEnabled(false);
    setCountdown(0);
  }, []);

  const formatRuntime = (minutes: number | null): string => {
    if (!minutes) return '';
    return `${minutes} min`;
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/90 flex items-center justify-center z-50"
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={onDismiss}
          className="absolute top-4 right-4 text-white/70 hover:text-white hover:bg-white/10"
        >
          <X className="w-6 h-6" />
        </Button>

        <div className="max-w-2xl w-full mx-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <p className="text-white/60 text-sm mb-2">
              S{currentSeason}E{currentEpisode} terminé
            </p>
            <h2 className="text-white text-2xl font-bold mb-6">{showTitle}</h2>

            {hasNextEpisode ? (
              <div className="space-y-6">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  </div>
                ) : nextEpisodeInfo ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white/10 rounded-xl p-4 backdrop-blur-sm"
                  >
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-40 aspect-video rounded-lg overflow-hidden bg-white/5">
                        {nextEpisodeInfo.still_path ? (
                          <img
                            src={tmdbApi.getImageUrl(nextEpisodeInfo.still_path, 'w300')}
                            alt={nextEpisodeInfo.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Play className="w-8 h-8 text-white/40" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary" className="text-xs">
                            S{nextSeason}E{nextEpisode}
                          </Badge>
                          {nextEpisodeInfo.vote_average > 0 && (
                            <div className="flex items-center gap-1 text-yellow-400 text-xs">
                              <Star className="w-3 h-3 fill-current" />
                              <span>{nextEpisodeInfo.vote_average.toFixed(1)}</span>
                            </div>
                          )}
                          {nextEpisodeInfo.runtime && (
                            <div className="flex items-center gap-1 text-white/60 text-xs">
                              <Clock className="w-3 h-3" />
                              <span>{formatRuntime(nextEpisodeInfo.runtime)}</span>
                            </div>
                          )}
                        </div>
                        <h3 className="text-white font-semibold mb-2 line-clamp-1">
                          {nextEpisodeInfo.name}
                        </h3>
                        <p className="text-white/60 text-sm line-clamp-2">
                          {nextEpisodeInfo.overview || 'Aucune description disponible'}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="py-4">
                    <p className="text-white/60">
                      Episode suivant : S{nextSeason}E{nextEpisode}
                    </p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Button
                    size="lg"
                    onClick={onWatchNext}
                    className="gap-2 min-w-[200px] bg-primary hover:bg-primary/90"
                  >
                    <Play className="w-5 h-5 fill-current" />
                    {autoPlayEnabled && countdown > 0 ? (
                      <span>Lecture dans {countdown}s</span>
                    ) : (
                      <span>Episode suivant</span>
                    )}
                    <ChevronRight className="w-4 h-4" />
                  </Button>

                  {autoPlayEnabled && countdown > 0 && (
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={handleCancelAutoPlay}
                      className="border-white/30 text-white hover:bg-white/10"
                    >
                      Annuler
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-6">
                <p className="text-white/60 text-lg mb-4">
                  Vous avez terminé tous les épisodes disponibles
                </p>
              </div>
            )}

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex items-center justify-center gap-4 mt-6 pt-6 border-t border-white/10"
            >
              <Button
                variant="ghost"
                onClick={onReplay}
                className="gap-2 text-white/70 hover:text-white hover:bg-white/10"
              >
                <RotateCcw className="w-4 h-4" />
                Revoir
              </Button>
              <Button
                variant="ghost"
                onClick={onChangeSource}
                className="gap-2 text-white/70 hover:text-white hover:bg-white/10"
              >
                <Monitor className="w-4 h-4" />
                Changer de source
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
