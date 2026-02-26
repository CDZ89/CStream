import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, Info } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

export const CloudHint = () => {
  const [isVisible, setIsVisible] = React.useState(true);
  const { language } = useI18n();

  if (!isVisible) return null;

  const content = {
    fr: {
      title: "Expérience sans Publicité",
      desc: "Pour un confort maximal, nous vous conseillons d'utiliser Brave ou une extension AdBlock. Cela bloque les fenêtres intrusives des lecteurs externes."
    },
    en: {
      title: "Ad-Free Experience",
      desc: "For maximum comfort, we recommend using Brave or an AdBlock extension. This blocks intrusive pop-ups from external players."
    }
  };

  const text = content[language as keyof typeof content] || content.en;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full mb-6"
      >
        <div className="relative overflow-hidden rounded-2xl border border-purple-500/20 bg-purple-500/5 backdrop-blur-xl p-4 sm:p-5 shadow-lg shadow-purple-500/5">
          <div className="flex items-start gap-4 relative z-10">
            <div className="hidden sm:flex p-2.5 bg-purple-500/20 rounded-xl border border-purple-500/30 shrink-0">
              <ShieldCheck className="w-5 h-5 text-purple-400" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Info className="w-4 h-4 text-purple-400 sm:hidden" />
                <h4 className="text-sm font-bold text-white tracking-wide uppercase">
                  {text.title}
                </h4>
              </div>
              <p className="text-xs sm:text-sm text-purple-100/70 leading-relaxed">
                {text.desc}
              </p>
            </div>

            <button
              onClick={() => setIsVisible(false)}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-purple-300/50 hover:text-white shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          {/* Decorative gradients */}
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-4 -top-4 w-16 h-16 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CloudHint;
