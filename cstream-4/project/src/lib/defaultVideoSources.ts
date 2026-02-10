/**
 * Default video sources for streaming
 * These are pre-configured streaming providers
 */

export const DEFAULT_VIDEO_SOURCES = [
  // ===== PREMIUM SOURCES (Multi-source aggregators) =====
  {
    label: 'Vidsrc.pro',
    url: 'https://vidsrc.pro/embed/tv/{id}/season/{season}/episode/{episode}',
    type: 'tv',
    quality: 'HD',
    priority: 1,
  },
  {
    label: 'VidCloud',
    url: 'https://vidcloud.co/embed/{id}/{season}/{episode}',
    type: 'tv',
    quality: 'HD',
    priority: 2,
  },
  {
    label: 'FlixHQ',
    url: 'https://flixhq.to/tv/{id}/season/{season}/episode/{episode}',
    type: 'tv',
    quality: 'HD+',
    priority: 3,
  },

  // ===== QUALITY SOURCES =====
  {
    label: 'StreamWish',
    url: 'https://streamwish.to/watch/{id}?s={season}&e={episode}',
    type: 'tv',
    quality: 'FHD',
    priority: 4,
  },
  {
    label: 'Upcloud',
    url: 'https://upcloud.link/embed/{id}/{season}/{episode}',
    type: 'tv',
    quality: 'FHD',
    priority: 5,
  },
  {
    label: 'Filemoon',
    url: 'https://filemoon.sx/embed/{id}/{season}/{episode}',
    type: 'tv',
    quality: 'FHD',
    priority: 6,
  },

  // ===== ALTERNATIVE SOURCES =====
  {
    label: 'Doodstream',
    url: 'https://doodstream.com/e/{id}',
    type: 'tv',
    quality: 'HD',
    priority: 7,
  },
  {
    label: 'Streamruby',
    url: 'https://streamruby.com/embed/{id}/{season}/{episode}',
    type: 'tv',
    quality: 'HD',
    priority: 8,
  },
  {
    label: 'Mixdrop',
    url: 'https://mixdrop.co/e/{id}',
    type: 'tv',
    quality: 'HD+',
    priority: 9,
  },
  {
    label: 'Vidoza',
    url: 'https://vidoza.net/embed/{id}',
    type: 'tv',
    quality: 'HD',
    priority: 10,
  },

  // ===== BACKUP SOURCES =====
  {
    label: 'Gomo',
    url: 'https://gomo.to/embed/{id}/{season}/{episode}',
    type: 'tv',
    quality: 'HD',
    priority: 11,
  },
  {
    label: 'Autoembed',
    url: 'https://player.autoembed.cc/embed/tv/{id}/{season}/{episode}',
    type: 'tv',
    quality: 'HD',
    priority: 12,
  },
  {
    label: 'Streamsb',
    url: 'https://streamsb.net/embed/{id}',
    type: 'tv',
    quality: 'FHD',
    priority: 13,
  },
  {
    label: 'Speedx',
    url: 'https://speedx.stream/embed/{id}',
    type: 'tv',
    quality: 'HD',
    priority: 14,
  },
  {
    label: 'StreamTape',
    url: 'https://streamtape.com/e/{id}',
    type: 'tv',
    quality: 'HD',
    priority: 15,
  },

  // ===== SECONDARY AGGREGATORS =====
  {
    label: 'Cinemabox',
    url: 'https://cinemabox.to/tv/{id}/season/{season}/episode/{episode}',
    type: 'tv',
    quality: 'HD+',
    priority: 16,
  },
  {
    label: 'MovieBox',
    url: 'https://moviebox.mov/tv/{id}/{season}/{episode}',
    type: 'tv',
    quality: 'HD',
    priority: 17,
  },
  {
    label: 'Voembed',
    url: 'https://voembed.com/embed/{id}',
    type: 'tv',
    quality: 'HD',
    priority: 18,
  },
  {
    label: 'Embedflix',
    url: 'https://embedflix.com/embed/{id}/{season}/{episode}',
    type: 'tv',
    quality: 'HD',
    priority: 19,
  },
  {
    label: 'Superembed',
    url: 'https://superembed.tv/embed/{id}/{season}/{episode}',
    type: 'tv',
    quality: 'HD',
    priority: 20,
  },

  // ===== ADDITIONAL PROVIDERS =====
  {
    label: 'VidHub',
    url: 'https://vidhub.to/embed/{id}',
    type: 'tv',
    quality: 'HD',
    priority: 21,
  },
  {
    label: 'Streamers',
    url: 'https://streamers.cc/embed/{id}',
    type: 'tv',
    quality: 'FHD',
    priority: 22,
  },
  {
    label: 'Hydrax',
    url: 'https://hydrax.net/embed/{id}',
    type: 'tv',
    quality: 'HD+',
    priority: 23,
  },
  {
    label: 'Embedsubtitle',
    url: 'https://embedsubtitle.com/embed/{id}/{season}/{episode}',
    type: 'tv',
    quality: 'HD',
    priority: 24,
  },
  {
    label: 'Vidplay',
    url: 'https://vidplay.site/embed/{id}/{season}/{episode}',
    type: 'tv',
    quality: 'FHD',
    priority: 25,
  },
];

/**
 * Get default sources for a specific media type
 */
export const getDefaultSourcesForType = (type: 'tv' | 'movie'): typeof DEFAULT_VIDEO_SOURCES => {
  return DEFAULT_VIDEO_SOURCES.filter(source => source.type === type)
    .sort((a, b) => a.priority - b.priority);
};

/**
 * Convert default source format to Reader format
 */
export const convertDefaultSourceToReader = (source: typeof DEFAULT_VIDEO_SOURCES[0]): any => {
  return {
    id: `default_${source.label.toLowerCase().replace(/\s+/g, '_')}`,
    label: source.label,
    url: source.url,
    media_type: source.type,
    language: 'multi',
    enabled: true,
    order_index: source.priority,
  };
};
