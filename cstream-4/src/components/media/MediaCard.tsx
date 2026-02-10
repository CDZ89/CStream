
import React, { useState } from 'react';
import { Star, Globe, Info, Play, ChevronDown, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';

interface Stream {
  name: string;
  url: string;
}

interface MediaCardProps {
  title: string;
  year?: string;
  score?: number;
  genres?: string[];
  overview?: string;
  poster?: string;
  tmdbId: number;
  lang?: string;
  type?: 'movie' | 'tv';
  className?: string;
  streams?: Stream[];
  onPlay?: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
  onShare?: () => void;
  plays?: number;
}

export function MediaCard({
  title, year, score, genres = [], overview, poster, tmdbId, lang = "fr-FR", type = 'movie', className, streams = [],
  onPlay, onDelete, onEdit, onShare, plays = 0
}: MediaCardProps) {
  const [selectedStream, setSelectedStream] = useState<Stream | null>(streams[0] || null);
  // LOGIQUE D'IMAGE TMDB ULTRA ROBUSTE
  let posterUrl = "";
  if (poster) {
    if (poster.startsWith('http')) {
      posterUrl = poster;
    } else {
      const cleanPath = poster.startsWith('/') ? poster : `/${poster}`;
      posterUrl = `https://image.tmdb.org/t/p/w500${cleanPath}`;
    }
  } else {
    posterUrl = `https://placehold.co/500x750/09090B/ffffff?text=${encodeURIComponent(title || 'No Image')}`;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }} 
      animate={{ opacity: 1, scale: 1 }} 
      className={cn("group relative w-full max-w-[280px] h-[420px]", className)}
    >
      <div className="relative h-full overflow-hidden rounded-2xl bg-zinc-900 border border-white/10 transition-all duration-500 hover:border-[#6C6CFF]/50 hover:shadow-[0_0_30px_rgba(108,108,255,0.2)] dark:bg-black/40 bg-white/5 backdrop-blur-xl">
        {/* Poster Image */}
        <div className="relative aspect-[2/3] overflow-hidden">
          <img 
            src={posterUrl} 
            alt={title} 
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" 
            loading="lazy"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (!target.src.includes('placehold.co')) {
                target.src = `https://placehold.co/500x750/09090B/ffffff?text=Image+Error`;
              }
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-500" />
          
          {/* Badge Rating */}
          <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
            <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10 shadow-xl">
              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
              <span className="text-[10px] font-bold text-white">{(score || 7.5).toFixed(1)}</span>
            </div>
            {plays > 0 && (
               <div className="flex items-center gap-1 bg-primary/80 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10 shadow-xl">
                <Play className="w-2 h-2 text-white fill-current" />
                <span className="text-[8px] font-bold text-white">{plays}</span>
              </div>
            )}
          </div>

          {/* Media Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-[#6C6CFF] text-[9px] font-bold rounded-full text-white uppercase tracking-wider shadow-lg">
                  {type === 'tv' ? 'Série' : 'Film'}
                </span>
                <span className="text-[10px] text-white/80 font-bold">{year || '2024'}</span>
              </div>
              <h3 className="text-white text-base font-bold truncate leading-tight mt-1 drop-shadow-md">
                {title}
              </h3>
            </div>
            
            {/* Quick Actions (Appear on Hover) */}
            <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-wrap gap-2">
              <Button 
                onClick={(e) => {
                  e.stopPropagation();
                  onPlay?.();
                }}
                size="sm" 
                className="flex-1 bg-white text-black hover:bg-[#6C6CFF] hover:text-white border-none text-[10px] h-8 font-bold uppercase tracking-widest rounded-lg transition-all shadow-lg"
              >
                <Play className="w-3 h-3 mr-2 fill-current" /> Play
              </Button>

              {onShare && (
                <Button 
                  onClick={onShare}
                  size="sm" 
                  variant="outline" 
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-lg h-8 px-2"
                >
                  <Globe className="w-3 h-3" />
                </Button>
              )}

              {onDelete && (
                <Button 
                  onClick={onDelete}
                  size="sm" 
                  variant="destructive" 
                  className="h-8 px-2"
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
