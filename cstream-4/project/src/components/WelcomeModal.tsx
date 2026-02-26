import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Share2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const WelcomeModal = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Afficher modal seulement si l'utilisateur n'a jamais visité
    const hasVisited = localStorage.getItem('cstream-visited');
    if (!hasVisited) {
      setIsOpen(true);
      localStorage.setItem('cstream-visited', 'true');
    }
  }, []);

  const handleClose = () => setIsOpen(false);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop avec blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-md z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="relative w-full max-w-md bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 border border-purple-500/30 rounded-2xl overflow-hidden shadow-2xl">
              {/* Décoration de fond */}
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 opacity-30" />
              
              {/* Contenu */}
              <div className="relative p-8 space-y-6">
                {/* Bouton fermer */}
                <button
                  onClick={handleClose}
                  className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-white/60 hover:text-white" />
                </button>

                {/* Icône */}
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center"
                >
                  <Sparkles className="w-8 h-8 text-white" />
                </motion.div>

                {/* Titre */}
                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-bold text-white">
                    Bienvenue sur <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">CStream</span>
                  </h2>
                  <p className="text-sm text-white/70">
                    La meilleure plateforme de streaming gratuit pour films, séries et animes
                  </p>
                </div>

                {/* Fonctionnalités */}
                <div className="space-y-3 pt-4">
                  {[
                    { icon: '🎬', text: '+350K films et séries' },
                    { icon: '⚡', text: 'Streaming haute qualité' },
                    { icon: '🌍', text: 'Contenu VOSTFR & VF' },
                    { icon: '📱', text: 'Accès mobile & desktop' },
                  ].map((feature, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * i }}
                      className="flex items-center gap-3 text-sm text-white/80"
                    >
                      <span className="text-xl">{feature.icon}</span>
                      <span>{feature.text}</span>
                    </motion.div>
                  ))}
                </div>

                {/* Boutons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleClose}
                    className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-semibold rounded-lg transition-all"
                  >
                    Commencer
                  </Button>
                  <Button
                    onClick={() => {
                      const url = window.location.href;
                      navigator.share?.({
                        title: 'CStream',
                        text: 'Découvrez CStream - Le meilleur streaming gratuit!',
                        url,
                      }) || navigator.clipboard.writeText(url);
                      handleClose();
                    }}
                    variant="outline"
                    className="flex-1 border-purple-500/30 text-white hover:bg-white/10 rounded-lg gap-2"
                  >
                    <Share2 className="w-4 h-4" />
                    Partager
                  </Button>
                </div>

                {/* Call to action */}
                <p className="text-xs text-center text-white/50 pt-2">
                  Profitez d'un contenu illimité sans abonnement
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
