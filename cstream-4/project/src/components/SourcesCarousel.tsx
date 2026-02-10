import { memo } from 'react';
import { motion } from 'framer-motion';
import { Server, Zap, Globe, Shield, Play, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SourceInfo {
  id: string;
  name: string;
  description: string;
  color: string;
  gradient: string;
  icon: string;
  reliable: boolean;
  language?: string;
  hasMultiLang?: boolean;
  hasPub?: boolean;
}

const SOURCES: SourceInfo[] = [
  { id: 'smashy', name: 'CSPlayer', description: '(Ultra recommandé)', color: '#F43F5E', gradient: 'from-rose-500 to-pink-600', icon: 'CS', reliable: true, hasMultiLang: true, hasPub: true },
  { id: 'primesrc', name: 'VidPlus', description: 'Multi-serveurs', color: '#F59E0B', gradient: 'from-amber-500 to-orange-600', icon: 'VP', reliable: true, hasPub: true },
  { id: 'vidfast', name: 'VidFast', description: 'Serveur rapide', color: '#10B981', gradient: 'from-green-500 to-emerald-500', icon: 'VF', reliable: true, hasMultiLang: true, hasPub: true },
  { id: 'vidsrc', name: 'VidSrc', description: 'Fiable', color: '#3B82F6', gradient: 'from-blue-500 to-cyan-500', icon: 'VS', reliable: true, hasPub: true },
  { id: 'videasy', name: 'Videasy', description: 'Leger', color: '#14B8A6', gradient: 'from-teal-500 to-cyan-500', icon: 'VE', reliable: true, hasMultiLang: true, hasPub: true },
  { id: 'autoembed', name: 'AutoEmbed', description: 'Auto HD', color: '#6366F1', gradient: 'from-indigo-500 to-blue-600', icon: 'AE', reliable: true, hasMultiLang: true, hasPub: true },
  { id: 'vidlink', name: 'VidLink', description: 'HLS 4K', color: '#0EA5E9', gradient: 'from-blue-600 to-sky-500', icon: 'VL', reliable: true, hasPub: true },
  { id: 'embed2', name: '2Embedded', description: 'Stable', color: '#10B981', gradient: 'from-green-500 to-emerald-500', icon: '2E', reliable: true, hasPub: true },
  { id: 'moviesapi', name: 'Movie API', description: 'Premium', color: '#F43F5E', gradient: 'from-rose-500 to-pink-600', icon: 'MA', reliable: true, hasPub: true },
  { id: 'vidnest', name: 'VidNest', description: 'Premium', color: '#06B6D4', gradient: 'from-cyan-500 to-blue-600', icon: 'VN', reliable: true, hasPub: true },
  { id: 'vidrock', name: 'VidRock', description: 'Premium 4K', color: '#EF4444', gradient: 'from-red-500 to-orange-500', icon: 'VR', reliable: true, hasPub: true },
  { id: 'vidsync', name: 'VidSync', description: 'Stable', color: '#3B82F6', gradient: 'from-blue-500 to-indigo-500', icon: 'VS', reliable: true, hasPub: true },
  { id: 'cinemaos', name: 'Cinemaos', description: 'Stable', color: '#6366F1', gradient: 'from-indigo-500 to-purple-500', icon: 'CO', reliable: true, hasPub: true },
  { id: 'multiembed', name: 'MultiEmbed', description: 'HLS Premium', color: '#8B5CF6', gradient: 'from-violet-500 to-purple-600', icon: 'M', reliable: true },
  { id: 'vidking', name: 'Vidking', description: 'Multi-sources', color: '#A855F7', gradient: 'from-purple-500 to-indigo-500', icon: 'K', reliable: true },
  { id: 'superembed', name: 'SuperEmbed', description: 'Ultra stable', color: '#EAB308', gradient: 'from-yellow-500 to-orange-500', icon: 'E', reliable: true },
  { id: 'frembed', name: 'Frembed', description: 'VF/VOSTFR', color: '#0EA5E9', gradient: 'from-blue-600 to-sky-500', icon: 'F', reliable: true, language: 'FR' },
];

interface SourcesCarouselProps {
  className?: string;
  onSourceSelect?: (sourceId: string) => void;
  selectedSource?: string;
}

export const SourcesCarousel = memo(({ className, onSourceSelect, selectedSource }: SourcesCarouselProps) => {
  return (
    <section className={cn("py-6", className)}>
      <div className="flex items-center gap-3 mb-4 px-4">
        <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20">
          <Server className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Sources disponibles</h3>
          <p className="text-xs text-muted-foreground">10 lecteurs haute qualité</p>
        </div>
      </div>

      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-3 px-4 pb-2">
          {SOURCES.map((source, index) => (
            <motion.button
              key={source.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onSourceSelect?.(source.id)}
              className={cn(
                "flex-shrink-0 group relative overflow-hidden rounded-xl border transition-all duration-300",
                "min-w-[140px] p-4",
                selectedSource === source.id
                  ? "bg-gradient-to-br from-primary/30 to-accent/20 border-primary/50 shadow-lg shadow-primary/20"
                  : "bg-zinc-900/60 border-white/10 hover:border-white/20 hover:bg-zinc-800/60"
              )}
            >
              <div className="flex flex-col items-center gap-3">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg text-white shadow-lg",
                  `bg-gradient-to-br ${source.gradient}`
                )}>
                  {source.icon}
                </div>
                
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      <span className="font-semibold text-sm text-white">{source.name}</span>
                      {source.language && (
                        <span className="px-1.5 py-0.5 text-[9px] bg-blue-500/30 text-blue-300 rounded font-bold">
                          {source.language}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-1 mb-1.5">
                      {source.hasMultiLang && (
                        <span className="px-1.5 py-0.5 text-[8px] bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded uppercase font-bold">
                          Multi
                        </span>
                      )}
                      {source.hasPub && (
                        <span className="px-1.5 py-0.5 text-[8px] bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded uppercase font-bold">
                          Pub
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-white/50">{source.description}</span>
                  </div>

                {source.reliable && (
                  <div className="flex items-center gap-1 text-[10px] text-green-400/80">
                    <Shield className="w-3 h-3" />
                    <span>Fiable</span>
                  </div>
                )}
              </div>

              {selectedSource === source.id && (
                <motion.div
                  layoutId="source-indicator"
                  className="absolute inset-0 border-2 border-primary rounded-xl pointer-events-none"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
});

SourcesCarousel.displayName = 'SourcesCarousel';

export const SourcesGrid = memo(({ className, onSourceSelect, selectedSource }: SourcesCarouselProps) => {
  return (
    <div className={cn("grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3", className)}>
      {SOURCES.map((source, index) => (
        <motion.button
          key={source.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.03 }}
          onClick={() => onSourceSelect?.(source.id)}
          className={cn(
            "group relative overflow-hidden rounded-xl border transition-all duration-300 p-3",
            selectedSource === source.id
              ? "bg-gradient-to-br from-primary/30 to-accent/20 border-primary/50 ring-2 ring-primary/30"
              : "bg-zinc-900/50 border-white/10 hover:border-white/20 hover:bg-zinc-800/50"
          )}
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm text-white shadow-md flex-shrink-0",
              `bg-gradient-to-br ${source.gradient}`
            )}>
              {source.icon}
            </div>
            
            <div className="text-left min-w-0">
              <div className="flex items-center gap-1">
                <span className="font-semibold text-sm text-white truncate">{source.name}</span>
                {source.language && (
                  <span className="px-1 py-0.5 text-[8px] bg-blue-500/30 text-blue-300 rounded font-bold flex-shrink-0">
                    {source.language}
                  </span>
                )}
              </div>
              <div className="flex gap-1 my-0.5">
                {source.hasMultiLang && (
                  <span className="px-1 py-0.5 text-[7px] bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded uppercase font-bold">
                    Multi
                  </span>
                )}
                {source.hasPub && (
                  <span className="px-1 py-0.5 text-[7px] bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded uppercase font-bold">
                    Pub
                  </span>
                )}
              </div>
              <span className="text-xs text-white/50 truncate block">{source.description}</span>
            </div>
          </div>
        </motion.button>
      ))}
    </div>
  );
});

SourcesGrid.displayName = 'SourcesGrid';

export default SourcesCarousel;
