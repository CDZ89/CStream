import { useState } from 'react';
import { useTheme, Theme } from '@/hooks/useTheme';
import { Palette, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface ThemeSelectorProps {
  adminMode?: boolean;
}

export const ThemeSelector = ({ adminMode = false }: ThemeSelectorProps) => {
  const { currentTheme, availableThemes, setTheme, getActiveSpecialTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const activeSpecial = getActiveSpecialTheme();

  const handleThemeChange = (theme: Theme) => {
    try {
      setTheme(theme);
      setIsOpen(false);
      toast.success(`Thème changé vers ${theme.name}`, {
        duration: 2000,
      });
    } catch (error) {
      console.error('Theme change error:', error);
      toast.error('Erreur lors du changement de thème');
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-2"
        title="Changer de thème"
      >
        <Palette className="w-4 h-4" />
        <span className="hidden sm:inline text-xs">Thème</span>
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Sélectionner un thème</DialogTitle>
            <DialogDescription>
              {activeSpecial && (
                <span className="text-amber-400 font-medium">✨ Thème spécial activé: {activeSpecial.name}</span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-96 overflow-y-auto py-4">
            {availableThemes.map((theme) => {
              const isActive = currentTheme?.id === theme.id;
              const isSpecialActive = activeSpecial?.id === theme.id;

              return (
                <motion.button
                  key={theme.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleThemeChange(theme)}
                  className={`relative p-3 rounded-lg border-2 transition-all ${
                    isActive
                      ? 'border-primary bg-primary/10'
                      : 'border-white/10 hover:border-white/30 bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div
                        className="w-6 h-6 rounded-full border border-white/40 shadow-inner"
                        style={{ backgroundColor: theme.colors.primary }}
                      />
                      <div
                        className="w-6 h-6 rounded-full border border-white/40 shadow-inner"
                        style={{ backgroundColor: theme.colors.background }}
                      />
                    </div>
                    <span className="text-xs font-bold text-left flex-1 text-white drop-shadow-md">{theme.name}</span>
                  </div>
                  {isActive && <Check className="w-4 h-4 text-primary absolute top-2 right-2" style={{ stroke: 'var(--svg-stroke)' }} />}
                  {isSpecialActive && <span className="absolute top-1 left-1 text-xs">✨</span>}
                </motion.button>
              );
            })}
          </div>

          {adminMode && (
            <div className="text-xs text-gray-400 pt-2 border-t border-white/10">
              Thèmes spéciaux disponibles pour admin uniquement
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
