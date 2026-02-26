import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useWatchHistory, WatchHistoryItem } from '@/hooks/useWatchHistory';
import { useAuth } from '@/hooks/useAuth';
import { tmdbApi } from '@/lib/tmdb';
import { useI18n, TMDB_LANGUAGE_MAP } from '@/lib/i18n';
import { 
  Play, Clock, X, ChevronRight, ChevronLeft, Crown, Shield, Star, Film, 
  Tv, Sparkles, Filter, BarChart3, Timer, Eye, Trash2, CalendarDays,
  TrendingUp, Zap, Award, Heart, Gem, Gavel, Edit3, User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, FreeMode } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/free-mode';

const SkeletonCard = () => (
  <div className="w-[130px] sm:w-[145px] md:w-[165px] lg:w-[175px] animate-pulse flex-shrink-0">
    <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-secondary/50 border border-border/50">
      <div className="absolute inset-0 bg-gradient-to-t from-card/90 via-transparent to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-3.5">
        <div className="h-4 bg-secondary/50 rounded-lg mb-2 w-3/4" />
        <div className="h-3 bg-secondary/30 rounded-lg w-1/2" />
      </div>
    </div>
  </div>
);

const ROLE_CONFIG = {
  creator: {
    greetingKey: 'role.creator' as const,
    icon: Gem,
    color: 'from-primary to-primary/60',
    textColor: 'text-primary',
    borderColor: 'border-primary/30',
    glowColor: 'shadow-primary/30',
    bgGlow: 'from-primary/20 via-primary/10 to-primary/20',
    particles: true,
  },
  super_admin: {
    greetingKey: 'role.superAdmin' as const,
    icon: Crown,
    color: 'from-yellow-400 via-amber-500 to-orange-500',
    textColor: 'text-amber-400',
    borderColor: 'border-amber-500/30',
    glowColor: 'shadow-amber-500/30',
    bgGlow: 'from-amber-500/20 via-yellow-500/10 to-orange-500/20',
    particles: true,
  },
  admin: {
    greetingKey: 'role.admin' as const,
    icon: Shield,
    color: 'from-red-500 via-rose-500 to-red-600',
    textColor: 'text-red-400',
    borderColor: 'border-red-500/30',
    glowColor: 'shadow-red-500/20',
    bgGlow: 'from-red-500/15 via-rose-500/10 to-red-600/15',
    particles: false,
  },
  moderator: {
    greetingKey: 'role.moderator' as const,
    icon: Gavel,
    color: 'from-emerald-500 via-teal-500 to-cyan-500',
    textColor: 'text-teal-400',
    borderColor: 'border-teal-500/30',
    glowColor: 'shadow-teal-500/20',
    bgGlow: 'from-teal-500/15 via-emerald-500/10 to-cyan-500/15',
    particles: false,
  },
  editor: {
    greetingKey: 'role.editor' as const,
    icon: Edit3,
    color: 'from-blue-500 via-indigo-500 to-purple-500',
    textColor: 'text-blue-400',
    borderColor: 'border-blue-500/30',
    glowColor: 'shadow-blue-500/20',
    bgGlow: 'from-blue-500/15 via-indigo-500/10 to-purple-500/15',
    particles: false,
  },
  member: {
    greetingKey: '' as const,
    icon: User,
    color: 'from-zinc-500 to-zinc-600',
    textColor: 'text-zinc-400',
    borderColor: 'border-zinc-500/20',
    glowColor: 'shadow-zinc-500/10',
    bgGlow: 'from-zinc-500/10 to-zinc-600/10',
    particles: false,
  },
};

const getTimeGreeting = (t: (key: any) => string) => {
  const hour = new Date().getHours();
  if (hour >= 18) return t('greeting.evening');
  if (hour >= 12) return t('greeting.afternoon');
  if (hour < 6) return t('greeting.night');
  return t('greeting.morning');
};

const formatRelativeTime = (dateString: string, t: (key: any) => string, language: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  const diffWeeks = Math.floor(diffDays / 7);

  if (diffMins < 1) return t('time.justNow');
  if (diffMins < 60) return t('time.minutesAgo').replace('{n}', String(diffMins));
  if (diffHours < 24) return t('time.hoursAgo').replace('{n}', String(diffHours));
  if (diffDays < 7) return t('time.daysAgo').replace('{n}', String(diffDays));
  if (diffWeeks < 4) return t('time.weeksAgo').replace('{n}', String(diffWeeks));
  const locale = TMDB_LANGUAGE_MAP[language as keyof typeof TMDB_LANGUAGE_MAP] || 'en-US';
  return date.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
};

type FilterType = 'all' | 'movie' | 'tv' | 'anime';

const WatchStats = ({ history }: { history: WatchHistoryItem[] }) => {
  const { t } = useI18n();
  const stats = useMemo(() => {
    const movies = history.filter(h => h.media_type === 'movie').length;
    const series = history.filter(h => h.media_type === 'tv').length;
    const anime = history.filter(h => h.media_type === 'anime').length;
    const avgProgress = history.length > 0 
      ? Math.round(history.reduce((acc, h) => acc + (h.progress || 0), 0) / history.length) 
      : 0;
    const recentlyWatched = history.filter(h => {
      const diff = Date.now() - new Date(h.updated_at).getTime();
      return diff < 24 * 60 * 60 * 1000;
    }).length;

    return { movies, series, anime, avgProgress, recentlyWatched, total: history.length };
  }, [history]);

  if (stats.total === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap items-center gap-2 sm:gap-3 mb-6"
    >
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20 backdrop-blur-sm">
        <BarChart3 className="w-3.5 h-3.5 text-violet-400" />
        <span className="text-xs font-medium text-violet-300">{t('stats.totalTitles').replace('{n}', String(stats.total))}</span>
      </div>
      
      {stats.movies > 0 && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <Film className="w-3 h-3 text-blue-400" />
          <span className="text-[11px] text-blue-300">{stats.movies}</span>
        </div>
      )}
      
      {stats.series > 0 && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <Tv className="w-3 h-3 text-emerald-400" />
          <span className="text-[11px] text-emerald-300">{stats.series}</span>
        </div>
      )}
      
      {stats.anime > 0 && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-pink-500/10 border border-pink-500/20">
          <Sparkles className="w-3 h-3 text-pink-400" />
          <span className="text-[11px] text-pink-300">{stats.anime}</span>
        </div>
      )}

      {stats.recentlyWatched > 0 && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <Zap className="w-3 h-3 text-amber-400" />
          <span className="text-[11px] text-amber-300">{t('stats.watchedToday').replace('{n}', String(stats.recentlyWatched))}</span>
        </div>
      )}
      
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10">
        <Timer className="w-3 h-3 text-white/60" />
        <span className="text-[11px] text-white/50">{t('stats.avgProgress').replace('{n}', String(stats.avgProgress))}</span>
      </div>
    </motion.div>
  );
};

const filterStyles = {
  all: {
    active: 'bg-violet-500/20 text-violet-400 border border-violet-500/30',
    badge: 'bg-violet-500/30',
  },
  movie: {
    active: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    badge: 'bg-blue-500/30',
  },
  tv: {
    active: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    badge: 'bg-emerald-500/30',
  },
  anime: {
    active: 'bg-pink-500/20 text-pink-400 border border-pink-500/30',
    badge: 'bg-pink-500/30',
  },
};

const FilterTabs = ({ 
  activeFilter, 
  onFilterChange,
  history 
}: { 
  activeFilter: FilterType; 
  onFilterChange: (filter: FilterType) => void;
  history: WatchHistoryItem[];
}) => {
  const counts = useMemo(() => ({
    all: history.length,
    movie: history.filter(h => h.media_type === 'movie').length,
    tv: history.filter(h => h.media_type === 'tv').length,
    anime: history.filter(h => h.media_type === 'anime').length,
  }), [history]);

  const { t } = useI18n();
  const filters: { key: FilterType; label: string; icon: React.ElementType }[] = [
    { key: 'all', label: t('common.all'), icon: Eye },
    { key: 'movie', label: t('nav.movies'), icon: Film },
    { key: 'tv', label: t('nav.tv'), icon: Tv },
    { key: 'anime', label: t('nav.anime'), icon: Sparkles },
  ];

  return (
    <div className="flex items-center gap-1.5 p-1 bg-white/[0.03] rounded-xl border border-white/[0.06] backdrop-blur-sm">
      {filters.map(({ key, label, icon: Icon }) => {
        const count = counts[key];
        const isActive = activeFilter === key;
        const styles = filterStyles[key];
        
        if (key !== 'all' && count === 0) return null;
        
        return (
          <button
            key={key}
            onClick={() => onFilterChange(key)}
            className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 ${
              isActive
                ? styles.active
                : 'text-white/50 hover:text-white/80 hover:bg-white/5'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{label}</span>
            {count > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                isActive ? styles.badge : 'bg-white/10'
              }`}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

const VisitorGreetingCard = () => {
  const { t } = useI18n();
  const timeGreeting = getTimeGreeting(t);

  return (
    <motion.div 
      initial={{ opacity: 0, y: -15, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      className="relative overflow-hidden mb-8 p-5 sm:p-6 rounded-2xl border border-primary/20 backdrop-blur-xl"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 opacity-50" />
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent" />
      
      <div className="relative flex items-center gap-4 sm:gap-5">
        <motion.div 
          whileHover={{ scale: 1.05, rotate: 5 }}
          className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-xl shadow-primary/20"
        >
          <div className="absolute inset-0 rounded-2xl bg-white/10" />
          <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 text-white drop-shadow-lg relative z-10" />
        </motion.div>
        
        <div className="flex-1 min-w-0">
          <motion.p 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl sm:text-2xl font-bold text-primary"
          >
            {timeGreeting} !
          </motion.p>
          <motion.p 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-sm text-white/50 mt-1"
          >
            Bienvenue sur CStream, profitez de votre visionnage
          </motion.p>
        </div>
      </div>
    </motion.div>
  );
};

const RoleGreetingCard = ({ 
  role, 
  username 
}: { 
  role: keyof typeof ROLE_CONFIG; 
  username: string;
}) => {
  const { t } = useI18n();
  const config = ROLE_CONFIG[role] || ROLE_CONFIG.member;
  const timeGreeting = getTimeGreeting(t);
  const Icon = config.icon;

  return (
    <motion.div 
      initial={{ opacity: 0, y: -15, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      className={`relative overflow-hidden mb-8 p-5 sm:p-6 rounded-2xl border ${config.borderColor} backdrop-blur-xl`}
    >
      <div className={`absolute inset-0 bg-gradient-to-r ${config.bgGlow} opacity-50`} />
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent" />
      
      {config.particles && (
        <>
          <motion.div
            animate={{ y: [-20, 20], x: [-10, 10], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-4 right-8 w-2 h-2 rounded-full bg-white/30 blur-sm"
          />
          <motion.div
            animate={{ y: [20, -20], x: [10, -10], opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            className="absolute bottom-4 right-16 w-1.5 h-1.5 rounded-full bg-white/20 blur-sm"
          />
          <motion.div
            animate={{ y: [-15, 15], x: [-5, 5], opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
            className="absolute top-1/2 right-24 w-1 h-1 rounded-full bg-white/40"
          />
        </>
      )}

      <div className="relative flex items-center gap-4 sm:gap-5">
        <motion.div 
          whileHover={{ scale: 1.05, rotate: 5 }}
          className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br ${config.color} flex items-center justify-center shadow-xl ${config.glowColor}`}
        >
          <div className="absolute inset-0 rounded-2xl bg-white/10" />
          <Icon className="w-7 h-7 sm:w-8 sm:h-8 text-white drop-shadow-lg relative z-10" />
          {config.particles && (
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 rounded-2xl border-2 border-white/20"
            />
          )}
        </motion.div>
        
        <div className="flex-1 min-w-0">
          <motion.p 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className={`text-xl sm:text-2xl font-bold ${config.textColor}`}
          >
            {timeGreeting}, <span className="text-white">{config.greetingKey ? t(config.greetingKey) : ''}</span> !
          </motion.p>
          <motion.p 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-sm text-white/50 mt-1"
          >
            Ravi de vous revoir, <span className="text-white/70 font-medium">{username}</span>
          </motion.p>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <motion.div
            whileHover={{ scale: 1.1 }}
            className={`p-2 rounded-xl bg-gradient-to-br ${config.color} bg-opacity-20 border ${config.borderColor}`}
          >
            <Award className="w-5 h-5 text-white/80" />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export const ContinueWatching = () => {
  const { user, profile, role } = useAuth();
  const { history, loading, removeFromHistory, clearHistory } = useWatchHistory();
  const navigate = useNavigate();
  const { t, language } = useI18n();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const filteredHistory = useMemo(() => {
    if (activeFilter === 'all') return history;
    return history.filter(h => h.media_type === activeFilter);
  }, [history, activeFilter]);

  const showGreeting = true;
  
  if (loading) {
    return (
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4 md:px-6">
          {showGreeting && (
            user ? (
              <RoleGreetingCard role={role as keyof typeof ROLE_CONFIG} username={profile?.username || user.email?.split('@')[0] || 'Utilisateur'} />
            ) : (
              <VisitorGreetingCard />
            )
          )}
          <div className="flex items-center gap-4 mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/30 to-purple-600/30 rounded-2xl blur-xl animate-pulse" />
              <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-600/20 flex items-center justify-center border border-violet-500/20">
                <Clock className="w-6 h-6 text-violet-400" />
              </div>
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">Reprendre le visionnage</h2>
              <p className="text-sm text-white/40 mt-0.5">Chargement de votre historique...</p>
            </div>
          </div>
          <div className="flex gap-3 md:gap-4 overflow-hidden">
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </div>
      </section>
    );
  }
  
  if (history.length === 0) {
    return null;
  }
  
  const getMediaLink = (item: WatchHistoryItem) => {
    if (item.media_type === 'movie') {
      return `/movie/${item.tmdb_id}`;
    }
    if (item.season_number && item.episode_number) {
      return `/tv/${item.tmdb_id}?season=${item.season_number}&episode=${item.episode_number}`;
    }
    return `/tv/${item.tmdb_id}`;
  };

  const getMediaTypeLabel = (type: string) => {
    switch (type) {
      case 'movie': return 'Film';
      case 'anime': return 'Anime';
      case 'tv': return 'Série';
      default: return 'Série';
    }
  };

  const getMediaTypeColor = (type: string) => {
    switch (type) {
      case 'movie': return 'from-blue-500 to-blue-600';
      case 'anime': return 'from-pink-500 to-rose-600';
      case 'tv': return 'from-violet-500 to-purple-600';
      default: return 'from-violet-500 to-purple-600';
    }
  };

  const getMediaTypeBadgeClass = (type: string) => {
    switch (type) {
      case 'movie': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'anime': return 'bg-pink-500/20 text-pink-400 border-pink-500/30';
      case 'tv': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      default: return 'bg-violet-500/20 text-violet-400 border-violet-500/30';
    }
  };

  const getLanguageBadge = (item: WatchHistoryItem) => {
    if (item.language) {
      return item.language.toUpperCase();
    }
    return item.media_type === 'movie' ? 'VF' : 'VOSTFR';
  };

  return (
    <section className="py-8 md:py-12 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.02] via-transparent to-transparent pointer-events-none" />
      
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        {showGreeting && (
          user ? (
            <RoleGreetingCard role={role as keyof typeof ROLE_CONFIG} username={profile?.username || user.email?.split('@')[0] || 'Utilisateur'} />
          ) : (
            <VisitorGreetingCard />
          )
        )}

        <WatchStats history={history} />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-primary/10 rounded-2xl blur-xl" />
              <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20 backdrop-blur-sm">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              </div>
            </motion.div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">Reprendre le visionnage</h2>
              {filteredHistory.length > 0 && (
                <p className="text-sm text-white/40 mt-0.5">
                  {filteredHistory.length} titre{filteredHistory.length > 1 ? 's' : ''} 
                  {activeFilter !== 'all' && ` (${activeFilter === 'movie' ? 'films' : activeFilter === 'tv' ? 'séries' : 'anime'})`}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {history.length > 0 && (
              <>
                <FilterTabs 
                  activeFilter={activeFilter} 
                  onFilterChange={setActiveFilter}
                  history={history}
                />
                
                <div className="hidden sm:flex items-center gap-2">
                  <button 
                    className="continue-prev w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/[0.05] border border-white/[0.1] hover:bg-violet-500/10 hover:border-violet-500/30 flex items-center justify-center text-white/50 hover:text-violet-400 transition-all duration-300 disabled:opacity-30 active:scale-95"
                    aria-label="Previous"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button 
                    className="continue-next w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/[0.05] border border-white/[0.1] hover:bg-violet-500/10 hover:border-violet-500/30 flex items-center justify-center text-white/50 hover:text-violet-400 transition-all duration-300 disabled:opacity-30 active:scale-95"
                    aria-label="Next"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                {history.length > 3 && (
                  <div className="relative">
                    <button
                      onClick={() => setShowClearConfirm(!showClearConfirm)}
                      className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-red-500/10 hover:border-red-500/30 text-white/40 hover:text-red-400 transition-all duration-300"
                      title="Effacer l'historique"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    
                    <AnimatePresence>
                      {showClearConfirm && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9, y: -10 }}
                          className="absolute right-0 top-full mt-2 p-4 rounded-xl bg-zinc-900/95 border border-red-500/30 backdrop-blur-xl shadow-2xl z-50 min-w-[200px]"
                        >
                          <p className="text-sm text-white mb-3">Effacer tout l'historique ?</p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                clearHistory();
                                setShowClearConfirm(false);
                              }}
                              className="flex-1 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/30 transition-colors"
                            >
                              Confirmer
                            </button>
                            <button
                              onClick={() => setShowClearConfirm(false)}
                              className="flex-1 px-3 py-1.5 rounded-lg bg-white/5 text-white/60 text-sm hover:bg-white/10 transition-colors"
                            >
                              Annuler
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {filteredHistory.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 px-6 rounded-3xl bg-gradient-to-b from-white/[0.02] to-transparent border border-white/[0.06]"
          >
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-purple-600/20 rounded-3xl blur-2xl" />
              <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-500/10 to-purple-600/10 flex items-center justify-center border border-violet-500/20">
                <Film className="w-10 h-10 text-violet-400/80" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              {activeFilter === 'all' ? 'Aucun historique' : `Aucun ${activeFilter === 'movie' ? 'film' : activeFilter === 'tv' ? 'série' : 'anime'}`}
            </h3>
            <p className="text-white/50 text-center mb-6 max-w-md text-sm leading-relaxed">
              {activeFilter === 'all' 
                ? 'Regardez des films ou des séries pour les retrouver ici et reprendre là où vous vous êtes arrêté.'
                : `Vous n'avez pas encore regardé de ${activeFilter === 'movie' ? 'films' : activeFilter === 'tv' ? 'séries' : 'animes'}.`
              }
            </p>
            <button 
              onClick={() => navigate(activeFilter === 'anime' ? '/anime' : activeFilter === 'tv' ? '/tv' : '/movies')}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-semibold hover:from-violet-400 hover:to-purple-500 transition-all duration-300 shadow-xl shadow-violet-500/25 hover:shadow-violet-500/40 hover:-translate-y-1"
            >
              Découvrir {activeFilter === 'movie' ? 'des films' : activeFilter === 'tv' ? 'des séries' : activeFilter === 'anime' ? 'des animes' : 'du contenu'}
            </button>
          </motion.div>
        ) : (
          <div className="relative -mx-2">
            <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-background via-background/80 to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background via-background/80 to-transparent z-10 pointer-events-none" />
            <Swiper
              modules={[Navigation, FreeMode]}
              spaceBetween={14}
              slidesPerView="auto"
              freeMode={{ enabled: true, sticky: false }}
              navigation={{
                prevEl: '.continue-prev',
                nextEl: '.continue-next',
              }}
              breakpoints={{
                320: { slidesPerView: 2.3, spaceBetween: 10 },
                400: { slidesPerView: 2.5, spaceBetween: 10 },
                480: { slidesPerView: 2.8, spaceBetween: 12 },
                640: { slidesPerView: 3.5, spaceBetween: 14 },
                768: { slidesPerView: 4.2, spaceBetween: 14 },
                1024: { slidesPerView: 5.2, spaceBetween: 16 },
                1280: { slidesPerView: 6, spaceBetween: 16 },
                1536: { slidesPerView: 7, spaceBetween: 18 },
              }}
              className="!overflow-visible !px-2"
            >
              <AnimatePresence mode="popLayout">
                {filteredHistory.slice(0, 15).map((item, index) => (
                  <SwiperSlide key={item.id} className="!w-auto">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: index * 0.03, duration: 0.4 }}
                      className="group relative w-[130px] sm:w-[145px] md:w-[165px] lg:w-[175px]"
                    >
                      <Link to={getMediaLink(item)} className="block">
                        <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-zinc-900/50 transition-all duration-500 border border-white/[0.06] group-hover:border-violet-500/40 group-hover:-translate-y-2 group-hover:shadow-2xl group-hover:shadow-violet-500/15">
                          {item.poster_path ? (
                            <img
                              src={tmdbApi.getImageUrl(item.poster_path, 'w300')}
                              alt={item.title || 'Media'}
                              className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-violet-500/20 to-purple-600/20">
                              <Film className="w-10 h-10 text-violet-400/60 mb-2" />
                              <span className="text-[10px] text-white/40 text-center px-2 line-clamp-2">{item.title || 'Chargement...'}</span>
                            </div>
                          )}
                          
                          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent" />
                          
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                            <motion.div 
                              initial={{ scale: 0.8, opacity: 0 }}
                              whileHover={{ scale: 1.05 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className="w-14 h-14 rounded-2xl bg-white/95 flex items-center justify-center shadow-2xl backdrop-blur-sm"
                            >
                              <Play className="w-6 h-6 text-zinc-900 fill-zinc-900 ml-0.5" />
                            </motion.div>
                          </div>
                          
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              removeFromHistory(item.id);
                            }}
                            className="absolute top-2.5 right-2.5 w-7 h-7 rounded-lg bg-black/50 backdrop-blur-sm text-white/60 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all z-10"
                            aria-label="Remove"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>

                          <div className="absolute top-2.5 left-2.5 flex items-center gap-1">
                            <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-semibold border ${getMediaTypeBadgeClass(item.media_type)}`}>
                              {getMediaTypeLabel(item.media_type)}
                            </span>
                          </div>
                          
                          <div className="absolute bottom-0 left-0 right-0 p-3.5">
                            <h3 className="font-semibold text-white text-sm line-clamp-1 mb-1">
                              {item.title || 'Titre inconnu'}
                            </h3>
                            
                            {item.media_type !== 'movie' && (
                              <div className="mb-2">
                                <p className="text-white/80 text-xs font-medium">
                                  S{item.season_number || 1} · E{item.episode_number || 1}
                                </p>
                                {item.episode_name && (
                                  <p className="text-white/40 text-[11px] truncate mt-0.5">{item.episode_name}</p>
                                )}
                              </div>
                            )}
                            
                            <div className="flex items-center justify-between gap-1.5">
                              <div className="flex items-center gap-1.5">
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white/10 text-white/80 backdrop-blur-sm">
                                  {getLanguageBadge(item)}
                                </span>
                              </div>
                              <span className="text-white/40 text-[10px] flex items-center gap-1">
                                <CalendarDays className="w-3 h-3" />
                                {formatRelativeTime(item.updated_at, t, language)}
                              </span>
                            </div>
                          </div>
                          
                          {item.progress && item.progress > 0 && (
                            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/10">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(item.progress, 100)}%` }}
                                transition={{ duration: 0.8, delay: index * 0.05 }}
                                className={`h-full rounded-full ${
                                  item.progress >= 90 
                                    ? 'bg-gradient-to-r from-emerald-400 to-green-500' 
                                    : 'bg-gradient-to-r from-violet-400 to-purple-500'
                                }`}
                              />
                            </div>
                          )}
                        </div>
                      </Link>
                    </motion.div>
                  </SwiperSlide>
                ))}
              </AnimatePresence>
            </Swiper>
          </div>
        )}
      </div>
    </section>
  );
};

export default ContinueWatching;
