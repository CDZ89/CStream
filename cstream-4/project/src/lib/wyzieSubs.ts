const WYZIE_SUBS_BASE_URL = 'https://subs.wyzie.ru';

export interface SubtitleResult {
  id: string;
  url: string;
  lang: string;
  langCode: string;
  format: string;
  encoding?: string;
  hearingImpaired: boolean;
  source: string;
  releaseName?: string;
}

export interface SubtitleSearchParams {
  id: string;
  season?: number;
  episode?: number;
  language?: string;
  format?: 'srt' | 'ass' | 'sub';
  encoding?: string;
  hi?: boolean;
  source?: 'subdl' | 'subf2m' | 'opensubtitles' | 'podnapisi' | 'gestdown' | 'animetosho' | 'all';
}

const subtitleCache = new Map<string, { data: SubtitleResult[]; timestamp: number }>();
const CACHE_DURATION = 10 * 60 * 1000;

const getCacheKey = (params: SubtitleSearchParams): string => {
  return `${params.id}-${params.season || ''}-${params.episode || ''}-${params.language || ''}-${params.format || ''}-${params.source || ''}`;
};

export const searchSubtitles = async (params: SubtitleSearchParams): Promise<SubtitleResult[]> => {
  const cacheKey = getCacheKey(params);
  const cached = subtitleCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  
  try {
    const queryParams = new URLSearchParams();
    queryParams.set('id', params.id);
    
    if (params.season !== undefined) {
      queryParams.set('season', params.season.toString());
    }
    if (params.episode !== undefined) {
      queryParams.set('episode', params.episode.toString());
    }
    if (params.language) {
      queryParams.set('language', params.language);
    }
    if (params.format) {
      queryParams.set('format', params.format);
    }
    if (params.encoding) {
      queryParams.set('encoding', params.encoding);
    }
    if (params.hi !== undefined) {
      queryParams.set('hi', params.hi.toString());
    }
    if (params.source) {
      queryParams.set('source', params.source);
    }
    
    const response = await fetch(`${WYZIE_SUBS_BASE_URL}/search?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.warn(`Wyzie Subs API error: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    
    const subtitles: SubtitleResult[] = Array.isArray(data) ? data.map((sub: any) => ({
      id: sub.id || sub.subId || `${Date.now()}-${Math.random()}`,
      url: sub.url || sub.link || '',
      lang: sub.lang || sub.language || 'Unknown',
      langCode: sub.langCode || sub.languageCode || sub.lang?.substring(0, 2).toLowerCase() || 'en',
      format: sub.format || 'srt',
      encoding: sub.encoding || 'utf-8',
      hearingImpaired: sub.hi || sub.hearingImpaired || false,
      source: sub.source || sub.provider || 'unknown',
      releaseName: sub.releaseName || sub.release || undefined,
    })) : [];
    
    subtitleCache.set(cacheKey, { data: subtitles, timestamp: Date.now() });
    
    return subtitles;
  } catch (error) {
    console.error('Error fetching subtitles:', error);
    return [];
  }
};

export const downloadSubtitle = async (url: string): Promise<string | null> => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`Failed to download subtitle: ${response.status}`);
      return null;
    }
    return await response.text();
  } catch (error) {
    console.error('Error downloading subtitle:', error);
    return null;
  }
};

export const getSubtitlesForMovie = async (tmdbId: number, language?: string): Promise<SubtitleResult[]> => {
  return searchSubtitles({
    id: tmdbId.toString(),
    language,
    format: 'srt',
    source: 'all',
  });
};

export const getSubtitlesForTV = async (
  tmdbId: number,
  season: number,
  episode: number,
  language?: string
): Promise<SubtitleResult[]> => {
  return searchSubtitles({
    id: tmdbId.toString(),
    season,
    episode,
    language,
    format: 'srt',
    source: 'all',
  });
};

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
  { code: 'pl', name: 'Polski', flag: '🇵🇱' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'sv', name: 'Svenska', flag: '🇸🇪' },
];

export const clearSubtitleCache = (): void => {
  subtitleCache.clear();
};
