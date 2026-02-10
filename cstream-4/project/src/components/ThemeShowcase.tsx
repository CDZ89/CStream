import { useTheme } from '@/hooks/useTheme';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

export const ThemeShowcase = () => {
  const { currentTheme, availableThemes, setTheme } = useTheme();
  
  // Get top 5 themes
  const topThemes = availableThemes.slice(0, 6);

  return (
    <div className="w-full bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <span className="text-primary">🎨</span> Choisir un thème
      </h3>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {topThemes.map((theme) => {
          const isActive = currentTheme?.id === theme.id;
          
          return (
            <motion.button
              key={theme.id}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setTheme(theme)}
              className={`relative group p-3 rounded-lg border-2 transition-all h-24 flex flex-col items-center justify-center ${
                isActive
                  ? 'border-primary bg-primary/20 shadow-lg shadow-primary/30'
                  : 'border-white/10 hover:border-white/30 bg-white/5 hover:bg-white/10'
              }`}
            >
              {/* Primary color preview */}
              <div className="flex gap-1 mb-2">
                <div
                  className="w-5 h-5 rounded-full border border-white/30 shadow-lg"
                  style={{ backgroundColor: theme.colors.primary }}
                />
              </div>
              
              {/* Theme name */}
              <span className="text-xs font-medium text-center leading-tight line-clamp-2">
                {theme.name}
              </span>
              
              {/* Active indicator */}
              {isActive && (
                <div className="absolute top-1 right-1 bg-primary rounded-full p-1">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
      
      {/* Gradient preview */}
      <div className="mt-4 p-4 rounded-lg border border-white/10 bg-white/5">
        <p className="text-xs text-white/60 mb-2">Aperçu du gradient:</p>
        <div
          className="h-16 rounded-lg border border-white/20"
          style={{
            backgroundImage: `linear-gradient(135deg, ${currentTheme?.colors.primary}40 0%, ${currentTheme?.colors.background} 100%)`
          }}
        />
      </div>
    </div>
  );
};
