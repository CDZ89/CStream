import { memo } from 'react';
import { motion } from 'framer-motion';
import { Share2, Copy, Heart, Gift } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

interface ShareWidgetChristmasProps {
  title: string;
  type: 'movie' | 'tv';
  id: number;
}

export const ShareWidgetChristmas = memo(({ title, type, id }: ShareWidgetChristmasProps) => {
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}/${type}/${id}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('🎄 Lien copié! Partage-le avec tes amis! 🎄');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `🎄 ${title} - CineBolt ⚡`,
          text: `Regarde ${title} sur CineBolt! 🎬🎄`,
          url: url,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      handleCopy();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative w-full"
    >
      <div className="relative group">
        {/* Background glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-red-600 via-green-600 to-red-600 rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-all duration-500 animate-pulse" />

        {/* Main card */}
        <div className="relative bg-gradient-to-br from-black/90 to-red-950/40 border-2 border-white/20 rounded-2xl p-6 backdrop-blur-xl hover:border-red-500/50 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Gift className="w-6 h-6 text-red-400 animate-bounce" />
              <h3 className="text-lg font-bold bg-gradient-to-r from-red-400 to-green-400 bg-clip-text text-transparent">
                Partage la Magie 🎄
              </h3>
            </div>
          </div>

          <p className="text-sm text-white/70 mb-4">
            Invite tes amis à découvrir {title} sur CineBolt!
          </p>

          <div className="space-y-3">
            {/* Share Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleShare}
              className="w-full py-3 px-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-red-500/50"
            >
              <Share2 className="w-4 h-4" />
              Partager
            </motion.button>

            {/* Copy Link Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCopy}
              className="w-full py-3 px-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-green-500/50"
            >
              <Copy className="w-4 h-4" />
              {copied ? 'Copié! ✅' : 'Copier le lien'}
            </motion.button>

            {/* Like Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full py-3 px-4 bg-gradient-to-r from-pink-600 to-pink-700 hover:from-pink-700 hover:to-pink-800 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-pink-500/50"
            >
              <Heart className="w-4 h-4" />
              J'aime cette magie! ❤️
            </motion.button>
          </div>

          {/* Festive message */}
          <motion.p
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-center text-xs text-white/50 mt-4 font-medium"
          >
            ✨ Partage la magie du streaming ⚡🎄
          </motion.p>
        </div>
      </div>
    </motion.div>
  );
});

ShareWidgetChristmas.displayName = 'ShareWidgetChristmas';
export default ShareWidgetChristmas;
