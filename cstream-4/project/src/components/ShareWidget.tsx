import { memo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Share2,
  Copy,
  Heart,
  Check,
  Sparkles,
  Coffee,
  ExternalLink,
  Globe,
  Users,
  Gift,
} from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";

interface ShareWidgetProps {
  title: string;
  type: "movie" | "tv";
  id: number;
}

export const ShareWidget = memo(({ title, type, id }: ShareWidgetProps) => {
  const { t, language } = useI18n();
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState(false);
  const [shareCount, setShareCount] = useState(0);
  const [donationCount, setDonationCount] = useState(0);
  const [isHovering, setIsHovering] = useState<string | null>(null);

  const url = `${window.location.origin}/${type}/${id}`;
  const storageKey = `share_data_${type}_${id}`;

  // Load counts from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const data = JSON.parse(stored);
      setShareCount(data.shares || 0);
      setDonationCount(data.donations || 0);
    }
  }, [storageKey]);

  const updateCounts = (newShares?: number, newDonations?: number) => {
    const stored = localStorage.getItem(storageKey) || '{"shares":0,"donations":0}';
    const data = JSON.parse(stored);
    if (newShares !== undefined) data.shares = newShares;
    if (newDonations !== undefined) data.donations = newDonations;
    localStorage.setItem(storageKey, JSON.stringify(data));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success(t("share.thankYou"));
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const newCount = shareCount + 1;
    setShareCount(newCount);
    updateCounts(newCount, donationCount);

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${title} - CStream`,
          text: `Check out ${title} on CStream`,
          url: url,
        });
        toast.success(t("share.thankYou"));
      } catch (err) {
        console.log("Share cancelled");
      }
    } else {
      handleCopy();
      toast.success(t("share.thankYou"));
    }
  };

  const handleLike = () => {
    setLiked(!liked);
    if (!liked) {
      toast.success(t("share.thankYou"));
    }
  };

  const handleDirectPayPal = () => {
    const newCount = donationCount + 1;
    setDonationCount(newCount);
    updateCounts(shareCount, newCount);
    window.open("https://paypal.me/CDZ68", "_blank");
    toast.success(t("share.thankYou"));
  };

  const handleDirectKoFi = () => {
    const newCount = donationCount + 1;
    setDonationCount(newCount);
    updateCounts(shareCount, newCount);
    window.open("https://ko-fi.com/cstream", "_blank");
    toast.success(t("share.thankYou"));
  };

  const handleSharePayPal = async () => {
    const payPalUrl = "https://paypal.me/CDZ68";
    const newCount = shareCount + 1;
    setShareCount(newCount);
    updateCounts(newCount, donationCount);

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Support CStream`,
          text: `Help CStream stay free and ad-free!`,
          url: payPalUrl,
        });
        toast.success(t("share.thankYou"));
      } catch (err) {
        console.log("Share PayPal cancelled");
      }
    } else {
      navigator.clipboard.writeText(payPalUrl);
      toast.success(t("share.thankYou"));
    }
  };

  const handleJoinDiscord = () => {
    window.open("https://discord.gg/YSkhZubt3y", "_blank");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-4xl mx-auto py-8"
    >
      <div className="relative group/card">
        <div className="relative bg-zinc-900/40 backdrop-blur-3xl rounded-3xl p-8 border border-white/5 shadow-2xl overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-xl border border-primary/20">
                  <Share2 className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight">Partager & Soutenir</h3>
                  <p className="text-[10px] text-white/30 font-black uppercase tracking-widest">Premium Experience</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleShare}
                  className="h-12 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl flex items-center justify-center gap-2 border border-white/10 transition-all text-xs"
                >
                  <Share2 className="w-4 h-4 text-primary" />
                  Partager
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCopy}
                  className="h-12 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl flex items-center justify-center gap-2 border border-white/10 transition-all text-xs"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-accent" />}
                  {copied ? "Copié" : "Copier"}
                </motion.button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDirectPayPal}
                  className="h-12 bg-amber-500/10 hover:bg-amber-500/20 text-white font-bold rounded-xl flex items-center justify-center gap-2 border border-amber-500/20 transition-all text-xs"
                >
                  <Coffee className="w-4 h-4 text-amber-400" />
                  PayPal
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDirectKoFi}
                  className="h-12 bg-red-500/10 hover:bg-red-500/20 text-white font-bold rounded-xl flex items-center justify-center gap-2 border border-red-500/20 transition-all text-xs"
                >
                  <Heart className="w-4 h-4 text-red-400" />
                  Ko-Fi
                </motion.button>
              </div>
            </div>

            <div className="space-y-6 border-l border-white/5 pl-8 md:block hidden flex items-center justify-center">
              <div className="text-center space-y-4">
                 <Sparkles className="w-12 h-12 text-primary mx-auto opacity-20" />
                 <p className="text-zinc-500 text-sm italic">Soutenez CStream pour plus de fonctionnalités.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

ShareWidget.displayName = "ShareWidget";
