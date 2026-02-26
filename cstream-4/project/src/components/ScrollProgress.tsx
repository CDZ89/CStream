import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp } from 'lucide-react';

export const ScrollProgress = () => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);

  const handleScroll = useCallback(() => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    
    setScrollProgress(Math.min(progress, 100));
    setShowBackToTop(scrollTop > 300);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const circumference = 2 * Math.PI * 20;
  const strokeDashoffset = circumference - (scrollProgress / 100) * circumference;

  return (
    <AnimatePresence>
      {showBackToTop && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 flex items-center justify-center cursor-pointer group"
          aria-label="Retour en haut de la page"
        >
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 56 56">
            <circle
              cx="28"
              cy="28"
              r="20"
              fill="none"
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="3"
            />
            <motion.circle
              cx="28"
              cy="28"
              r="20"
              fill="none"
              stroke="url(#scrollProgressGradient)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: 'stroke-dashoffset 0.15s ease-out' }}
            />
            <defs>
              <linearGradient id="scrollProgressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(var(--primary))" />
                <stop offset="100%" stopColor="hsl(var(--accent))" />
              </linearGradient>
            </defs>
          </svg>
          
          <div className="relative z-10 w-10 h-10 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/10 shadow-xl shadow-black/30 flex items-center justify-center group-hover:from-primary/20 group-hover:to-accent/20 group-hover:border-primary/30 transition-all duration-300">
            <ChevronUp className="w-5 h-5 text-white/80 group-hover:text-white transition-colors" />
          </div>
        </motion.button>
      )}
    </AnimatePresence>
  );
};

export default ScrollProgress;
