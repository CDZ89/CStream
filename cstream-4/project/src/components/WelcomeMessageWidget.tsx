import { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Bonjour';
  if (hour >= 12 && hour < 18) return 'Bon après-midi';
  if (hour >= 18 && hour < 22) return 'Bonsoir';
  return 'Bonne nuit';
};

export const WelcomeMessageWidget = memo(() => {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="py-3 sm:py-4 relative z-20"
        >
          <div className="container mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between gap-3 p-3 sm:p-4 rounded-lg bg-gradient-to-r from-red-500/8 via-green-500/5 to-red-500/8 border border-red-500/15 backdrop-blur-sm">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm sm:text-base font-semibold text-white">
                  {getGreeting()} {user?.email?.split('@')[0]} 🎄
                </h3>
                <p className="text-xs sm:text-sm text-gray-300 truncate">
                  Explorez des milliers de films et séries en streaming
                </p>
              </div>
              <button
                onClick={() => setIsVisible(false)}
                className="flex-shrink-0 p-1 hover:bg-white/10 rounded transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

WelcomeMessageWidget.displayName = 'WelcomeMessageWidget';
