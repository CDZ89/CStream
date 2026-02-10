import { useCallback, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Play, Star, Calendar, Clock, Heart, Bookmark,
  Info, ChevronLeft, ThumbsUp, Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import { tmdbApi } from '@/lib/tmdb';

interface MediaHeroProps {
  id: number;
  title: string;
  tagline?: string;
  overview?: string;
  posterPath?: string | null;
  backdropPath?: string | null;
  voteAverage?: number;
  voteCount?: number;
  releaseDate?: string;
  runtime?: number | null;
  genres?: Array<{ id: number; name: string }>;
  mediaType: 'movie' | 'tv';
  numberOfSeasons?: number;
  isFavorite?: boolean;
  isInWatchlist?: boolean;
  onWatch?: () => void;
  onToggleFavorite?: () => void;
  onToggleWatchlist?: () => void;
  onBack?: () => void;
  showBackButton?: boolean;
  isLoading?: boolean;
  className?: string;
}

const useMediaLogo = (id: number, mediaType: 'movie' | 'tv') => {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    
    tmdbApi.getMediaImages(id, mediaType)
      .then((data: any) => {
        if (!mounted) return;
        
        const logos = data.logos || [];
        const frLogo = logos.find((l: any) => l.iso_639_1 === 'fr');
        const enLogo = logos.find((l: any) => l.iso_639_1 === 'en');
        const nullLogo = logos.find((l: any) => l.iso_639_1 === null);
        const bestLogo = frLogo || enLogo || nullLogo || logos[0];
        
        if (bestLogo?.file_path) {
          setLogoUrl(tmdbApi.getLogoUrl(bestLogo.file_path, 'original'));
        }
        setLoading(false);
      })
      .catch(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => { mounted = false; };
  }, [id, mediaType]);

  return { logoUrl, loading };
};

const formatDuration = (minutes?: number | null): string => {
  if (!minutes || minutes <= 0) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}min` : `${m}min`;
};

const formatYear = (dateStr?: string): string => {
  if (!dateStr) return '';
  return new Date(dateStr).getFullYear().toString();
};

export const MediaHero = ({
  id,
  title,
  tagline,
  overview,
  posterPath,
  backdropPath,
  voteAverage,
  voteCount,
  releaseDate,
  runtime,
  genres,
  mediaType,
  numberOfSeasons,
  isFavorite = false,
  isInWatchlist = false,
  onWatch,
  onToggleFavorite,
  onToggleWatchlist,
  onBack,
  showBackButton = true,
  isLoading = false,
  className,
}: MediaHeroProps) => {
  const { t, language } = useI18n();
  const { logoUrl } = useMediaLogo(id, mediaType);
  const [logoError, setLogoError] = useState(false);
  
  const score = voteAverage ? Math.round(voteAverage * 10) : 0;
  const year = formatYear(releaseDate);
  const duration = formatDuration(runtime);
  const showLogo = logoUrl && !logoError;
  
  const posterUrl = posterPath 
    ? `https://image.tmdb.org/t/p/w500${posterPath}` 
    : null;
  const backdropUrl = backdropPath 
    ? `https://image.tmdb.org/t/p/original${backdropPath}` 
    : null;

  return (
    <section 
      className={cn("relative w-full", className)}
      aria-labelledby="media-title"
    >
      {/* Backdrop avec gradient sombre */}
      {backdropUrl && (
        <div className="absolute inset-0 -z-10">
          <img
            src={backdropUrl}
            alt=""
            className="w-full h-full object-cover opacity-30"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/95 to-background/60" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
        </div>
      )}

      <div className="container mx-auto px-4 py-6 sm:py-8 lg:py-12">
        {/* Bouton Retour */}
        {showBackButton && onBack && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-4 sm:mb-6"
          >
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onBack}
              className="gap-2 text-white/80 hover:text-white hover:bg-white/10 min-h-[44px] min-w-[44px]"
              aria-label={language === 'fr' ? 'Retour' : 'Go back'}
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="hidden sm:inline">{language === 'fr' ? 'Retour' : 'Back'}</span>
            </Button>
          </motion.div>
        )}

        {/* Affichage du Logo/Titre en grand */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8 sm:mb-10"
        >
          {showLogo ? (
            <div className="flex items-center gap-4">
              <div className="relative">
                <img
                  src={logoUrl}
                  alt={title}
                  className="max-w-[350px] sm:max-w-[500px] md:max-w-[600px] max-h-[180px] sm:max-h-[220px] object-contain drop-shadow-2xl"
                  style={{ filter: 'drop-shadow(0 12px 32px rgba(0,0,0,0.8))' }}
                  onError={() => setLogoError(true)}
                  loading="eager"
                />
              </div>
            </div>
          ) : (
            <h1 
              id="media-title"
              className={cn(
                "text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black",
                "text-white leading-tight tracking-tighter",
                "drop-shadow-lg"
              )}
              style={{ textShadow: '0 4px 16px rgba(0,0,0,0.8)', letterSpacing: '-0.02em' }}
            >
              {title}
            </h1>
          )}
          
          {tagline && (
            <p className="mt-3 text-lg sm:text-xl text-white/70 italic font-light">
              {tagline}
            </p>
          )}
        </motion.div>

        {/* Layout principal: responsive grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] xl:grid-cols-[280px_1fr] gap-6 lg:gap-10">
          
          {/* Poster - visible sur desktop */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="hidden lg:block"
          >
            <div className="relative aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl shadow-black/50 ring-1 ring-white/10">
              {posterUrl ? (
                <img
                  src={posterUrl}
                  alt={`Affiche de ${title}`}
                  className="w-full h-full object-cover"
                  loading="eager"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
                  <span className="text-white/30 text-5xl font-bold">{title.charAt(0)}</span>
                </div>
              )}
              {/* Score badge sur le poster */}
              {score > 0 && (
                <div className="absolute top-3 right-3">
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm shadow-lg",
                    score >= 70 ? "bg-green-500 text-white" :
                    score >= 50 ? "bg-yellow-500 text-black" :
                    "bg-red-500 text-white"
                  )}>
                    {score}%
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Contenu principal - Infos et actions */}
          <div className="flex flex-col gap-4 sm:gap-6">
            

            {/* Score + Métadonnées */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="flex flex-wrap items-center gap-3 sm:gap-4"
            >
              {/* Score cercle (visible sur mobile aussi) */}
              {score > 0 && (
                <div className="lg:hidden flex items-center gap-2">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shadow-lg",
                    score >= 70 ? "bg-green-500 text-white" :
                    score >= 50 ? "bg-yellow-500 text-black" :
                    "bg-red-500 text-white"
                  )}>
                    {score}%
                  </div>
                </div>
              )}
              
              {/* Étoiles */}
              {voteAverage && voteAverage > 0 && (
                <div className="flex items-center gap-1.5 text-yellow-400">
                  <Star className="w-5 h-5 fill-current" />
                  <span className="font-semibold">{voteAverage.toFixed(1)}</span>
                  {voteCount && (
                    <span className="text-white/50 text-sm">({voteCount.toLocaleString()})</span>
                  )}
                </div>
              )}
              
              {/* Année */}
              {year && (
                <div className="flex items-center gap-1.5 text-white/70">
                  <Calendar className="w-4 h-4" />
                  <span>{year}</span>
                </div>
              )}
              
              {/* Durée */}
              {duration && (
                <div className="flex items-center gap-1.5 text-white/70">
                  <Clock className="w-4 h-4" />
                  <span>{duration}</span>
                </div>
              )}
              
              {/* Nombre de saisons pour TV */}
              {mediaType === 'tv' && numberOfSeasons && (
                <Badge variant="secondary" className="bg-white/10 text-white/80">
                  {numberOfSeasons} {numberOfSeasons > 1 ? 'saisons' : 'saison'}
                </Badge>
              )}
            </motion.div>

            {/* Genres */}
            {genres && genres.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.25 }}
                className="flex flex-wrap gap-2"
              >
                {genres.map((genre) => (
                  <Link 
                    key={genre.id} 
                    to={`/discover?genre=${genre.id}`}
                    className="focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-background rounded-full"
                  >
                    <Badge 
                      variant="outline" 
                      className="bg-white/5 border-white/20 text-white/90 hover:bg-white/10 transition-colors cursor-pointer px-3 py-1"
                    >
                      {genre.name}
                    </Badge>
                  </Link>
                ))}
              </motion.div>
            )}

            {/* BOUTONS D'ACTION - Toujours visibles, accessibles, taille minimum 44x44 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="flex flex-wrap items-center gap-3 mt-2"
              role="group"
              aria-label={language === 'fr' ? 'Actions du média' : 'Media actions'}
            >
              {/* Bouton Regarder - Principal */}
              <Button 
                size="lg" 
                onClick={onWatch}
                disabled={isLoading}
                className={cn(
                  "gap-2.5 min-h-[48px] min-w-[140px] px-8",
                  "bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600",
                  "text-white font-semibold text-base",
                  "shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50",
                  "transition-all duration-300 backdrop-blur-sm",
                  "focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-background",
                  "rounded-xl border border-white/20 hover:border-white/40"
                )}
                aria-label={language === 'fr' ? 'Regarder le contenu' : 'Watch content'}
              >
                <Play className="w-5 h-5 fill-current" />
                {language === 'fr' ? 'Regarder' : 'Watch'}
              </Button>

              {/* Bouton Favoris */}
              <Button
                variant="outline"
                size="lg"
                onClick={onToggleFavorite}
                disabled={isLoading}
                className={cn(
                  "min-h-[48px] min-w-[48px] p-3 sm:px-5",
                  "backdrop-blur-xl transition-all duration-300",
                  "rounded-xl border",
                  "focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-background",
                  isFavorite 
                    ? "bg-red-500/20 border-red-500/50 hover:bg-red-500/30 hover:border-red-500/70" 
                    : "bg-white/5 border-white/20 hover:bg-white/10 hover:border-white/40"
                )}
                aria-label={isFavorite 
                  ? (language === 'fr' ? 'Retirer des favoris' : 'Remove from favorites')
                  : (language === 'fr' ? 'Ajouter aux favoris' : 'Add to favorites')
                }
                aria-pressed={isFavorite}
              >
                <Heart className={cn(
                  "w-5 h-5",
                  isFavorite ? "fill-red-500 text-red-500" : "text-white"
                )} />
                <span className="hidden sm:inline ml-2 text-white">
                  {isFavorite ? (language === 'fr' ? 'Favori' : 'Favorited') : 'Favoris'}
                </span>
              </Button>

              {/* Bouton Watchlist */}
              <Button
                variant="outline"
                size="lg"
                onClick={onToggleWatchlist}
                disabled={isLoading}
                className={cn(
                  "min-h-[48px] min-w-[48px] p-3 sm:px-5",
                  "backdrop-blur-xl transition-all duration-300",
                  "rounded-xl border",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-background",
                  isInWatchlist 
                    ? "bg-blue-500/20 border-blue-500/50 hover:bg-blue-500/30 hover:border-blue-500/70" 
                    : "bg-white/5 border-white/20 hover:bg-white/10 hover:border-white/40"
                )}
                aria-label={isInWatchlist 
                  ? (language === 'fr' ? 'Retirer de la watchlist' : 'Remove from watchlist')
                  : (language === 'fr' ? 'Ajouter à la watchlist' : 'Add to watchlist')
                }
                aria-pressed={isInWatchlist}
              >
                <Bookmark className={cn(
                  "w-5 h-5",
                  isInWatchlist ? "fill-blue-500 text-blue-500" : "text-white"
                )} />
                <span className="hidden sm:inline ml-2 text-white">Watchlist</span>
              </Button>
            </motion.div>

            {/* Synopsis */}
            {overview && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.35 }}
                className="mt-4"
              >
                <p className={cn(
                  "text-white/80 text-base sm:text-lg leading-relaxed",
                  "max-w-3xl line-clamp-4 sm:line-clamp-none"
                )}>
                  {overview}
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default MediaHero;
