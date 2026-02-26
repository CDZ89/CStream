export type EmbedMode = 'iframe' | 'popup' | 'both';

export interface HostInfo {
  name: string;
  displayName: string;
  color: string;
  icon?: string;
  embedMode: EmbedMode;
  embedReliability: 'high' | 'medium' | 'low';
}

const HOST_PATTERNS: Record<string, HostInfo> = {
  'smashy': { name: 'smashy', displayName: 'Smashy', color: '#8B5CF6', embedMode: 'iframe', embedReliability: 'high' },
  'smashystream': { name: 'smashy', displayName: 'Smashy', color: '#8B5CF6', embedMode: 'iframe', embedReliability: 'high' },
  'vidfast': { name: 'vidfast', displayName: 'VidFast', color: '#10B981', embedMode: 'iframe', embedReliability: 'high' },
  'vidking': { name: 'vidking', displayName: 'VidKing', color: '#6366F1', embedMode: 'iframe', embedReliability: 'high' },
  'vidsrc': { name: 'vidsrc', displayName: 'VidSrc', color: '#3B82F6', embedMode: 'iframe', embedReliability: 'high' },
  'autoembed': { name: 'autoembed', displayName: 'AutoEmbed', color: '#F59E0B', embedMode: 'iframe', embedReliability: 'high' },
  'frembed': { name: 'frembed', displayName: 'Frembed', color: '#EC4899', embedMode: 'iframe', embedReliability: 'high' },
  'videasy': { name: 'videasy', displayName: 'Videasy', color: '#14B8A6', embedMode: 'iframe', embedReliability: 'high' },
  'embed.su': { name: 'embedsu', displayName: 'EmbedSU', color: '#8B5CF6', embedMode: 'iframe', embedReliability: 'high' },
  'embedsu': { name: 'embedsu', displayName: 'EmbedSU', color: '#8B5CF6', embedMode: 'iframe', embedReliability: 'high' },
  'multiembed': { name: 'multiembed', displayName: 'MultiEmbed', color: '#6366F1', embedMode: 'iframe', embedReliability: 'high' },
  'vidnest': { name: 'vidnest', displayName: 'VidNest', color: '#06B6D4', embedMode: 'iframe', embedReliability: 'high' },
  'vidzee': { name: 'vidzee', displayName: 'VidZee', color: '#A855F7', embedMode: 'iframe', embedReliability: 'high' },
  'vidrock': { name: 'vidrock', displayName: 'VidRock', color: '#EF4444', embedMode: 'iframe', embedReliability: 'high' },
  '2embed': { name: '2embed', displayName: '2Embed', color: '#EF4444', embedMode: 'iframe', embedReliability: 'high' },
  'superembed': { name: 'superembed', displayName: 'SuperEmbed', color: '#22C55E', embedMode: 'iframe', embedReliability: 'high' },
  'gomoplayer': { name: 'gomoplayer', displayName: 'GomoPlayer', color: '#F97316', embedMode: 'iframe', embedReliability: 'medium' },
  'sibnet': { name: 'sibnet', displayName: 'Sibnet', color: '#4CAF50', embedMode: 'iframe', embedReliability: 'high' },
  'oneupload': { name: 'oneupload', displayName: 'OneUpload', color: '#2196F3', embedMode: 'popup', embedReliability: 'low' },
  'vidmoly': { name: 'vidmoly', displayName: 'Vidmoly', color: '#9C27B0', embedMode: 'iframe', embedReliability: 'medium' },
  'smoothpre': { name: 'smoothpre', displayName: 'SmoothPre', color: '#FF9800', embedMode: 'popup', embedReliability: 'low' },
  'sendvid': { name: 'sendvid', displayName: 'SendVid', color: '#E91E63', embedMode: 'iframe', embedReliability: 'medium' },
  'uqload': { name: 'uqload', displayName: 'Uqload', color: '#00BCD4', embedMode: 'popup', embedReliability: 'low' },
  'voe': { name: 'voe', displayName: 'VOE', color: '#607D8B', embedMode: 'popup', embedReliability: 'low' },
  'doodstream': { name: 'doodstream', displayName: 'DoodStream', color: '#3F51B5', embedMode: 'popup', embedReliability: 'low' },
  'dood': { name: 'doodstream', displayName: 'DoodStream', color: '#3F51B5', embedMode: 'popup', embedReliability: 'low' },
  'streamtape': { name: 'streamtape', displayName: 'StreamTape', color: '#F44336', embedMode: 'popup', embedReliability: 'low' },
  'mixdrop': { name: 'mixdrop', displayName: 'MixDrop', color: '#8BC34A', embedMode: 'popup', embedReliability: 'low' },
  'upstream': { name: 'upstream', displayName: 'UpStream', color: '#673AB7', embedMode: 'popup', embedReliability: 'low' },
  'vidoza': { name: 'vidoza', displayName: 'Vidoza', color: '#009688', embedMode: 'iframe', embedReliability: 'high' },
  'filemoon': { name: 'filemoon', displayName: 'FileMoon', color: '#FFEB3B', embedMode: 'iframe', embedReliability: 'high' },
  'netu': { name: 'netu', displayName: 'NetU', color: '#795548', embedMode: 'popup', embedReliability: 'low' },
  'vudeo': { name: 'vudeo', displayName: 'Vudeo', color: '#FF5722', embedMode: 'popup', embedReliability: 'low' },
  'vido': { name: 'vido', displayName: 'Vido', color: '#03A9F4', embedMode: 'popup', embedReliability: 'low' },
  'okru': { name: 'okru', displayName: 'OK.ru', color: '#FF6D00', embedMode: 'iframe', embedReliability: 'high' },
  'ok.ru': { name: 'okru', displayName: 'OK.ru', color: '#FF6D00', embedMode: 'iframe', embedReliability: 'high' },
  'youtube': { name: 'youtube', displayName: 'YouTube', color: '#FF0000', embedMode: 'iframe', embedReliability: 'high' },
  'dailymotion': { name: 'dailymotion', displayName: 'Dailymotion', color: '#0066DC', embedMode: 'iframe', embedReliability: 'high' },
  'vimeo': { name: 'vimeo', displayName: 'Vimeo', color: '#1AB7EA', embedMode: 'iframe', embedReliability: 'high' },
  'anime-sama': { name: 'animesama', displayName: 'Anime-Sama', color: '#E040FB', embedMode: 'iframe', embedReliability: 'high' },
  'animesama': { name: 'animesama', displayName: 'Anime-Sama', color: '#E040FB', embedMode: 'iframe', embedReliability: 'high' },
  'myvi.ru': { name: 'myvi', displayName: 'MyVI', color: '#00ACC1', embedMode: 'popup', embedReliability: 'low' },
  'myvi': { name: 'myvi', displayName: 'MyVI', color: '#00ACC1', embedMode: 'popup', embedReliability: 'low' },
  'vk.com': { name: 'vk', displayName: 'VK Video', color: '#4C75A3', embedMode: 'iframe', embedReliability: 'high' },
  'vkvideo': { name: 'vk', displayName: 'VK Video', color: '#4C75A3', embedMode: 'iframe', embedReliability: 'high' },
  'rutube': { name: 'rutube', displayName: 'Rutube', color: '#1E88E5', embedMode: 'iframe', embedReliability: 'high' },
  'vidlox': { name: 'vidlox', displayName: 'Vidlox', color: '#7B1FA2', embedMode: 'popup', embedReliability: 'low' },
  'vidcloud': { name: 'vidcloud', displayName: 'VidCloud', color: '#26A69A', embedMode: 'popup', embedReliability: 'low' },
  'mp4upload': { name: 'mp4upload', displayName: 'MP4Upload', color: '#5C6BC0', embedMode: 'popup', embedReliability: 'low' },
  'streamz': { name: 'streamz', displayName: 'Streamz', color: '#EF5350', embedMode: 'popup', embedReliability: 'low' },
  'streamsb': { name: 'streamsb', displayName: 'StreamSB', color: '#AB47BC', embedMode: 'popup', embedReliability: 'low' },
  'sbembed': { name: 'streamsb', displayName: 'StreamSB', color: '#AB47BC', embedMode: 'popup', embedReliability: 'low' },
  'fembed': { name: 'fembed', displayName: 'Fembed', color: '#66BB6A', embedMode: 'popup', embedReliability: 'low' },
  'femax': { name: 'fembed', displayName: 'Fembed', color: '#66BB6A', embedMode: 'popup', embedReliability: 'low' },
  'evoload': { name: 'evoload', displayName: 'Evoload', color: '#42A5F5', embedMode: 'popup', embedReliability: 'low' },
  'streamhub': { name: 'streamhub', displayName: 'StreamHub', color: '#78909C', embedMode: 'popup', embedReliability: 'low' },
  'vidstreaming': { name: 'vidstreaming', displayName: 'VidStreaming', color: '#8D6E63', embedMode: 'popup', embedReliability: 'low' },
  'gogoplay': { name: 'gogoplay', displayName: 'GogoPlay', color: '#FF7043', embedMode: 'popup', embedReliability: 'low' },
  'gogo-stream': { name: 'gogostream', displayName: 'GogoStream', color: '#FF7043', embedMode: 'popup', embedReliability: 'low' },
  'gogostream': { name: 'gogostream', displayName: 'GogoStream', color: '#FF7043', embedMode: 'popup', embedReliability: 'low' },
  'kwik': { name: 'kwik', displayName: 'Kwik', color: '#FFCA28', embedMode: 'popup', embedReliability: 'low' },
  'mega': { name: 'mega', displayName: 'MEGA', color: '#D50000', embedMode: 'popup', embedReliability: 'low' },
  'gdrive': { name: 'gdrive', displayName: 'Google Drive', color: '#4285F4', embedMode: 'popup', embedReliability: 'low' },
  'drive.google': { name: 'gdrive', displayName: 'Google Drive', color: '#4285F4', embedMode: 'popup', embedReliability: 'low' },
  'mycloud': { name: 'mycloud', displayName: 'MyCloud', color: '#29B6F6', embedMode: 'popup', embedReliability: 'low' },
  'streamwish': { name: 'streamwish', displayName: 'StreamWish', color: '#EC407A', embedMode: 'popup', embedReliability: 'low' },
  'vidhide': { name: 'vidhide', displayName: 'VidHide', color: '#7986CB', embedMode: 'popup', embedReliability: 'low' },
  'vtube': { name: 'vtube', displayName: 'VTube', color: '#4DB6AC', embedMode: 'popup', embedReliability: 'low' },
  'supervideo': { name: 'supervideo', displayName: 'SuperVideo', color: '#FFB300', embedMode: 'popup', embedReliability: 'low' },
  'streambolt': { name: 'streambolt', displayName: 'StreamBolt', color: '#5C6BC0', embedMode: 'popup', embedReliability: 'low' },
};

export function detectHost(url: string): HostInfo | null {
  if (!url) return null;
  
  try {
    const urlLower = url.toLowerCase();
    
    for (const [pattern, info] of Object.entries(HOST_PATTERNS)) {
      if (urlLower.includes(pattern)) {
        return info;
      }
    }
    
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace('www.', '');
    const parts = hostname.split('.');
    const baseName = parts.length >= 2 ? parts[parts.length - 2] : parts[0];
    
    return {
      name: baseName,
      displayName: baseName.charAt(0).toUpperCase() + baseName.slice(1),
      color: '#6B7280',
      embedMode: 'both' as const,
      embedReliability: 'low' as const,
    };
  } catch {
    return null;
  }
}

export function getHostDisplayName(url: string): string {
  const host = detectHost(url);
  return host?.displayName || 'Source';
}

export function getHostColor(url: string): string {
  const host = detectHost(url);
  return host?.color || '#6B7280';
}

export interface ReaderWithHost {
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
  host?: HostInfo | null;
}

export function groupReadersByHost(readers: ReaderWithHost[]): Map<string, ReaderWithHost[]> {
  const groups = new Map<string, ReaderWithHost[]>();
  
  for (const reader of readers) {
    const host = detectHost(reader.url);
    const hostName = host?.name || 'other';
    
    const enrichedReader = { ...reader, host };
    
    if (!groups.has(hostName)) {
      groups.set(hostName, []);
    }
    groups.get(hostName)!.push(enrichedReader);
  }
  
  return groups;
}

export function groupReadersByEpisode(
  readers: ReaderWithHost[]
): Map<string, ReaderWithHost[]> {
  const groups = new Map<string, ReaderWithHost[]>();
  
  for (const reader of readers) {
    const season = reader.season_number ?? 1;
    const episode = reader.episode_number ?? 0;
    const key = `S${String(season).padStart(2, '0')}E${String(episode).padStart(2, '0')}`;
    
    const host = detectHost(reader.url);
    const enrichedReader = { ...reader, host };
    
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(enrichedReader);
  }
  
  const sortedGroups = new Map(
    [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  );
  
  return sortedGroups;
}

export function getAvailableHosts(readers: ReaderWithHost[]): HostInfo[] {
  const hostsSet = new Set<string>();
  const hosts: HostInfo[] = [];
  
  for (const reader of readers) {
    const host = detectHost(reader.url);
    if (host && !hostsSet.has(host.name)) {
      hostsSet.add(host.name);
      hosts.push(host);
    }
  }
  
  return hosts;
}

export function filterReadersByHost(
  readers: ReaderWithHost[],
  hostName: string
): ReaderWithHost[] {
  if (!hostName || hostName === 'all') {
    return readers;
  }
  
  return readers.filter(reader => {
    const host = detectHost(reader.url);
    return host?.name === hostName;
  });
}

export function getEpisodeRange(readers: ReaderWithHost[]): {
  seasons: number[];
  episodesBySeason: Map<number, number[]>;
} {
  const seasons = new Set<number>();
  const episodesBySeason = new Map<number, Set<number>>();
  
  for (const reader of readers) {
    const season = reader.season_number ?? 1;
    const episode = reader.episode_number ?? 1;
    
    seasons.add(season);
    
    if (!episodesBySeason.has(season)) {
      episodesBySeason.set(season, new Set<number>());
    }
    episodesBySeason.get(season)!.add(episode);
  }
  
  const sortedSeasons = [...seasons].sort((a, b) => a - b);
  const sortedEpisodesBySeason = new Map<number, number[]>();
  
  for (const season of sortedSeasons) {
    const episodes = episodesBySeason.get(season) || new Set();
    sortedEpisodesBySeason.set(season, [...episodes].sort((a, b) => a - b));
  }
  
  return {
    seasons: sortedSeasons,
    episodesBySeason: sortedEpisodesBySeason,
  };
}

export function findReaderForEpisode(
  readers: ReaderWithHost[],
  season: number,
  episode: number,
  preferredHost?: string
): ReaderWithHost | null {
  const episodeReaders = readers.filter(
    r => r.season_number === season && r.episode_number === episode
  );
  
  if (episodeReaders.length === 0) return null;
  
  if (preferredHost) {
    const preferred = episodeReaders.find(r => {
      const host = detectHost(r.url);
      return host?.name === preferredHost;
    });
    if (preferred) return { ...preferred, host: detectHost(preferred.url) };
  }
  
  const first = episodeReaders[0];
  return { ...first, host: detectHost(first.url) };
}

export function getNextEpisode(
  readers: ReaderWithHost[],
  currentSeason: number,
  currentEpisode: number
): { season: number; episode: number } | null {
  const { seasons, episodesBySeason } = getEpisodeRange(readers);
  
  const currentSeasonEpisodes = episodesBySeason.get(currentSeason);
  if (currentSeasonEpisodes) {
    const nextEp = currentSeasonEpisodes.find(ep => ep > currentEpisode);
    if (nextEp !== undefined) {
      return { season: currentSeason, episode: nextEp };
    }
  }
  
  const nextSeasonIndex = seasons.indexOf(currentSeason) + 1;
  if (nextSeasonIndex < seasons.length) {
    const nextSeason = seasons[nextSeasonIndex];
    const nextSeasonEpisodes = episodesBySeason.get(nextSeason);
    if (nextSeasonEpisodes && nextSeasonEpisodes.length > 0) {
      return { season: nextSeason, episode: nextSeasonEpisodes[0] };
    }
  }
  
  return null;
}

export function getPreviousEpisode(
  readers: ReaderWithHost[],
  currentSeason: number,
  currentEpisode: number
): { season: number; episode: number } | null {
  const { seasons, episodesBySeason } = getEpisodeRange(readers);
  
  const currentSeasonEpisodes = episodesBySeason.get(currentSeason);
  if (currentSeasonEpisodes) {
    const prevEpisodes = currentSeasonEpisodes.filter(ep => ep < currentEpisode);
    if (prevEpisodes.length > 0) {
      return { season: currentSeason, episode: prevEpisodes[prevEpisodes.length - 1] };
    }
  }
  
  const prevSeasonIndex = seasons.indexOf(currentSeason) - 1;
  if (prevSeasonIndex >= 0) {
    const prevSeason = seasons[prevSeasonIndex];
    const prevSeasonEpisodes = episodesBySeason.get(prevSeason);
    if (prevSeasonEpisodes && prevSeasonEpisodes.length > 0) {
      return { season: prevSeason, episode: prevSeasonEpisodes[prevSeasonEpisodes.length - 1] };
    }
  }
  
  return null;
}

export function getEmbedMode(url: string): EmbedMode {
  const host = detectHost(url);
  return host?.embedMode || 'both';
}

export function getEmbedReliability(url: string): 'high' | 'medium' | 'low' {
  const host = detectHost(url);
  return host?.embedReliability || 'low';
}

export function canEmbedInIframe(url: string): boolean {
  const embedMode = getEmbedMode(url);
  return embedMode === 'iframe' || embedMode === 'both';
}

export function shouldPreferPopup(url: string): boolean {
  const embedMode = getEmbedMode(url);
  return embedMode === 'popup';
}

export function openInNewTab(url: string): void {
  window.open(url, '_blank', 'noopener,noreferrer');
}
