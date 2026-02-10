import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getDefaultSourcesForType, convertDefaultSourceToReader } from '@/lib/defaultVideoSources';

export interface SourceItem {
  id: string;
  label: string;
  url: string;
  media_type: string;
  language: string;
  tmdb_id?: number | null;
  season_number?: number | null;
  episode_number?: number | null;
  enabled?: boolean | null;
  order_index?: number | null;
  source_type: 'local' | 'synchronized' | 'default';
  created_at?: string;
}

export const useLocalAndSyncSources = () => {
  const [sources, setSources] = useState<SourceItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Get local sources from localStorage
  const getLocalSources = useCallback(() => {
    try {
      const stored = localStorage.getItem('cstream_local_sources_v1');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }, []);

  // Save local sources to localStorage
  const saveLocalSourcesToStorage = useCallback((localSources: SourceItem[]) => {
    try {
      localStorage.setItem('cstream_local_sources_v1', JSON.stringify(localSources));
    } catch (err) {
      console.error('Error saving local sources:', err);
    }
  }, []);

  // Fetch all sources (local + synchronized + defaults)
  const fetchAllSources = useCallback(async (mediaType?: string, tmdbId?: number) => {
    setLoading(true);
    try {
      // Get local sources
      const localSources = getLocalSources();

      // Get synchronized sources from Supabase
      let query = supabase
        .from('readers')
        .select('*')
        .eq('enabled', true);

      if (tmdbId) {
        query = query.eq('tmdb_id', tmdbId);
      }

      const { data: syncSources, error } = await query.order('order_index', { ascending: true });

      if (error) {
        console.warn('Supabase fetch error:', error);
      }

      // Get default sources for this media type
      const defaultSources = mediaType 
        ? getDefaultSourcesForType(mediaType as 'tv' | 'movie').map(convertDefaultSourceToReader)
        : [];

      // Combine all sources (default first, then custom)
      const combined: SourceItem[] = [
        ...defaultSources.map(src => ({
          ...src,
          source_type: 'default' as const,
        })),
        ...(syncSources || []).map(src => ({
          ...src,
          source_type: 'synchronized' as const,
        })),
        ...(localSources || []).map(src => ({
          ...src,
          source_type: 'local' as const,
        })),
      ];

      setSources(combined);
      return combined;
    } catch (err) {
      console.error('Error fetching sources:', err);
      setSources([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [getLocalSources]);

  // Add local source
  const addLocalSource = useCallback((source: Omit<SourceItem, 'id' | 'source_type'>) => {
    const newSource: SourceItem = {
      ...source,
      id: `local_${Date.now()}_${Math.random()}`,
      source_type: 'local',
    };

    const localSources = getLocalSources();
    localSources.push(newSource);
    saveLocalSourcesToStorage(localSources);
    setSources(prev => [...prev, newSource]);
    return newSource;
  }, [getLocalSources, saveLocalSourcesToStorage]);

  // Remove local source
  const removeLocalSource = useCallback((id: string) => {
    if (!id.startsWith('local_')) return;

    const localSources = getLocalSources().filter(src => src.id !== id);
    saveLocalSourcesToStorage(localSources);
    setSources(prev => prev.filter(src => src.id !== id));
  }, [getLocalSources, saveLocalSourcesToStorage]);

  // Update local source
  const updateLocalSource = useCallback((id: string, updates: Partial<SourceItem>) => {
    if (!id.startsWith('local_')) return;

    const localSources = getLocalSources().map(src =>
      src.id === id ? { ...src, ...updates } : src
    );
    saveLocalSourcesToStorage(localSources);
    setSources(prev =>
      prev.map(src => (src.id === id ? { ...src, ...updates } : src))
    );
  }, [getLocalSources, saveLocalSourcesToStorage]);

  // Clear all local sources
  const clearLocalSources = useCallback(() => {
    saveLocalSourcesToStorage([]);
    setSources(prev => prev.filter(src => src.source_type === 'synchronized'));
  }, [saveLocalSourcesToStorage]);

  return {
    sources,
    loading,
    fetchAllSources,
    addLocalSource,
    removeLocalSource,
    updateLocalSource,
    clearLocalSources,
  };
};
