import { useState } from 'react';
import { THEMES, getAvailableThemes, isThemeSpecial } from '@/lib/themes';
import { useUserSettings } from '@/hooks/useUserSettings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Crown, Zap, Users } from 'lucide-react';

interface SpecialThemesPanelProps {
  isAdmin: boolean;
  isCreator: boolean;
  onThemeSelect: (themeId: string) => void;
  selectedTheme: string;
}

export const SpecialThemesPanel = ({
  isAdmin,
  isCreator,
  onThemeSelect,
  selectedTheme,
}: SpecialThemesPanelProps) => {
  const { settings, setTheme } = useUserSettings();
  const [applyToAll, setApplyToAll] = useState(false);
  const [loading, setLoading] = useState(false);

  const availableSpecialThemes = getAvailableThemes(isAdmin, isCreator).filter(t => isThemeSpecial(t.id));

  if (availableSpecialThemes.length === 0) {
    return null;
  }

  const handleSpecialThemeSelect = async (themeId: string) => {
    setLoading(true);
    try {
      setTheme(themeId);
      onThemeSelect(themeId);

      if (applyToAll && isAdmin) {
        // Send request to apply theme to all users
        await fetch('/api/admin/apply-theme-all', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ themeId }),
        });
        toast.success(`Thème ${THEMES.find(t => t.id === themeId)?.name} appliqué à tous`);
      } else {
        toast.success('Thème appliqué');
      }
    } catch (error) {
      console.error('Error applying theme:', error);
      toast.error('Erreur lors de l\'application du thème');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isAdmin ? <Crown className="w-5 h-5 text-yellow-400" /> : <Zap className="w-5 h-5 text-blue-400" />}
            Thèmes Spéciaux {isAdmin ? 'Admin' : 'Créateur'}
          </CardTitle>
          <CardDescription>
            {isAdmin
              ? 'Thèmes exclusifs réservés aux administrateurs. Appliquez-les à vous-même ou à tous les utilisateurs.'
              : 'Thèmes exclusifs réservés aux créateurs.'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Admin only: Apply to all users option */}
          {isAdmin && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-yellow-400" />
                <Label className="text-sm font-medium cursor-pointer">Appliquer à tous les utilisateurs</Label>
              </div>
              <Switch checked={applyToAll} onCheckedChange={setApplyToAll} disabled={loading} />
            </div>
          )}

          {/* Special Themes Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {availableSpecialThemes.map(theme => (
              <motion.button
                key={theme.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSpecialThemeSelect(theme.id)}
                disabled={loading}
                className={`relative p-3 rounded-lg border-2 transition-all ${
                  selectedTheme === theme.id
                    ? 'border-primary bg-primary/10 ring-2 ring-primary'
                    : 'border-white/20 hover:border-white/40 bg-white/5'
                }`}
              >
                <div
                  className="w-full h-16 rounded mb-2"
                  style={{
                    background: theme.colors
                      ? `linear-gradient(135deg, ${theme.colors[0]} 0%, ${theme.colors[1]} 100%)`
                      : '#666',
                  }}
                />
                <div className="text-xs font-medium text-left truncate">{theme.label}</div>
                <div className="text-xs text-muted-foreground text-left mt-0.5">{theme.description}</div>
              </motion.button>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
