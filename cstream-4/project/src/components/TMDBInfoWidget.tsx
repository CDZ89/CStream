import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TMDBInfoWidgetProps {
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  playerType?: 'vidking' | 'vidfast';
  season?: number;
  episode?: number;
  className?: string;
}

export const TMDBInfoWidget = ({
  tmdbId,
  mediaType,
  playerType = 'vidking',
  season,
  episode,
  className = ''
}: TMDBInfoWidgetProps) => {
  const [showWidget, setShowWidget] = useState(false);

  // Detect device type
  const getDeviceType = () => {
    if (typeof window === 'undefined') return 'pc';
    const ua = navigator.userAgent;
    if (/android/i.test(ua)) return 'android';
    if (/iphone|ipad|ipod/i.test(ua)) return 'ios';
    return 'pc';
  };

  const deviceType = getDeviceType();

  return (
    <>
      <motion.button
        onClick={() => setShowWidget(true)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-primary/30 to-purple-600/20 hover:from-primary/40 hover:to-purple-600/30 border border-primary/60 hover:border-primary/80 text-primary font-semibold transition-all text-xs sm:text-sm shadow-lg shadow-primary/20 ${className}`}
        title="CStream v3.7 - Infos Lecteur"
      >
        <Info className="w-4 h-4" />
        <span className="hidden sm:inline">Infos</span>
      </motion.button>

      <AnimatePresence>
        {showWidget && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[999] bg-black/70 backdrop-blur-md"
              onClick={() => setShowWidget(false)}
            />
            
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 30 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="fixed inset-0 z-[1000] flex items-center justify-center p-4 pointer-events-none"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                onClick={(e) => e.stopPropagation()}
                className="pointer-events-auto w-full max-w-md bg-gradient-to-br from-slate-900/95 via-slate-950/95 to-black/95 border border-primary/40 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-primary/30 backdrop-blur-xl max-h-[90vh] overflow-y-auto"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-primary/30 to-purple-600/20 rounded-lg">
                      <Info className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                        CStream v3.7
                      </h3>
                      <p className="text-xs text-white/50 mt-0.5">Infos Lecteur</p>
                    </div>
                  </div>
                  <motion.button
                    onClick={() => setShowWidget(false)}
                    whileHover={{ rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 hover:bg-white/10 rounded-lg transition-all"
                  >
                    <X className="w-5 h-5 text-white/70 hover:text-white" />
                  </motion.button>
                </div>

                {/* Divider */}
                <div className="h-px bg-gradient-to-r from-primary/20 via-primary/40 to-transparent mb-6" />

                {/* Content Grid */}
                <div className="space-y-3">
                  {/* TMDB ID */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white/5 hover:bg-white/10 rounded-lg p-3 border border-white/10 hover:border-primary/30 transition-all"
                  >
                    <p className="text-xs text-white/50 mb-1 font-semibold uppercase tracking-wide">ID TMDB</p>
                    <p className="text-white font-mono text-sm font-bold text-primary">{tmdbId}</p>
                  </motion.div>

                  {/* Media Type */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 }}
                    className="bg-white/5 hover:bg-white/10 rounded-lg p-3 border border-white/10 hover:border-primary/30 transition-all"
                  >
                    <p className="text-xs text-white/50 mb-1 font-semibold uppercase tracking-wide">Type</p>
                    <p className="text-white font-semibold text-sm capitalize">
                      {mediaType === 'movie' ? '🎬 Film' : '📺 Série'}
                    </p>
                  </motion.div>

                  {/* Player Type */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white/5 hover:bg-white/10 rounded-lg p-3 border border-white/10 hover:border-primary/30 transition-all"
                  >
                    <p className="text-xs text-white/50 mb-1 font-semibold uppercase tracking-wide">Lecteur</p>
                    <p className="text-white font-semibold text-sm capitalize">
                      {playerType === 'vidking' ? '⚡ VidKing' : '🚀 VidFast'}
                    </p>
                  </motion.div>

                  {/* Device Info */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 }}
                    className="bg-white/5 hover:bg-white/10 rounded-lg p-3 border border-white/10 hover:border-primary/30 transition-all"
                  >
                    <p className="text-xs text-white/50 mb-1 font-semibold uppercase tracking-wide">Appareil</p>
                    <p className="text-white font-semibold text-sm capitalize">
                      {deviceType === 'ios' && '🍎 iOS'} 
                      {deviceType === 'android' && '🤖 Android'} 
                      {deviceType === 'pc' && '💻 PC'}
                    </p>
                  </motion.div>

                  {/* Season/Episode (TV only) */}
                  {mediaType === 'tv' && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                      className="grid grid-cols-2 gap-3"
                    >
                      <div className="bg-white/5 hover:bg-white/10 rounded-lg p-3 border border-white/10 hover:border-primary/30 transition-all">
                        <p className="text-xs text-white/50 mb-1 font-semibold uppercase tracking-wide">Saison</p>
                        <p className="text-white font-bold text-sm text-primary text-center text-lg">{season || 1}</p>
                      </div>
                      <div className="bg-white/5 hover:bg-white/10 rounded-lg p-3 border border-white/10 hover:border-primary/30 transition-all">
                        <p className="text-xs text-white/50 mb-1 font-semibold uppercase tracking-wide">Épisode</p>
                        <p className="text-white font-bold text-sm text-primary text-center text-lg">{episode || 1}</p>
                      </div>
                    </motion.div>
                  )}

                  {/* Footer Info */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="mt-4 bg-gradient-to-r from-primary/20 via-purple-600/15 to-transparent rounded-lg p-4 border border-primary/30 backdrop-blur-sm"
                  >
                    <p className="text-xs text-white/80 leading-relaxed">
                      <span className="font-semibold">CStream v3.7</span> • Plateforme de streaming premium avec logos TMDB officiels • Conçu pour iOS, Android & PC
                    </p>
                  </motion.div>

                  {/* Close Button */}
                  <motion.button
                    onClick={() => setShowWidget(false)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full mt-4 px-4 py-3 bg-gradient-to-r from-primary/30 to-purple-600/20 hover:from-primary/40 hover:to-purple-600/30 border border-primary/40 hover:border-primary/60 text-white font-semibold rounded-lg transition-all"
                  >
                    Fermer
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
