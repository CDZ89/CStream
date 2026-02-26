import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { tmdbApi } from '@/lib/tmdb';

interface Provider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
}

interface StreamingProvidersModalProps {
  mediaType: 'movie' | 'tv';
  className?: string;
}

export const StreamingProvidersModal = ({ mediaType, className = '' }: StreamingProvidersModalProps) => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        setLoading(true);
        const data: any = await tmdbApi.getWatchProviders(mediaType);
        if (data?.results) {
          setProviders(data.results);
        }
      } catch (error) {
        console.error('Error fetching providers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, [mediaType]);

  if (loading || providers.length === 0) {
    return null;
  }

  const displayedProviders = providers.slice(0, 6);
  const hasMore = providers.length > 6;

  return (
    <>
      <div className={`pt-2 ${className}`}>
        <p className="text-xs text-muted-foreground mb-3">Available on</p>
        
        {/* Main TMDB Badge */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="bg-[#0d253f] rounded-lg px-3 py-1.5 flex items-center gap-1">
            <span className="text-xs font-bold text-[#01b4e4]">THE</span>
            <span className="text-xs font-bold text-[#90cea1]">MOVIE</span>
            <span className="text-xs font-bold text-[#01b4e4]">DB</span>
          </div>

          {/* First 6 Providers */}
          {displayedProviders.map((provider) => (
            <motion.div
              key={provider.provider_id}
              whileHover={{ scale: 1.1 }}
              className="bg-white/10 backdrop-blur rounded-lg px-3 py-1.5 flex items-center gap-2 hover:bg-white/20 transition-all cursor-pointer"
              title={provider.provider_name}
            >
              {provider.logo_path && (
                <img
                  src={tmdbApi.getImageUrl(provider.logo_path, 'w200')}
                  alt={provider.provider_name}
                  className="h-6 w-6 object-contain rounded"
                  loading="lazy"
                />
              )}
              <span className="text-xs font-medium text-white/90 hidden sm:inline">
                {provider.provider_name}
              </span>
            </motion.div>
          ))}

          {/* "View More" Button */}
          {hasMore && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAll(true)}
              className="bg-primary/20 hover:bg-primary/30 border border-primary/50 rounded-lg px-3 py-1.5 flex items-center gap-1 transition-all"
            >
              <span className="text-xs font-medium text-primary">+{providers.length - 6}</span>
              <ChevronDown className="w-3.5 h-3.5 text-primary" />
            </motion.button>
          )}
        </div>
      </div>

      {/* Modal with All Providers */}
      <AnimatePresence>
        {showAll && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[999] bg-black/70 backdrop-blur-md"
              onClick={() => setShowAll(false)}
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
                className="pointer-events-auto w-full max-w-2xl bg-gradient-to-br from-slate-900/95 via-slate-950/95 to-black/95 border border-primary/40 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-primary/30 backdrop-blur-xl max-h-[90vh] overflow-y-auto"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                    All Streaming Networks
                  </h2>
                  <motion.button
                    onClick={() => setShowAll(false)}
                    whileHover={{ rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 hover:bg-white/10 rounded-lg transition-all"
                  >
                    <X className="w-5 h-5 text-white/70 hover:text-white" />
                  </motion.button>
                </div>

                {/* Divider */}
                <div className="h-px bg-gradient-to-r from-primary/20 via-primary/40 to-transparent mb-6" />

                {/* All Providers Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {providers.map((provider, index) => (
                    <motion.div
                      key={provider.provider_id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/50 rounded-lg p-4 flex flex-col items-center gap-3 transition-all hover:shadow-lg hover:shadow-primary/20"
                    >
                      {provider.logo_path ? (
                        <div className="h-12 w-12 flex items-center justify-center bg-white/5 rounded-lg">
                          <img
                            src={tmdbApi.getImageUrl(provider.logo_path, 'w200')}
                            alt={provider.provider_name}
                            className="h-10 w-10 object-contain"
                            loading="lazy"
                          />
                        </div>
                      ) : (
                        <div className="h-12 w-12 flex items-center justify-center bg-white/10 rounded-lg">
                          <span className="text-xs text-center font-medium text-white/70 px-1">
                            {provider.provider_name.substring(0, 3)}
                          </span>
                        </div>
                      )}
                      <span className="text-xs text-center font-medium text-white/90 line-clamp-2">
                        {provider.provider_name}
                      </span>
                    </motion.div>
                  ))}
                </div>

                {/* Footer */}
                <div className="flex gap-3 mt-8 pt-6 border-t border-white/10">
                  <Button
                    onClick={() => setShowAll(false)}
                    className="flex-1 bg-primary hover:bg-primary/90 text-white"
                  >
                    Close
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
