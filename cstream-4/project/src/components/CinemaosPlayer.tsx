import { useState } from 'react';
import { AlertTriangle, Play, Loader2 } from 'lucide-react';

interface CinemaosPlayerProps {
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  seasonNumber?: number;
  episodeNumber?: number;
  title?: string;
}

export const CinemaosPlayer = ({
  tmdbId,
  mediaType,
  seasonNumber,
  episodeNumber,
  title
}: CinemaosPlayerProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const getEmbedUrl = () => {
    const baseUrl = 'https://cinemaos.tech/player';
    
    if (mediaType === 'movie') {
      return `${baseUrl}/${tmdbId}`;
    } else if (mediaType === 'tv' && seasonNumber && episodeNumber) {
      return `${baseUrl}/${tmdbId}/${seasonNumber}/${episodeNumber}`;
    }
    return null;
  };

  const embedUrl = getEmbedUrl();

  if (!embedUrl) {
    return (
      <div className="w-full aspect-video bg-black/50 rounded-xl flex items-center justify-center border border-red-500/30">
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <p className="text-red-400 text-sm">Lecteur Cinemaos indisponible</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full aspect-video bg-black/80 rounded-xl overflow-hidden border border-white/10 relative group">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      )}
      
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
          <div className="text-center">
            <AlertTriangle className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
            <p className="text-yellow-400 text-sm mb-3">Erreur du lecteur</p>
            <p className="text-gray-400 text-xs max-w-xs">{title || 'Contenu'}</p>
          </div>
        </div>
      )}

      <iframe
        src={embedUrl}
        className="w-full h-full border-0"
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
  );
};
