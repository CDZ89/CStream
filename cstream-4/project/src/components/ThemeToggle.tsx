import { Moon, Sun } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useThemeMode } from "@/hooks/useThemeMode";

export const ThemeToggle = () => {
  const { mode, isMounted, toggleMode } = useThemeMode();

  if (!isMounted) return null;

  const isDark = mode === 'dark';

  return (
    <motion.button
      onClick={toggleMode}
      whileHover={{ scale: 1.1, rotate: 5 }}
      whileTap={{ scale: 0.9 }}
      className="relative w-9 h-9 rounded-lg bg-gradient-to-br from-white/10 to-white/5 hover:from-white/15 hover:to-white/10 dark:bg-gradient-to-br dark:from-white/8 dark:to-white/4 dark:hover:from-white/12 dark:hover:to-white/8 border-2 border-white/20 hover:border-white/40 dark:border-white/15 dark:hover:border-white/30 flex items-center justify-center transition-all duration-300 group shadow-lg shadow-black/20 dark:shadow-lg dark:shadow-amber-500/10"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Mode clair" : "Mode sombre"}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={isDark ? "moon" : "sun"}
          initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.2 }}
          className="flex items-center justify-center"
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-amber-400 drop-shadow-lg" />
          ) : (
            <Moon className="w-4 h-4 text-blue-400 drop-shadow-lg" />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Subtle glow on hover */}
      <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        {isDark ? (
          <div className="absolute inset-0 rounded-lg bg-amber-400/10 blur-md" />
        ) : (
          <div className="absolute inset-0 rounded-lg bg-blue-400/10 blur-md" />
        )}
      </div>
    </motion.button>
  );
};
