import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import { Sparkles, Zap } from 'lucide-react';
import { BackgroundBeams } from '@/components/ui/background-beams';
import { Vortex } from '@/components/ui/vortex';
import { BackgroundBeamsWithCollision } from '@/components/ui/background-beams-with-collision';
import { useUserSettings } from '@/hooks/useUserSettings';
import { toast } from 'sonner';

const themeOptions = [
  {
    id: 'sparkles-default',
    name: '✨ Sparkles',
    description: 'Particules brillantes qui dansent',
    preview: 'sparkles',
    speed: 'default',
  },
  {
    id: 'beams-default',
    name: '🌟 Background Beams',
    description: 'Rayons lumineux animés',
    preview: 'beams',
    speed: 'default',
  },
  {
    id: 'vortex-default',
    name: '🌀 Vortex',
    description: 'Effet tourbillon immersif',
    preview: 'vortex',
    speed: 'default',
  },
  {
    id: 'collision-default',
    name: '💫 Collision Beams',
    description: 'Rayons en collision',
    preview: 'collision',
    speed: 'default',
  },
];

const speedOptions = [
  { id: 'very-slow', label: 'Très lent' },
  { id: 'slow', label: 'Lent' },
  { id: 'default', label: 'Normal' },
  { id: 'fast', label: 'Rapide' },
  { id: 'very-fast', label: 'Très rapide' },
];

interface BetaThemesSectionProps {
  onThemeSelect?: (themeId: string) => void;
}

export function BetaThemesSection({ onThemeSelect }: BetaThemesSectionProps = {}) {
  const [selectedSpeed, setSelectedSpeed] = useState('default');
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);

  const handleThemeSelect = (themeId: string) => {
    setSelectedTheme(themeId);
    onThemeSelect?.(themeId);
    toast.success('Thème Beta sélectionné!');
  };

  const handleSpeedChange = (speed: string) => {
    setSelectedSpeed(speed);
    toast.success(`Vitesse définie: ${speedOptions.find(s => s.id === speed)?.label}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <Card className="border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            Thèmes Beta Exclusifs
          </CardTitle>
          <CardDescription>Prévisualisez et sélectionnez les thèmes expérimentaux</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Speed Control */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <label className="text-sm font-medium flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-yellow-400" />
              Vitesse d'animation
            </label>
            <Select value={selectedSpeed} onValueChange={handleSpeedChange}>
              <SelectTrigger className="bg-white/10 border-white/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-black border-white/20">
                {speedOptions.map(option => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Themes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {themeOptions.map((theme, index) => (
              <motion.div
                key={theme.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="relative group"
              >
                {/* Preview Container */}
                <div className="relative h-48 rounded-xl overflow-hidden bg-black border border-white/10 group-hover:border-purple-500/50 transition-all duration-300 mb-3">
                  {theme.preview === 'sparkles' && (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center">
                        <Sparkles className="w-8 h-8 text-purple-400 mx-auto mb-2 animate-pulse" />
                        <p className="text-xs text-gray-400">{theme.description}</p>
                      </div>
                    </div>
                  )}
                  {theme.preview === 'beams' && (
                    <BackgroundBeams className="opacity-60" />
                  )}
                  {theme.preview === 'vortex' && (
                    <Vortex containerClassName="absolute inset-0">
                      <div className="text-center">
                        <p className="text-xs text-gray-300">{theme.description}</p>
                      </div>
                    </Vortex>
                  )}
                  {theme.preview === 'collision' && (
                    <BackgroundBeamsWithCollision>
                      <div className="text-center">
                        <p className="text-xs text-gray-300">{theme.description}</p>
                      </div>
                    </BackgroundBeamsWithCollision>
                  )}
                </div>

                {/* Theme Info */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-sm">{theme.name}</h3>
                    <Badge variant="secondary" className="text-xs bg-purple-500/20 text-purple-300 border-purple-500/30">
                      Beta
                    </Badge>
                  </div>
                  <Button
                    onClick={() => handleThemeSelect(theme.id)}
                    className={`w-full text-xs h-8 transition-all ${
                      selectedTheme === theme.id
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500'
                        : 'bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    {selectedTheme === theme.id ? '✓ Sélectionné' : 'Sélectionner'}
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Info Banner */}
          <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
            <p className="text-xs text-purple-300">
              💡 Ces thèmes sont en mode Beta. Vos retours nous aident à les améliorer. Vous pouvez en ajouter d'autres à tout moment.
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
