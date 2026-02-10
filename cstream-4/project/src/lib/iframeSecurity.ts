// CRITICAL: NO SANDBOX for video players - sandbox causes "Sandbox Not Allowed" errors
// All video players need full iframe privileges to work correctly
// NEVER set sandbox attribute on video player iframes - it breaks playback
export const IFRAME_SANDBOX_PERMISSIONS = undefined;

// Maximum permissions for video embeds - required for all streaming players
// This is the most permissive allow string for compatibility with ALL embed players
// Using wildcard (*) at the end ensures future permissions are automatically allowed
export const IFRAME_ALLOW_PERMISSIONS = [
  'accelerometer',
  'autoplay',
  'clipboard-read',
  'clipboard-write',
  'encrypted-media',
  'fullscreen',
  'gyroscope',
  'picture-in-picture',
  'web-share',
  'camera',
  'microphone',
  'display-capture',
  'geolocation',
  'midi',
  'payment',
  'usb',
  'screen-wake-lock',
  'xr-spatial-tracking',
  'gamepad',
  'serial',
  'hid',
  'idle-detection',
  'window-management',
  'local-fonts',
  'storage-access',
  'publickey-credentials-get',
  'ambient-light-sensor',
  'magnetometer',
  'speaker-selection',
  'browsing-topics',
  'attribution-reporting',
  'compute-pressure',
  'sync-xhr',
  'document-domain'
].join('; ') + '; *';

// Simple allow string for basic embeds that don't need all features
export const IFRAME_ALLOW_SIMPLE = 'accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture; web-share';

// Backwards-compatible simple allow string for basic embeds (YouTube, Vimeo, etc.)
export const IFRAME_ALLOW_BASIC = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen';

// Allow string specifically for streaming video players - maximum compatibility
export const IFRAME_ALLOW_STREAMING = 'accelerometer; autoplay; clipboard-read; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture; web-share; camera; microphone; display-capture; geolocation; midi; payment; usb; screen-wake-lock; xr-spatial-tracking; gamepad; storage-access; *';

// Complete list of trusted video hosting domains for iframe embeds
// All these domains are allowed without sandbox restrictions
const TRUSTED_DOMAINS = [
  // Russian platforms
  'sibnet.ru', 'video.sibnet.ru',
  'ok.ru', 'odnoklassniki.ru',
  // Major platforms
  'youtube.com', 'www.youtube.com', 'youtube-nocookie.com', 'youtu.be',
  'vimeo.com', 'player.vimeo.com',
  'dailymotion.com', 'www.dailymotion.com', 'dai.ly',
  // VidMoly family
  'vidmoly.to', 'vidmoly.me', 'vidmoly.cc', 'vidmoly.net',
  // FileMoon family
  'filemoon.sx', 'filemoon.to', 'filemoon.in', 'filemoon.wf', 'filemoon.nl',
  // Vidoza family
  'vidoza.net', 'vidoza.org', 'vidoza.co',
  // VidSrc family (comprehensive)
  'vidsrc.me', 'vidsrc.to', 'vidsrc.xyz', 'vidsrc.pro', 'vidsrc.cc', 'vidsrc.in',
  'vidsrc.net', 'vidsrc.pm', 'vidsrc2.to', 'vidsrc.su', 'vidsrc.stream',
  // AutoEmbed family
  'autoembed.co', 'autoembed.cc', 'autoembed.to', 'player.autoembed.cc', 'autoembed.vip',
  // Frembed family
  'frembed.pro', 'frembed.art', 'frembed.fun', 'frembed.lol', 'frembed.com', 'frembed.live',
  // VidFast family (complete list matching VIDFAST_ORIGINS)
  'vidfast.pro', 'vidfast.co', 'vidfast.net', 'vidfast.in', 'vidfast.io', 'vidfast.me', 'vidfast.pm', 'vidfast.xyz',
  // VidKing family (comprehensive)
  'vidking.pro', 'vidking.co', 'vidking.online', 'vidking.net', 'www.vidking.net',
  'vidking.cc', 'vidking.me', 'player.vidking.net',
  // Smashy Stream family
  'smashystream.com', 'smashystream.xyz', 'smashy.stream', 'player.smashy.stream', 'smashystream.tv',
  // Videasy family
  'videasy.net', 'videasy.co', 'player.videasy.net', 'videasy.cc',
  // EmbedSU family
  'embed.su', 'embedsu.com', 'embedsu.net',
  // MultiEmbed family
  'multiembed.mov', 'multiembed.xyz', 'multiembed.cc',
  // MoviesAPI family
  'moviesapi.club', 'moviee.tv', 'moviesapi.net',
  // VOE family
  'voe.sx', 'voe-unblock.com', 'voe.bar', 'voe.plus',
  // DoodStream family (comprehensive)
  'doodstream.com', 'dood.watch', 'dood.to', 'dood.la', 'dood.pm', 'dood.so', 'dood.ws',
  'dood.cx', 'dood.re', 'dood.wf', 'dood.yt', 'dood.sh', 'dood.work', 'ds2play.com',
  // StreamTape family
  'streamtape.com', 'streamtape.to', 'streamtape.net', 'streamtape.xyz', 'streamta.pe',
  // MixDrop family
  'mixdrop.co', 'mixdrop.to', 'mixdrop.sx', 'mixdrop.ag', 'mixdrop.ps', 'mixdrop.bz', 'mixdrop.gl',
  // Upstream family
  'upstream.to', 'upstream.me',
  // SendVid family
  'sendvid.com', 'sendvid.net',
  // Netu/HQQ family
  'netu.tv', 'hqq.tv', 'waaw.tv', 'netu.ac',
  // UQLoad family
  'uqload.com', 'uqload.to', 'uqload.io', 'uqload.org', 'uqload.co',
  // Various embed platforms
  'vedbam.xyz', 'waaw.to',
  '2embed.cc', '2embed.org', 'www.2embed.cc', '2embed.to', '2embed.skin', '2embed.me',
  'gomoplayer.com', 'gomo.to',
  'superembed.stream', 'superembed.org',
  'embedsito.com',
  'player.voxzer.org', 'voxzer.org',
  // StreamSB family
  'watchsb.com', 'sbembed.com', 'sbplay.org', 'sbplay.one', 'sbplay2.com',
  'streamsb.net', 'streamsb.com', 'sbfull.com', 'sbcloud.io', 'sbfast.stream',
  // PrimeSrc family
  'primesrc.me', 'primesrc.cc',
  // VidLink family
  'vidlink.pro', 'vidlink.org', 'vidlink.cc',
  // VidNest family
  'vidnest.fun', 'vidnest.io', 'vidnest.cc',
  // VidZee family
  'vidzee.wtf', 'player.vidzee.wtf', 'vidzee.io',
  // VidRock family (comprehensive - this was the main issue)
  'vidrock.net', 'vidrock.pro', 'vidrock.to', 'vidrock.cc', 'vidrock.me', 'vidrock.stream',
  'player.vidrock.net', 'vidrock.co', 'vidrock.tv', 'vidrock.org', 'vidrock.xyz',
  'www.vidrock.net', 'embed.vidrock.net', 'play.vidrock.net',
  // OneUpload family
  'oneupload.to', 'oneupload.com',
  // LPlayer family
  'lpayer.xyz', 'lpayer.cc',
  // Dingtez
  'dingtez.com',
  // MoveAmpre family
  'moveampre.xyz', 'moveampre.site',
  // StreamBucket
  'streambucket.net',
  // StreamWish family
  'streamwish.to', 'streamwish.com', 'streamwish.site', 'strwish.com',
  // DesiUpload
  'desiupload.co',
  // VTube family
  'vtbe.to', 'vtube.to', 'vtube.network',
  // MyStream
  'mystream.to',
  // Kwik family
  'kwik.cx', 'kwik.si', 'kwik.to',
  // MP4Upload
  'mp4upload.com',
  // SuperVideo
  'supervideo.tv',
  // CloudVideo
  'cloudvideo.tv',
  // Streamlare
  'streamlare.com',
  // UpToStream
  'uptostream.com',
  // NXLoad
  'nxload.com',
  // StreamHub
  'streamhub.to', 'streamhub.gg',
  // Mega embed platforms
  'megacloud.tv', 'megaf.cc', 'megaupload.to',
  // Rabbitstream
  'rabbitstream.net', 'rabbitstream.me',
  // Rapid-cloud
  'rapid-cloud.co', 'rapid-cloud.ru',
  // Watchhub
  'watchhub.to',
  // EmTurbo
  'emturbo.cc', 'emturbovid.com',
  // Rive Stream family - PRIMARY PLAYER
  'rivestream.net', 'www.rivestream.net',
  // VidSync family - PREMIUM PLAYER
  'vidsync.xyz', 'www.vidsync.xyz',
  // Anime players
  'ani.googledrive.stream', 'anime.googleusercontent.com',
  // Misc players
  'closeload.top', 'braflix.app', 'aniwave.to', 'zoro.to', 'animekisa.tv',
];

export const getSandboxForSource = (url: string): string | undefined => {
  // NEVER apply sandbox to video players - causes "Sandbox Not Allowed" errors
  // All video sources need full iframe privileges to function properly
  return undefined;
};

export const getIframeAttributes = (url: string) => {
  // No sandbox attribute - causes "Sandbox Not Allowed" errors
  return {
    allow: IFRAME_ALLOW_PERMISSIONS,
    allowFullScreen: true,
    referrerPolicy: 'no-referrer-when-downgrade' as const,
  };
};

export const AD_DOMAINS = [
  'doubleclick.net',
  'googlesyndication.com',
  'googleadservices.com',
  'adnxs.com',
  'adsrvr.org',
  'rubiconproject.com',
  'pubmatic.com',
  'openx.net',
  'adcolony.com',
  'taboola.com',
  'outbrain.com',
  'criteo.com',
  'amazon-adsystem.com',
  'bidswitch.net',
  'smartadserver.com',
  'popads.net',
  'popcash.net',
  'propellerads.com',
  'exoclick.com',
  'trafficjunky.com',
  'juicyads.com',
  'adsterra.com',
  'hilltopads.com',
  'clickadu.com',
  'popunder.net',
  'revcontent.com',
  'mgid.com',
];

export const isAdUrl = (url: string): boolean => {
  if (!url) return false;
  const lowerUrl = url.toLowerCase();
  return AD_DOMAINS.some(domain => lowerUrl.includes(domain));
};

export const RECOMMENDED_PLAYERS = [
  { id: 'rivestream', name: 'Rive Stream', priority: 0, prefix: 'rivestream', domains: ['rivestream.net', 'www.rivestream.net'] },
  { id: 'vidsync', name: 'VidSync', priority: 1, prefix: 'vidsync', domains: ['vidsync.xyz', 'www.vidsync.xyz'] },
  { id: 'smashy', name: 'Smashy', priority: 2, prefix: 'smashy', domains: ['smashystream.com', 'smashystream.xyz', 'smashy.stream'] },
  { id: 'vidfast', name: 'VidFast', priority: 3, prefix: 'vidfast', domains: ['vidfast.pro', 'vidfast.co'] },
  { id: 'vidking', name: 'VidKing', priority: 3, prefix: 'vidking', domains: ['vidking.pro', 'vidking.co'] },
  { id: 'vidsrc', name: 'VidSrc', priority: 4, prefix: 'vidsrc', domains: ['vidsrc.me', 'vidsrc.to', 'vidsrc.xyz', 'vidsrc.pro'] },
  { id: 'autoembed', name: 'AutoEmbed', priority: 5, prefix: 'autoembed', domains: ['autoembed.co', 'autoembed.cc', 'autoembed.to'] },
  { id: 'frembed', name: 'Frembed', priority: 6, prefix: 'frembed', domains: ['frembed.live', 'frembed.art', 'frembed.pro', 'frembed.fun', 'frembed.lol'] },
  { id: 'videasy', name: 'Videasy', priority: 7, prefix: 'videasy', domains: ['videasy.net', 'videasy.co'] },
  { id: 'embedsu', name: 'EmbedSU', priority: 8, prefix: 'embedsu', domains: ['embed.su', 'embedsu.com'] },
  { id: 'multiembed', name: 'MultiEmbed', priority: 9, prefix: 'multiembed', domains: ['multiembed.mov', 'multiembed.xyz'] },
  { id: '2embed', name: '2Embed', priority: 10, prefix: '2embed', domains: ['2embed.cc', '2embed.org'] },
  { id: 'superembed', name: 'SuperEmbed', priority: 11, prefix: 'superembed', domains: ['superembed.stream'] },
  { id: 'vidnest', name: 'VidNest', priority: 12, prefix: 'vidnest', domains: ['vidnest.fun', 'vidnest.io'] },
  { id: 'vidzee', name: 'VidZee', priority: 13, prefix: 'vidzee', domains: ['vidzee.wtf', 'player.vidzee.wtf'] },
  { id: 'vidrock', name: 'VidRock', priority: 14, prefix: 'vidrock', domains: ['vidrock.net', 'vidrock.pro'] },
  { id: 'gomoplayer', name: 'GomoPlayer', priority: 12, prefix: 'gomo', domains: ['gomoplayer.com'] },
  { id: 'sibnet', name: 'Sibnet', priority: 13, prefix: 'sibnet', domains: ['sibnet.ru', 'video.sibnet.ru'] },
  { id: 'okru', name: 'OK.ru', priority: 14, prefix: 'ok.ru', domains: ['ok.ru', 'odnoklassniki.ru'] },
  { id: 'vidmoly', name: 'VidMoly', priority: 15, prefix: 'vidmoly', domains: ['vidmoly.to', 'vidmoly.me'] },
  { id: 'filemoon', name: 'FileMoon', priority: 16, prefix: 'filemoon', domains: ['filemoon.sx', 'filemoon.to'] },
  { id: 'doodstream', name: 'DoodStream', priority: 17, prefix: 'dood', domains: ['doodstream.com', 'dood.watch', 'dood.to'] },
  { id: 'streamtape', name: 'StreamTape', priority: 18, prefix: 'streamtape', domains: ['streamtape.com', 'streamtape.to'] },
  { id: 'mixdrop', name: 'MixDrop', priority: 19, prefix: 'mixdrop', domains: ['mixdrop.co', 'mixdrop.to', 'mixdrop.sx'] },
];

export const isRecommendedPlayer = (name: string): boolean => {
  const lowerName = name.toLowerCase();
  return RECOMMENDED_PLAYERS.some(p => lowerName.startsWith(p.prefix) || lowerName.includes(p.prefix));
};

export const getPlayerPriority = (name: string): number => {
  const lowerName = name.toLowerCase();
  const player = RECOMMENDED_PLAYERS.find(p => lowerName.startsWith(p.prefix) || lowerName.includes(p.prefix));
  return player?.priority ?? 999;
};

export const sortPlayersByRecommendation = <T extends { name?: string; id?: string; source?: string }>(players: T[]): T[] => {
  return [...players].sort((a, b) => {
    const nameA = a.name || a.id || a.source || '';
    const nameB = b.name || b.id || b.source || '';
    return getPlayerPriority(nameA) - getPlayerPriority(nameB);
  });
};

// Creates iframe props with maximum permissions for video embeds
// CRITICAL: Never add sandbox attribute - causes "Sandbox Not Allowed" errors
export const createSecureIframeProps = (src: string) => {
  return {
    src,
    // Full permissions - required for video players
    allow: IFRAME_ALLOW_PERMISSIONS,
    // Always allow fullscreen for video
    allowFullScreen: true,
    // Prevent referrer leaks while allowing functionality
    referrerPolicy: 'no-referrer-when-downgrade' as const,
    // Load immediately for faster video playback
    loading: 'eager' as const,
    // NO SANDBOX ATTRIBUTE - this is intentional
    // sandbox: undefined means NO sandbox attribute will be added
  };
};

// Helper to check if a URL is safe to embed without restrictions
export const isSafeEmbedUrl = (url: string): boolean => {
  if (!url) return false;
  return isTrustedSource(url) && !isAdUrl(url);
};

// Get complete iframe element attributes as a string for debugging
export const getIframeDebugInfo = (src: string) => {
  const props = createSecureIframeProps(src);
  return {
    src: props.src,
    allow: props.allow,
    allowFullScreen: props.allowFullScreen,
    referrerPolicy: props.referrerPolicy,
    sandboxApplied: false, // Always false - we never apply sandbox
    isTrusted: isTrustedSource(src),
    isAd: isAdUrl(src),
  };
};

export const isTrustedSource = (url: string): boolean => {
  if (!url) return false;
  const lowerUrl = url.toLowerCase();
  return TRUSTED_DOMAINS.some(domain => lowerUrl.includes(domain));
};

export const getPlayerFromUrl = (url: string): typeof RECOMMENDED_PLAYERS[0] | null => {
  if (!url) return null;
  const lowerUrl = url.toLowerCase();
  
  for (const player of RECOMMENDED_PLAYERS) {
    if (player.domains?.some(domain => lowerUrl.includes(domain))) {
      return player;
    }
    if (lowerUrl.includes(player.prefix)) {
      return player;
    }
  }
  return null;
};

export const injectAdBlockScript = (): string => {
  return `
    (function() {
      const blockedMethods = ['open', 'alert', 'confirm', 'prompt'];
      blockedMethods.forEach(method => {
        try {
          if (window[method]) {
            Object.defineProperty(window, method, {
              value: function() { return null; },
              writable: false,
              configurable: false
            });
          }
        } catch(e) {}
      });
      
      const originalSetTimeout = window.setTimeout;
      window.setTimeout = function(fn, delay, ...args) {
        if (typeof fn === 'string' && (fn.includes('popup') || fn.includes('redirect'))) {
          return 0;
        }
        return originalSetTimeout.call(this, fn, delay, ...args);
      };

      document.addEventListener('click', function(e) {
        const target = e.target;
        if (target && target.tagName === 'A') {
          const href = target.getAttribute('href');
          if (href && (href.includes('popup') || href.includes('ads') || href.startsWith('javascript:'))) {
            e.preventDefault();
            e.stopPropagation();
          }
        }
      }, true);
    })();
  `;
};
