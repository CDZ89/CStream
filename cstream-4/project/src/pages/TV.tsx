import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { tmdbApi, TMDBTV } from '@/lib/tmdb';
import { MediaGrid } from '@/components/MediaGrid';
import { Navbar } from '@/components/Navbar';
import { LoadMoreButton } from '@/components/LoadMoreButton';
import { MediaGridSkeleton } from '@/components/MediaGridSkeleton';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { SEO } from '@/components/SEO';
import { useI18n } from '@/lib/i18n';
import {
  Tv, TrendingUp, Star, Calendar, Clock, Filter, X,
  SlidersHorizontal, ChevronDown, Sparkles, Search, Play
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Genre {
  id: number;
  name: string;
}

const TVPage = () => {
  const { t } = useI18n();
  const [searchParams] = useSearchParams();
  const urlGenre = searchParams.get('genre');

  const [shows, setShows] = useState<TMDBTV[]>([]);
  const [category, setCategory] = useState('popular');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [genres, setGenres] = useState<Genre[]>([]);

  const [selectedGenre, setSelectedGenre] = useState<string>(urlGenre || 'all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<string>('popularity.desc');
  const [searchQuery, setSearchQuery] = useState('');

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => currentYear - i);

  useEffect(() => {
    if (urlGenre) {
      setSelectedGenre(urlGenre);
      setShowFilters(true);
    }
  }, [urlGenre]);

  useEffect(() => {
    const loadGenres = async () => {
      try {
        const data = await tmdbApi.getTVGenres() as { genres: Genre[] };
        setGenres(data.genres || []);
      } catch (error) {
        console.error('Failed to load genres:', error);
      }
    };
    loadGenres();
  }, []);

  const fetchShows = useCallback(async (pageNum: number, isLoadMore = false) => {
    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    try {
      let data;

      if (selectedGenre !== 'all' || selectedYear !== 'all' || minRating > 0) {
        const params: Record<string, string | number> = {
          page: pageNum,
          sort_by: sortBy,
        };

        if (selectedGenre !== 'all') {
          params.with_genres = selectedGenre;
        }
        if (selectedYear !== 'all') {
          params.first_air_date_year = selectedYear;
        }
        if (minRating > 0) {
          params['vote_average.gte'] = minRating;
        }

        data = await tmdbApi.discoverTV(params);
      } else {
        switch (category) {
          case 'top_rated':
            data = await tmdbApi.getTopRatedTV(pageNum);
            break;
          case 'airing_today':
            data = await tmdbApi.getAiringTodayTV(pageNum);
            break;
          case 'on_the_air':
            data = await tmdbApi.getOnTheAirTV(pageNum);
            break;
          default:
            data = await tmdbApi.getPopularTV(pageNum);
        }
      }

      if (isLoadMore) {
        setShows(prev => [...prev, ...(data.results || [])]);
      } else {
        setShows(data.results || []);
      }
      setTotalPages(Math.min(data.total_pages || 1, 500));
      setTotalResults(data.total_results || 0);
    } catch (error) {
      console.error('Failed to fetch TV shows:', error);
    } finally {
      if (isLoadMore) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  }, [category, selectedGenre, selectedYear, minRating, sortBy]);

  useEffect(() => {
    setPage(1);
    setShows([]);
  }, [category, selectedGenre, selectedYear, minRating, sortBy]);

  useEffect(() => {
    fetchShows(page, page > 1);
  }, [page, fetchShows]);

  const filteredShows = useMemo(() => {
    if (!searchQuery.trim()) return shows;

    const query = searchQuery.toLowerCase();
    return shows.filter(s =>
      s.name?.toLowerCase().includes(query) ||
      s.original_name?.toLowerCase().includes(query)
    );
  }, [shows, searchQuery]);

  const handleLoadMore = () => {
    if (page < totalPages) {
      setPage(page + 1);
      setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }, 100);
    }
  };

  const resetFilters = () => {
    setSelectedGenre('all');
    setSelectedYear('all');
    setMinRating(0);
    setSortBy('popularity.desc');
    setSearchQuery('');
  };

  const hasActiveFilters = selectedGenre !== 'all' || selectedYear !== 'all' || minRating > 0 || searchQuery.trim();

  const categories = [
    { id: 'popular', label: t('tv.popular'), icon: TrendingUp },
    { id: 'top_rated', label: t('tv.topRated'), icon: Star },
    { id: 'airing_today', label: t('tv.airingToday'), icon: Play },
    { id: 'on_the_air', label: t('tv.onTheAir'), icon: Tv },
  ];

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-color)] relative overflow-hidden transition-colors duration-500">
      <SEO
        title="Séries TV - CStream"
        description="Regardez les meilleures séries TV en streaming gratuit. Drames, thrillers, comédies et plus. Tous les épisodes disponibles en VF et VOSTFR."
        keywords="séries TV streaming, séries gratuit, séries HD, drama, thriller, comédie, VF, VOSTFR"
        url="/tv"
        type="website"
      />
      {/* Enhanced background with animated gradients */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute inset-0 bg-[var(--bg-gradient)] opacity-40" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,var(--primary),transparent_50%)] opacity-[0.03]" />
      </div>

      <Navbar />

      <section className="relative pt-32 pb-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--primary)]/10 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-noise opacity-[0.02]" />

        <div className="relative container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--primary)]/10 border border-[var(--border-color)] mb-8 backdrop-blur-md"
          >
            <Tv className="w-4 h-4 text-[var(--primary)]" />
            <span className="text-xs font-bold tracking-wider uppercase text-[var(--primary)]/80">Séries Originales</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-black mb-6 tracking-tighter"
          >
            <span className="bg-gradient-to-r from-blue-400 via-[var(--primary)] to-blue-400 bg-clip-text text-transparent animate-gradient">
              {t('tv.title')}
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground text-lg max-w-2xl mx-auto font-medium leading-relaxed"
          >
            {t('tv.description')}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex justify-center gap-6 mt-10"
          >
            <div className="px-6 py-3 rounded-2xl bg-[var(--card-bg)] border border-[var(--border-color)] backdrop-blur-md transition-all hover:bg-white/5">
              <span className="text-[var(--primary)] font-black text-xl">{totalResults.toLocaleString()}</span>
              <span className="text-muted-foreground ml-2 font-bold text-sm uppercase tracking-tight">Séries Premium</span>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col gap-8 mb-12">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6">
              <div className="flex flex-wrap gap-2 p-1.5 bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] backdrop-blur-sm">
                {categories.map((cat, idx) => (
                  <motion.div
                    key={cat.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Button
                      variant={category === cat.id ? 'default' : 'ghost'}
                      onClick={() => setCategory(cat.id)}
                      className={cn(
                        "gap-2 rounded-xl transition-all font-bold px-6",
                        category === cat.id
                          ? "bg-[var(--primary)] text-white shadow-xl shadow-[var(--primary)]/20"
                          : "hover:bg-[var(--primary)]/10 text-muted-foreground"
                      )}
                      style={category === cat.id ? { backgroundColor: 'var(--primary)' } : {}}
                    >
                      <cat.icon className="w-4 h-4" />
                      {cat.label}
                    </Button>
                  </motion.div>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <div className="relative flex-1 lg:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Titre de la série..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-11 bg-secondary/30 border-white/5 rounded-xl focus:ring-primary/20 transition-all"
                  />
                </div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <Button
                    variant={showFilters ? 'default' : 'outline'}
                    onClick={() => setShowFilters(!showFilters)}
                    className={cn(
                      "h-11 px-6 rounded-xl gap-2 font-bold transition-all",
                      showFilters ? "bg-primary text-primary-foreground" : "border-white/10"
                    )}
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                    {t('common.filters')}
                    {hasActiveFilters && (
                      <Badge variant="secondary" className="ml-1 bg-white/20">
                        {[selectedGenre !== 'all', selectedYear !== 'all', minRating > 0, searchQuery.trim()].filter(Boolean).length}
                      </Badge>
                    )}
                  </Button>
                </motion.div>
              </div>
            </div>

            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="glass-card p-6 space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Filter className="w-5 h-5 text-blue-500" />
                        Filtres avancés
                      </h3>
                      {hasActiveFilters && (
                        <Button variant="ghost" size="sm" onClick={resetFilters} className="text-muted-foreground hover:text-white">
                          <X className="w-4 h-4 mr-1" />
                          {t('common.reset')}
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                          <Search className="w-4 h-4 text-muted-foreground" />
                          {t('common.search')}
                        </label>
                        <Input
                          placeholder="Titre de la série..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="rounded-lg bg-secondary/50"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-muted-foreground" />
                          {t('filter.genre')}
                        </label>
                        <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                          <SelectTrigger className="rounded-lg bg-secondary/50">
                            <SelectValue placeholder={t('filter.allGenres')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">{t('filter.allGenres')}</SelectItem>
                            {genres.map((genre) => (
                              <SelectItem key={genre.id} value={String(genre.id)}>
                                {genre.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          {t('filter.year')}
                        </label>
                        <Select value={selectedYear} onValueChange={setSelectedYear}>
                          <SelectTrigger className="rounded-lg bg-secondary/50">
                            <SelectValue placeholder={t('filter.allYears')} />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            <SelectItem value="all">{t('filter.allYears')}</SelectItem>
                            {years.map((year) => (
                              <SelectItem key={year} value={String(year)}>
                                {year}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                          <Star className="w-4 h-4 text-muted-foreground" />
                          {t('filter.minRating')}: {minRating > 0 ? minRating.toFixed(1) : t('common.all')}
                        </label>
                        <Slider
                          value={[minRating]}
                          onValueChange={([val]) => setMinRating(val)}
                          min={0}
                          max={9}
                          step={0.5}
                          className="py-4"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-muted-foreground" />
                          {t('filter.sortBy')}
                        </label>
                        <Select value={sortBy} onValueChange={setSortBy}>
                          <SelectTrigger className="rounded-lg bg-secondary/50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="popularity.desc">{t('sort.popularityDesc')}</SelectItem>
                            <SelectItem value="popularity.asc">{t('sort.popularityAsc')}</SelectItem>
                            <SelectItem value="vote_average.desc">{t('sort.ratingDesc')}</SelectItem>
                            <SelectItem value="vote_average.asc">{t('sort.ratingAsc')}</SelectItem>
                            <SelectItem value="first_air_date.desc">{t('sort.dateDesc')}</SelectItem>
                            <SelectItem value="first_air_date.asc">{t('sort.dateAsc')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {hasActiveFilters && (
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50">
                        <span className="text-sm text-muted-foreground">{t('filter.active')}:</span>
                        {selectedGenre !== 'all' && (
                          <Badge variant="secondary" className="gap-1">
                            {genres.find(g => String(g.id) === selectedGenre)?.name}
                            <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedGenre('all')} />
                          </Badge>
                        )}
                        {selectedYear !== 'all' && (
                          <Badge variant="secondary" className="gap-1">
                            {selectedYear}
                            <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedYear('all')} />
                          </Badge>
                        )}
                        {minRating > 0 && (
                          <Badge variant="secondary" className="gap-1">
                            Note ≥ {minRating}
                            <X className="w-3 h-3 cursor-pointer" onClick={() => setMinRating(0)} />
                          </Badge>
                        )}
                        {searchQuery.trim() && (
                          <Badge variant="secondary" className="gap-1">
                            "{searchQuery}"
                            <X className="w-3 h-3 cursor-pointer" onClick={() => setSearchQuery('')} />
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-4 text-sm text-muted-foreground"
          >
            {totalResults.toLocaleString()} {t('tv.found')}
          </motion.div>

          {loading && shows.length === 0 ? (
            <MediaGridSkeleton count={20} />
          ) : (
            <>
              <MediaGrid items={filteredShows} mediaType="tv" />

              {!searchQuery.trim() && page < totalPages && (
                <LoadMoreButton
                  onClick={handleLoadMore}
                  isLoading={loadingMore}
                  hasMore={page < totalPages}
                  itemsShowing={shows.length}
                  totalItems={totalResults}
                />
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default TVPage;
