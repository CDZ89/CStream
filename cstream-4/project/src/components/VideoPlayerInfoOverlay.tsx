import { useState, lazy, Suspense, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, X } from 'lucide-react';

interface VideoPlayerInfoOverlayProps {
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  playerType?: 'vidking' | 'vidfast' | 'videasy';
  season?: number;
  episode?: number;
  title?: string;
}

const InfoContent = memo(() => (
  <>
    {/* Header */}
    <div className="flex items-start justify-between mb-4">
      <div>
        <h3 className="text-lg font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
          CStream v3.7
        </h3>
        <p className="text-xs text-white/60 mt-1">Guide Utilisateur</p>
      </div>
    </div>

    {/* Divider */}
    <div className="h-px bg-gradient-to-r from-primary/40 to-transparent mb-4" />

    {/* Content */}
    <div className="space-y-6 text-white">
      {/* Android Section */}
      <div className="relative bg-white/5 backdrop-blur-xl border border-white/20 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-cyan-400/10 opacity-50 rounded-xl"></div>
        <div className="relative flex items-center gap-3 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-help w-6 h-6 text-blue-400">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
            <path d="M12 17h.01"></path>
          </svg>
          <h2 className="text-xl font-semibold text-white">Android (Samsung, Redmi, etc.)</h2>
        </div>
        <p className="text-gray-300 text-sm mb-4">Sur Android (Google Chrome uniquement) :</p>
        <ol className="list-decimal list-inside space-y-2 text-gray-200 text-sm">
          <li>Ouvre Google Chrome</li>
          <li>Va dans les Paramètres (3 points en haut à droite)</li>
          <li>Appuie sur <strong>Confidentialité et sécurité</strong></li>
          <li>Va dans <strong>Utiliser des DNS sécurisés</strong></li>
          <li>Active l'option, puis choisis : <strong>Google (Public DNS)</strong></li>
        </ol>
        <p className="mt-4 text-gray-300 text-sm"><strong>Note :</strong> Cela fonctionne uniquement pour Chrome. Pour changer le DNS de tout le téléphone, modifiez les paramètres Wi-Fi de votre appareil.</p>
      </div>

      {/* iOS Section */}
      <div className="relative bg-white/5 backdrop-blur-xl border border-white/20 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-400/10 to-pink-400/10 opacity-50 rounded-xl"></div>
        <div className="relative flex items-center gap-3 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-help w-6 h-6 text-purple-400">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
            <path d="M12 17h.01"></path>
          </svg>
          <h2 className="text-xl font-semibold text-white">iPhone, iPad & Mac</h2>
        </div>
        <p className="text-gray-300 text-sm mb-4">Sur iOS/iPadOS :</p>
        <ol className="list-decimal list-inside space-y-2 text-gray-200 text-sm">
          <li>Ouvre Réglages</li>
          <li>Appuie sur WiFi</li>
          <li>Appuie sur le <strong>ⓘ</strong> à côté du réseau WiFi</li>
          <li>Va dans <strong>Configurer les DNS</strong></li>
          <li>Choisis <strong>Manuel</strong> et ajoute : <strong>8.8.8.8</strong></li>
        </ol>
      </div>

      {/* Desktop Section */}
      <div className="relative bg-white/5 backdrop-blur-xl border border-white/20 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-r from-green-400/10 to-teal-400/10 opacity-50 rounded-xl"></div>
        <div className="relative flex items-center gap-3 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-help w-6 h-6 text-green-400">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
            <path d="M12 17h.01"></path>
          </svg>
          <h2 className="text-xl font-semibold text-white">Ordinateur (Windows, Mac, Linux)</h2>
        </div>
        <p className="text-gray-300 text-sm mb-4">Configuration DNS système :</p>
        <ol className="list-decimal list-inside space-y-2 text-gray-200 text-sm">
          <li><strong>Windows:</strong> Paramètres → Réseau → Paramètres avancés → DNS → Éditer</li>
          <li><strong>Mac:</strong> Préférences Système → Réseau → WiFi → Avancé → DNS</li>
          <li><strong>Linux:</strong> Éditer /etc/resolv.conf</li>
          <li>Remplacez par : <strong>8.8.8.8</strong> et <strong>8.8.4.4</strong></li>
        </ol>
      </div>

      {/* Tips */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
        <p className="text-amber-200 text-sm"><strong>💡 Conseil:</strong> Si vous avez toujours des problèmes, videz le cache de votre navigateur ou utilisez un VPN.</p>
      </div>

      {/* Brand */}
      <div className="bg-gradient-to-r from-primary/20 to-transparent rounded-lg p-3 border border-primary/30 mt-4">
        <p className="text-xs text-white/80">
          <span className="font-semibold">CStream v3.7</span> • Streaming premium
        </p>
      </div>
    </div>
  </>
));

InfoContent.displayName = 'InfoContent';

export const VideoPlayerInfoOverlay = ({
  tmdbId,
  mediaType,
  playerType = 'vidking',
  season,
  episode,
  title = 'Content',
}: VideoPlayerInfoOverlayProps) => {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <>
      {/* Info Button - Fixed overlay top-right */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        onClick={() => setShowInfo(true)}
        className="absolute top-4 right-4 z-40 flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-primary/40 to-purple-600/30 hover:from-primary/60 hover:to-purple-600/50 border border-primary/60 backdrop-blur-xl text-white font-semibold transition-all text-xs sm:text-sm shadow-lg hover:shadow-xl hover:scale-110"
        title="Infos Lecteur"
      >
        <Info className="w-4 h-4" />
        <span className="hidden sm:inline">Infos</span>
      </motion.button>

      {/* Info Overlay Panel - Lazy loaded content */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="absolute top-16 right-4 z-50 w-96 max-h-[600px] overflow-y-auto bg-white/5 backdrop-blur-xl border border-white/20 rounded-xl p-6 shadow-2xl shadow-primary/20 scrollbar-hide"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                  CStream v3.7
                </h3>
                <p className="text-xs text-white/60 mt-1">Guide Utilisateur</p>
              </div>
              <button
                onClick={() => setShowInfo(false)}
                className="p-1 hover:bg-white/10 rounded-lg transition-all"
              >
                <X className="w-5 h-5 text-white/70" />
              </button>
            </div>

            <Suspense fallback={<div className="text-white/50 text-sm">Chargement...</div>}>
              <InfoContent />
            </Suspense>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
