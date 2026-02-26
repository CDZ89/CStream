import { useState, useEffect, useCallback } from 'react';
import { AlertCircle, Loader2, Cpu, Volume2, Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface BackendPlayerProps {
  mediaId: string | number;
  mediaType: 'movie' | 'tv';
  episodeId?: string | number;
  seasonId?: string | number;
  title?: string;
  className?: string;
  onError?: (error: string) => void;
}

interface BackendStream {
  url: string;
  type: 'hls' | 'dash' | 'mp4';
  quality: 'auto' | '480p' | '720p' | '1080p' | '4k';
}

interface BackendPlayerState {
  isLoading: boolean;
  error: string | null;
  streams: BackendStream[];
  currentStream: BackendStream | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
}

export const BackendPlayer = ({
  mediaId,
  mediaType,
  seasonId,
  episodeId,
  title,
  className,
  onError,
}: BackendPlayerProps) => {
  const [state, setState] = useState<BackendPlayerState>({
    isLoading: true,
    error: null,
    streams: [],
    currentStream: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
  });

  const [playerRef, setPlayerRef] = useState<HTMLVideoElement | null>(null);
  const [volume, setVolume] = useState(1);

  // Initialiser le lecteur backend
  useEffect(() => {
    const initializeBackend = async () => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        // Construire l'URL de la requête backend
        let apiUrl = `/api/backend/stream/${mediaType}/${mediaId}`;
        if (mediaType === 'tv' && seasonId && episodeId) {
          apiUrl += `/${seasonId}/${episodeId}`;
        }

        // Récupérer les streams du backend
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-Backend-Request': 'true',
          },
        });

        if (!response.ok) {
          throw new Error(`Erreur backend: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.streams || data.streams.length === 0) {
          throw new Error('Aucun stream disponible');
        }

        // Prendre le premier stream comme défaut
        const defaultStream = data.streams[0];
        
        setState(prev => ({
          ...prev,
          streams: data.streams,
          currentStream: defaultStream,
          isLoading: false,
        }));

        toast.success(`${data.streams.length} source(s) trouvée(s)`);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Erreur inconnue';
        setState(prev => ({ ...prev, error: errorMsg, isLoading: false }));
        onError?.(errorMsg);
        toast.error(`Erreur lecteur backend: ${errorMsg}`);
      }
    };

    initializeBackend();
  }, [mediaId, mediaType, seasonId, episodeId, onError]);

  // Gestion du lecteur vidéo
  const handlePlay = useCallback(() => {
    if (playerRef) {
      playerRef.play();
      setState(prev => ({ ...prev, isPlaying: true }));
    }
  }, [playerRef]);

  const handlePause = useCallback(() => {
    if (playerRef) {
      playerRef.pause();
      setState(prev => ({ ...prev, isPlaying: false }));
    }
  }, [playerRef]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (playerRef) {
      playerRef.volume = newVolume;
    }
  };

  const switchStream = (stream: BackendStream) => {
    setState(prev => ({ ...prev, currentStream: stream }));
    if (playerRef) {
      const wasPlaying = !playerRef.paused;
      playerRef.src = stream.url;
      if (wasPlaying) {
        playerRef.play();
      }
    }
  };

  // État de chargement
  if (state.isLoading) {
    return (
      <div className={cn(
        "w-full aspect-video bg-gradient-to-br from-zinc-900 via-zinc-800 to-black rounded-lg overflow-hidden",
        className
      )}>
        <div className="flex flex-col items-center justify-center w-full h-full gap-3">
          <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
          <div className="flex flex-col items-center gap-1">
            <p className="text-sm text-zinc-300 font-semibold">Initialisation du lecteur</p>
            <p className="text-xs text-zinc-500">Récupération des streams...</p>
          </div>
        </div>
      </div>
    );
  }

  // État d'erreur
  if (state.error) {
    return (
      <div className={cn(
        "w-full aspect-video bg-gradient-to-br from-zinc-900 via-zinc-800 to-black rounded-lg overflow-hidden flex items-center justify-center",
        className
      )}>
        <div className="flex flex-col items-center gap-3 text-center px-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
          <div>
            <p className="text-sm text-zinc-300 font-semibold">Lecteur Backend Indisponible</p>
            <p className="text-xs text-zinc-500 mt-1">{state.error}</p>
          </div>
          <Badge className="bg-orange-500/30 text-orange-300 border-orange-500/50 mt-2">
            Beta
          </Badge>
        </div>
      </div>
    );
  }

  // Lecteur vidéo
  return (
    <div className={cn(
      "w-full bg-black rounded-lg overflow-hidden group",
      className
    )}>
      {/* Vidéo */}
      <div className="relative aspect-video bg-zinc-900 flex items-center justify-center overflow-hidden">
        <video
          ref={setPlayerRef}
          src={state.currentStream?.url}
          className="w-full h-full"
          controls={false}
          crossOrigin="anonymous"
          onLoadedMetadata={(e) => {
            const video = e.currentTarget;
            setState(prev => ({ ...prev, duration: video.duration }));
          }}
          onTimeUpdate={(e) => {
            setState(prev => ({ ...prev, currentTime: e.currentTarget.currentTime }));
          }}
          onPlay={() => setState(prev => ({ ...prev, isPlaying: true }))}
          onPause={() => setState(prev => ({ ...prev, isPlaying: false }))}
        />

        {/* Badge Beta */}
        <div className="absolute top-4 right-4 z-50">
          <Badge className="bg-orange-500/30 text-orange-300 border-orange-500/50 flex items-center gap-1">
            <Cpu className="w-3 h-3" />
            Backend (Beta)
          </Badge>
        </div>

        {/* Contrôles au survol */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4">
          {/* Top: Title */}
          <div className="flex justify-between items-start">
            <div className="text-white">
              <p className="text-sm font-semibold">{title || 'Lecteur Backend'}</p>
              {state.currentStream && (
                <p className="text-xs text-zinc-300 mt-1">
                  {state.currentStream.quality} - {state.currentStream.type.toUpperCase()}
                </p>
              )}
            </div>
          </div>

          {/* Bottom: Controls */}
          <div className="flex flex-col gap-3">
            {/* Sélection du stream */}
            {state.streams.length > 1 && (
              <div className="flex gap-2 flex-wrap">
                {state.streams.map((stream, idx) => (
                  <Button
                    key={idx}
                    size="sm"
                    variant={state.currentStream === stream ? 'default' : 'outline'}
                    onClick={() => switchStream(stream)}
                    className="text-xs"
                  >
                    {stream.quality}
                  </Button>
                ))}
              </div>
            )}

            {/* Contrôles de lecture */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={state.isPlaying ? handlePause : handlePlay}
                className="text-white hover:bg-white/10"
              >
                {state.isPlaying ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </Button>

              {/* Durée */}
              <div className="flex-1 flex items-center gap-2 text-xs text-white">
                <span>{formatTime(state.currentTime)}</span>
                <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                    style={{ width: `${(state.currentTime / (state.duration || 1)) * 100}%` }}
                  />
                </div>
                <span>{formatTime(state.duration)}</span>
              </div>

              {/* Volume */}
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-white" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-16 h-1 bg-white/20 rounded-full appearance-none cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function formatTime(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return '0:00';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export default BackendPlayer;
