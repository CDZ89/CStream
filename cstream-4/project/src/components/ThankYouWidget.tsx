import { useState, useEffect, memo } from 'react';
import { motion } from 'framer-motion';
import { Share2, Copy, Check, Heart, Users, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export const ThankYouWidget = memo(() => {
  const [shareCount, setShareCount] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('cstream-share-count');
    if (saved) setShareCount(parseInt(saved, 10));
  }, []);

  const incrementShareCount = () => {
    const newCount = shareCount + 1;
    setShareCount(newCount);
    localStorage.setItem('cstream-share-count', newCount.toString());
  };

  const shareURL = window.location.origin;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareURL);
    setCopied(true);
    incrementShareCount();
    toast.success('Lien copié! Merci de partager CStream 🚀');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = (platform: string) => {
    incrementShareCount();
    const message = 'Découvrez CStream - Le meilleur streaming gratuit! 🎬';
    const encodedURL = encodeURIComponent(shareURL);
    const encodedMessage = encodeURIComponent(message);

    const links: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${encodedMessage}&url=${encodedURL}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedURL}`,
      whatsapp: `https://wa.me/?text=${encodedMessage}%20${encodedURL}`,
      telegram: `https://t.me/share/url?url=${encodedURL}&text=${encodedMessage}`,
      reddit: `https://reddit.com/submit?url=${encodedURL}&title=${encodedMessage}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedURL}`,
    };

    if (links[platform]) {
      window.open(links[platform], '_blank', 'width=600,height=400');
      toast.success(`Partagé sur ${platform}! 🎉`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="py-12 relative z-20"
    >
      <div className="container mx-auto px-4 sm:px-6">
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 via-purple-500/10 to-pink-500/20 rounded-2xl blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-500" />
          
          <div className="relative p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-slate-900/80 via-slate-800/60 to-slate-900/80 border border-violet-500/20 hover:border-violet-500/40 backdrop-blur-xl shadow-2xl shadow-violet-500/10 hover:shadow-violet-500/20 transition-all duration-500 overflow-hidden">
            {/* Animated background */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-violet-500/0 via-violet-500/5 to-violet-500/0"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            />

            <div className="relative">
              {/* Header */}
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                  className="inline-block mb-4"
                >
                  <Heart className="w-12 h-12 text-red-400 fill-red-400" />
                </motion.div>
                <motion.h2
                  initial={{ opacity: 0, y: -10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-white via-violet-200 to-white bg-clip-text text-transparent mb-2"
                >
                  Merci de partager CStream !
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-gray-300 text-lg"
                >
                  Chaque partage aide notre communauté à grandir 🌟
                </motion.p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="p-4 rounded-lg bg-violet-500/10 border border-violet-500/20"
                >
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-violet-400" />
                    <div>
                      <p className="text-xs text-gray-400">Communauté</p>
                      <p className="text-xl font-bold text-white">2.5M+</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                  className="p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/20"
                >
                  <div className="flex items-center gap-3">
                    <Zap className="w-5 h-5 text-cyan-400" />
                    <div>
                      <p className="text-xs text-gray-400">Votre partage</p>
                      <p className="text-xl font-bold text-white">{shareCount}</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                  className="p-4 rounded-lg bg-pink-500/10 border border-pink-500/20"
                >
                  <div className="flex items-center gap-3">
                    <Share2 className="w-5 h-5 text-pink-400" />
                    <div>
                      <p className="text-xs text-gray-400">Total partagés</p>
                      <p className="text-xl font-bold text-white">{(shareCount * 1000).toLocaleString('fr-FR')}+</p>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {/* Copy Link Button */}
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <Button
                    onClick={handleCopyLink}
                    className="gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white border-0 shadow-lg shadow-cyan-500/30 font-semibold w-full sm:w-auto"
                    size="lg"
                  >
                    {copied ? (
                      <>
                        <Check className="w-5 h-5" />
                        Lien copié!
                      </>
                    ) : (
                      <>
                        <Copy className="w-5 h-5" />
                        Copier le lien
                      </>
                    )}
                  </Button>
                </motion.div>

                {/* Share Platforms */}
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        className="gap-2 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white border-0 shadow-lg shadow-violet-500/30 font-semibold w-full sm:w-auto"
                        size="lg"
                      >
                        <Share2 className="w-5 h-5" />
                        Partager partout
                      </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                      align="end"
                      className="w-56 bg-slate-900/95 border-violet-500/30 backdrop-blur-xl shadow-2xl shadow-violet-500/20"
                    >
                      <div className="p-3 text-sm text-gray-400 font-medium">Choisir une plateforme</div>
                      <DropdownMenuSeparator className="bg-violet-500/20" />
                      
                      {[
                        { id: 'twitter', label: '𝕏 Twitter', color: 'text-blue-400' },
                        { id: 'facebook', label: 'Facebook', color: 'text-blue-600' },
                        { id: 'whatsapp', label: 'WhatsApp', color: 'text-green-500' },
                        { id: 'telegram', label: 'Telegram', color: 'text-blue-500' },
                        { id: 'reddit', label: 'Reddit', color: 'text-orange-500' },
                        { id: 'linkedin', label: 'LinkedIn', color: 'text-blue-700' },
                      ].map((platform) => (
                        <DropdownMenuItem
                          key={platform.id}
                          onClick={() => handleShare(platform.id)}
                          className="flex items-center gap-2 cursor-pointer hover:bg-white/5"
                        >
                          <span className={`font-bold ${platform.color}`}>📱</span>
                          <span className="text-white">{platform.label}</span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

ThankYouWidget.displayName = 'ThankYouWidget';
