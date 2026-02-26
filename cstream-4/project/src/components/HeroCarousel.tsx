import { useState, useCallback, memo, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import {
  Autoplay,
  Navigation,
  EffectFade,
  Keyboard,
  A11y,
} from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import {
  ChevronRight,
  ChevronLeft,
  Play,
  Star,
  Info,
  Calendar,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { tmdbApi, TMDBMovie, TMDBTV } from "@/lib/tmdb";
import { cn } from "@/lib/utils";
import { useMediaLogo } from "@/hooks/useMediaLogo";
import { useI18n } from "@/lib/i18n";
import "swiper/css";
import "swiper/css/effect-fade";
import "swiper/css/navigation";

interface HeroCarouselProps {
  items: (TMDBMovie | TMDBTV)[];
  className?: string;
}

const getItemMediaType = (item: TMDBMovie | TMDBTV): "movie" | "tv" =>
  "title" in item ? "movie" : "tv";

const getItemTitle = (item: TMDBMovie | TMDBTV): string =>
  "title" in item ? item.title : (item as TMDBTV).name;

const getItemLink = (item: TMDBMovie | TMDBTV): string => {
  const mediaType = getItemMediaType(item);
  return mediaType === "movie" ? `/movie/${item.id}` : `/tv/${item.id}`;
};

const getItemMediaTypeLabel = (item: TMDBMovie | TMDBTV, t: any) =>
  getItemMediaType(item) === "movie" ? t('media.movie') : t('media.tv');

const genreKeyMap: Record<string, any> = {
  Action: 'genre.action',
  Adventure: 'genre.adventure',
  Animation: 'genre.animation',
  Comedy: 'genre.comedy',
  Crime: 'genre.crime',
  Documentary: 'genre.documentary',
  Drama: 'genre.drama',
  Family: 'genre.family',
  Fantasy: 'genre.fantasy',
  History: 'genre.history',
  Horror: 'genre.horror',
  Music: 'genre.music',
  Mystery: 'genre.mystery',
  Romance: 'genre.romance',
  "Science Fiction": 'genre.scienceFiction',
  "TV Movie": 'genre.tvMovie',
  Thriller: 'genre.thriller',
  War: 'genre.war',
  Western: 'genre.western',
};

const getItemGenres = (item: TMDBMovie | TMDBTV, t: any): string[] => {
  const mediaType = getItemMediaType(item);
  let genreNames: string[] = [];

  if ("genres" in item && Array.isArray((item as any).genres)) {
    genreNames = (item as any).genres.slice(0, 3).map((g: any) => g.name);
  } else if ("genre_ids" in item && Array.isArray((item as any).genre_ids)) {
    // Fixed: getGenreName removed in newer tmdbApi versions, manually map common IDs or skip
    const commonGenres: Record<number, string> = {
      28: "Action", 12: "Aventure", 16: "Animation", 35: "Comédie", 80: "Crime",
      99: "Documentaire", 18: "Drame", 10751: "Famille", 14: "Fantastique",
      36: "Histoire", 27: "Horreur", 10402: "Musique", 9648: "Mystère",
      10749: "Romance", 878: "Science-Fiction", 10770: "Téléfilm",
      53: "Thriller", 10752: "Guerre", 37: "Western", 10759: "Action & Adventure",
      10762: "Kids", 10763: "News", 10764: "Reality", 10765: "Sci-Fi & Fantasy",
      10766: "Soap", 10767: "Talk", 10768: "War & Politics"
    };
    genreNames = (item as any).genre_ids
      .slice(0, 3)
      .map((id: number) => commonGenres[id])
      .filter(Boolean);
  }

  return genreNames.map(name => {
    const key = genreKeyMap[name];
    return key ? t(key) : name;
  });
};

const getReleaseYear = (item: TMDBMovie | TMDBTV): number | null => {
  if ("release_date" in item && item.release_date) {
    return new Date(item.release_date).getFullYear();
  }
  if ("first_air_date" in item && (item as any).first_air_date) {
    return new Date((item as any).first_air_date).getFullYear();
  }
  return null;
};

const HeroSlide = memo(
  ({
    item,
    isActive,
    isFirst,
  }: {
    item: TMDBMovie | TMDBTV;
    isActive: boolean;
    isFirst?: boolean;
  }) => {
    const navigate = useNavigate();
    const { t } = useI18n();
    const genres = getItemGenres(item, t);
    const mediaType = getItemMediaType(item);
    const mediaTypeLabel = getItemMediaTypeLabel(item, t);
    const { logoUrl } = useMediaLogo(item.id, mediaType, true);
    const [logoError, setLogoError] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    const releaseYear = getReleaseYear(item);
    const title = getItemTitle(item);
    const hasLogo = logoUrl && !logoError;

    // Parallax mouse effect
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const springConfig = { damping: 25, stiffness: 150 };
    const springX = useSpring(mouseX, springConfig);
    const springY = useSpring(mouseY, springConfig);

    const rotateX = useTransform(springY, [-0.5, 0.5], [2, -2]);
    const rotateY = useTransform(springX, [-0.5, 0.5], [-2, 2]);
    const translateX = useTransform(springX, [-0.5, 0.5], [-15, 15]);
    const translateY = useTransform(springY, [-0.5, 0.5], [-15, 15]);

    const handleMouseMove = (e: React.MouseEvent) => {
      if (!isActive) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      mouseX.set(x);
      mouseY.set(y);
    };

    const handleMouseLeave = () => {
      mouseX.set(0);
      mouseY.set(0);
    };

    const backdropUrl = item.backdrop_path
      ? tmdbApi.getImageUrl(item.backdrop_path, "w1280")
      : null;

    if (!backdropUrl) return null;

    return (
      <div
        className="relative h-full w-full overflow-hidden"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Image avec effet zoom et parallaxe */}
        <motion.div
          style={{
            zIndex: 1,
            x: translateX,
            y: translateY,
            rotateX,
            rotateY,
            perspective: 1000,
            willChange: "transform",
            transform: "translateZ(0)"
          }}
          initial={{ scale: 1.1 }}
          animate={{ scale: isActive ? 1.05 : 1.1 }}
          transition={{ duration: 6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="absolute inset-0"
        >
          <img
            src={backdropUrl}
            alt=""
            onLoad={() => setImageLoaded(true)}
            className={cn(
              "w-full h-full object-cover object-center transition-all duration-1000",
              imageLoaded ? "opacity-100 blur-0" : "opacity-0 blur-sm",
            )}
            loading={isFirst ? "eager" : "lazy"}
            decoding={isFirst ? "sync" : "async"}
          />
          {/* Effet de brillance animé */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: isActive ? "100%" : "-100%" }}
            transition={{ duration: 2, ease: "easeInOut", delay: 0.5 }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
            style={{ zIndex: 2 }}
          />
        </motion.div>

        {/* Gradients ultra-premium multi-couches */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-background via-background/90 via-35% to-transparent rounded-[2.5rem]"
          style={{ zIndex: 3 }}
        />
        <div
          className="absolute inset-0 bg-gradient-to-r from-background via-background/70 via-25% to-transparent rounded-[2.5rem]"
          style={{ zIndex: 3 }}
        />
        <div
          className="absolute inset-0 bg-gradient-to-l from-background/20 via-transparent to-transparent rounded-[2.5rem]"
          style={{ zIndex: 3 }}
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-transparent rounded-[2.5rem]"
          style={{ zIndex: 3 }}
        />

        {/* Mesh Gradient Animé */}
        {
          isActive && (
            <>
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{
                  duration: 10,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute -top-[20%] -right-[10%] w-[60%] h-[60%] bg-primary/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none"
                style={{ zIndex: 2 }}
              />
              <motion.div
                animate={{
                  scale: [1.2, 1, 1.2],
                  opacity: [0.2, 0.4, 0.2],
                }}
                transition={{
                  duration: 12,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1
                }}
                className="absolute -bottom-[10%] -left-[5%] w-[50%] h-[50%] bg-primary/10 blur-[100px] rounded-full mix-blend-screen pointer-events-none"
                style={{ zIndex: 2 }}
              />
            </>
          )
        }

        {/* Texture et Overlay de grain */}
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none z-[3] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] rounded-[2.5rem] mix-blend-overlay" />

        {/* Effet de lueur diffuse dynamique */}
        <motion.div
          animate={{
            opacity: isActive ? [0.4, 0.6, 0.4] : 0.2,
            scale: isActive ? [1, 1.1, 1] : 1
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/30 blur-[160px] pointer-events-none z-[2] rounded-full"
        />

        {/* Effet de vignette amélioré */}
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(0,0,0,0.5)_100%)]"
          style={{ zIndex: 3 }}
        />
        {/* Effet de bordure subtile */}
        <div
          className="absolute inset-0 border border-transparent pointer-events-none"
          style={{ zIndex: 3 }}
        />

        <div className="absolute inset-0 flex items-end" style={{ zIndex: 4 }}>
          <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-10 pb-16 sm:pb-20 md:pb-24 lg:pb-32">
            <AnimatePresence mode="wait">
              {isActive && (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 30 }}
                  transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                  className="max-w-[100vw] lg:max-w-6xl w-full"
                >
                  <div className="flex flex-col lg:flex-row items-center lg:items-center justify-between gap-12 lg:gap-24 w-full relative">
                    {/* Colonne gauche : Logos */}
                    <div className="flex flex-col items-center lg:items-start gap-4 sm:gap-6 lg:gap-8 lg:w-2/5 flex-shrink-0">
                      {hasLogo ? (
                        <motion.div
                          initial={{ opacity: 0, y: 30, filter: "blur(15px)", scale: 0.9 }}
                          animate={{ opacity: 1, y: 0, filter: "blur(0px)", scale: 1 }}
                          transition={{ delay: 0.2, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                          className="relative group/logo"
                        >
                          <img
                            key={`logo-${item.id}`}
                            src={logoUrl}
                            alt={title}
                            onError={() => setLogoError(true)}
                            className="h-16 sm:h-24 md:h-32 lg:h-48 xl:h-56 w-auto max-w-[85vw] lg:max-w-full object-contain transition-all duration-700 group-hover/logo:scale-105 group-hover/logo:drop-shadow-[0_0_40px_rgba(var(--theme-primary-rgb),0.5)]"
                            style={{
                              filter: "drop-shadow(0 12px 48px rgba(0,0,0,0.9))",
                            }}
                          />
                          <motion.div
                            animate={{
                              opacity: [0.3, 0.6, 0.3],
                              scale: [0.8, 1.1, 0.8]
                            }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute inset-0 bg-primary/20 blur-[60px] -z-10 rounded-full"
                          />
                        </motion.div>
                      ) : (
                        <motion.h1
                          initial={{ opacity: 0, x: -50, filter: "blur(20px)" }}
                          animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                          transition={{ delay: 0.2, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                          className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white leading-[0.85] tracking-tighter text-center lg:text-left uppercase italic drop-shadow-[0_10px_40px_rgba(0,0,0,0.8)]"
                        >
                          {title}
                        </motion.h1>
                      )}

                      {/* Logo TMDB Image - Visible partout mais plus petit sur mobile */}
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4, duration: 0.8 }}
                        className="select-none"
                      >
                        <img
                          src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_short-8e7b30f73a4020692ccca9c88bafe5dcb6f8a62a4c6bc55cd9ba82bb2cd95f6c.svg"
                          alt="The Movie Database Logo"
                          className="h-2 sm:h-2.5 w-auto opacity-80 hover:opacity-100 transition-opacity duration-300 pointer-events-none drop-shadow-[0_0_15px_rgba(1,180,228,0.3)]"
                        />
                      </motion.div>
                    </div>

                    {/* Colonne droite : Infos, Description, Boutons */}
                    <div className="flex-1 flex flex-col items-center lg:items-start gap-4 sm:gap-6 lg:gap-8 w-full">
                      <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                        className="flex flex-wrap items-center justify-center lg:justify-start gap-4"
                      >
                        {item.vote_average > 0 && (
                          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-500/10 backdrop-blur-xl border border-yellow-500/20 shadow-[0_0_20px_rgba(234,179,8,0.1)] group/badge cursor-default">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 group-hover:scale-110 transition-transform" />
                            <div className="flex items-baseline gap-1">
                              <span className="text-sm font-black text-yellow-500">
                                {item.vote_average.toFixed(1)}
                              </span>
                              <span className="text-[10px] font-bold text-yellow-500/60 tracking-tighter uppercase">TMDB</span>
                            </div>
                          </div>
                        )}
                        {releaseYear && (
                          <div className="px-4 py-2 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 text-white/90 shadow-lg">
                            <span className="text-sm font-bold tracking-tight">{releaseYear}</span>
                          </div>
                        )}
                        <div className="px-4 py-2 rounded-xl bg-primary/10 backdrop-blur-xl border border-primary/20 text-primary-foreground shadow-lg">
                          <span className="text-sm font-bold tracking-tight uppercase px-1">
                            {mediaTypeLabel}
                          </span>
                        </div>
                        {genres.length > 0 && genres.map((genre, idx) => (
                          <motion.div
                            key={genre}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.5 + (idx * 0.1) }}
                            className="hidden sm:flex px-4 py-2 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 text-white/70 hover:bg-white/10 transition-colors"
                          >
                            <span className="text-sm font-semibold">{genre}</span>
                          </motion.div>
                        ))}
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6, duration: 0.6 }}
                        className="max-w-2xl relative w-full group/desc"
                      >
                        <div className="absolute inset-0 bg-primary/5 blur-3xl -z-10 rounded-[2.5rem] opacity-0 group-hover/desc:opacity-100 transition-opacity duration-700" />
                        <div className="relative overflow-hidden rounded-[1.5rem] sm:rounded-[2.5rem] border border-white/10 bg-black/40 backdrop-blur-[32px] p-4 sm:p-8 md:p-10 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)]">
                          <div className="absolute top-0 left-0 w-1 sm:w-2 h-full bg-gradient-to-b from-primary via-primary/40 to-transparent opacity-100" />
                          <p className="text-white/95 text-xs sm:text-base lg:text-xl leading-relaxed font-medium line-clamp-2 sm:line-clamp-4 tracking-tight text-center lg:text-left pl-3 sm:pl-4 premium-gradient-text">
                            {item.overview || "Découvrez ce contenu exclusif sur CStream."}
                          </p>
                        </div>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 25 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8, duration: 0.6 }}
                        className="flex flex-row items-center justify-center lg:justify-start gap-4 sm:gap-8 w-full lg:w-auto"
                      >
                        <Button
                          onClick={() => {
                            // Timeout to allow the browser to paint CSS 'active:scale-95' feedback instantly
                            setTimeout(() => navigate(getItemLink(item)), 20);
                          }}
                          onMouseEnter={() => tmdbApi.getMovieDetails(item.id)} // Prefetch
                          className="flex-1 sm:flex-none gap-3 bg-primary hover:scale-105 text-primary-foreground font-black h-12 sm:h-14 px-8 sm:px-10 rounded-full transition-transform active:scale-95 group/play relative overflow-hidden border-none"
                          style={{ boxShadow: "0 0 20px rgba(var(--theme-primary-rgb),0.3)" }}
                        >
                          <div
                            className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/play:translate-x-[100%] transition-transform duration-700 ease-in-out pointer-events-none"
                          />
                          <Play className="w-5 h-5 fill-current group-hover/play:scale-110 transition-transform" />
                          <span className="tracking-tighter uppercase text-base sm:text-lg">{t('home.play')}</span>
                        </Button>

                        <Button
                          variant="secondary"
                          onClick={() => {
                            setTimeout(() => navigate(getItemLink(item)), 20);
                          }}
                          onMouseEnter={() => tmdbApi.getMovieDetails(item.id)} // Prefetch
                          className="flex-1 sm:flex-none gap-3 bg-white/5 hover:bg-white/10 hover:scale-105 backdrop-blur-xl text-white font-black h-12 sm:h-14 px-8 sm:px-10 rounded-full border border-white/10 transition-transform active:scale-95 group/info"
                        >
                          <Info className="w-5 h-5 group-hover/info:rotate-12 transition-transform" />
                          <span className="hidden xs:inline tracking-tighter uppercase text-base sm:text-lg">{t('home.info')}</span>
                          <span className="xs:hidden uppercase text-sm">Infos</span>
                        </Button>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div >
    );
  },
);

HeroSlide.displayName = "HeroSlide";

const ProgressDots = memo(
  ({
    total,
    active,
    onSelect,
  }: {
    total: number;
    active: number;
    onSelect: (index: number) => void;
  }) => (
    <div className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-black/30 backdrop-blur-2xl border border-transparent shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)]">
      {Array.from({ length: total }).map((_, i) => (
        <motion.button
          key={i}
          onClick={() => onSelect(i)}
          whileHover={{ scale: 1.3 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 500, damping: 20 }}
          className={cn(
            "transition-all duration-500 rounded-full relative",
            i === active
              ? "w-10 h-2 bg-primary shadow-[0_0_20px_var(--primary-hex)] opacity-100"
              : "w-2 h-2 bg-white/20 hover:bg-white/40",
          )}
          aria-label={`Aller au slide ${i + 1}`}
        >
          {i === active && (
            <motion.div
              layoutId="activeDot"
              className="absolute inset-0 bg-primary rounded-full blur-[2px]"
            />
          )}
        </motion.button>
      ))}
    </div>
  ),
);

ProgressDots.displayName = "ProgressDots";

export const HeroCarousel = memo(({ items, className }: HeroCarouselProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const swiperRef = useRef<SwiperType | null>(null);

  const handleSlideChange = useCallback((swiper: SwiperType) => {
    setActiveIndex(swiper.realIndex);
  }, []);

  const handleDotClick = useCallback((index: number) => {
    swiperRef.current?.slideToLoop(index);
  }, []);

  if (!items || items.length === 0) return null;

  const displayedItems = items
    .filter((item) => item.backdrop_path)
    .slice(0, 10);

  if (displayedItems.length === 0) return null;

  return (
    <section
      className={cn(
        "relative overflow-hidden bg-background group/hero mx-1 sm:mx-4 my-4 rounded-[2.5rem] border border-white/10",
        className,
      )}
      aria-label="Carrousel des contenus vedettes"
    >
      <div className="relative h-[45vh] sm:h-[55vh] md:h-[65vh] lg:h-[75vh] xl:h-[80vh] min-h-[400px] sm:min-h-[500px] md:min-h-[600px] max-h-[850px] bg-gradient-to-br from-background via-background/95 to-background/90 rounded-[2.3rem] overflow-hidden">
        <Swiper
          modules={[Autoplay, Navigation, EffectFade, Keyboard, A11y]}
          effect="fade"
          fadeEffect={{ crossFade: true }}
          autoplay={{
            delay: 7000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          navigation={{
            prevEl: ".hero-btn-prev",
            nextEl: ".hero-btn-next",
          }}
          keyboard={{ enabled: true, onlyInViewport: true }}
          loop={displayedItems.length > 1}
          speed={1000}
          grabCursor={true}
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
          }}
          onSlideChange={handleSlideChange}
          className="h-full w-full select-none"
        >
          {displayedItems.map((item, index) => (
            <SwiperSlide key={item.id} className="h-full">
              <HeroSlide
                item={item}
                isActive={activeIndex === index}
                isFirst={index === 0}
              />
            </SwiperSlide>
          ))}
        </Swiper>

        {displayedItems.length > 1 && (
          <>
            <motion.button
              whileHover={{ scale: 1.15, x: -6 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
              className="hero-btn-prev absolute left-4 sm:left-10 top-1/2 -translate-y-1/2 z-30 w-16 h-16 sm:w-[70px] sm:h-[70px] rounded-full bg-black/40 hover:bg-primary/30 backdrop-blur-3xl text-white flex items-center justify-center transition-all duration-500 border border-transparent hover:border-primary/50 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.6)] opacity-0 group-hover/hero:opacity-100 group-hover/hero:translate-x-0 -translate-x-10"
              aria-label="Slide précédent"
            >
              <ChevronLeft className="w-8 h-8" strokeWidth={3} />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.15, x: 6 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
              className="hero-btn-next absolute right-4 sm:right-10 top-1/2 -translate-y-1/2 z-30 w-16 h-16 sm:w-[70px] sm:h-[70px] rounded-full bg-black/40 hover:bg-primary/30 backdrop-blur-3xl text-white flex items-center justify-center transition-all duration-500 border border-transparent hover:border-primary/50 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.6)] opacity-0 group-hover/hero:opacity-100 group-hover/hero:translate-x-0 translate-x-10"
              aria-label="Slide suivant"
            >
              <ChevronRight className="w-8 h-8" strokeWidth={3} />
            </motion.button>

            <div className="absolute bottom-10 sm:bottom-14 left-1/2 -translate-x-1/2 z-20">
              <ProgressDots
                total={displayedItems.length}
                active={activeIndex}
                onSelect={handleDotClick}
              />
            </div>
          </>
        )}
      </div>
    </section>
  );
});

HeroCarousel.displayName = "HeroCarousel";
