import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { UniversalPlayer, SOURCES, type PlayerSource } from '@/components/UniversalPlayer';
import { SourceSelectorList } from '@/components/SourceSelectorList';
import { ImportedSourceSelector } from '@/components/ImportedSourceSelector';
import { MediaCard } from '@/components/MediaCard';
import { tmdbApi } from '@/lib/tmdb';
import { useAuth } from '@/hooks/useAuth';
import { useWatchHistory } from '@/hooks/useWatchHistory';
import { supabase } from '@/integrations/supabase/client';
import { SEO } from '@/components/SEO';
import { CloudHint } from '@/components/player/CloudHint';
import {
  ChevronLeft, Loader2, AlertTriangle, ChevronDown, Play,
  SkipForward, SkipBack, Clock, Calendar, Star, Check,
  Settings, ChevronRight, Tv
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';

interface Episode {
  episode_number: number;
  name: string;
  overview?: string;
  still_path?: string;
  runtime?: number;
  air_date?: string;
  vote_average?: number;
}

interface Season {
  season_number: number;
  name: string;
  episode_count: number;
  poster_path?: string;
  air_date?: string;
}

export default function PlayerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { saveProgress } = useWatchHistory();

  const mediaType = (searchParams.get('type') || 'movie') as 'movie' | 'tv' | 'anilist';
  const season = searchParams.get('season') ? parseInt(searchParams.get('season')!) : 1;
  const episode = searchParams.get('episode') ? parseInt(searchParams.get('episode')!) : 1;

  const [isLoading, setIsLoading] = useState(false); // Don't block player with loading
  const [error, setError] = useState<string | null>(null);
  const [media, setMedia] = useState<any>(null);
  const [nextEpisode, setNextEpisode] = useState<{ season: number; episode: number } | null>(null);
  const [previousEpisode, setPreviousEpisode] = useState<{ season: number; episode: number } | null>(null);
  const [showEndOverlay, setShowEndOverlay] = useState(false);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [autoPlayNext, setAutoPlayNext] = useState(() => {
    try {
      return localStorage.getItem('cstream_autoplay_next') !== 'false';
    } catch {
      return true;
    }
  });
  const [currentEpisodeInfo, setCurrentEpisodeInfo] = useState<Episode | null>(null);
  const [showEpisodeList, setShowEpisodeList] = useState(true);
  const [importedSources, setImportedSources] = useState<Array<{ id: string; label: string; url: string; language?: string }>>([]);
  const [selectedSource, setSelectedSource] = useState<PlayerSource>(() => {
    try {
      const saved = localStorage.getItem('cstream_preferred_player');
      if (saved && SOURCES.some(s => s.id === saved)) return saved as PlayerSource;
    } catch { }
    return 'rivestream';
  });

  const handleSourceChange = (sourceId: PlayerSource) => {
    console.log('[PlayerPage] Switching source to:', sourceId);
    setSelectedSource(sourceId);
    try {
      localStorage.setItem('cstream_preferred_player', sourceId);
    } catch (e) {
      console.error('[PlayerPage] Failed to save preferred source:', e);
    }
  };

  const playerKey = useMemo(() =>
    `player-${id}-${mediaType}-${season || 0}-${episode || 0}`,
    [id, mediaType, season, episode]
  );

  useEffect(() => {
    if (mediaType === 'anilist') {
      setSelectedSource('vidplus');
    }
  }, [mediaType]);

  useEffect(() => {
    try {
      localStorage.setItem('cstream_autoplay_next', String(autoPlayNext));
    } catch { }
  }, [autoPlayNext]);

  // Load imported sources for this TMDB ID from Supabase
  useEffect(() => {
    const loadImportedSources = async () => {
      if (!id) return;

      try {
        console.log('[Sources] Starting load for TMDB ID:', id, 'Media type:', mediaType);
        const tmdbId = parseInt(id);

        // Simple query - no filters first to check if table exists
        const { data, error } = await (supabase as any)
          .from('custom_media')
          .select('*')
          .catch((e: any) => {
            console.error('[Sources] Query failed:', e);
            return { data: null, error: e };
          });

        console.log('[Sources] Raw data:', data, 'Error:', error);

        if (error || !data) {
          console.warn('[Sources] Supabase error or no data:', error?.message || 'Unknown error');
          setImportedSources([]);
          return;
        }

        // Filter manually client-side
        const filtered = Array.isArray(data) ? data.filter((s: any) => {
          const matches = s.tmdb_id == tmdbId && s.active === true;
          if (matches) console.log('[Sources] Found match:', s);
          return matches;
        }) : [];

        console.log('[Sources] Filtered results:', filtered);

        const sources = filtered.map((s: any) => ({
          id: s.id,
          label: s.title || s.url?.split('/')[2] || 'ShareCloudy',
          url: s.url,
          language: s.language || 'FR'
        }));

        console.log('[Sources] Final mapped sources:', sources);
        setImportedSources(sources);
      } catch (err: any) {
        console.error('[Sources] Exception:', err?.message || err);
        setImportedSources([]);
      }
    };

    loadImportedSources();
  }, [id, mediaType]);

  useEffect(() => {
    const loadMedia = async () => {
      try {
        // Don't block player - load in background
        setError(null);
        setNextEpisode(null);
        setPreviousEpisode(null);

        if (mediaType === 'tv' && id) {
          const show = await tmdbApi.getTVDetails(parseInt(id)) as { seasons?: Season[]; number_of_seasons?: number;[key: string]: any };
          setMedia(show);

          const validSeasons = (show.seasons || []).filter((s: Season) => s.season_number > 0);
          setSeasons(validSeasons);

          if (season !== undefined && episode !== undefined) {
            const cacheKey = `episodes_${id}_s${season}`;
            let seasonData: any = null;

            try {
              const cached = sessionStorage.getItem(cacheKey);
              if (cached) seasonData = JSON.parse(cached);
            } catch { }

            if (!seasonData) {
              seasonData = await tmdbApi.getTVSeasonDetails(parseInt(id), season);
              try {
                sessionStorage.setItem(cacheKey, JSON.stringify(seasonData));
              } catch { }
            }

            const episodeList = seasonData?.episodes || [];
            setEpisodes(episodeList);

            const currentEp = episodeList.find((ep: Episode) => ep.episode_number === episode);
            setCurrentEpisodeInfo(currentEp || null);

            if (episode > 1) {
              setPreviousEpisode({ season, episode: episode - 1 });
            } else if (season > 1) {
              const prevSeasonKey = `episodes_${id}_s${season - 1}`;
              let prevSeasonData: any = null;
              try {
                const cached = sessionStorage.getItem(prevSeasonKey);
                if (cached) prevSeasonData = JSON.parse(cached);
              } catch { }
              if (!prevSeasonData) {
                try {
                  prevSeasonData = await tmdbApi.getTVSeasonDetails(parseInt(id), season - 1);
                  sessionStorage.setItem(prevSeasonKey, JSON.stringify(prevSeasonData));
                } catch { }
              }
              if (prevSeasonData?.episodes?.length > 0) {
                setPreviousEpisode({
                  season: season - 1,
                  episode: prevSeasonData.episodes.length
                });
              }
            }

            if (episode < episodeList.length) {
              setNextEpisode({ season, episode: episode + 1 });
            } else if (season < ((show as any)?.number_of_seasons || 1)) {
              const nextSeasonKey = `episodes_${id}_s${season + 1}`;
              let nextSeasonData: any = null;

              try {
                const cached = sessionStorage.getItem(nextSeasonKey);
                if (cached) nextSeasonData = JSON.parse(cached);
              } catch { }

              if (!nextSeasonData) {
                try {
                  nextSeasonData = await tmdbApi.getTVSeasonDetails(parseInt(id), season + 1);
                  sessionStorage.setItem(nextSeasonKey, JSON.stringify(nextSeasonData));
                } catch { }
              }

              if (nextSeasonData?.episodes?.length > 0) {
                setNextEpisode({ season: season + 1, episode: 1 });
              }
            }

            if (user) {
              saveProgress(parseInt(id), 'tv', season, episode);
            }
          }
        } else if (mediaType === 'movie' && id) {
          const movie = await tmdbApi.getMovieDetails(parseInt(id));
          setMedia(movie);
          if (user) {
            saveProgress(parseInt(id), 'movie');
          }
        } else if (mediaType === 'anilist' && id) {
          // AniList metadata handled by player for now, or fetch if needed
          setMedia({ name: 'Anime', overview: 'Streaming Anime via AniList' });
        }
      } catch (err) {
        console.error('Error loading media:', err);
        setError('Erreur lors du chargement du contenu');
        toast.error('Erreur', { description: 'Impossible de charger le contenu' });
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      loadMedia();
    }
  }, [id, mediaType, season, episode, user, saveProgress]);

  const handleVideoEnd = useCallback(() => {
    if (nextEpisode && mediaType === 'tv') {
      if (autoPlayNext) {
        toast.info('Épisode suivant dans 5 secondes...', { duration: 4000 });
        setTimeout(() => {
          handleNextEpisode();
        }, 5000);
      } else {
        setShowEndOverlay(true);
      }
    }
  }, [nextEpisode, mediaType, autoPlayNext]);

  const handleNextEpisode = useCallback(() => {
    if (nextEpisode && id) {
      setShowEndOverlay(false);
      navigate(`/player/${id}?type=tv&season=${nextEpisode.season}&episode=${nextEpisode.episode}`, { replace: true });
    }
  }, [nextEpisode, id, navigate]);

  const handlePreviousEpisode = useCallback(() => {
    if (previousEpisode && id) {
      navigate(`/player/${id}?type=tv&season=${previousEpisode.season}&episode=${previousEpisode.episode}`, { replace: true });
    }
  }, [previousEpisode, id, navigate]);

  const handleChangeSeason = useCallback((newSeason: number) => {
    if (id) {
      navigate(`/player/${id}?type=tv&season=${newSeason}&episode=1`, { replace: true });
    }
  }, [id, navigate]);

  const handleChangeEpisode = useCallback((newEpisode: number) => {
    if (id && season !== undefined) {
      navigate(`/player/${id}?type=tv&season=${season}&episode=${newEpisode}`, { replace: true });
    }
  }, [id, season, navigate]);

  const handleGoBack = useCallback(() => {
    if (mediaType === 'tv' && id) {
      navigate(`/media/${id}?type=tv`);
    } else if (mediaType === 'movie' && id) {
      navigate(`/media/${id}?type=movie`);
    } else {
      navigate(-1);
    }
  }, [navigate, mediaType, id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin" />
              <Play className="w-6 h-6 text-purple-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-gray-400 text-sm">Chargement du lecteur...</p>
          </motion.div>
        </div>
      </div>
    );
  }

  // Show error page only if no id provided
  if (!id) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="max-w-md w-full p-8 text-center bg-zinc-900/50 border-white/10">
              <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-6" />
              <h2 className="text-xl font-bold mb-3 text-white">Erreur de chargement</h2>
              <p className="text-gray-400 mb-8">Contenu non trouvé</p>
              <Button
                onClick={handleGoBack}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
              >
                Retour
              </Button>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  // Show player immediately with available data
  const title = mediaType === 'tv'
    ? (media?.name || 'Série')
    : (media?.title || 'Film');

  const episodeTitle = mediaType === 'tv' && currentEpisodeInfo
    ? currentEpisodeInfo.name
    : null;

  const seoTitle = mediaType === 'tv'
    ? `${title} S${season}E${episode}${episodeTitle ? ` - ${episodeTitle}` : ''}`
    : title;

  const seoDescription = media?.overview
    ? media.overview.substring(0, 160) + '...'
    : `Regarder ${title} en streaming gratuit sur CStream`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-[#0a0a0a] flex flex-col"
    >
      <SEO
        title={`Regarder ${seoTitle}`}
        description={seoDescription}
        image={media?.backdrop_path ? `https://image.tmdb.org/t/p/w1280${media.backdrop_path}` : undefined}
        url={`/player/${id}?type=${mediaType}${mediaType === 'tv' ? `&season=${season}&episode=${episode}` : ''}`}
        type={mediaType === 'movie' ? 'video.movie' : 'video.tv_show'}
        noIndex={true}
      />
      <Navbar />

      {/* Non-blocking error banner */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-2"
        >
          <div className="max-w-[1800px] mx-auto flex items-center gap-2 text-yellow-400 text-sm">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>Certaines informations n'ont pas pu être chargées. Le lecteur reste disponible.</span>
          </div>
        </motion.div>
      )}

      <div className="flex-1 flex flex-col">
        <div className="w-full bg-gradient-to-b from-zinc-900/50 to-transparent">
          <div className="max-w-[1800px] mx-auto px-4 py-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3 sm:gap-4 w-full md:w-auto">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleGoBack}
                  className="p-2 sm:p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-colors border border-white/10 shrink-0"
                  title="Retour"
                >
                  <ChevronLeft className="w-5 h-5 text-white/70" />
                </motion.button>
                <div className="min-w-0 flex-1">
                  <h1 className="text-sm sm:text-lg font-bold text-white truncate">{title}</h1>
                  {mediaType === 'tv' && (
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] sm:text-xs text-purple-400 font-bold uppercase tracking-wider">
                        S{String(season).padStart(2, '0')} E{String(episode).padStart(2, '0')}
                      </span>
                      {episodeTitle && (
                        <>
                          <span className="text-white/20">|</span>
                          <span className="text-[10px] sm:text-xs text-white/40 truncate max-w-[150px] sm:max-w-none">
                            {episodeTitle}
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {mediaType === 'tv' && (
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handlePreviousEpisode}
                    disabled={!previousEpisode}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] sm:text-xs font-bold transition-all whitespace-nowrap",
                      previousEpisode
                        ? "bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white"
                        : "bg-white/5 border border-white/5 text-white/20 cursor-not-allowed"
                    )}
                  >
                    <SkipBack className="w-3.5 h-3.5" />
                    <span className="hidden xs:inline">Précédent</span>
                  </motion.button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-purple-600/20 to-pink-600/20 
                          hover:from-purple-600/30 hover:to-pink-600/30 border border-purple-500/30 
                          rounded-xl text-[10px] sm:text-xs font-bold text-white transition-all whitespace-nowrap"
                      >
                        Saison {season}
                        <ChevronDown className="w-3.5 h-3.5 text-white/50" />
                      </motion.button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="center"
                      className="max-h-80 overflow-y-auto bg-zinc-900/98 backdrop-blur-xl border-white/10 rounded-xl p-1 min-w-[200px]"
                    >
                      <DropdownMenuLabel className="text-xs text-white/40 px-3 py-2">
                        Sélectionner une saison
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-white/10" />
                      {seasons.map((s) => (
                        <DropdownMenuItem
                          key={s.season_number}
                          onClick={() => handleChangeSeason(s.season_number)}
                          className={cn(
                            "cursor-pointer px-3 py-2.5 rounded-lg mx-1 my-0.5 transition-all",
                            s.season_number === season
                              ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-white"
                              : "hover:bg-white/5 text-white/70 hover:text-white"
                          )}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span>Saison {s.season_number}</span>
                            <span className="text-xs text-white/40">{s.episode_count} ép.</span>
                          </div>
                          {s.season_number === season && (
                            <Check className="w-4 h-4 text-purple-400 ml-2" />
                          )}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 
                          border border-white/10 rounded-xl text-[10px] sm:text-xs font-bold text-white transition-all whitespace-nowrap"
                      >
                        Épisode {episode}
                        <ChevronDown className="w-3.5 h-3.5 text-white/50" />
                      </motion.button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="center"
                      className="max-h-80 overflow-y-auto bg-zinc-900/98 backdrop-blur-xl border-white/10 rounded-xl p-1 w-80"
                    >
                      <DropdownMenuLabel className="text-xs text-white/40 px-3 py-2">
                        Sélectionner un épisode
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-white/10" />
                      {episodes.length > 0 ? (
                        episodes.map((ep) => (
                          <DropdownMenuItem
                            key={ep.episode_number}
                            onClick={() => handleChangeEpisode(ep.episode_number)}
                            className={cn(
                              "cursor-pointer px-3 py-3 rounded-lg mx-1 my-0.5 transition-all",
                              ep.episode_number === episode
                                ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20"
                                : "hover:bg-white/5"
                            )}
                          >
                            <div className="flex items-start gap-3 w-full">
                              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                                {ep.episode_number === episode ? (
                                  <Play className="w-4 h-4 text-purple-400 fill-purple-400" />
                                ) : (
                                  <span className="text-xs font-bold text-white/50">{ep.episode_number}</span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-white truncate">
                                    {ep.name || `Épisode ${ep.episode_number}`}
                                  </span>
                                </div>
                                {ep.runtime && (
                                  <span className="text-xs text-white/40">{ep.runtime} min</span>
                                )}
                              </div>
                            </div>
                          </DropdownMenuItem>
                        ))
                      ) : (
                        <div className="px-4 py-8 text-center">
                          <Loader2 className="w-6 h-6 animate-spin text-purple-400 mx-auto mb-2" />
                          <span className="text-sm text-white/40">Chargement...</span>
                        </div>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleNextEpisode}
                    disabled={!nextEpisode}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] sm:text-xs font-bold transition-all whitespace-nowrap",
                      nextEpisode
                        ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/20"
                        : "bg-white/5 border border-white/5 text-white/20 cursor-not-allowed"
                    )}
                  >
                    <span className="hidden xs:inline">Suivant</span>
                    <SkipForward className="w-3.5 h-3.5" />
                  </motion.button>

                  <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-white/5 rounded-xl border border-white/10">
                    <span className="text-xs text-white/50">Auto-play</span>
                    <Switch
                      checked={autoPlayNext}
                      onCheckedChange={setAutoPlayNext}
                      className="data-[state=checked]:bg-purple-600"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row max-w-[1800px] mx-auto w-full px-2 sm:px-4 pb-4 sm:pb-6 gap-3 sm:gap-4">
          <motion.div
            key={playerKey}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "w-full",
              mediaType === 'tv' && showEpisodeList ? "lg:w-[70%] xl:w-[75%]" : "lg:w-full"
            )}
          >
            <div className="mb-4">
              <CloudHint />
            </div>
            {mediaType === 'tv' && season !== undefined && episode !== undefined ? (
              <UniversalPlayer
                key={`${playerKey}-${selectedSource}`}
                tmdbId={parseInt(id)}
                mediaType="tv"
                season={season}
                episode={episode}
                title={`${title} - S${season}E${episode}`}
                posterPath={media?.backdrop_path || media?.poster_path}
                defaultSource={selectedSource}
                onVideoEnd={handleVideoEnd}
                hasNextEpisode={!!nextEpisode}
                hasPreviousEpisode={!!previousEpisode}
                onNextEpisode={handleNextEpisode}
                onPreviousEpisode={handlePreviousEpisode}
              />
            ) : mediaType === 'movie' ? (
              <UniversalPlayer
                key={`${playerKey}-${selectedSource}`}
                tmdbId={parseInt(id!)}
                mediaType="movie"
                title={title}
                posterPath={media?.backdrop_path || media?.poster_path}
                defaultSource={selectedSource}
                onVideoEnd={handleVideoEnd}
              />
            ) : null}

            {/* Source Selector Section - Beautiful Grid Layout */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mt-3 sm:mt-6 p-3 sm:p-6 bg-gradient-to-br from-zinc-900/80 via-zinc-900/60 to-zinc-800/40 rounded-lg sm:rounded-2xl border border-white/10 backdrop-blur-xl"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg sm:rounded-xl border border-purple-500/20">
                    <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white">Sélectionner une source</h3>
                    <p className="text-xs text-white/50 mt-0.5">Choisissez votre lecteur</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <ImportedSourceSelector
                    tmdbId={id ? parseInt(id) : 0}
                    onSelect={(s) => {
                      // Custom source handling
                      const newSource = {
                        id: s.id as any,
                        name: s.label,
                        url: s.url,
                        icon: '🔗'
                      };
                      handleSourceChange(s.id as any);
                    }}
                    currentSource={null}
                  />
                  <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-white/5 rounded-lg border border-white/10 text-xs">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-white/60 font-medium">{SOURCES.length} sources</span>
                  </div>
                </div>
              </div>

              <SourceSelectorList
                currentSource={selectedSource}
                onSelect={(id) => handleSourceChange(id)}
                className="mt-6"
              />

              <div className="grid grid-cols-2 xs:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3 mt-8">

                {/* Imported Custom Sources - ADMIN ADDED */}
                {importedSources.map((source, index) => (
                  <motion.button
                    key={`imported-${source.id}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (SOURCES.length + index) * 0.02 }}
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      toast.info(`Source ajoutée: ${source.label}`, { description: source.language ? `Langue: ${source.language}` : undefined });
                    }}
                    className="relative group flex flex-col items-center justify-center p-2 sm:p-4 rounded-lg sm:rounded-xl transition-all duration-300 overflow-hidden bg-gradient-to-br from-emerald-600/20 via-teal-500/15 to-emerald-600/20 border-2 border-emerald-500/40 hover:border-emerald-500/60 shadow-lg shadow-emerald-500/10"
                    title={`Admin ajout: ${source.label}`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-teal-500/5 animate-pulse" />

                    <div className="absolute top-1 right-1 bg-emerald-500/60 text-white text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                      ADMIN
                    </div>

                    <div className="relative z-10 w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center mb-1 sm:mb-2 transition-all bg-gradient-to-br from-emerald-500/40 to-teal-500/40 shadow-lg">
                      <span className="text-base sm:text-lg">✨</span>
                    </div>

                    <span className="relative z-10 text-xs sm:text-sm font-semibold text-center truncate w-full transition-colors text-emerald-100">
                      {source.label.substring(0, 10)}
                    </span>

                    <span className="relative z-10 text-[8px] sm:text-[10px] text-center truncate w-full mt-0.5 sm:mt-1 transition-colors text-emerald-300/70">
                      {source.language || 'FR'}
                    </span>

                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  </motion.button>
                ))}
              </div>

              {/* Footer info */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-3 sm:mt-5 pt-3 sm:pt-4 border-t border-white/5 gap-2">
                <p className="text-xs text-white/40 flex-1">
                  💡 Si une source ne fonctionne pas, essayez-en une autre {importedSources.length > 0 && `(+${importedSources.length} admin)`}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/30">Active:</span>
                  <span className="text-xs font-semibold text-purple-400">
                    {SOURCES.find(s => s.id === selectedSource)?.name}
                  </span>
                </div>
              </div>
            </motion.div>

            {currentEpisodeInfo && currentEpisodeInfo.overview && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-4 p-4 bg-zinc-900/50 rounded-xl border border-white/5"
              >
                <h3 className="text-sm font-semibold text-white mb-2">
                  {currentEpisodeInfo.name}
                </h3>
                <p className="text-sm text-white/60 leading-relaxed line-clamp-3">
                  {currentEpisodeInfo.overview}
                </p>
                <div className="flex items-center gap-4 mt-3 text-xs text-white/40">
                  {currentEpisodeInfo.runtime && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {currentEpisodeInfo.runtime} min
                    </span>
                  )}
                  {currentEpisodeInfo.air_date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(currentEpisodeInfo.air_date).toLocaleDateString('fr-FR')}
                    </span>
                  )}
                  {currentEpisodeInfo.vote_average && currentEpisodeInfo.vote_average > 0 && (
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-400" />
                      {currentEpisodeInfo.vote_average.toFixed(1)}
                    </span>
                  )}
                </div>
              </motion.div>
            )}
          </motion.div>

          {mediaType === 'tv' && showEpisodeList && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="w-full lg:w-[30%] xl:w-[25%] bg-zinc-900/30 rounded-2xl border border-white/5 overflow-hidden"
            >
              <div className="p-4 border-b border-white/5 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">
                    Saison {season} • {episodes.length} épisodes
                  </h3>
                  <button
                    onClick={() => setShowEpisodeList(false)}
                    className="lg:hidden p-1 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 text-white/50" />
                  </button>
                </div>
              </div>

              <div className="max-h-[calc(100vh-400px)] lg:max-h-[600px] overflow-y-auto custom-scrollbar">
                <div className="p-2 space-y-1">
                  {episodes.map((ep) => (
                    <motion.button
                      key={ep.episode_number}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => handleChangeEpisode(ep.episode_number)}
                      className={cn(
                        "w-full flex items-start gap-3 p-3 rounded-xl transition-all text-left",
                        ep.episode_number === episode
                          ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30"
                          : "hover:bg-white/5 border border-transparent"
                      )}
                    >
                      <div className="flex-shrink-0 relative">
                        {ep.still_path ? (
                          <img
                            src={`https://image.tmdb.org/t/p/w185${ep.still_path}`}
                            alt={ep.name}
                            className="w-24 h-14 object-cover rounded-lg"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-24 h-14 bg-zinc-800 rounded-lg flex items-center justify-center">
                            <Play className="w-5 h-5 text-white/30" />
                          </div>
                        )}
                        {ep.episode_number === episode && (
                          <div className="absolute inset-0 bg-purple-500/20 rounded-lg flex items-center justify-center">
                            <Play className="w-6 h-6 text-white fill-white" />
                          </div>
                        )}
                        <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/80 rounded text-[10px] font-bold text-white">
                          E{ep.episode_number}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={cn(
                          "text-sm font-medium truncate",
                          ep.episode_number === episode ? "text-white" : "text-white/70"
                        )}>
                          {ep.name || `Épisode ${ep.episode_number}`}
                        </h4>
                        {ep.runtime && (
                          <span className="text-xs text-white/40">{ep.runtime} min</span>
                        )}
                        {ep.overview && (
                          <p className="text-xs text-white/30 mt-1 line-clamp-2">
                            {ep.overview}
                          </p>
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {mediaType === 'tv' && !showEpisodeList && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              whileHover={{ scale: 1.05 }}
              onClick={() => setShowEpisodeList(true)}
              className="fixed right-4 top-1/2 -translate-y-1/2 p-3 bg-zinc-900/90 backdrop-blur-xl 
                border border-white/10 rounded-xl shadow-xl z-40 hidden lg:flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4 text-white/70" />
              <span className="text-xs text-white/70">Épisodes</span>
            </motion.button>
          )}
        </div>

        {/* Recommendations Section */}
        {media?.recommendations?.results?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="max-w-[1800px] mx-auto w-full px-4 pb-8"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full" />
              <h2 className="text-lg font-bold text-white">Recommandations</h2>
              <span className="text-xs text-white/40">
                {Math.min(media.recommendations.results.length, 12)} titres similaires
              </span>
            </div>
            <div className="relative">
              <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide scroll-smooth">
                {media.recommendations.results.slice(0, 12).map((item: any) => (
                  <div key={item.id} className="flex-shrink-0 w-[140px] sm:w-[160px]">
                    <MediaCard
                      id={item.id}
                      title={item.title || item.name}
                      posterPath={item.poster_path}
                      voteAverage={item.vote_average}
                      releaseDate={item.release_date || item.first_air_date}
                      mediaType={item.media_type || mediaType}
                    />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {showEndOverlay && nextEpisode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-zinc-900/90 border border-white/10 rounded-2xl p-8 text-center max-w-md w-full shadow-2xl"
            >
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 
                flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Play className="w-8 h-8 text-white fill-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Épisode terminé</h2>
              <p className="text-white/60 mb-6">
                Prochain épisode : <span className="text-purple-400 font-semibold">S{nextEpisode.season}E{nextEpisode.episode}</span>
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={handleNextEpisode}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 
                    text-white font-semibold py-3"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Lire l'épisode suivant
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowEndOverlay(false)}
                  className="px-6 border-white/20 hover:bg-white/5 text-white"
                >
                  Fermer
                </Button>
              </div>
              <div className="mt-6 flex items-center justify-center gap-2">
                <span className="text-xs text-white/40">Lecture auto</span>
                <Switch
                  checked={autoPlayNext}
                  onCheckedChange={setAutoPlayNext}
                  className="data-[state=checked]:bg-purple-600"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 92, 246, 0.5);
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </motion.div>
  );
}
