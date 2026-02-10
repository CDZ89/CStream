import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export const TopLoadingBar = () => {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      if (progressRef.current) clearInterval(progressRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isMountedRef.current) return;
    
    setIsLoading(true);
    setProgress(0);

    if (progressRef.current) clearInterval(progressRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    progressRef.current = setInterval(() => {
      if (!isMountedRef.current) return;
      setProgress(prev => {
        if (prev >= 90) return prev;
        const increment = Math.random() * 15 + 5;
        return Math.min(prev + increment, 90);
      });
    }, 100);

    timeoutRef.current = setTimeout(() => {
      if (progressRef.current) clearInterval(progressRef.current);
      if (!isMountedRef.current) return;
      setProgress(100);
      setTimeout(() => {
        if (!isMountedRef.current) return;
        setIsLoading(false);
        setProgress(0);
      }, 200);
    }, 400);

    return () => {
      if (progressRef.current) clearInterval(progressRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [location.pathname]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1 }}
          className="fixed top-0 left-0 right-0 z-[9999] h-1 bg-transparent"
        >
          <motion.div
            className="h-full bg-gradient-to-r from-purple-600 via-purple-500 to-purple-600 relative"
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.08, ease: 'easeOut' }}
          >
            <div className="absolute right-0 top-0 w-20 h-full bg-gradient-to-r from-transparent to-white/50 blur-sm" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
