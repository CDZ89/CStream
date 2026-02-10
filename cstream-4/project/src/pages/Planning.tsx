import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { tmdbApi, TMDBMovie, TMDBTV } from '@/lib/tmdb';
import { anilistApi } from '@/lib/anilist';
import { jikanApi } from '@/lib/jikan';
import { animeScheduleApi, AnimeScheduleItem, formatAirTime, getAiringStatusColor } from '@/lib/animeScheduleApi';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calendar, Star, Search, Film, Tv, Sparkles, 
  ChevronRight, Clock, TrendingUp, SortAsc, SortDesc,
  Heart, Bookmark, Play, Timer, Bell, CalendarClock, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useContentSettings } from '@/hooks/useContentSettings';
import { parseHTML } from '@/lib/utils';
import { toast } from 'sonner';

type MediaType = 'all' | 'movie' | 'tv' | 'anime';
type SortType = 'date' | 'popularity' | 'rating';
type TimeFilter = 'all' | 'today' | 'week' | 'month';

interface UpcomingItem {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  vote_average: number;
  release_date: string;
  media_type: 'movie' | 'tv';
  genre_ids?: number[];
  next_episode_to_air?: {
    air_date: string;
    episode_number: number;
    season_number: number;
    name: string;
  } | null;
}

const Planning = () => {
  const { user } = useAuth();
  const { showAdultContent } = useContentSettings();
  const [activeType, setActiveType] = useState<MediaType>('all');
  const [sortBy, setSortBy] = useState<SortType>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [loading, setLoading] = useState(true);
  const [apiSource, setApiSource] = useState<'anilist' | 'jikan' | 'tmdb'>('anilist');

  // Helper function to get the correct image URL based on the source
  const getImageUrl = (posterPath: string | null): string => {
    if (!posterPath) return '/placeholder.svg';
    // If it's already a complete URL (from AniList or Jikan), use it directly
    if (posterPath.startsWith('http')) {
      return posterPath;
    }
    // Otherwise, it's a TMDB path, construct the full URL
    return tmdbApi.getImageUrl(posterPath, 'w500');
  };

  const [upcomingMovies, setUpcomingMovies] = useState<UpcomingItem[]>([]);
  const [airingTV, setAiringTV] = useState<UpcomingItem[]>([]);
  const [upcomingAnime, setUpcomingAnime] = useState<UpcomingItem[]>([]);
  
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set());
  
  const [itemsPerPage, setItemsPerPage] = useState(12);
  
  const [weeklySchedule, setWeeklySchedule] = useState<{ [day: string]: AnimeScheduleItem[] }>({});
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string>('Aujourd\'hui');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [moviesRes, tvRes] = await Promise.all([
          tmdbApi.getUpcomingMovies(1) as Promise<{ results: TMDBMovie[] }>,
          tmdbApi.getOnTheAirTV(1) as Promise<{ results: TMDBTV[] }>,
        ]);

        let anime: UpcomingItem[] = [];
        if (apiSource === 'tmdb') {
          const animeRes = await tmdbApi.discoverTV({
            with_genres: '16',
            with_origin_country: 'JP',
            sort_by: 'first_air_date.desc',
            'first_air_date.gte': new Date().toISOString().split('T')[0],
            include_adult: showAdultContent ? 'true' : 'false'
          }) as { results: TMDBTV[] };
          anime = (animeRes.results || []).map((a: TMDBTV) => ({
            id: a.id,
            title: a.name,
            poster_path: a.poster_path,
            backdrop_path: a.backdrop_path,
            overview: a.overview,
            vote_average: a.vote_average,
            release_date: a.first_air_date,
            media_type: 'tv' as const,
            genre_ids: a.genre_ids,
            next_episode_to_air: (a as any).next_episode_to_air || null
          }));
        } else if (apiSource === 'jikan') {
          // Fetch upcoming anime with pagination
          const upcomingRes = await jikanApi.anime.getUpcoming(showAdultContent);
          anime = (upcomingRes?.data || []).slice(0, 50).map((a: any) => ({
            id: a.mal_id,
            title: a.title,
            poster_path: a.images?.webp?.large_image_url || null,
            backdrop_path: null,
            overview: a.synopsis || '',
            vote_average: a.score || 0,
            release_date: a.aired?.from?.split('T')[0] || '',
            media_type: 'tv' as const,
            next_episode_to_air: a.aired?.to ? {
              air_date: a.aired.to.split('T')[0],
              episode_number: (a.episodes || 0),
              season_number: 1,
              name: `Nouvelle saison`
            } : null
          }));
        } else {
          // Fetch multiple statuses to get more results
          const releasingRes = await anilistApi.query(`
            query {
              Page(page: 1, perPage: 30) {
                media(type: ANIME, status: RELEASING, sort: START_DATE_DESC${showAdultContent ? ", isAdult: true" : ", isAdult: false"}) {
                  id
                  isAdult
                  title { romaji english }
                  coverImage { large }
                  bannerImage
                  description
                  averageScore
                  startDate { year month day }
                  endDate { year month day }
                  format
                  episodes
                  status
                  nextAiringEpisode {
                    airingAt
                    episode
                  }
                }
              }
            }
          `);
          const upcomingRes = await anilistApi.query(`
            query {
              Page(page: 1, perPage: 20) {
                media(type: ANIME, status: NOT_YET_RELEASED, sort: START_DATE_DESC${showAdultContent ? ", isAdult: true" : ", isAdult: false"}) {
                  id
                  isAdult
                  title { romaji english }
                  coverImage { large }
                  bannerImage
                  description
                  averageScore
                  startDate { year month day }
                  endDate { year month day }
                  format
                  episodes
                  status
                  nextAiringEpisode {
                    airingAt
                    episode
                  }
                }
              }
            }
          `);
          const animeRes = {
            data: {
              Page: {
                media: [...(releasingRes?.data?.Page?.media || []), ...(upcomingRes?.data?.Page?.media || [])]
              }
            }
          };
          anime = (animeRes?.data?.Page?.media || []).map((a: any) => ({
            id: a.id,
            title: a.title.english || a.title.romaji,
            poster_path: a.coverImage.large,
            backdrop_path: a.bannerImage,
            overview: a.description || '',
            vote_average: a.averageScore / 10,
            release_date: a.startDate?.year ? `${a.startDate.year}-${String(a.startDate.month).padStart(2, '0')}-${String(a.startDate.day).padStart(2, '0')}` : '',
            media_type: 'tv' as const,
            isAdult: a.isAdult,
            next_episode_to_air: a.nextAiringEpisode ? {
              air_date: new Date(a.nextAiringEpisode.airingAt * 1000).toISOString().split('T')[0],
              episode_number: a.nextAiringEpisode.episode,
              season_number: 1,
              name: a.status === 'RELEASING' ? `Épisode ${a.nextAiringEpisode.episode}` : `Nouvelle saison`
            } : null
          }));
        }

        const movies: UpcomingItem[] = (moviesRes.results || []).map((m: TMDBMovie) => ({
          id: m.id,
          title: m.title,
          poster_path: m.poster_path,
          backdrop_path: m.backdrop_path,
          overview: m.overview,
          vote_average: m.vote_average,
          release_date: m.release_date,
          media_type: 'movie' as const,
          genre_ids: m.genre_ids
        }));

        const tv: UpcomingItem[] = (tvRes.results || []).map((t: TMDBTV) => ({
          id: t.id,
          title: t.name,
          poster_path: t.poster_path,
          backdrop_path: t.backdrop_path,
          overview: t.overview,
          vote_average: t.vote_average,
          release_date: t.first_air_date,
          media_type: 'tv' as const,
          genre_ids: t.genre_ids,
          next_episode_to_air: (t as any).next_episode_to_air || null
        }));

        setUpcomingMovies(movies);
        setAiringTV(tv.filter(item => !item.genre_ids?.includes(16)));
        setUpcomingAnime(anime);
      } catch (error) {
        console.error('Failed to fetch planning data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [apiSource, showAdultContent]);

  useEffect(() => {
    const fetchAnimeSchedule = async () => {
      setScheduleLoading(true);
      try {
        const schedule = await animeScheduleApi.getWeeklyTimetable();
        setWeeklySchedule(schedule);
      } catch (error) {
        console.error('Failed to fetch anime schedule:', error);
        // Gracefully handle by showing empty schedule
        setWeeklySchedule({});
      } finally {
        setScheduleLoading(false);
      }
    };
    fetchAnimeSchedule();
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;

      try {
        const [favsRes, watchRes] = await Promise.all([
          supabase.from('favorites').select('media_id, media_type').eq('user_id', user.id),
          supabase.from('watchlist').select('tmdb_id, media_type').eq('user_id', user.id)
        ]);

        if (favsRes.data) {
          setFavorites(new Set(favsRes.data.map(f => `${f.media_type}-${f.media_id}`)));
        }
        if (watchRes.data) {
          setWatchlist(new Set(watchRes.data.map(w => `${w.media_type}-${w.tmdb_id}`)));
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      }
    };

    fetchUserData();
  }, [user]);

  const toggleFavorite = async (item: UpcomingItem) => {
    if (!user) {
      toast.error('Connectez-vous pour ajouter aux favoris');
      return;
    }

    const key = `${item.media_type}-${item.id}`;
    const isFav = favorites.has(key);

    try {
      if (isFav) {
        await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('media_id', String(item.id))
          .eq('media_type', item.media_type);
        
        setFavorites(prev => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
        toast.success('Retiré des favoris');
      } else {
        await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            media_id: String(item.id),
            media_type: item.media_type
          });
        
        setFavorites(prev => new Set([...prev, key]));
        toast.success('Ajouté aux favoris');
      }
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const toggleWatchlist = async (item: UpcomingItem) => {
    if (!user) {
      toast.error('Connectez-vous pour ajouter à la liste');
      return;
    }

    const key = `${item.media_type}-${item.id}`;
    const inList = watchlist.has(key);

    try {
      if (inList) {
        await supabase
          .from('watchlist')
          .delete()
          .eq('user_id', user.id)
          .eq('tmdb_id', item.id)
          .eq('media_type', item.media_type);
        
        setWatchlist(prev => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
        toast.success('Retiré de la liste');
      } else {
        await supabase
          .from('watchlist')
          .insert({
            user_id: user.id,
            tmdb_id: item.id,
            media_type: item.media_type,
            title: item.title,
            poster_path: item.poster_path
          });
        
        setWatchlist(prev => new Set([...prev, key]));
        toast.success('Ajouté à la liste');
      }
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  // Get ALL items without pagination (for calculating total and button visibility)
  const getTotalItems = (): UpcomingItem[] => {
    let items: UpcomingItem[] = [];
    
    switch (activeType) {
      case 'movie':
        items = upcomingMovies;
        break;
      case 'tv':
        items = airingTV;
        break;
      case 'anime':
        items = upcomingAnime;
        break;
      default:
        // Films → Séries (Anime excluded from 'all' as per user request)
        items = [...upcomingMovies, ...airingTV];
    }

    if (searchQuery) {
      items = items.filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const monthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    if (timeFilter !== 'all') {
      items = items.filter(item => {
        const releaseDate = item.next_episode_to_air?.air_date || item.release_date;
        if (!releaseDate) return false;
        
        switch (timeFilter) {
          case 'today':
            return releaseDate === today;
          case 'week':
            return releaseDate >= today && releaseDate <= weekFromNow;
          case 'month':
            return releaseDate >= today && releaseDate <= monthFromNow;
          default:
            return true;
        }
      });
    }

    items.sort((a, b) => {
      let comparison = 0;
      const dateA = a.next_episode_to_air?.air_date || a.release_date;
      const dateB = b.next_episode_to_air?.air_date || b.release_date;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(dateA || 0).getTime() - new Date(dateB || 0).getTime();
          break;
        case 'popularity':
          comparison = b.vote_average - a.vote_average;
          break;
        case 'rating':
          comparison = b.vote_average - a.vote_average;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return items;
  };

  // Get paginated items
  const getAllItems = (): UpcomingItem[] => {
    return getTotalItems().slice(0, itemsPerPage);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Date inconnue';
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { 
      weekday: 'long',
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRelativeDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return 'Demain';
    if (diffDays < 0) return `Il y a ${Math.abs(diffDays)} jour${Math.abs(diffDays) > 1 ? 's' : ''}`;
    if (diffDays < 7) return `Dans ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    if (diffDays < 30) return `Dans ${Math.ceil(diffDays / 7)} semaine${Math.ceil(diffDays / 7) > 1 ? 's' : ''}`;
    return `Dans ${Math.ceil(diffDays / 30)} mois`;
  };

  const getRelativeBadgeColor = (dateStr: string) => {
    if (!dateStr) return 'bg-gray-500/20 text-gray-400';
    const date = new Date(dateStr);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (diffDays === 1) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    if (diffDays < 7) return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
  };

  const items = getAllItems();

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 rounded-full border-4 border-primary border-t-transparent"
          />
          <p className="text-muted-foreground">Chargement du planning...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="relative overflow-hidden py-20 bg-gradient-to-b from-primary/10 via-background to-background">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.2),transparent_60%)]" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="inline-flex items-center gap-2 mb-6 px-5 py-2.5 bg-primary/10 rounded-full border border-primary/20"
            >
              <CalendarClock className="w-5 h-5 text-primary" />
              <span className="text-sm font-bold text-primary uppercase tracking-wider">
                Planning des sorties
              </span>
            </motion.div>
            <h1 className="text-5xl md:text-7xl font-black mb-6">
              <span className="gradient-text">Prochaines Sorties</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Ne manquez plus aucune sortie ! Films, séries et animes avec les dates et heures exactes
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-10">
        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20 hover:border-red-500/40 transition-colors">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-red-500/20">
                <Film className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-400">{upcomingMovies.length}</p>
                <p className="text-sm text-muted-foreground">Films à venir</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20 hover:border-blue-500/40 transition-colors">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-500/20">
                <Tv className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-400">{airingTV.length}</p>
                <p className="text-sm text-muted-foreground">Séries en cours</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-pink-500/10 to-pink-600/5 border-pink-500/20 hover:border-pink-500/40 transition-colors">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-pink-500/20">
                <Sparkles className="w-6 h-6 text-pink-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-pink-400">{upcomingAnime.length}</p>
                <p className="text-sm text-muted-foreground">Animes</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20 hover:border-green-500/40 transition-colors">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-green-500/20">
                <TrendingUp className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-400">{upcomingMovies.length + airingTV.length + upcomingAnime.length}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Weekly Anime Schedule Section */}
        {Object.keys(weeklySchedule).length > 0 && activeType === 'anime' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="h-8 w-1 bg-gradient-to-b from-pink-500 to-purple-500 rounded-full" />
              <h2 className="text-2xl font-bold">Programme Anime</h2>
              <Badge className="bg-pink-500/20 text-pink-400 border-pink-500/30">
                Cette semaine
              </Badge>
            </div>
            
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {Object.keys(weeklySchedule).map((day) => (
                <Button
                  key={day}
                  variant={selectedDay === day ? "default" : "outline"}
                  onClick={() => setSelectedDay(day)}
                  className={`shrink-0 ${selectedDay === day 
                    ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white' 
                    : 'hover:border-pink-500/50'}`}
                >
                  {day}
                  <Badge className="ml-2 bg-white/20 text-xs">{weeklySchedule[day]?.length || 0}</Badge>
                </Button>
              ))}
            </div>
            
            {scheduleLoading ? (
              <div className="flex items-center justify-center py-12">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-8 h-8 rounded-full border-2 border-pink-500 border-t-transparent"
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {(weeklySchedule[selectedDay] || []).slice(0, 12).map((anime, index) => (
                  <motion.div
                    key={anime.id || index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="group"
                  >
                    <Card className="overflow-hidden bg-secondary/30 border-border/30 hover:border-pink-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-pink-500/10">
                      <div className="relative aspect-[2/3] overflow-hidden">
                        <img
                          src={animeScheduleApi.getImageUrl(anime.imageVersionRoute)}
                          alt={anime.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder.svg';
                          }}
                        />
                        <div className="absolute top-2 right-2">
                          <Badge className={`${getAiringStatusColor(anime.airingStatus)} text-white text-xs`}>
                            {anime.episodeNumber ? `Ep ${anime.episodeNumber}` : 'Nouveau'}
                          </Badge>
                        </div>
                        {anime.episodeDate && (
                          <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 backdrop-blur-sm rounded-lg text-xs font-medium text-white flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatAirTime(anime.episodeDate)}
                          </div>
                        )}
                      </div>
                      <CardContent className="p-3">
                        <h3 className="font-medium text-sm line-clamp-2 group-hover:text-pink-400 transition-colors">
                          {anime.title || anime.romaji || anime.english}
                        </h3>
                        {anime.airType && (
                          <Badge variant="outline" className="mt-2 text-xs uppercase">
                            {anime.airType}
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6 mb-10"
        >
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Rechercher dans le planning..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-14 h-14 rounded-2xl bg-secondary/50 border-2 border-border/50 focus:border-primary text-base transition-all focus:shadow-lg focus:shadow-primary/10"
              />
            </div>

            {activeType === 'anime' && (
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
                <div className="flex flex-wrap bg-white/5 p-1 rounded-xl border border-white/5 gap-1 shadow-2xl">
                  <button 
                    onClick={() => setApiSource('anilist')}
                    className={`px-4 h-9 rounded-lg text-[10px] font-black uppercase transition-all ${apiSource === 'anilist' ? 'bg-primary text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                  >
                    AniList
                  </button>
                  <button 
                    onClick={() => setApiSource('jikan')}
                    className={`px-4 h-9 rounded-lg text-[10px] font-black uppercase transition-all ${apiSource === 'jikan' ? 'bg-primary text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                  >
                    Jikan
                  </button>
                  <button 
                    onClick={() => setApiSource('tmdb')}
                    className={`px-4 h-9 rounded-lg text-[10px] font-black uppercase transition-all ${apiSource === 'tmdb' ? 'bg-primary text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                  >
                    TMDB
                  </button>
                </div>
              </div>
            )}

            <Tabs value={activeType} onValueChange={(v) => setActiveType(v as MediaType)} className="w-full lg:w-auto">
              <TabsList className="grid grid-cols-4 bg-secondary/60 p-1.5 rounded-2xl h-14 border border-border/50">
                <TabsTrigger value="all" className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent data-[state=active]:text-white data-[state=active]:shadow-lg font-semibold transition-all">
                  Tout
                </TabsTrigger>
                <TabsTrigger value="movie" className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent data-[state=active]:text-white data-[state=active]:shadow-lg gap-2 font-semibold transition-all">
                  <Film className="w-4 h-4" />
                  <span className="hidden sm:inline">Films</span>
                </TabsTrigger>
                <TabsTrigger value="tv" className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent data-[state=active]:text-white data-[state=active]:shadow-lg gap-2 font-semibold transition-all">
                  <Tv className="w-4 h-4" />
                  <span className="hidden sm:inline">Séries</span>
                </TabsTrigger>
                <TabsTrigger value="anime" className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent data-[state=active]:text-white data-[state=active]:shadow-lg gap-2 font-semibold transition-all">
                  <Sparkles className="w-4 h-4" />
                  <span className="hidden sm:inline">Anime</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 p-1.5 bg-secondary/60 rounded-xl border border-border/50">
              {[
                { key: 'all', label: 'Toutes dates', icon: Calendar },
                { key: 'today', label: "Aujourd'hui", icon: Timer },
                { key: 'week', label: 'Cette semaine', icon: CalendarClock },
                { key: 'month', label: 'Ce mois', icon: Calendar },
              ].map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setTimeFilter(filter.key as TimeFilter)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    timeFilter === filter.key
                      ? 'bg-gradient-to-r from-primary to-accent text-white shadow-lg'
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                  }`}
                >
                  <filter.icon className="w-4 h-4" />
                  {filter.label}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortType)}>
                <SelectTrigger className="w-[160px] h-12 rounded-xl bg-secondary/60 border-border/50">
                  <SelectValue placeholder="Trier par" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">
                    <span className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Date de sortie
                    </span>
                  </SelectItem>
                  <SelectItem value="popularity">
                    <span className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Popularité
                    </span>
                  </SelectItem>
                  <SelectItem value="rating">
                    <span className="flex items-center gap-2">
                      <Star className="w-4 h-4" />
                      Note
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 rounded-xl"
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? <SortAsc className="w-5 h-5" /> : <SortDesc className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </motion.div>

        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1 bg-gradient-to-b from-primary to-accent rounded-full" />
            <p className="text-lg font-semibold">
              {items.length} résultat{items.length > 1 ? 's' : ''}
            </p>
          </div>
          {items.filter(i => getRelativeDate(i.next_episode_to_air?.air_date || i.release_date) === "Aujourd'hui").length > 0 && (
            <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 px-4 py-1.5 text-sm animate-pulse">
              <Bell className="w-4 h-4 mr-2" />
              {items.filter(i => getRelativeDate(i.next_episode_to_air?.air_date || i.release_date) === "Aujourd'hui").length} sortie{items.filter(i => getRelativeDate(i.next_episode_to_air?.air_date || i.release_date) === "Aujourd'hui").length > 1 ? 's' : ''} aujourd'hui
            </Badge>
          )}
        </div>

        <AnimatePresence mode="popLayout">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((item, index) => {
              const releaseDate = item.next_episode_to_air?.air_date || item.release_date;
              const isNextEpisode = !!item.next_episode_to_air;
              
              return (
                <motion.div
                  key={`${item.media_type}-${item.id}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.03 }}
                  layout
                >
                  <Card className="group overflow-hidden bg-secondary/30 border-2 border-border/30 hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2">
                    <div className="relative aspect-[2/3] overflow-hidden">
                      <img
                        src={getImageUrl(item.poster_path)}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder.svg';
                        }}
                      />
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
                        <Badge className={`${
                          item.media_type === 'movie' 
                            ? 'bg-red-500/90' 
                            : item.genre_ids?.includes(16) 
                              ? 'bg-pink-500/90' 
                              : 'bg-blue-500/90'
                        } text-white border-0 font-semibold`}>
                          {item.media_type === 'movie' ? 'Film' : item.genre_ids?.includes(16) ? 'Anime' : 'Série'}
                        </Badge>
                        
                        {item.vote_average > 0 && (
                          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-black/70 backdrop-blur-sm">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="text-sm font-bold text-white">{item.vote_average.toFixed(1)}</span>
                          </div>
                        )}
                      </div>

                      <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                        <div className="flex gap-2 mb-3">
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`rounded-xl bg-white/10 backdrop-blur-sm hover:bg-white/20 ${
                              favorites.has(`${item.media_type}-${item.id}`) ? 'text-red-500' : 'text-white'
                            }`}
                            onClick={(e) => {
                              e.preventDefault();
                              toggleFavorite(item);
                            }}
                          >
                            <Heart className={`w-5 h-5 ${favorites.has(`${item.media_type}-${item.id}`) ? 'fill-current' : ''}`} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`rounded-xl bg-white/10 backdrop-blur-sm hover:bg-white/20 ${
                              watchlist.has(`${item.media_type}-${item.id}`) ? 'text-primary' : 'text-white'
                            }`}
                            onClick={(e) => {
                              e.preventDefault();
                              toggleWatchlist(item);
                            }}
                          >
                            <Bookmark className={`w-5 h-5 ${watchlist.has(`${item.media_type}-${item.id}`) ? 'fill-current' : ''}`} />
                          </Button>
                          <Link to={`/${item.media_type}/${item.id}`} className="flex-1">
                            <Button className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 rounded-xl gap-2 font-semibold">
                              <Play className="w-4 h-4 fill-current" />
                              Voir
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>

                    <CardContent className="p-5">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border ${getRelativeBadgeColor(releaseDate)}`}>
                            <Clock className="w-3.5 h-3.5" />
                            {getRelativeDate(releaseDate)}
                          </span>
                          {isNextEpisode && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-500/20 text-purple-400 text-xs font-semibold border border-purple-500/30">
                              <Bell className="w-3 h-3" />
                              Épisode {item.next_episode_to_air?.episode_number}
                            </span>
                          )}
                        </div>
                        
                        <Link to={`/${item.media_type}/${item.id}`}>
                          <h3 className="font-bold text-lg line-clamp-1 group-hover:text-primary transition-colors">
                            {item.title}
                          </h3>
                        </Link>

                        {isNextEpisode && item.next_episode_to_air?.name && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            "{item.next_episode_to_air.name}"
                          </p>
                        )}
                        
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(releaseDate)}</span>
                          {formatTime(releaseDate) && (
                            <span className="flex items-center gap-1 text-primary font-medium">
                              <Clock className="w-3.5 h-3.5" />
                              {formatTime(releaseDate)}
                            </span>
                          )}
                        </div>

                        {isNextEpisode && (
                          <div className="flex items-center gap-2 text-sm text-primary">
                            <Timer className="w-4 h-4" />
                            <span className="font-medium">
                              Saison {item.next_episode_to_air?.season_number} • Épisode {item.next_episode_to_air?.episode_number}
                            </span>
                          </div>
                        )}
                        
                        {item.overview && (
                          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                            {parseHTML(item.overview)}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </AnimatePresence>

        {/* Load More Button */}
        {itemsPerPage < getTotalItems().length && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center mt-12 mb-12"
          >
            <Button
              onClick={() => setItemsPerPage(prev => prev + 12)}
              className="bg-gradient-to-r from-primary to-accent hover:opacity-90 rounded-xl px-8 py-6 text-lg font-semibold"
            >
              <ChevronRight className="w-5 h-5 mr-2" />
              Charger plus de résultats ({itemsPerPage} / {getTotalItems().length})
            </Button>
          </motion.div>
        )}

        {items.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-24"
          >
            <motion.div 
              className="w-32 h-32 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-primary/10 to-accent/10 border-2 border-dashed border-primary/30 flex items-center justify-center"
              animate={{ 
                scale: [1, 1.05, 1],
                borderColor: ['rgba(139,92,246,0.3)', 'rgba(139,92,246,0.5)', 'rgba(139,92,246,0.3)']
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Calendar className="w-16 h-16 text-primary/50" />
            </motion.div>
            <h3 className="text-3xl font-bold mb-4 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              Aucun résultat
            </h3>
            <p className="text-muted-foreground text-lg max-w-md mx-auto leading-relaxed">
              Aucune sortie prévue ne correspond à votre recherche. Essayez d'élargir vos critères ou de changer de catégorie.
            </p>
            <Button 
              variant="outline" 
              className="mt-8 rounded-xl px-6"
              onClick={() => {
                setSearchQuery('');
                setTimeFilter('all');
                setActiveType('all');
              }}
            >
              Réinitialiser les filtres
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Planning;
