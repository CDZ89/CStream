const ANIMESCHEDULE_BASE_URL = 'https://animeschedule.net/api/v3';
const ANIMESCHEDULE_IMAGE_CDN = 'https://img.animeschedule.net/production/assets/public/img/';

const APP_ID = import.meta.env.VITE_ANIMESCHEDULE_APP_ID || 'R5Qn3yJSv5eEevqsbJ5e';
const APP_TOKEN = import.meta.env.VITE_ANIMESCHEDULE_TOKEN || 'ZuDO37qUPvKmlsIWoI8U2ao4CdVsJL';

export interface AnimeScheduleItem {
  id: string;
  title: string;
  route: string;
  romaji?: string;
  english?: string;
  native?: string;
  delayedText?: string;
  delayedFrom?: string;
  delayedUntil?: string;
  status?: string;
  episodeDate?: string;
  episodeNumber?: number;
  subtractedEpisodeNumber?: number;
  episodes?: number;
  lengthMin?: number;
  donghua?: boolean;
  airType?: 'raw' | 'sub' | 'dub';
  imageVersionRoute?: string;
  airingStatus?: 'airing' | 'aired' | 'unaired' | 'delayed-air';
  mediaTypes?: { name: string; route: string }[];
  streams?: { platform: string; url: string; name: string }[];
}

export interface AnimeDetails {
  id: string;
  title: string;
  route: string;
  premier?: string;
  subPremier?: string;
  dubPremier?: string;
  month?: string;
  year?: number;
  description?: string;
  genres?: { name: string; route: string }[];
  studios?: { name: string; route: string }[];
  sources?: { name: string; route: string }[];
  mediaTypes?: { name: string; route: string }[];
  episodes?: number;
  lengthMin?: number;
  status?: string;
  imageVersionRoute?: string;
  stats?: {
    averageScore?: number;
    ratingCount?: number;
    trackedCount?: number;
    trackedRating?: number;
  };
  names?: {
    romaji?: string;
    english?: string;
    native?: string;
    abbreviation?: string;
    synonyms?: string[];
  };
  websites?: {
    official?: string;
    mal?: string;
    aniList?: string;
    streams?: { platform: string; url: string; name: string }[];
  };
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

const cache = new Map<string, CacheEntry<any>>();

const getCached = <T>(key: string): T | null => {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > entry.ttl) {
    cache.delete(key);
    return null;
  }
  return entry.data;
};

const setCache = <T>(key: string, data: T, ttlMs: number = 5 * 60 * 1000): void => {
  cache.set(key, { data, timestamp: Date.now(), ttl: ttlMs });
};

const fetchWithAuth = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
  const headers = {
    'Authorization': `Bearer ${APP_TOKEN}`,
    'Content-Type': 'application/json',
    ...options.headers,
  };

  try {
    const response = await fetch(`${ANIMESCHEDULE_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`AnimeSchedule API error: ${response.status}`);
    }

    return response.json();
  } catch (error: any) {
    // CORS error - use fallback
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      console.warn('[AnimeSchedule] CORS error, returning empty array');
      return [];
    }
    throw error;
  }
};

export const animeScheduleApi = {
  getImageUrl: (imageVersionRoute?: string): string => {
    if (!imageVersionRoute) return '/placeholder-anime.jpg';
    return `${ANIMESCHEDULE_IMAGE_CDN}${imageVersionRoute}`;
  },

  getTimetable: async (date?: string): Promise<AnimeScheduleItem[]> => {
    const dateParam = date || new Date().toISOString().split('T')[0];
    const cacheKey = `timetable_${dateParam}`;
    
    const cached = getCached<AnimeScheduleItem[]>(cacheKey);
    if (cached) return cached;

    try {
      const data = await fetchWithAuth(`/timetables/${dateParam}`);
      const items = Array.isArray(data) ? data : (data.anime || []);
      setCache(cacheKey, items, 10 * 60 * 1000);
      return items;
    } catch (error) {
      console.error('Failed to fetch timetable:', error);
      return [];
    }
  },

  getWeeklyTimetable: async (): Promise<{ [day: string]: AnimeScheduleItem[] }> => {
    const cacheKey = 'weekly_timetable';
    
    const cached = getCached<{ [day: string]: AnimeScheduleItem[] }>(cacheKey);
    if (cached) return cached;

    try {
      const today = new Date();
      const days: { [day: string]: AnimeScheduleItem[] } = {};
      
      const promises = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        const dayName = date.toLocaleDateString('fr-FR', { weekday: 'long' });
        promises.push(
          animeScheduleApi.getTimetable(dateStr).then(items => ({
            dayName: i === 0 ? 'Aujourd\'hui' : i === 1 ? 'Demain' : dayName.charAt(0).toUpperCase() + dayName.slice(1),
            date: dateStr,
            items
          }))
        );
      }
      
      const results = await Promise.all(promises);
      results.forEach(({ dayName, items }) => {
        days[dayName] = items;
      });
      
      setCache(cacheKey, days, 15 * 60 * 1000);
      return days;
    } catch (error) {
      console.error('Failed to fetch weekly timetable:', error);
      return {};
    }
  },

  getAnimeDetails: async (slugOrId: string): Promise<AnimeDetails | null> => {
    const cacheKey = `anime_${slugOrId}`;
    
    const cached = getCached<AnimeDetails>(cacheKey);
    if (cached) return cached;

    try {
      const data = await fetchWithAuth(`/anime/${slugOrId}`);
      setCache(cacheKey, data, 30 * 60 * 1000);
      return data;
    } catch (error) {
      console.error('Failed to fetch anime details:', error);
      return null;
    }
  },

  searchAnime: async (query: string, page: number = 1): Promise<{ anime: AnimeDetails[]; total: number; page: number }> => {
    const cacheKey = `search_${query}_${page}`;
    
    const cached = getCached<{ anime: AnimeDetails[]; total: number; page: number }>(cacheKey);
    if (cached) return cached;

    try {
      const params = new URLSearchParams({
        q: query,
        page: String(page),
      });
      
      const data = await fetchWithAuth(`/anime?${params}`);
      const result = {
        anime: data.anime || [],
        total: data.total || 0,
        page: data.page || page,
      };
      setCache(cacheKey, result, 5 * 60 * 1000);
      return result;
    } catch (error) {
      console.error('Failed to search anime:', error);
      return { anime: [], total: 0, page: 1 };
    }
  },

  getAiringAnime: async (page: number = 1): Promise<AnimeDetails[]> => {
    const cacheKey = `airing_${page}`;
    
    const cached = getCached<AnimeDetails[]>(cacheKey);
    if (cached) return cached;

    try {
      const params = new URLSearchParams({
        page: String(page),
        st: 'releaseDate',
      });
      
      const data = await fetchWithAuth(`/anime?${params}`);
      const anime = data.anime || [];
      setCache(cacheKey, anime, 10 * 60 * 1000);
      return anime;
    } catch (error) {
      console.error('Failed to fetch airing anime:', error);
      return [];
    }
  },

  getUpcomingAnime: async (): Promise<AnimeScheduleItem[]> => {
    const cacheKey = 'upcoming_anime';
    
    const cached = getCached<AnimeScheduleItem[]>(cacheKey);
    if (cached) return cached;

    try {
      const today = new Date();
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);
      
      const allItems: AnimeScheduleItem[] = [];
      
      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const items = await animeScheduleApi.getTimetable(date.toISOString().split('T')[0]);
        allItems.push(...items.filter(item => item.airingStatus === 'unaired' || !item.airingStatus));
      }
      
      setCache(cacheKey, allItems, 15 * 60 * 1000);
      return allItems;
    } catch (error) {
      console.error('Failed to fetch upcoming anime:', error);
      return [];
    }
  },
};

export const formatAirTime = (dateString?: string): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
};

export const formatAirDate = (dateString?: string): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) return 'Aujourd\'hui';
    if (date.toDateString() === tomorrow.toDateString()) return 'Demain';
    
    return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  } catch {
    return '';
  }
};

export const getAiringStatusColor = (status?: string): string => {
  switch (status) {
    case 'airing': return 'bg-red-500';
    case 'aired': return 'bg-green-500';
    case 'unaired': return 'bg-blue-500';
    case 'delayed-air': return 'bg-yellow-500';
    default: return 'bg-gray-500';
  }
};

export const getAiringStatusText = (status?: string): string => {
  switch (status) {
    case 'airing': return 'En cours';
    case 'aired': return 'Diffusé';
    case 'unaired': return 'À venir';
    case 'delayed-air': return 'Retardé';
    default: return 'Inconnu';
  }
};
