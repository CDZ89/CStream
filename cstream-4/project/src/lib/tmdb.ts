import { useI18n } from './i18n';
import { tmdbCache, CACHE_TTL } from './tmdbCache';

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY || '';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

const getLanguage = () => {
  try {
    const state = useI18n.getState();
    return state.getTMDBLanguage();
  } catch {
    return 'fr-FR';
  }
};

const fetchWithError = async <T>(url: string): Promise<T> => {
  const res = await fetch(url);
  if (!res.ok) {
    const errorText = await res.text().catch(() => 'Unknown error');
    console.error(`TMDB API Error (${res.status}): ${url.replace(TMDB_API_KEY, 'REDACTED')}`, errorText);
    throw new Error(`TMDB API Error (${res.status}): ${errorText}`);
  }
  return res.json();
};

const cachedFetch = async <T>(
  key: string,
  url: string,
  ttl: number = CACHE_TTL.DYNAMIC,
  persist: boolean = false
): Promise<T> => {
  return tmdbCache.getOrSet<T>(
    key,
    () => fetchWithError<T>(url),
    { ttl, persist }
  );
};

export const tmdbApi = {
  getImageUrl: (path: string | null, size: 'w200' | 'w300' | 'w342' | 'w500' | 'w780' | 'w1280' | 'original' = 'w500') => {
    if (!path) return '/placeholder.svg';
    return `${TMDB_IMAGE_BASE}/${size}${path}`;
  },

  getPosterSrcSet: (path: string | null) => {
    if (!path) return undefined;
    return `${TMDB_IMAGE_BASE}/w185${path} 185w, ${TMDB_IMAGE_BASE}/w342${path} 342w, ${TMDB_IMAGE_BASE}/w500${path} 500w`;
  },

  getBackdropSrcSet: (path: string | null) => {
    if (!path) return undefined;
    return `${TMDB_IMAGE_BASE}/w300${path} 300w, ${TMDB_IMAGE_BASE}/w780${path} 780w, ${TMDB_IMAGE_BASE}/original${path} 1920w`;
  },

  searchMulti: async (query: string, language?: string) => {
    const lang = language || getLanguage();
    const key = `search_multi_${query}_${lang}`;
    const url = `${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&language=${lang}&query=${encodeURIComponent(query)}&page=1`;
    return cachedFetch(key, url, CACHE_TTL.SHORT);
  },

  searchMovies: async (query: string, language?: string) => {
    const lang = language || getLanguage();
    const key = `search_movies_${query}_${lang}`;
    const url = `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&language=${lang}&query=${encodeURIComponent(query)}&page=1`;
    return cachedFetch(key, url, CACHE_TTL.SHORT);
  },

  searchTV: async (query: string, language?: string) => {
    const lang = language || getLanguage();
    const key = `search_tv_${query}_${lang}`;
    const url = `${TMDB_BASE_URL}/search/tv?api_key=${TMDB_API_KEY}&language=${lang}&query=${encodeURIComponent(query)}&page=1`;
    return cachedFetch(key, url, CACHE_TTL.SHORT);
  },

  searchPerson: async (query: string, language?: string) => {
    const lang = language || getLanguage();
    const key = `search_person_${query}_${lang}`;
    const url = `${TMDB_BASE_URL}/search/person?api_key=${TMDB_API_KEY}&language=${lang}&query=${encodeURIComponent(query)}&page=1`;
    return cachedFetch(key, url, CACHE_TTL.SHORT);
  },

  getTrending: async (mediaType: 'all' | 'movie' | 'tv' | 'person' = 'all', timeWindow: 'day' | 'week' = 'week', language?: string): Promise<{ results: (TMDBMovie | TMDBTV | TMDBPerson)[] }> => {
    const lang = language || getLanguage();
    const key = `trending_${mediaType}_${timeWindow}_${lang}`;
    const url = `${TMDB_BASE_URL}/trending/${mediaType}/${timeWindow}?api_key=${TMDB_API_KEY}&language=${lang}`;
    return cachedFetch(key, url, CACHE_TTL.DYNAMIC);
  },

  getPopularMovies: async (page = 1, language?: string): Promise<{ results: TMDBMovie[] }> => {
    const lang = language || getLanguage();
    const key = `popular_movies_${page}_${lang}`;
    const url = `${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&language=${lang}&page=${page}`;
    return cachedFetch(key, url, CACHE_TTL.DYNAMIC);
  },

  getTopRatedMovies: async (page = 1, language?: string) => {
    const lang = language || getLanguage();
    const key = `top_rated_movies_${page}_${lang}`;
    const url = `${TMDB_BASE_URL}/movie/top_rated?api_key=${TMDB_API_KEY}&language=${lang}&page=${page}`;
    return cachedFetch(key, url, CACHE_TTL.DYNAMIC);
  },

  getNowPlayingMovies: async (page = 1, language?: string) => {
    const lang = language || getLanguage();
    const key = `now_playing_movies_${page}_${lang}`;
    const url = `${TMDB_BASE_URL}/movie/now_playing?api_key=${TMDB_API_KEY}&language=${lang}&page=${page}`;
    return cachedFetch(key, url, CACHE_TTL.DYNAMIC);
  },

  getUpcomingMovies: async (page = 1, language?: string) => {
    const lang = language || getLanguage();
    const key = `upcoming_movies_${page}_${lang}`;
    const url = `${TMDB_BASE_URL}/movie/upcoming?api_key=${TMDB_API_KEY}&language=${lang}&page=${page}`;
    return cachedFetch(key, url, CACHE_TTL.DYNAMIC);
  },

  getPopularTV: async (page = 1, language?: string): Promise<{ results: TMDBTV[] }> => {
    const lang = language || getLanguage();
    const key = `popular_tv_${page}_${lang}`;
    const url = `${TMDB_BASE_URL}/tv/popular?api_key=${TMDB_API_KEY}&language=${lang}&page=${page}`;
    return cachedFetch(key, url, CACHE_TTL.DYNAMIC);
  },

  getTopRatedTV: async (page = 1, language?: string) => {
    const lang = language || getLanguage();
    const key = `top_rated_tv_${page}_${lang}`;
    const url = `${TMDB_BASE_URL}/tv/top_rated?api_key=${TMDB_API_KEY}&language=${lang}&page=${page}`;
    return cachedFetch(key, url, CACHE_TTL.DYNAMIC);
  },

  getAiringTodayTV: async (page = 1, language?: string) => {
    const lang = language || getLanguage();
    const key = `airing_today_tv_${page}_${lang}`;
    const url = `${TMDB_BASE_URL}/tv/airing_today?api_key=${TMDB_API_KEY}&language=${lang}&page=${page}`;
    return cachedFetch(key, url, CACHE_TTL.DYNAMIC);
  },

  getOnTheAirTV: async (page = 1, language?: string) => {
    const lang = language || getLanguage();
    const key = `on_the_air_tv_${page}_${lang}`;
    const url = `${TMDB_BASE_URL}/tv/on_the_air?api_key=${TMDB_API_KEY}&language=${lang}&page=${page}`;
    return cachedFetch(key, url, CACHE_TTL.DYNAMIC);
  },

  getMovieDetails: async (id: number, language?: string) => {
    const lang = language || getLanguage();
    const key = `movie_details_${id}_${lang}`;
    const url = `${TMDB_BASE_URL}/movie/${id}?api_key=${TMDB_API_KEY}&language=${lang}&append_to_response=credits,videos,recommendations,similar,images,watch/providers&include_image_language=${lang.split('-')[0]},en,null`;
    return cachedFetch(key, url, CACHE_TTL.STABLE);
  },

  getTVDetails: async (id: number, language?: string) => {
    const lang = language || getLanguage();
    const key = `tv_details_${id}_${lang}`;
    const url = `${TMDB_BASE_URL}/tv/${id}?api_key=${TMDB_API_KEY}&language=${lang}&append_to_response=credits,videos,recommendations,similar,images,watch/providers&include_image_language=${lang.split('-')[0]},en,null`;
    return cachedFetch(key, url, CACHE_TTL.STABLE);
  },

  getTVSeasonDetails: async (tvId: number, seasonNumber: number, language?: string) => {
    const lang = language || getLanguage();
    const key = `tv_season_${tvId}_${seasonNumber}_${lang}`;
    const url = `${TMDB_BASE_URL}/tv/${tvId}/season/${seasonNumber}?api_key=${TMDB_API_KEY}&language=${lang}`;
    return cachedFetch(key, url, CACHE_TTL.STABLE);
  },

  getTVEpisodeDetails: async (tvId: number, seasonNumber: number, episodeNumber: number, language?: string) => {
    const lang = language || getLanguage();
    const key = `tv_episode_${tvId}_${seasonNumber}_${episodeNumber}_${lang}`;
    const url = `${TMDB_BASE_URL}/tv/${tvId}/season/${seasonNumber}/episode/${episodeNumber}?api_key=${TMDB_API_KEY}&language=${lang}`;
    return cachedFetch(key, url, CACHE_TTL.STABLE);
  },

  getPersonDetails: async (id: number, language?: string) => {
    const lang = language || getLanguage();
    const key = `person_details_${id}_${lang}`;
    const url = `${TMDB_BASE_URL}/person/${id}?api_key=${TMDB_API_KEY}&language=${lang}&append_to_response=combined_credits,images`;
    return cachedFetch(key, url, CACHE_TTL.STABLE);
  },

  getPopularPeople: async (page = 1, language?: string) => {
    const lang = language || getLanguage();
    const key = `popular_people_${page}_${lang}`;
    const url = `${TMDB_BASE_URL}/person/popular?api_key=${TMDB_API_KEY}&language=${lang}&page=${page}`;
    return cachedFetch(key, url, CACHE_TTL.DYNAMIC);
  },

  getMovieGenres: async (language?: string) => {
    const lang = language || getLanguage();
    const key = `movie_genres_${lang}`;
    const url = `${TMDB_BASE_URL}/genre/movie/list?api_key=${TMDB_API_KEY}&language=${lang}`;
    return cachedFetch(key, url, CACHE_TTL.LONG, true);
  },

  getTVGenres: async (language?: string) => {
    const lang = language || getLanguage();
    const key = `tv_genres_${lang}`;
    const url = `${TMDB_BASE_URL}/genre/tv/list?api_key=${TMDB_API_KEY}&language=${lang}`;
    return cachedFetch(key, url, CACHE_TTL.LONG, true);
  },

  discoverMovies: async (params: Record<string, string | number> = {}, language?: string) => {
    const lang = language || getLanguage();
    const searchParams = new URLSearchParams({
      api_key: TMDB_API_KEY,
      language: lang,
      ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)]))
    });
    const key = `discover_movies_${searchParams.toString()}`;
    const url = `${TMDB_BASE_URL}/discover/movie?${searchParams}`;
    return cachedFetch(key, url, CACHE_TTL.DYNAMIC);
  },

  discoverTV: async (params: Record<string, string | number> = {}, language?: string) => {
    const lang = language || getLanguage();
    const searchParams = new URLSearchParams({
      api_key: TMDB_API_KEY,
      language: lang,
      ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)]))
    });
    const key = `discover_tv_${searchParams.toString()}`;
    const url = `${TMDB_BASE_URL}/discover/tv?${searchParams}`;
    return cachedFetch(key, url, CACHE_TTL.DYNAMIC);
  },

  getAnime: async (page = 1, language?: string): Promise<{ results: TMDBTV[] }> => {
    const lang = language || getLanguage();
    const key = `anime_${page}_${lang}`;
    const url = `${TMDB_BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&language=${lang}&with_genres=16&with_origin_country=JP&sort_by=popularity.desc&page=${page}`;
    return cachedFetch(key, url, CACHE_TTL.DYNAMIC);
  },

  searchByType: async (query: string, mediaType: 'movie' | 'tv' | 'anime' | 'series', language?: string) => {
    const lang = language || getLanguage();
    if (mediaType === 'movie') {
      return tmdbApi.searchMovies(query, lang);
    } else {
      return tmdbApi.searchTV(query, lang);
    }
  },

  getCollection: async (id: number, language?: string) => {
    const lang = language || getLanguage();
    const key = `collection_${id}_${lang}`;
    const url = `${TMDB_BASE_URL}/collection/${id}?api_key=${TMDB_API_KEY}&language=${lang}`;
    return cachedFetch(key, url, CACHE_TTL.STABLE);
  },

  getMediaImages: async (id: number, mediaType: 'movie' | 'tv', language?: string): Promise<TMDBImagesResponse> => {
    const lang = language || getLanguage();
    const langCode = lang.split('-')[0];
    const key = `images_${mediaType}_${id}_${langCode}`;
    const url = `${TMDB_BASE_URL}/${mediaType}/${id}/images?api_key=${TMDB_API_KEY}&include_image_language=${langCode},en,null`;
    return cachedFetch(key, url, CACHE_TTL.STABLE);
  },

  getLogoUrl: (path: string | null, size: 'w200' | 'w300' | 'w500' | 'w780' | 'w1280' | 'original' = 'w500') => {
    if (!path) return null;
    return `${TMDB_IMAGE_BASE}/${size}${path}`;
  },

  getWatchProviders: async (mediaType: 'movie' | 'tv' = 'movie', language?: string) => {
    const lang = language || getLanguage();
    const region = lang.split('-')[1] || 'US';
    const key = `watch_providers_${mediaType}_${region}`;
    const url = `${TMDB_BASE_URL}/watch/providers/${mediaType}?api_key=${TMDB_API_KEY}&language=${lang}&watch_region=${region}`;
    return cachedFetch(key, url, CACHE_TTL.LONG, true);
  },

  discoverByProvider: async (providerId: number, mediaType: 'movie' | 'tv' = 'movie', page = 1, language?: string): Promise<{ results: (TMDBMovie | TMDBTV)[] }> => {
    const lang = language || getLanguage();
    const region = lang.split('-')[1] || 'US';
    const key = `discover_provider_${providerId}_${mediaType}_${page}_${region}_${lang}`;
    const url = `${TMDB_BASE_URL}/discover/${mediaType}?api_key=${TMDB_API_KEY}&language=${lang}&with_watch_providers=${providerId}&watch_region=${region}&sort_by=popularity.desc&page=${page}`;
    return cachedFetch(key, url, CACHE_TTL.DYNAMIC);
  },

  clearCache: () => {
    tmdbCache.clear();
  },

  getCacheStats: () => {
    return {
      size: tmdbCache.size(),
      keys: tmdbCache.keys(),
    };
  },
};

export const prefetchContent = async (id: number, type: 'movie' | 'tv'): Promise<void> => {
  try {
    if (type === 'movie') {
      await tmdbApi.getMovieDetails(id);
    } else {
      await tmdbApi.getTVDetails(id);
    }
  } catch {
    // Silent fail for prefetch - don't disrupt user experience
  }
};

export const prefetchTrending = async (): Promise<void> => {
  try {
    await Promise.all([
      tmdbApi.getTrending('movie', 'week'),
      tmdbApi.getTrending('tv', 'week'),
      tmdbApi.getPopularMovies(1),
      tmdbApi.getPopularTV(1),
    ]);
  } catch {
    // Silent fail for prefetch
  }
};

export const prefetchGenres = async (): Promise<void> => {
  try {
    await Promise.all([
      tmdbApi.getMovieGenres(),
      tmdbApi.getTVGenres(),
    ]);
  } catch {
    // Silent fail for prefetch
  }
};

export type TMDBMovie = {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids: number[];
  media_type?: 'movie';
};

export type TMDBTV = {
  id: number;
  name: string;
  original_name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids: number[];
  media_type?: 'tv';
};

export type TMDBPerson = {
  id: number;
  name: string;
  profile_path: string | null;
  known_for_department: string;
  popularity: number;
  media_type?: 'person';
};

export type TMDBSearchResult = TMDBMovie | TMDBTV | TMDBPerson;

export interface TMDBListResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface TMDBImage {
  aspect_ratio: number;
  file_path: string;
  height: number;
  iso_639_1: string | null;
  vote_average: number;
  vote_count: number;
  width: number;
}

export interface TMDBImagesResponse {
  id: number;
  logos: TMDBImage[];
  posters: TMDBImage[];
  backdrops: TMDBImage[];
}
