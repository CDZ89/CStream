import { MediaCard } from './MediaCard';
import { TMDBMovie, TMDBTV, TMDBPerson } from '@/lib/tmdb';
import { Film, Tv, User, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useSettingsStore, DisplayDensity } from '@/hooks/useUserSettings';
import { memo, useMemo, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface MediaGridProps {
  items: (TMDBMovie | TMDBTV | TMDBPerson)[];
  mediaType?: 'movie' | 'tv' | 'person';
  emptyMessage?: string;
  showTitle?: boolean;
  title?: string;
  icon?: React.ReactNode;
  showTrendingBadges?: boolean;
  variant?: 'default' | 'compact' | 'spacious';
}

const getGridClasses = (density: DisplayDensity): string => {
  switch (density) {
    case 'compact':
      return 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-9 gap-1.5 sm:gap-2 md:gap-2.5 lg:gap-3';
    case 'spacious':
      return 'grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5 lg:gap-6';
    default:
      return 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2.5 sm:gap-3 md:gap-4 lg:gap-4';
  }
};

export const MediaGrid = memo(({
  items,
  mediaType,
  emptyMessage = 'Aucun élément trouvé.',
  showTitle = false,
  title,
  icon,
  showTrendingBadges = false,
  variant
}: MediaGridProps) => {
  const settingsDensity = useSettingsStore((state) => state.displayDensity) || 'normal';
  const displayDensity = (variant || settingsDensity) as DisplayDensity;
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  const processedItems = useMemo(() => {
    if (!items || items.length === 0) return [];

    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return items.map((item, index) => {
      const type: 'movie' | 'tv' | 'person' =
        mediaType || (item as any).media_type || 'movie';

      const itemTitle =
        'title' in item
          ? item.title
          : 'name' in item
            ? item.name
            : 'Sans titre';

      const posterPath =
        'poster_path' in item
          ? item.poster_path
          : 'profile_path' in item
            ? item.profile_path
            : null;

      const releaseDate =
        'release_date' in item
          ? item.release_date
          : 'first_air_date' in item
            ? item.first_air_date
            : undefined;

      const voteAverage =
        'vote_average' in item ? item.vote_average : undefined;

      const popularity = 'popularity' in item ? (item as any).popularity : undefined;

      const isNew = showTrendingBadges && releaseDate
        ? new Date(releaseDate).getTime() > thirtyDaysAgo
        : false;

      const isHot = showTrendingBadges && voteAverage !== undefined && voteAverage >= 8;

      return {
        key: `${type}-${item.id}`,
        id: item.id,
        title: itemTitle,
        posterPath,
        voteAverage,
        releaseDate,
        mediaType: type,
        trendingRank: showTrendingBadges && index < 10 ? index + 1 : undefined,
        isNew,
        isHot,
        popularity: showTrendingBadges ? popularity : undefined,
      };
    });
  }, [items, mediaType, showTrendingBadges]);

  const handleImageClick = useCallback((index: number) => {
    setSelectedImageIndex(index);
  }, []);

  const handleNext = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedImageIndex !== null) {
      setSelectedImageIndex((selectedImageIndex + 1) % items.length);
    }
  }, [selectedImageIndex, items.length]);

  const handlePrev = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedImageIndex !== null) {
      setSelectedImageIndex((selectedImageIndex - 1 + items.length) % items.length);
    }
  }, [selectedImageIndex, items.length]);

  if (!items || items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="w-20 h-20 rounded-full bg-secondary/50 flex items-center justify-center mb-4">
          {mediaType === 'movie' && <Film className="w-10 h-10 text-muted-foreground/50" />}
          {mediaType === 'tv' && <Tv className="w-10 h-10 text-muted-foreground/50" />}
          {mediaType === 'person' && <User className="w-10 h-10 text-muted-foreground/50" />}
          {!mediaType && <Film className="w-10 h-10 text-muted-foreground/50" />}
        </div>
        <p className="text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <>
      <div>
        {showTitle && title && (
          <div className="flex items-center gap-3 mb-6 animate-in fade-in slide-in-from-left-4 duration-300">
            {icon}
            <h2 className="text-2xl font-bold">{title}</h2>
            <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
            <span className="text-sm text-muted-foreground">{items.length} résultats</span>
          </div>
        )}

        <div className={`${getGridClasses(displayDensity)} animate-in fade-in duration-300`}>
          {processedItems.map((item, index) => (
            <motion.div
              key={item.key}
              className="animate-in fade-in duration-200"
            >
              <MediaCard
                id={item.id}
                title={item.title}
                posterPath={item.posterPath}
                voteAverage={item.voteAverage}
                releaseDate={item.releaseDate}
                mediaType={item.mediaType}
                trendingRank={item.trendingRank}
                isNew={item.isNew}
                isHot={item.isHot}
                popularity={item.popularity}
              />
            </motion.div>
          ))}
        </div>
      </div>

      <Dialog open={selectedImageIndex !== null} onOpenChange={(open) => !open && setSelectedImageIndex(null)}>
        <DialogContent className="max-w-[95vw] max-h-[90vh] p-0 bg-black/80 backdrop-blur-xl border-none overflow-hidden flex items-center justify-center">
          <AnimatePresence mode="wait">
            {selectedImageIndex !== null && (
              <motion.div
                key={selectedImageIndex}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative w-full h-full flex items-center justify-center group"
              >
                <img
                  src={`https://image.tmdb.org/t/p/w1280${processedItems[selectedImageIndex].posterPath}`}
                  alt={processedItems[selectedImageIndex].title}
                  className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                />

                <div className="absolute inset-0 flex items-center justify-between px-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-12 h-12 rounded-full bg-black/50 hover:bg-black/70 text-white border border-white/10"
                    onClick={handlePrev}
                  >
                    <ChevronLeft className="w-8 h-8" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-12 h-12 rounded-full bg-black/50 hover:bg-black/70 text-white border border-white/10"
                    onClick={handleNext}
                  >
                    <ChevronRight className="w-8 h-8" />
                  </Button>
                </div>

                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white font-bold text-lg shadow-2xl text-center min-w-[200px]">
                  {processedItems[selectedImageIndex].title}
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white border border-white/10"
                  onClick={() => setSelectedImageIndex(null)}
                >
                  <X className="w-6 h-6" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </>
  );
});

MediaGrid.displayName = 'MediaGrid';

MediaGrid.displayName = 'MediaGrid';
