import { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import { tmdbApi, TMDBMovie, TMDBTV } from "@/lib/tmdb";
import { MediaGrid } from "@/components/MediaGrid";
import { WatchHistoryWidget } from "@/components/WatchHistoryWidget";
import { ContinueWatching } from "@/components/ContinueWatching";
import { HeroCarousel } from "@/components/HeroCarousel";
import { Button } from "@/components/ui/button";
import { WelcomeMessageWidget } from "@/components/WelcomeMessageWidget";
import { ShareWidget } from "@/components/ShareWidget";
import {
  TrendingUp,
  Film,
  Tv,
  Sparkles,
  Users,
  Clock,
  Heart,
  Globe,
  Zap,
  X,
  Star,
  Eye,
  MessageSquare,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { InfiniteMovingCards } from "@/components/ui/infinite-moving-cards";
import { supabase } from "@/integrations/supabase/client";

const formatLargeNumber = (num: number): string => {
  if (num >= 1000000000) {
    const value = num / 1000000000;
    return value >= 10
      ? `${Math.floor(value)}B`
      : `${value.toFixed(1).replace(".0", "")}B`;
  }
  if (num >= 1000000) {
    const value = num / 1000000;
    return value >= 10
      ? `${Math.floor(value)}M`
      : `${value.toFixed(1).replace(".0", "")}M`;
  }
  if (num >= 10000) {
    const value = num / 1000;
    return value >= 10
      ? `${Math.floor(value)}K`
      : `${value.toFixed(1).replace(".0", "")}K`;
  }
  return num.toLocaleString("fr-FR");
};

const AnimatedCounter = ({
  end,
  duration = 2000,
  suffix = "",
  useCompactFormat = false,
  infinite = false,
}: {
  end: number;
  duration?: number;
  suffix?: string;
  useCompactFormat?: boolean;
  infinite?: boolean;
}) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const countRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3, rootMargin: "50px" },
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;

    const startTime = Date.now();
    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      countRef.current = Math.floor(eased * end);
      setCount(countRef.current);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else if (infinite) {
        intervalRef.current = setInterval(
          () => {
            setCount((prev) => prev + Math.floor(Math.random() * 3) + 1);
          },
          2000 + Math.random() * 3000,
        );
      }
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [end, duration, isVisible, infinite]);

  const displayValue =
    useCompactFormat || end >= 10000
      ? formatLargeNumber(count)
      : count.toLocaleString("fr-FR");

  return (
    <span ref={containerRef}>
      {displayValue}
      {suffix}
    </span>
  );
};

const LiveStatsSection = ({
  movieCount = 850000,
  tvCount = 150000,
  animeCount = 45000,
}) => {
  const stats = useMemo(
    () => [
      {
        icon: Film,
        label: "Films",
        value: 854320,
        color: "from-red-500 to-orange-500",
        iconColor: "text-red-400",
      },
      {
        icon: Tv,
        label: "Séries",
        value: 158450,
        color: "from-blue-500 to-cyan-500",
        iconColor: "text-blue-400",
      },
      {
        icon: Sparkles,
        label: "Animes",
        value: 48200,
        color: "from-pink-500 to-purple-500",
        iconColor: "text-pink-400",
      },
      {
        icon: Users,
        label: "Utilisateurs Premium",
        value: 2584120,
        color: "from-green-500 to-emerald-500",
        iconColor: "text-green-400",
      },
    ],
    [],
  );

  return (
    <section className="py-3 sm:py-6 relative z-20">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, type: "spring", stiffness: 200 }}
              className="relative group"
            >
              <div
                className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl rounded-lg sm:rounded-xl"
                style={{
                  background: `linear-gradient(to right, var(--tw-gradient-from), var(--tw-gradient-to))`,
                }}
              />
              <div className="relative p-2 sm:p-3 rounded-lg sm:rounded-xl bg-card/40 backdrop-blur-xl border border-white/5 hover:border-primary/20 transition-all duration-300 hover:shadow-xl">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/20 flex items-center justify-center shadow-lg flex-shrink-0 border border-primary/30"
                  >
                    <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xl sm:text-2xl md:text-3xl font-black bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent truncate tracking-tight">
                      <AnimatedCounter
                        end={stat.value}
                        duration={2500 + i * 300}
                        suffix="+"
                        infinite={true}
                      />
                    </p>
                    <p className="text-[10px] sm:text-[11px] text-muted-foreground font-bold uppercase tracking-widest truncate">
                      {stat.label}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const STREAMING_PROVIDERS = [
  { id: 8, name: 'Netflix', logo: '/t2yyOv40HZeVlLjYsCsPHnWLk4W.jpg' },
  { id: 9, name: 'Prime Video', logo: '/emthp39XA2YScoYL1p0sdbAH2WA.jpg' },
  { id: 337, name: 'Disney+', logo: '/7rwgEs15tFwyR9NPQ5vpzxTj19Q.jpg' },
  { id: 350, name: 'Apple TV+', logo: '/6uhKBfmtzFqOcLousHwZuzcrScK.jpg' },
  { id: 1899, name: 'Max', logo: '/6Q3ZYUNA9Hsgj6iWnVsQ2g0GD7.jpg' },
  { id: 15, name: 'Hulu', logo: '/zxrVdFjIjLqkfnwyghnfywTn3Lh.jpg' },
  { id: 531, name: 'Paramount+', logo: '/xbhHHa1YgtpwhC8lb1NQ3ACVcLd.jpg' },
  { id: 386, name: 'Peacock', logo: '/8VCV78prwd9QzZnEm0ReO6bERDa.jpg' },
  { id: 283, name: 'Crunchyroll', logo: '/8Gt1iClBlzTeQs8WQm8rRwbflj7.jpg' },
  { id: 381, name: 'Canal+', logo: '/eBXzkFEupZjKaIKY7zBUaSdCY8I.jpg' },
  { id: 520, name: 'Discovery+', logo: '/1D8V4X15m0w4ZZBXGO7AULT4DEE.jpg' },
  { id: 35, name: 'Rakuten TV', logo: '/5GEbAhFW2S5T8zVrzbZJL7dVdRs.jpg' },
  { id: 7, name: 'Vudu', logo: '/21dEscfO8n1tL35k4DANixhffsR.jpg' },
  { id: 3, name: 'Google Play Movies', logo: '/tbEdFQDwx5LEVr8WpSeXQSIirVq.jpg' },
  { id: 188, name: 'YouTube Premium', logo: '/6IPjvnYl6WWkIwN158qBFXCr2Ne.jpg' },
];

const ProviderContentRow = ({ items, isLoading }: { items: (TMDBMovie | TMDBTV)[]; isLoading: boolean }) => {
  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex-shrink-0 w-[150px] sm:w-[180px]">
            <div className="aspect-[2/3] rounded-xl bg-secondary/50 animate-pulse" />
            <div className="mt-2 h-4 bg-secondary/50 rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Aucun contenu disponible pour ce service
      </div>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
      {items.map((item) => {
        const isMovie = 'title' in item;
        const title = isMovie ? item.title : (item as TMDBTV).name;
        const date = isMovie ? item.release_date : (item as TMDBTV).first_air_date;
        const year = date ? new Date(date).getFullYear() : '';
        const mediaType = isMovie ? 'movie' : 'tv';

        return (
          <Link
            key={item.id}
            to={`/${mediaType}/${item.id}`}
            className="flex-shrink-0 w-[140px] sm:w-[160px] group snap-start"
          >
            <motion.div
              whileHover={{ scale: 1.05, y: -5 }}
              className="relative aspect-[2/3] rounded-xl overflow-hidden shadow-lg"
            >
              <img
                src={tmdbApi.getImageUrl(item.poster_path, 'w342')}
                alt={title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                <div className="flex items-center gap-2 text-xs text-white/90">
                  <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                  <span>{item.vote_average.toFixed(1)}</span>
                  {year && <span>• {year}</span>}
                </div>
              </div>
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-8 h-8 rounded-full bg-primary/90 flex items-center justify-center">
                  <Eye className="w-4 h-4 text-white" />
                </div>
              </div>
            </motion.div>
            <h3 className="mt-2 text-sm font-medium text-white truncate group-hover:text-primary transition-colors">
              {title}
            </h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
              <span>{item.vote_average.toFixed(1)}</span>
              {year && <span>• {year}</span>}
            </div>
          </Link>
        );
      })}
    </div>
  );
};

const StreamingProvidersSection = () => {
  const [selectedProvider, setSelectedProvider] = useState<number | null>(null);
  const [providerContent, setProviderContent] = useState<(TMDBMovie | TMDBTV)[]>([]);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [contentType, setContentType] = useState<'movie' | 'tv'>('movie');
  const [logoStates, setLogoStates] = useState<Record<number, 'loading' | 'loaded' | 'error'>>({});
  const [isSectionOpen, setIsSectionOpen] = useState(true);
  const [showAllProviders, setShowAllProviders] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const visibleProviders = STREAMING_PROVIDERS.slice(0, 6);
  const selectedProviderData = STREAMING_PROVIDERS.find(p => p.id === selectedProvider);

  useEffect(() => {
    if (!selectedProvider) return;

    const fetchProviderContent = async () => {
      setIsLoadingContent(true);
      try {
        const [moviesRes, tvRes] = await Promise.all([
          tmdbApi.discoverByProvider(selectedProvider, 'movie'),
          tmdbApi.discoverByProvider(selectedProvider, 'tv'),
        ]);

        const movies = (moviesRes.results || []).slice(0, 12);
        const tvShows = (tvRes.results || []).slice(0, 12);

        const combined = contentType === 'movie' ? movies : tvShows;
        setProviderContent(combined as (TMDBMovie | TMDBTV)[]);
      } catch (error) {
        console.error('Failed to fetch provider content:', error);
        setProviderContent([]);
      } finally {
        setIsLoadingContent(false);
      }
    };

    fetchProviderContent();
  }, [selectedProvider, contentType]);

  const handleProviderClick = (providerId: number) => {
    if (selectedProvider === providerId) {
      setSelectedProvider(null);
      setProviderContent([]);
    } else {
      setSelectedProvider(providerId);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  };

  if (!isSectionOpen) return null;

  const hasMoreProviders = STREAMING_PROVIDERS.length > 6;

  return (
    <>
      <section className="py-8 sm:py-12 relative">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center justify-between gap-2.5 mb-5"
          >
            <div className="flex items-center gap-2.5">
              <Globe className="w-4 h-4 text-zinc-500" />
              <h2 className="text-lg sm:text-xl font-medium text-zinc-200">
                Plateformes de Streaming
              </h2>
            </div>
            <button
              onClick={() => setIsSectionOpen(false)}
              className="p-1.5 rounded-lg hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all"
              title="Fermer"
            >
              <X className="w-5 h-5 text-zinc-400 hover:text-zinc-200" />
            </button>
          </motion.div>

          <div
            ref={scrollRef}
            className="flex flex-wrap gap-2 pb-2"
          >
            {visibleProviders.map((provider, index) => {
              const isSelected = selectedProvider === provider.id;
              const logoState = logoStates[provider.id] || 'loading';

              return (
                <motion.button
                  key={`${provider.id}-${index}`}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.02, duration: 0.2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleProviderClick(provider.id)}
                  className={`
                    flex-shrink-0 relative overflow-hidden rounded-full cursor-pointer
                    flex items-center gap-2.5 px-3 py-2 sm:px-4 sm:py-2
                    transition-all duration-150 ease-out
                    ${isSelected
                      ? 'bg-zinc-100 text-zinc-900'
                      : 'bg-zinc-900/80 hover:bg-zinc-800/90 text-zinc-300 hover:text-zinc-100'}
                    border ${isSelected ? 'border-zinc-200' : 'border-zinc-800 hover:border-zinc-700'}
                  `}
                >
                  <div className={`
                    w-5 h-5 sm:w-6 sm:h-6 rounded-full overflow-hidden flex-shrink-0
                    flex items-center justify-center
                    ${logoState === 'loading' ? 'bg-zinc-700' : ''}
                    ${logoState === 'error' ? (isSelected ? 'bg-zinc-300' : 'bg-zinc-700') : ''}
                  `}>
                    {logoState === 'loading' && (
                      <div className="w-full h-full bg-zinc-700 animate-pulse rounded-full" />
                    )}
                    {logoState === 'error' && (
                      <span className={`text-[8px] sm:text-[9px] font-bold ${isSelected ? 'text-zinc-600' : 'text-zinc-400'}`}>
                        {getInitials(provider.name)}
                      </span>
                    )}
                    {logoState !== 'error' && (
                      <img
                        src={`https://image.tmdb.org/t/p/original${provider.logo}`}
                        alt={provider.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onLoad={() => setLogoStates(prev => ({ ...prev, [provider.id]: 'loaded' }))}
                        onError={() => setLogoStates(prev => ({ ...prev, [provider.id]: 'error' }))}
                      />
                    )}
                  </div>
                  <span className={`font-medium text-xs sm:text-sm whitespace-nowrap ${isSelected ? 'text-zinc-900' : ''}`}>
                    {provider.name}
                  </span>
                </motion.button>
              );
            })}

            {hasMoreProviders && (
              <motion.button
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.12, duration: 0.2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowAllProviders(true)}
                className="flex-shrink-0 relative overflow-hidden rounded-full cursor-pointer flex items-center gap-2.5 px-3 py-2 sm:px-4 sm:py-2 transition-all duration-150 ease-out bg-primary/20 hover:bg-primary/30 border border-primary/50 text-primary"
              >
                <span className="font-medium text-sm">
                  +{STREAMING_PROVIDERS.length - 6} plus
                </span>
              </motion.button>
            )}
          </div>

          <AnimatePresence mode="wait">
            {selectedProvider && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="mt-5 overflow-hidden"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-medium text-zinc-200">
                    Top sur {selectedProviderData?.name}
                  </h3>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-0.5 p-0.5 bg-zinc-900 rounded-full border border-zinc-800">
                      <button
                        onClick={() => setContentType('movie')}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 ${contentType === 'movie'
                            ? 'bg-zinc-100 text-zinc-900'
                            : 'text-zinc-500 hover:text-zinc-300'
                          }`}
                      >
                        Films
                      </button>
                      <button
                        onClick={() => setContentType('tv')}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 ${contentType === 'tv'
                            ? 'bg-zinc-100 text-zinc-900'
                            : 'text-zinc-500 hover:text-zinc-300'
                          }`}
                      >
                        Séries
                      </button>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedProvider(null);
                        setProviderContent([]);
                      }}
                      className="p-2 rounded-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 transition-all"
                      aria-label="Fermer"
                    >
                      <X className="w-4 h-4 text-zinc-400" />
                    </button>
                  </div>
                </div>

                <ProviderContentRow items={providerContent} isLoading={isLoadingContent} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      <AnimatePresence>
        {showAllProviders && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[999] bg-black/70 backdrop-blur-md"
              onClick={() => setShowAllProviders(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
              onClick={() => setShowAllProviders(false)}
            >
              <motion.div
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-4xl bg-gradient-to-br from-slate-900/95 via-slate-950/95 to-black/95 border border-primary/40 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-primary/30 backdrop-blur-xl max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                    Toutes les Plateformes
                  </h2>
                  <motion.button
                    onClick={() => setShowAllProviders(false)}
                    whileHover={{ rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 hover:bg-white/10 rounded-lg transition-all"
                  >
                    <X className="w-5 h-5 text-white/70 hover:text-white" />
                  </motion.button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {STREAMING_PROVIDERS.map((provider, index) => (
                    <motion.button
                      key={provider.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.03 }}
                      onClick={() => {
                        handleProviderClick(provider.id);
                        setShowAllProviders(false);
                      }}
                      className="group relative flex flex-col items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/50 transition-all"
                    >
                      <div className="w-12 h-12 rounded-full overflow-hidden shadow-lg border border-white/10">
                        <img
                          src={`https://image.tmdb.org/t/p/w500${provider.logo}`}
                          alt={provider.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                        />
                      </div>
                      <span className="text-sm font-medium text-white text-center">
                        {provider.name}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default function Home() {
  const [heroItems, setHeroItems] = useState<(TMDBMovie | TMDBTV)[]>([]);
  const [popularMovies, setPopularMovies] = useState<TMDBMovie[]>([]);
  const [popularTV, setPopularTV] = useState<TMDBTV[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [trendingRes, moviesRes, tvRes] = await Promise.all([
          tmdbApi.getTrending('all', 'day'),
          tmdbApi.getPopularMovies(1),
          tmdbApi.getPopularTV(1)
        ]);

        const filteredTrending = (trendingRes.results || []).filter(item => 'title' in item || 'name' in item);
        setHeroItems(filteredTrending.slice(0, 10) as (TMDBMovie | TMDBTV)[]);
        setPopularMovies((moviesRes.results || []).slice(0, 20));
        setPopularTV((tvRes.results || []).slice(0, 20));
      } catch (error) {
        console.error('Failed to fetch home data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading && heroItems.length === 0) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative bg-[#050505] text-foreground">
      <div
        className="fixed inset-0 pointer-events-none transition-opacity duration-700"
        style={{
          background: `linear-gradient(180deg, 
            rgba(var(--theme-primary-rgb), 0.15) 0%, 
            var(--background-hex) 40%, 
            var(--background-hex) 60%, 
            rgba(var(--theme-primary-rgb), 0.1) 100%
          )`,
          zIndex: 0
        }}
      />
      <Navbar />
      {/* Content */}
      <div className="relative">
        <HeroCarousel items={heroItems} />

        <div className="container mx-auto px-4 sm:px-6 relative z-10 mt-8">
          <ContinueWatching />

          <WelcomeMessageWidget />

          <LiveStatsSection
            movieCount={854320}
            tvCount={158450}
            animeCount={48200}
          />

          <div className="space-y-12 mt-12 pb-12">
            <section className="relative">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <h2 className="text-xl sm:text-2xl font-bold text-white">Tendances</h2>
                </div>
              </div>
              <MediaGrid items={heroItems} />
            </section>

            <StreamingProvidersSection />

            <section className="relative">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Film className="w-5 h-5 text-primary" />
                  <h2 className="text-xl sm:text-2xl font-bold text-white">Films Populaires</h2>
                </div>
              </div>
              <MediaGrid items={popularMovies} mediaType="movie" />
            </section>

            <section className="relative">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Tv className="w-5 h-5 text-primary" />
                  <h2 className="text-xl sm:text-2xl font-bold text-white">Séries Populaires</h2>
                </div>
              </div>
              <MediaGrid items={popularTV} mediaType="tv" />
            </section>

            <section className="py-10 sm:py-14 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
              <div className="container mx-auto px-6 relative z-10">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-center mb-12"
                >
                  <h2 className="text-3xl font-bold mb-3">Pourquoi CStream ?</h2>
                  <p className="text-muted-foreground">
                    Une expérience de streaming premium et gratuite
                  </p>
                </motion.div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    {
                      icon: Zap,
                      title: "Streaming 4K",
                      desc: "Qualité jusqu'à 4K HDR",
                      color: "text-yellow-500",
                      bg: "from-yellow-500/20 to-amber-500/20",
                      border: "border-yellow-500/20",
                    },
                    {
                      icon: Clock,
                      title: "Nouveautés",
                      desc: "Mise à jour quotidienne",
                      color: "text-blue-500",
                      bg: "from-blue-500/20 to-cyan-500/20",
                      border: "border-blue-500/20",
                    },
                    {
                      icon: Heart,
                      title: "Favoris",
                      desc: "Sauvegardez vos contenus",
                      color: "text-pink-500",
                      bg: "from-pink-500/20 to-rose-500/20",
                      border: "border-pink-500/20",
                    },
                    {
                      icon: Users,
                      title: "Communauté",
                      desc: "Rejoignez notre Discord",
                      color: "text-indigo-500",
                      bg: "from-indigo-500/20 to-purple-500/20",
                      border: "border-indigo-500/20",
                    },
                  ].map((feature, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      whileHover={{ y: -8, scale: 1.02 }}
                      className={`p-6 rounded-2xl bg-gradient-to-br ${feature.bg} border ${feature.border} backdrop-blur-sm transition-all duration-300 hover:shadow-xl`}
                    >
                      <div
                        className={`w-14 h-14 rounded-2xl bg-background/80 flex items-center justify-center mb-5 ${feature.color}`}
                      >
                        <feature.icon className="w-7 h-7" />
                      </div>
                      <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                      <p className="text-muted-foreground text-sm">{feature.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>

            <ReviewsMarquee />

            <section className="py-12 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-gray-500/5 via-transparent to-transparent" />
              <div className="container mx-auto px-6 relative z-10">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="max-w-2xl mx-auto"
                >
                  <ShareWidget title="CStream Premium" type="tv" id={1} />

                  <motion.a
                    href="https://ko-fi.com/cstream"
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{
                      scale: 1.05,
                      backgroundColor: '#2a2a2a',
                      boxShadow: '0 0 20px rgba(255, 255, 255, 0.1)'
                    }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-[#1a1a1a] text-white rounded-lg text-[15px] font-medium transition-all duration-250 border border-white/10 shadow-xl mt-6"
                  >
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    Soutenir sur Ko-fi
                  </motion.a>
                </motion.div>
              </div>
            </section>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

const ReviewsMarquee = () => {
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    const fetchReviews = async () => {
      console.log('Fetching global reviews for home...');
      // Note: In case the table name is different or not yet initialized in some environments,
      // we'll add a safety check or use mock data as fallback for UI testing.
      try {
        const { data, error } = await supabase
          .from('reviews')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) {
          console.error('Error fetching global reviews:', error);
          // Fallback mock data if the table doesn't exist yet or is empty
          setReviews([
            {
              quote: "Meilleure plateforme de streaming que j'ai testée. La qualité 4K est incroyable !",
              name: "Julien R.",
              avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Julien",
              rating: 5,
              title: "Membre Premium"
            },
            {
              quote: "L'assistant CAi est super utile pour trouver des nouveaux animes à regarder.",
              name: "Sophie M.",
              avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie",
              rating: 5,
              title: "Fan d'Anime"
            },
            {
              quote: "Interface fluide et rapide. On sent la qualité CDZ !",
              name: "Thomas L.",
              avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Thomas",
              rating: 5,
              title: "Utilisateur Fidèle"
            },
            {
              quote: "Le catalogue est gigantesque, je ne m'ennuie jamais.",
              name: "Marie D.",
              avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Marie",
              rating: 4,
              title: "Membre CStream"
            }
          ]);
          return;
        }

        if (data && data.length > 0) {
          console.log('Global reviews fetched:', data.length, data);
          const mappedReviews = data.map((r: any) => ({
            quote: r.comment,
            name: r.username || 'Utilisateur CStream',
            avatar: r.profile_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${r.user_id}`,
            rating: Math.ceil(r.rating / 2),
            title: r.badge || "Membre CStream"
          }));
          setReviews(mappedReviews);
        } else {
          // Fallback if table is empty
          setReviews([
            {
              quote: "Soyez le premier à laisser un avis sur CStream !",
              name: "CDZ",
              avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=CDZ",
              rating: 5,
              title: "Fondateur"
            }
          ]);
        }
      } catch (err) {
        console.error('Unexpected error fetching reviews:', err);
      }
    };
    fetchReviews();
  }, []);

  if (reviews.length === 0) return null;

  return (
    <section className="py-12 bg-black/20">
      <div className="container mx-auto px-4 mb-8">
        <h2 className="text-3xl font-bold flex items-center gap-3">
          <Star className="w-8 h-8 text-yellow-500 fill-yellow-500" />
          Avis de la Communauté
        </h2>
      </div>
      <InfiniteMovingCards items={reviews} speed="slow" />
    </section>
  );
};
