import { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PureIframePlayer } from './PureIframePlayer';
import { PlayerControls } from './PlayerControls';
import { cn } from '@/lib/utils';

interface ExternalControlsPlayerProps {
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  season?: number;
  episode?: number;
  autoPlay?: boolean;
  progress?: number;
  onProgressUpdate?: (data: any) => void;
  onVideoEnd?: () => void;
  className?: string;
  playerType?: 'vidking' | 'vidfast';
  showName?: string;
  initialServer?: string;
  posterPath?: string;
}

const VIDKING_BASE_URL = 'https://www.vidking.net/embed';
const VIDFAST_BASE_URL = 'https://vidfast.pro/embed';
const PRIMARY_COLOR = '8B5CF6';
const GREEN_THEME = '10B981';

export const ExternalControlsPlayer = ({
  tmdbId,
  mediaType,
  season,
  episode,
  autoPlay = true,
  progress,
  onProgressUpdate,
  onVideoEnd,
  className,
  playerType = 'vidking',
  showName,
  initialServer = 'auto',
  posterPath,
}: ExternalControlsPlayerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentServer, setCurrentServer] = useState(initialServer);
  const [iframeKey, setIframeKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const buildPlayerUrl = useCallback(() => {
    const baseUrl = playerType === 'vidfast' ? VIDFAST_BASE_URL : VIDKING_BASE_URL;
    const color = playerType === 'vidfast' ? GREEN_THEME : PRIMARY_COLOR;

    let url = '';
    if (mediaType === 'movie') {
      url = `${baseUrl}/movie/${tmdbId}`;
    } else {
      const s = season || 1;
      const e = episode || 1;
      url = `${baseUrl}/tv/${tmdbId}/${s}/${e}`;
    }

    const params = new URLSearchParams();

    if (playerType === 'vidfast') {
      params.set('theme', color);
      params.set('title', 'true');
      params.set('poster', 'true');
      params.set('fullscreenButton', 'true');
      if (mediaType === 'tv') {
        params.set('nextButton', 'true');
        params.set('autoNext', 'true');
      }
    } else {
      params.set('color', color);
      if (mediaType === 'tv') {
        params.set('nextEpisode', 'true');
        params.set('episodeSelector', 'true');
      }
    }

    if (autoPlay) {
      params.set('autoPlay', 'true');
    }

    if (progress && progress > 0) {
      params.set('progress', String(Math.round(progress)));
    }

    if (currentServer && currentServer !== 'auto') {
      params.set('server', currentServer);
    }

    params.set('hideServer', 'true');

    return `${url}?${params.toString()}`;
  }, [tmdbId, mediaType, season, episode, autoPlay, progress, currentServer, playerType]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        if (typeof event.data !== 'string') return;
        const data = JSON.parse(event.data);

        if (data.type === 'PLAYER_EVENT' && data.data) {
          if (onProgressUpdate) {
            onProgressUpdate({
              event: data.data.event,
              currentTime: data.data.currentTime || 0,
              duration: data.data.duration || 0,
              progress: data.data.progress || 0,
              id: String(tmdbId),
              mediaType,
              season,
              episode,
              timestamp: Date.now(),
            });
          }

          if (data.data.event === 'ended' && onVideoEnd) {
            onVideoEnd();
          }
        }
      } catch (e) { }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [tmdbId, mediaType, season, episode, onProgressUpdate, onVideoEnd]);

  const handleServerChange = useCallback((serverId: string) => {
    setCurrentServer(serverId);
    setIframeKey(prev => prev + 1);
    setIsLoaded(false);
  }, []);

  const handleOpenExternal = useCallback(() => {
    window.open(buildPlayerUrl(), '_blank', 'noopener,noreferrer');
  }, [buildPlayerUrl]);

  const handleToggleFullscreen = useCallback(() => {
    if (containerRef.current) {
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen().catch(() => { });
      } else {
        document.exitFullscreen().catch(() => { });
      }
    }
  }, []);

  const handlePlayerLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn("flex flex-col gap-3 sm:gap-4", className)}
    >
      <PlayerControls
        currentServer={currentServer}
        onServerChange={handleServerChange}
        onOpenExternal={handleOpenExternal}
        onToggleFullscreen={handleToggleFullscreen}
        isFullscreen={isFullscreen}
        playerType={playerType}
        mediaType={mediaType}
        season={season}
        episode={episode}
        showName={showName}
      />

      <PureIframePlayer
        key={iframeKey}
        src={buildPlayerUrl()}
        onLoad={handlePlayerLoad}
        playerType={playerType}
        posterPath={posterPath}
      />
    </motion.div>
  );
};

export default ExternalControlsPlayer;
