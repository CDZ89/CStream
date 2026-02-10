import React from 'react';

interface BludclartPlayerProps {
  tmdbId: string;
  type: 'movie' | 'tv';
  season?: number;
  episode?: number;
}

export function BludclartPlayer({ tmdbId, type, season, episode }: BludclartPlayerProps) {
  const baseUrl = "https://watch.bludclart.com";
  let url = "";

  if (type === 'movie') {
    url = `${baseUrl}/movie/${tmdbId}/watch`;
  } else {
    url = `${baseUrl}/tv/${tmdbId}/watch?season=${season || 1}&episode=${episode || 1}`;
  }

  return (
    <div className="w-full h-full min-h-[500px] relative bg-black rounded-xl overflow-hidden shadow-2xl">
      <iframe
        src={url}
        className="absolute top-0 left-0 w-full h-full border-0"
        allowFullScreen
        allow="autoplay; encrypted-media; picture-in-picture"
        title="Bludclart Player"
      />
    </div>
  );
}
