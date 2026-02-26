import React, { useEffect, useRef } from 'react';
import Artplayer from 'artplayer';
import Hls from 'hls.js';

interface ArtPlayerProps {
  url: string;
  type?: string;
  style?: React.CSSProperties;
  className?: string;
}

export const ArtPlayer: React.FC<ArtPlayerProps> = ({ url, type = 'm3u8', style, className }) => {
  const artRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!artRef.current) return;

    const art = new Artplayer({
      container: artRef.current,
      url: url,
      type: type,
      customType: {
        m3u8: (video, url) => {
          if (Hls.isSupported()) {
            const hls = new Hls();
            hls.loadSource(url);
            hls.attachMedia(video);
          } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = url;
          }
        },
      },
      autoplay: true,
      pip: true,
      screenshot: true,
      setting: true,
      loop: false,
      flip: true,
      playbackRate: true,
      aspectRatio: true,
      fullscreen: true,
      fullscreenWeb: true,
      subtitleOffset: true,
      miniProgressBar: true,
      mutex: true,
      backdrop: true,
      playsInline: true,
      autoPlayback: true,
      airplay: true,
      theme: '#8B5CF6',
    });

    return () => {
      if (art && art.destroy) {
        art.destroy(false);
      }
    };
  }, [url, type]);

  return <div ref={artRef} style={style} className={className} />;
};
