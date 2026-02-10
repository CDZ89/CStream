import { useState, useEffect } from 'react';
import { AlertTriangle, Loader2, RefreshCw } from 'lucide-react';

interface CSPlayerProps {
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  seasonNumber?: number;
  episodeNumber?: number;
  title?: string;
}

export const CSPlayer = ({
  tmdbId,
  mediaType,
  seasonNumber,
  episodeNumber,
  title
}: CSPlayerProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  const getEmbedUrl = () => {
    const baseUrl = 'https://player.vidify.top/embed';
    
    if (mediaType === 'movie') {
      return `${baseUrl}/movie/${tmdbId}?autoplay=false&poster=true&chromecast=true&servericon=true&setting=true&pip=true&logo=CSPlayer&fontsize=20&opacity=0.8`;
    } else if (mediaType === 'tv' && seasonNumber && episodeNumber) {
      return `${baseUrl}/tv/${tmdbId}/${seasonNumber}/${episodeNumber}?autoplay=false&poster=true&chromecast=true&servericon=true&setting=true&pip=true&logo=CSPlayer&fontsize=20&opacity=0.8`;
    }
    return null;
  };

  const embedUrl = getEmbedUrl();

  useEffect(() => {
    if (!isLoading && !hasError && embedUrl) {
      // Simulate progress update since we can't get real progress from iframe easily
      const interval = setInterval(() => {
        if (typeof window !== 'undefined') {
          // Send heartbeat to watch history
          window.dispatchEvent(new CustomEvent('cstream:player_progress', { 
            detail: { 
              tmdbId, 
              mediaType, 
              seasonNumber, 
              episodeNumber, 
              progress: -1 // Heartbeat
            } 
          }));
        }
      }, 20000);
      return () => clearInterval(interval);
    }
  }, [isLoading, hasError, embedUrl, tmdbId, mediaType, seasonNumber, episodeNumber]);

  const handleRetry = () => {
    setHasError(false);
    setIsLoading(true);
    setIframeKey(prev => prev + 1);
  };

  if (!embedUrl) {
    return (
      <div className="video-player-wrapper">
        <div className="player-error">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3 animate-pulse" />
            <p className="text-red-300 text-lg font-semibold mb-2">Lecteur indisponible</p>
            <p className="text-gray-400 text-sm">Données manquantes pour le contenu</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full">
      <div className="video-player-wrapper">
        {isLoading && (
          <div className="player-loading">
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-lg opacity-50 animate-pulse"></div>
                <Loader2 className="w-10 h-10 text-white animate-spin relative z-10" />
              </div>
              <p className="text-gray-300 text-sm font-medium">Chargement du lecteur...</p>
            </div>
          </div>
        )}
        
        {hasError && (
          <div className="player-error">
            <div className="text-center">
              <div className="mb-4">
                <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
              </div>
              <p className="text-yellow-300 text-lg font-semibold mb-2">Erreur du lecteur</p>
              <p className="text-gray-400 text-sm mb-4 max-w-xs">{title || 'Contenu'}</p>
              <button
                onClick={handleRetry}
                className="inline-flex items-center gap-2 px-6 py-2 rounded-lg bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <RefreshCw className="w-4 h-4" />
                Réessayer
              </button>
            </div>
          </div>
        )}

        <div className="player-container" key={iframeKey}>
          <iframe
            src={embedUrl}
            className="player-iframe"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            loading="lazy"
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setHasError(true);
            }}
          />
        </div>
      </div>
    </div>
  );
};
