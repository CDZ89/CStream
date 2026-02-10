import { useState, useEffect, useRef } from 'react';
import { tmdbApi, TMDBImagesResponse } from '@/lib/tmdb';

// Global cache to prevent duplicate fetches across component instances
const logoCache = new Map<string, string | null>();
const pendingRequests = new Map<string, Promise<string | null>>();

export const useMediaLogo = (id: number | undefined, mediaType: 'movie' | 'tv', enabled: boolean = true) => {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!id || !enabled) {
      setLoading(false);
      return;
    }

    const cacheKey = `${mediaType}-${id}`;
    
    // Check cache first
    if (logoCache.has(cacheKey)) {
      const cached = logoCache.get(cacheKey);
      console.log(`[Logo] Using cached logo for ${cacheKey}:`, cached);
      setLogoUrl(cached ?? null);
      setLoading(false);
      return;
    }

    setLoading(true);
    
    const fetchLogo = async (): Promise<string | null> => {
      try {
        const data: TMDBImagesResponse = await tmdbApi.getMediaImages(id, mediaType);
        
        console.log(`[Logo] Fetched images for ${mediaType}/${id}:`, data);
        
        const logos = (data?.logos || []) as any[];
        if (logos.length === 0) {
          console.log(`[Logo] No logos found for ${mediaType}/${id}`);
          return null;
        }

        // Priority: FR > EN > NULL > ANY
        const frLogo = logos.find(l => l.iso_639_1 === 'fr');
        const enLogo = logos.find(l => l.iso_639_1 === 'en');
        const nullLogo = logos.find(l => l.iso_639_1 === null);
        const bestLogo = frLogo || enLogo || nullLogo || logos[0];
        
        if (bestLogo?.file_path) {
          const url = tmdbApi.getLogoUrl(bestLogo.file_path, 'w500'); // Utiliser w500 pour un chargement plus rapide
          console.log(`[Logo] Using logo for ${cacheKey}:`, url);
          return url;
        } else {
          console.log(`[Logo] Best logo found but no file_path:`, bestLogo);
          return null;
        }
      } catch (err) {
        console.error(`[Logo] Error fetching logos for ${cacheKey}:`, err);
        return null;
      }
    };

    // Check if there's already a pending request for this key
    let promise = pendingRequests.get(cacheKey);
    if (!promise) {
      promise = fetchLogo();
      pendingRequests.set(cacheKey, promise);
    }

    promise.then((url) => {
      logoCache.set(cacheKey, url);
      pendingRequests.delete(cacheKey);
      if (mountedRef.current) {
        setLogoUrl(url);
        setLoading(false);
      }
    });

  }, [id, mediaType, enabled]);

  return { logoUrl, loading };
};
