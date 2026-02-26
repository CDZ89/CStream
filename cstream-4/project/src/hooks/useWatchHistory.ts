import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { tmdbApi } from '@/lib/tmdb';

export interface WatchHistoryItem {
  id: string;
  tmdb_id: number;
  media_type: string;
  season_number: number | null;
  episode_number: number | null;
  progress: number;
  updated_at: string;
  title?: string;
  poster_path?: string;
  backdrop_path?: string;
  episode_name?: string;
  total_episodes?: number;
  language?: string;
  runtime?: number;
}


const LOCAL_STORAGE_KEY = 'cstream_watch_history_v3';
const LEGACY_STORAGE_KEY = 'cstream_watch_history_v2';
const MAX_HISTORY_ITEMS = 100;

const migrateOldHistory = (): void => {
  if (typeof window === 'undefined') return;

  try {
    const oldData = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (oldData) {
      const newData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!newData) {
        localStorage.setItem(LOCAL_STORAGE_KEY, oldData);
      } else {
        const oldItems = JSON.parse(oldData);
        const newItems = JSON.parse(newData);
        const merged = [...newItems];
        for (const oldItem of oldItems) {
          const exists = merged.some(m =>
            m.tmdb_id === oldItem.tmdb_id &&
            m.media_type === oldItem.media_type &&
            m.season_number === oldItem.season_number &&
            m.episode_number === oldItem.episode_number
          );
          if (!exists) {
            merged.push(oldItem);
          }
        }
        merged.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged.slice(0, MAX_HISTORY_ITEMS)));
      }
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    }
  } catch (e) {
    console.warn('Failed to migrate old history:', e);
  }
};

if (typeof window !== 'undefined') {
  migrateOldHistory();
}

const getLocalHistory = (): WatchHistoryItem[] => {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveLocalHistory = (items: WatchHistoryItem[]): void => {
  if (typeof window === 'undefined') return;

  try {
    const trimmed = items.slice(0, MAX_HISTORY_ITEMS);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.warn('Failed to save local watch history:', e);
  }
};

const generateLocalId = (): string => {
  return `local-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
};

export const useWatchHistory = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState<WatchHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const enrichmentCacheRef = useRef<Map<string, any>>(new Map());
  const isFetchingRef = useRef(false);
  const supabaseSyncEnabledRef = useRef(true);

  const trySyncToSupabase = useCallback(async (item: WatchHistoryItem) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('history')
        .upsert({
          id: item.id.startsWith('local-') ? undefined : item.id,
          user_id: user.id,
          tmdb_id: item.tmdb_id,
          media_type: item.media_type,
          season_number: item.season_number,
          episode_number: item.episode_number,
          progress: item.progress,
          updated_at: item.updated_at,
          language: item.language,
        }, {
          onConflict: 'user_id,tmdb_id,media_type,season_number,episode_number',
          ignoreDuplicates: false
        });

      if (error) {
        console.warn('[Watch History] Supabase sync failed:', error.message);
      }
    } catch (err) {
      console.error('[Watch History] Sync error:', err);
    }
  }, [user]);

  const enrichHistoryItem = useCallback(async (item: WatchHistoryItem): Promise<Partial<WatchHistoryItem>> => {
    const cacheKey = `${item.tmdb_id}-${item.media_type}`;

    if (enrichmentCacheRef.current.has(cacheKey)) {
      const cached = enrichmentCacheRef.current.get(cacheKey);
      let episodeData = {};

      if ((item.media_type === 'tv' || item.media_type === 'anime') && item.season_number && item.episode_number) {
        const seasonCacheKey = `${item.tmdb_id}-s${item.season_number}`;
        if (enrichmentCacheRef.current.has(seasonCacheKey)) {
          const seasonData = enrichmentCacheRef.current.get(seasonCacheKey);
          const episode = seasonData.episodes?.find((ep: any) => ep.episode_number === item.episode_number);
          episodeData = {
            episode_name: episode?.name || '',
            total_episodes: seasonData.episodes?.length || 0,
          };
        }
      }

      return {
        id: item.id,
        title: cached.title || cached.name || '',
        poster_path: cached.poster_path || null,
        backdrop_path: cached.backdrop_path || null,
        ...episodeData,
      };
    }

    try {
      if (item.media_type === 'tv' || item.media_type === 'anime') {
        const details = await tmdbApi.getTVDetails(item.tmdb_id) as any;
        enrichmentCacheRef.current.set(cacheKey, details);

        let episodeName = '';
        let totalEpisodes = 0;

        if (item.season_number && item.episode_number) {
          try {
            const seasonCacheKey = `${item.tmdb_id}-s${item.season_number}`;
            let seasonData;

            if (enrichmentCacheRef.current.has(seasonCacheKey)) {
              seasonData = enrichmentCacheRef.current.get(seasonCacheKey);
            } else {
              seasonData = await tmdbApi.getTVSeasonDetails(item.tmdb_id, item.season_number) as any;
              enrichmentCacheRef.current.set(seasonCacheKey, seasonData);
            }

            const episode = seasonData.episodes?.find((ep: any) => ep.episode_number === item.episode_number);
            episodeName = episode?.name || '';
            totalEpisodes = seasonData.episodes?.length || 0;
          } catch (e) {
            console.warn('Could not fetch season details for:', item.tmdb_id);
          }
        }

        return {
          id: item.id,
          title: details?.name || '',
          poster_path: details?.poster_path || null,
          backdrop_path: details?.backdrop_path || null,
          episode_name: episodeName,
          total_episodes: totalEpisodes,
          runtime: details?.episode_run_time?.[0] || details?.runtime,
        };
      } else {
        const details = await tmdbApi.getMovieDetails(item.tmdb_id) as any;
        enrichmentCacheRef.current.set(cacheKey, details);

        return {
          id: item.id,
          title: details?.title || '',
          poster_path: details?.poster_path || null,
          backdrop_path: details?.backdrop_path || null,
          runtime: details?.runtime,
        };
      }
    } catch (e) {
      console.warn('Failed to enrich history item:', item.tmdb_id);
      return { id: item.id };
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      const localData = getLocalHistory();
      console.log('[Watch History] Loading local history:', localData.length, 'items');

      // Always show local data first
      setHistory(localData);
      setLoading(false);

      // Sync with server if logged in
      if (user && supabaseSyncEnabledRef.current) {
        try {
          const { data, error } = await supabase
            .from('history')
            .select('*')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false })
            .limit(MAX_HISTORY_ITEMS);

          if (!error && data) {
            console.log('[Watch History] Supabase data fetched:', data.length, 'items');

            // Merge local and server data, server taking priority if newer
            const mergedMap = new Map<string, WatchHistoryItem>();

            // Add local items first
            localData.forEach(item => {
              const key = `${item.tmdb_id}-${item.media_type}-${item.season_number || 0}-${item.episode_number || 0}`;
              mergedMap.set(key, item);
            });

            // Add/Update with server items
            data.forEach((serverItem: any) => {
              const key = `${serverItem.tmdb_id}-${serverItem.media_type}-${serverItem.season_number || 0}-${serverItem.episode_number || 0}`;
              const existing = mergedMap.get(key);

              if (!existing || new Date(serverItem.updated_at) > new Date(existing.updated_at)) {
                mergedMap.set(key, {
                  ...serverItem,
                  progress: serverItem.progress || 0,
                } as WatchHistoryItem);
              }
            });

            const mergedHistory = Array.from(mergedMap.values())
              .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
              .slice(0, MAX_HISTORY_ITEMS);

            saveLocalHistory(mergedHistory);
            setHistory(mergedHistory);
          }
        } catch (err) {
          console.log('[Watch History] Supabase fetch skipped:', err);
        }
      }

      // Enrich visible items with TMDB data
      const currentHistory = getLocalHistory();
      if (currentHistory.length > 0) {
        const itemsToEnrich = currentHistory.slice(0, 12);
        const batchSize = 4;
        for (let i = 0; i < itemsToEnrich.length; i += batchSize) {
          const batch = itemsToEnrich.slice(i, i + batchSize);
          const enrichedBatch = await Promise.all(batch.map(enrichHistoryItem));

          setHistory(prev => {
            if (!Array.isArray(prev)) return currentHistory;
            return prev.map(item => {
              const enriched = enrichedBatch.find(e => e.id === item.id);
              return enriched ? { ...item, ...enriched } : item;
            });
          });
        }
      }
    } catch (error) {
      console.error('Error in fetchHistory:', error);
      setLoading(false);
    } finally {
      isFetchingRef.current = false;
    }
  }, [user, enrichHistoryItem]);

  const saveProgress = useCallback(async (
    tmdbId: number,
    mediaType: string,
    seasonNumber?: number | null,
    episodeNumber?: number | null,
    progress?: number,
    language?: string
  ) => {
    const normalizedMediaType = mediaType === 'series' ? 'tv' : mediaType;

    // Handle special value -1 which means "heartbeat" (update updated_at but keep same progress if not 100)
    const safeProgress = progress === -1 ? -1 : Math.max(0, Math.min(100, progress || 0));

    console.log('[Watch History] saveProgress called:', { tmdbId, mediaType: normalizedMediaType, seasonNumber, episodeNumber, progress: safeProgress, language });

    const localHistory = getLocalHistory();
    const existingIndex = localHistory.findIndex(item =>
      item.tmdb_id === tmdbId &&
      item.media_type === normalizedMediaType &&
      (normalizedMediaType === 'movie' ||
        (item.season_number === (seasonNumber || item.season_number) && item.episode_number === (episodeNumber || item.episode_number)))
    );

    const now = new Date().toISOString();
    let newItem: WatchHistoryItem;

    if (existingIndex !== -1) {
      const existing = localHistory[existingIndex];

      // If safeProgress is heartbeat (-1), we use the existing progress but update the timestamp
      const finalProgress = safeProgress === -1 ? existing.progress : safeProgress;

      const shouldUpdate =
        (normalizedMediaType === 'movie') ||
        (seasonNumber && episodeNumber && (
          (seasonNumber > (existing.season_number || 0)) ||
          (seasonNumber === existing.season_number && (episodeNumber || 0) > (existing.episode_number || 0))
        )) ||
        (seasonNumber === existing.season_number && episodeNumber === existing.episode_number);

      if (shouldUpdate) {
        localHistory[existingIndex] = {
          ...existing,
          progress: finalProgress,
          updated_at: now,
          ...(seasonNumber !== undefined && seasonNumber !== null && { season_number: seasonNumber }),
          ...(episodeNumber !== undefined && episodeNumber !== null && { episode_number: episodeNumber }),
          ...(language && { language }),
        };
        newItem = localHistory[existingIndex];
        const [updated] = localHistory.splice(existingIndex, 1);
        localHistory.unshift(updated);
      } else {
        newItem = existing;
      }
    } else {
      // For new items, -1 defaults to 0
      const startProgress = safeProgress === -1 ? 0 : safeProgress;

      newItem = {
        id: generateLocalId(),
        tmdb_id: tmdbId,
        media_type: normalizedMediaType,
        season_number: seasonNumber ?? null,
        episode_number: episodeNumber ?? null,
        progress: startProgress,
        updated_at: now,
        language: language,
      };
      localHistory.unshift(newItem);
    }

    saveLocalHistory(localHistory);

    setHistory([...localHistory]);

    if (!localHistory[0].title) {
      try {
        const enriched = await enrichHistoryItem(localHistory[0]);
        setHistory(prev => {
          if (!Array.isArray(prev)) return localHistory;
          return prev.map(item =>
            item.id === localHistory[0].id ? { ...item, ...enriched } : item
          );
        });
      } catch (e) {
        console.warn('[Watch History] Failed to enrich item');
      }
    }

    trySyncToSupabase(newItem);
  }, [enrichHistoryItem, trySyncToSupabase]);

  const removeFromHistory = useCallback(async (id: string) => {
    const localHistory = getLocalHistory();
    const itemToRemove = localHistory.find(item => item.id === id);
    const filtered = localHistory.filter(item => item.id !== id);
    saveLocalHistory(filtered);
    setHistory(filtered);

    if (user && supabaseSyncEnabledRef.current && itemToRemove) {
      try {
        let query = supabase
          .from('history')
          .delete()
          .eq('user_id', user.id)
          .eq('tmdb_id', itemToRemove.tmdb_id)
          .eq('media_type', itemToRemove.media_type);

        if (itemToRemove.media_type !== 'movie' && itemToRemove.season_number !== null) {
          query = query
            .eq('season_number', itemToRemove.season_number)
            .eq('episode_number', itemToRemove.episode_number);
        }

        await query;
      } catch (error) {
        console.log('[Watch History] Supabase delete skipped');
      }
    }
  }, [user]);

  const clearHistory = useCallback(async () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setHistory([]);

    if (user && supabaseSyncEnabledRef.current) {
      try {
        await supabase
          .from('history')
          .delete()
          .eq('user_id', user.id);
      } catch (error) {
        console.log('[Watch History] Supabase clear skipped');
      }
    }
  }, [user]);

  const getProgressForMedia = useCallback((tmdbId: number, mediaType: string, seasonNumber?: number, episodeNumber?: number): number => {
    const normalizedType = mediaType === 'series' ? 'tv' : mediaType;

    if (!Array.isArray(history)) return 0;

    const item = history.find(h => {
      if (h.tmdb_id !== tmdbId || h.media_type !== normalizedType) return false;
      if (normalizedType === 'movie') return true;
      return h.season_number === seasonNumber && h.episode_number === episodeNumber;
    });

    return item?.progress || 0;
  }, [history]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const formatWatchedAt = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';

      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return "À l'instant";
      if (diffMins < 60) return `Il y a ${diffMins} min`;
      if (diffHours < 24) return `Il y a ${diffHours}h`;
      if (diffDays < 7) return `Il y a ${diffDays}j`;
      return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    } catch {
      return '';
    }
  };

  const safeHistory = Array.isArray(history) ? history : [];

  return {
    history: safeHistory,
    loading,
    saveProgress,
    removeFromHistory,
    clearHistory,
    fetchHistory,
    getProgressForMedia,
    formatWatchedAt,
  };
};
