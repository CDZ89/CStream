import type { MediaType, Reader, TMDBResult, TMDBSeason } from './types';

export const TMDB_BASE = 'https://api.themoviedb.org/3';
export const TMDB_IMG = 'https://image.tmdb.org/t/p';

export const formatDate = (dateString: string) => {
  try {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
};

export const isValidUrl = (value: string) => {
  try {
    const u = new URL(value);
    return !!u.protocol && !!u.host;
  } catch {
    return false;
  }
};

export const normalizeBaseUrl = (url: string) => {
  if (!url) return url;
  return url.endsWith('/') ? url.slice(0, -1) : url;
};

export const buildFinalUrl = (
  baseUrl: string, 
  mediaType: MediaType | string, 
  season?: number | null, 
  episode?: number | null
) => {
  const base = normalizeBaseUrl(baseUrl);
  if ((mediaType === 'series' || mediaType === 'tv' || mediaType === 'anime') && (season || episode)) {
    const parts: string[] = [base];
    if (season && Number.isFinite(season)) parts.push(`season/${season}`);
    if (episode && Number.isFinite(episode)) parts.push(`episode/${episode}`);
    return parts.join('/');
  }
  return base;
};

export const normalizeMediaType = (type: string): MediaType => {
  if (type === 'series') return 'tv';
  if (type === 'movie' || type === 'tv' || type === 'anime') return type;
  return 'tv';
};

export const extractBaseSourceName = (label: string): string => {
  if (!label) return 'Source inconnue';
  const cleaned = label
    .replace(/\s*-?\s*S\d{1,2}E\d{1,3}\s*$/i, '')
    .replace(/\s*S\d{1,2}\s*E\d{1,3}\s*$/i, '')
    .replace(/\s*-\s*$/, '')
    .trim();
  return cleaned || label;
};

export const formatEpisodeRange = (readers: Reader[]): string => {
  if (!readers.length) return '';
  
  const seasonEpisodes = new Map<number, Set<number>>();
  
  readers.forEach(r => {
    const season = r.season_number ?? 1;
    const episode = r.episode_number ?? 0;
    if (!seasonEpisodes.has(season)) {
      seasonEpisodes.set(season, new Set());
    }
    if (episode > 0) {
      seasonEpisodes.get(season)!.add(episode);
    }
  });
  
  if (seasonEpisodes.size === 0) return '';
  
  const sortedSeasons = [...seasonEpisodes.keys()].sort((a, b) => a - b);
  
  const formatRange = (episodes: number[]): string => {
    if (episodes.length === 0) return '';
    if (episodes.length === 1) return `E${String(episodes[0]).padStart(2, '0')}`;
    const sorted = [...episodes].sort((a, b) => a - b);
    return `E${String(sorted[0]).padStart(2, '0')}-E${String(sorted[sorted.length - 1]).padStart(2, '0')}`;
  };
  
  if (sortedSeasons.length === 1) {
    const season = sortedSeasons[0];
    const episodes = [...(seasonEpisodes.get(season) || [])];
    if (episodes.length === 0) return `S${String(season).padStart(2, '0')}`;
    return `S${String(season).padStart(2, '0')} ${formatRange(episodes)}`;
  }
  
  const parts: string[] = [];
  sortedSeasons.forEach(season => {
    const episodes = [...(seasonEpisodes.get(season) || [])];
    if (episodes.length === 0) {
      parts.push(`S${String(season).padStart(2, '0')}`);
    } else {
      parts.push(`S${String(season).padStart(2, '0')} ${formatRange(episodes)}`);
    }
  });
  
  return parts.join(' | ');
};

export const searchTMDB = async (query: string, filterType?: 'all' | 'movie' | 'tv'): Promise<TMDBResult[]> => {
  const key = import.meta.env.VITE_TMDB_API_KEY;
  if (!key || !query.trim()) return [];
  
  let endpoint = 'search/multi';
  let searchUrl = `${TMDB_BASE}/${endpoint}?api_key=${key}&language=fr-FR&query=${encodeURIComponent(query)}&include_adult=false&page=1`;
  
  if (filterType && filterType !== 'all') {
    endpoint = `search/${filterType}`;
    searchUrl = `${TMDB_BASE}/${endpoint}?api_key=${key}&language=fr-FR&query=${encodeURIComponent(query)}&include_adult=false&page=1`;
  }
  
  const res = await fetch(searchUrl);
  if (!res.ok) throw new Error('TMDB search failed');
  const json = await res.json();
  
  let results = json.results || [];
  
  if (filterType === 'all' || !filterType) {
    results = results.filter((r: any) => r.media_type === 'movie' || r.media_type === 'tv');
  } else {
    results = results.map((r: any) => ({ ...r, media_type: filterType }));
  }
  
  return results
    .slice(0, 10)
    .map((r: any) => ({
      id: r.id,
      media_type: r.media_type || filterType,
      title: r.title,
      name: r.name,
      release_date: r.release_date,
      first_air_date: r.first_air_date,
      poster_path: r.poster_path,
      vote_average: r.vote_average,
      overview: r.overview,
    }));
};

export const fetchTMDBById = async (tmdbId: number, mediaType: 'movie' | 'tv'): Promise<TMDBResult | null> => {
  const key = import.meta.env.VITE_TMDB_API_KEY;
  if (!key) return null;
  try {
    const url = `${TMDB_BASE}/${mediaType}/${tmdbId}?api_key=${key}&language=fr-FR`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = await res.json();
    return {
      id: json.id,
      media_type: mediaType,
      title: json.title,
      name: json.name,
      release_date: json.release_date,
      first_air_date: json.first_air_date,
      poster_path: json.poster_path,
      vote_average: json.vote_average,
      overview: json.overview,
    };
  } catch {
    return null;
  }
};

export const fetchTMDBSeasons = async (tmdbId: number): Promise<TMDBSeason[]> => {
  const key = import.meta.env.VITE_TMDB_API_KEY;
  if (!key) return [];
  const url = `${TMDB_BASE}/tv/${tmdbId}?api_key=${key}&language=fr-FR`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const json = await res.json();
  return (json.seasons || []).map((s: any) => ({
    season_number: s.season_number,
    name: s.name,
    episode_count: s.episode_count,
  }));
};

export const extractReaderNameFromUrl = (url: string): string => {
  if (!url) return '';
  
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname;
    
    const hostMappings: Record<string, string> = {
      'uqload.to': 'Uqload',
      'uqload.co': 'Uqload',
      'filemoon.sx': 'Filemoon',
      'filemoon.to': 'Filemoon',
      'doodstream.com': 'DoodStream',
      'dood.to': 'DoodStream',
      'dood.wf': 'DoodStream',
      'dood.sh': 'DoodStream',
      'voe.sx': 'Voe',
      'voe-network.net': 'Voe',
      'vidguard.to': 'VidGuard',
      'streamwish.to': 'StreamWish',
      'streamwish.com': 'StreamWish',
      'vidhide.com': 'VidHide',
      'vidhidevip.com': 'VidHide',
      'mixdrop.co': 'MixDrop',
      'mixdrop.to': 'MixDrop',
      'streamtape.com': 'StreamTape',
      'upstream.to': 'Upstream',
      'vidoza.net': 'Vidoza',
      'netu.tv': 'Netu',
      'supervideo.tv': 'SuperVideo',
      'megaupload.to': 'MegaUpload',
      'megaupload.nz': 'MegaUpload',
      'sendvid.com': 'SendVid',
      'sibnet.ru': 'SibNet',
      'myvi.ru': 'MyVi',
      'ok.ru': 'Okru',
      'rutube.ru': 'RuTube',
      'dailymotion.com': 'Dailymotion',
      'vimeo.com': 'Vimeo',
      'youtube.com': 'YouTube',
      'youtu.be': 'YouTube',
      'drive.google.com': 'GoogleDrive',
      'mega.nz': 'Mega',
      'sendcm.com': 'SendCM',
      'sendcm.net': 'SendCM',
    };
    
    for (const [domain, name] of Object.entries(hostMappings)) {
      if (hostname.includes(domain)) {
        return name;
      }
    }
    
    const parts = hostname.split('.');
    if (parts.length >= 2) {
      const mainDomain = parts[parts.length - 2];
      return mainDomain.charAt(0).toUpperCase() + mainDomain.slice(1);
    }
  } catch {}
  
  return '';
};

export const extractUrlsFromContent = (content: string): string[] => {
  const urls: string[] = [];
  const urlPattern = /['"`](https?:\/\/[^'"`]+)['"`]/g;
  let match;
  
  while ((match = urlPattern.exec(content)) !== null) {
    const url = match[1].trim();
    if (url && isValidUrl(url)) {
      urls.push(url);
    }
  }
  
  return urls;
};
