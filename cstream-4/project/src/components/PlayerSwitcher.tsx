import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MonitorPlay, Check, Zap, Shield, Globe, Server, 
  ChevronDown, Sparkles, Star, Cpu
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useGeoLocation } from '@/hooks/useGeoLocation';

export type PlayerSourceId = 'vidking' | 'smashy' | 'primesrc' | 'vidfast' | 'multiembed' | 'superembed' | 'vidsrc' | 'videasy' | 'autoembed' | 'frembed' | 'vidlink' | 'embed2' | 'moviesapi' | 'vidnest' | 'vidzee' | 'vidrock' | 'vidsync' | 'cinemaos' | 'streamwish' | 'lookmovie' | 'tmdb' | 'flixhq' | 'soap2day' | 'putlockers' | 'cinebb' | 'bludclart' | 'pstream';

interface PlayerSource {
  id: PlayerSourceId;
  name: string;
  description: string;
  color: string;
  icon: React.ReactNode;
  quality: 'hd' | '4k' | 'auto';
  reliable: boolean;
  hasMultiLang?: boolean;
  hasPub?: boolean;
  isBeta?: boolean;
}

const PLAYER_SOURCES: PlayerSource[] = [
  {
    id: 'bludclart',
    name: 'Bludclart',
    description: 'Nouveau - Lecteur TMDB optimisé',
    color: 'from-blue-600 to-cyan-500',
    icon: <MonitorPlay className="w-4 h-4" />,
    quality: 'hd',
    reliable: true,
  },
  {
    id: 'pstream',
    name: 'PStream',
    description: 'Nouveau - Lecteur stable & Rapide',
    color: 'from-blue-600 to-indigo-700',
    icon: <Zap className="w-4 h-4" />,
    quality: 'hd',
    reliable: true,
  },
  {
    id: 'vidzee',
    name: 'VidZee',
    description: 'TOP - VF/VOSTFR - Cliquez "Paramètre" > "Langue"',
    color: 'from-purple-500 to-pink-500',
    icon: <Star className="w-4 h-4" />,
    quality: 'hd',
    reliable: true,
  },
  {
    id: 'vidking',
    name: 'Vidking',
    description: 'Multi-serveurs VF/VOSTFR - Recommandé',
    color: 'from-purple-500 to-indigo-500',
    icon: <Star className="w-4 h-4" />,
    quality: 'hd',
    reliable: true,
  },
  {
    id: 'smashy',
    name: 'CSPlayer',
    description: '(Ultra recommandé)',
    color: 'from-rose-500 to-pink-600',
    icon: <Sparkles className="w-4 h-4" />,
    quality: 'hd',
    reliable: true,
    hasMultiLang: true,
    hasPub: true,
  },
  {
    id: 'cinemaos',
    name: 'CSPlayer (V2)',
    description: 'Premium sans restrictions',
    color: 'from-indigo-400 to-purple-500',
    icon: <MonitorPlay className="w-4 h-4" />,
    quality: 'hd',
    reliable: true,
    hasPub: true,
  },
  {
    id: 'vidfast',
    name: 'VidFast',
    description: 'Serveur ultra-rapide',
    color: 'from-green-500 to-emerald-500',
    icon: <Zap className="w-4 h-4" />,
    quality: 'hd',
    reliable: true,
    hasMultiLang: true,
    hasPub: true,
  },
  {
    id: 'multiembed',
    name: 'MultiEmbed VIP',
    description: 'Streaming HLS rapide',
    color: 'from-violet-500 to-purple-600',
    icon: <Sparkles className="w-4 h-4" />,
    quality: 'hd',
    reliable: true,
  },
  {
    id: 'superembed',
    name: 'SuperEmbed',
    description: 'Ultra stable',
    color: 'from-yellow-500 to-orange-500',
    icon: <Shield className="w-4 h-4" />,
    quality: 'hd',
    reliable: true,
  },
  {
    id: 'vidsrc',
    name: 'VidSrc',
    description: 'Stable & fiable',
    color: 'from-blue-500 to-cyan-500',
    icon: <Shield className="w-4 h-4" />,
    quality: 'hd',
    reliable: true,
    hasPub: true,
  },
  {
    id: 'videasy',
    name: 'Videasy',
    description: 'Serveur léger',
    color: 'from-teal-500 to-cyan-500',
    icon: <Zap className="w-4 h-4" />,
    quality: 'hd',
    reliable: true,
    hasMultiLang: true,
    hasPub: true,
  },
  {
    id: 'autoembed',
    name: 'AutoEmbed',
    description: 'Multi-sources auto HD',
    color: 'from-indigo-500 to-blue-600',
    icon: <Globe className="w-4 h-4" />,
    quality: 'auto',
    reliable: true,
    hasMultiLang: true,
    hasPub: true,
  },
  {
    id: 'frembed',
    name: 'Frembed',
    description: 'TOP - VF/VOSTFR - Lecteur français optimisé',
    color: 'from-pink-500 to-rose-600',
    icon: <Globe className="w-4 h-4" />,
    quality: 'hd',
    reliable: true,
  },
  {
    id: 'vidlink',
    name: 'VidLink',
    description: 'Ultra HD / 4K',
    color: 'from-blue-600 to-sky-500',
    icon: <Sparkles className="w-4 h-4" />,
    quality: '4k',
    reliable: true,
    hasPub: true,
  },
  {
    id: 'embed2',
    name: '2Embedded',
    description: 'Multi-serveurs stable',
    color: 'from-emerald-500 to-teal-500',
    icon: <Server className="w-4 h-4" />,
    quality: 'hd',
    reliable: true,
    hasPub: true,
  },
  {
    id: 'moviesapi',
    name: 'Movie API',
    description: 'HLS Premium qualité',
    color: 'from-pink-500 to-rose-500',
    icon: <Sparkles className="w-4 h-4" />,
    quality: 'hd',
    reliable: true,
    hasPub: true,
  },
  {
    id: 'vidnest',
    name: 'VidNest',
    description: 'Multi-serveurs premium',
    color: 'from-cyan-500 to-blue-600',
    icon: <Server className="w-4 h-4" />,
    quality: 'hd',
    reliable: true,
    hasPub: true,
  },
  {
    id: 'vidrock',
    name: 'VidRock',
    description: 'Qualité premium 4K',
    color: 'from-red-500 to-orange-500',
    icon: <Sparkles className="w-4 h-4" />,
    quality: '4k',
    reliable: true,
    hasPub: true,
  },
  {
    id: 'vidsync',
    name: 'VidSync',
    description: 'Multi-serveurs stable',
    color: 'from-blue-400 to-indigo-500',
    icon: <Zap className="w-4 h-4" />,
    quality: 'hd',
    reliable: true,
    hasPub: true,
  },
  {
    id: 'streamwish',
    name: 'StreamWish',
    description: 'Sources multiples ultrarapide',
    color: 'from-lime-500 to-green-500',
    icon: <Zap className="w-4 h-4" />,
    quality: 'hd',
    reliable: true,
  },
  {
    id: 'lookmovie',
    name: 'LookMovie',
    description: 'Catalogue extensif',
    color: 'from-cyan-400 to-blue-500',
    icon: <Shield className="w-4 h-4" />,
    quality: 'hd',
    reliable: true,
  },
  {
    id: 'tmdb',
    name: 'TMDB Direct',
    description: 'Source officielle API',
    color: 'from-yellow-500 to-amber-500',
    icon: <Server className="w-4 h-4" />,
    quality: 'auto',
    reliable: true,
  },
  {
    id: 'flixhq',
    name: 'FlixHQ',
    description: 'Premium sans restrictions',
    color: 'from-pink-500 to-red-500',
    icon: <Star className="w-4 h-4" />,
    quality: 'hd',
    reliable: true,
  },
  {
    id: 'soap2day',
    name: 'Soap2Day',
    description: 'Catalogue global complet',
    color: 'from-indigo-500 to-purple-600',
    icon: <Sparkles className="w-4 h-4" />,
    quality: 'hd',
    reliable: true,
  },
  {
    id: 'putlockers',
    name: 'PutLocker',
    description: 'Multisources stable',
    color: 'from-orange-400 to-red-500',
    icon: <Globe className="w-4 h-4" />,
    quality: 'hd',
    reliable: true,
  },
  {
    id: 'cinebb',
    name: 'CineBB',
    description: 'Français/International',
    color: 'from-blue-400 to-indigo-500',
    icon: <Star className="w-4 h-4" />,
    quality: 'hd',
    reliable: true,
  },
];

interface PlayerSwitcherProps {
  currentSource: PlayerSourceId;
  onSourceChange: (sourceId: PlayerSourceId) => void;
  disabled?: boolean;
  className?: string;
  variant?: 'default' | 'minimal' | 'floating';
}

export const PlayerSwitcher = ({
  currentSource,
  onSourceChange,
  disabled = false,
  className,
  variant = 'default',
}: PlayerSwitcherProps) => {
  const [open, setOpen] = useState(false);
  const { country } = useGeoLocation();
  
  useEffect(() => {
    if (country === 'FR' && currentSource !== 'frembed') {
      const hasFrembed = PLAYER_SOURCES.some(s => s.id === 'frembed');
      if (hasFrembed) {
        onSourceChange('frembed');
      }
    }
  }, [country]);
  
  const currentSourceData = PLAYER_SOURCES.find(s => s.id === currentSource) || PLAYER_SOURCES[1];

  const handleSourceChange = (sourceId: PlayerSourceId) => {
    if (sourceId !== currentSource) {
      onSourceChange(sourceId);
      const sourceName = PLAYER_SOURCES.find(s => s.id === sourceId)?.name || 'Lecteur';
      toast.success(`Lecteur changé pour ${sourceName}`);
    }
    setOpen(false);
  };

  const getQualityBadge = (quality: string) => {
    switch (quality) {
      case '4k':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-[10px] px-1.5 py-0">4K</Badge>;
      case 'hd':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-[10px] px-1.5 py-0">HD</Badge>;
      default:
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30 text-[10px] px-1.5 py-0">Auto</Badge>;
    }
  };

  if (variant === 'minimal') {
    return (
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild disabled={disabled}>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "gap-2 text-white/80 hover:text-white hover:bg-white/10 transition-all",
              className
            )}
          >
            <MonitorPlay className="w-4 h-4" />
            <span className="hidden sm:inline">{currentSourceData.name}</span>
            <ChevronDown className="w-3 h-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          className="w-64 bg-background/95 backdrop-blur-xl border-white/10"
          sideOffset={8}
        >
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Changer de lecteur
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {PLAYER_SOURCES.map((source) => (
            <DropdownMenuItem
              key={source.id}
              onClick={() => handleSourceChange(source.id)}
              className="flex items-center gap-3 cursor-pointer py-2.5"
            >
              <div className={cn(
                "p-1.5 rounded-lg bg-gradient-to-br",
                source.color
              )}>
                {source.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{source.name}</span>
                  {source.isBeta && <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-[9px] px-1 py-0">Beta</Badge>}
                  {getQualityBadge(source.quality)}
                </div>
                <span className="text-xs text-muted-foreground">{source.description}</span>
              </div>
              {currentSource === source.id && (
                <Check className="w-4 h-4 text-primary flex-shrink-0" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (variant === 'floating') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "fixed bottom-24 right-4 z-50",
          className
        )}
      >
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild disabled={disabled}>
            <Button
              className={cn(
                "rounded-full shadow-xl bg-gradient-to-r gap-2 px-4 py-6",
                currentSourceData.color
              )}
            >
              <MonitorPlay className="w-5 h-5" />
              <span>{currentSourceData.name}</span>
              <ChevronDown className={cn(
                "w-4 h-4 transition-transform",
                open && "rotate-180"
              )} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="end" 
            className="w-72 bg-background/95 backdrop-blur-xl border-white/10 max-h-80 overflow-y-auto"
            sideOffset={8}
          >
            <DropdownMenuLabel className="flex items-center gap-2 text-primary">
              <Sparkles className="w-4 h-4" />
              Lecteurs disponibles
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {PLAYER_SOURCES.map((source, index) => (
              <motion.div
                key={source.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.02 }}
              >
                <DropdownMenuItem
                  onClick={() => handleSourceChange(source.id)}
                  className="flex items-center gap-3 cursor-pointer py-3 hover:bg-white/5"
                >
                  <div className={cn(
                    "p-2 rounded-xl bg-gradient-to-br shadow-lg",
                    source.color
                  )}>
                    {source.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{source.name}</span>
                      {source.isBeta && <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-[9px] px-1 py-0">Beta</Badge>}
                      {getQualityBadge(source.quality)}
                    </div>
                    <span className="text-xs text-muted-foreground">{source.description}</span>
                  </div>
                  {currentSource === source.id && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="p-1 rounded-full bg-primary"
                    >
                      <Check className="w-3 h-3 text-white" />
                    </motion.div>
                  )}
                </DropdownMenuItem>
              </motion.div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </motion.div>
    );
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <Button
          variant="outline"
          className={cn(
            "gap-2 border-white/10 hover:border-primary/50 transition-all",
            className
          )}
        >
          <div className={cn(
            "p-1 rounded-md bg-gradient-to-br",
            currentSourceData.color
          )}>
            <MonitorPlay className="w-3 h-3" />
          </div>
          <span>{currentSourceData.name}</span>
          <ChevronDown className={cn(
            "w-4 h-4 transition-transform",
            open && "rotate-180"
          )} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="start" 
        className="w-72 bg-background/95 backdrop-blur-xl border-white/10 max-h-96 overflow-y-auto"
        sideOffset={8}
      >
        <DropdownMenuLabel className="flex items-center gap-2">
          <MonitorPlay className="w-4 h-4 text-primary" />
          Changer de lecteur vidéo
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <AnimatePresence>
          {PLAYER_SOURCES.map((source, index) => (
            <motion.div
              key={source.id}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02 }}
            >
              <DropdownMenuItem
                onClick={() => handleSourceChange(source.id)}
                className={cn(
                  "flex items-center gap-3 cursor-pointer py-3 transition-all",
                  currentSource === source.id 
                    ? "bg-primary/10 border-l-2 border-primary" 
                    : "hover:bg-white/5"
                )}
              >
                <div className={cn(
                  "p-2 rounded-xl bg-gradient-to-br shadow-md",
                  source.color
                )}>
                  {source.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{source.name}</span>
                    {source.isBeta && <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-[9px] px-1 py-0">Beta</Badge>}
                    {getQualityBadge(source.quality)}
                    {source.reliable && (
                      <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-[9px] px-1 py-0">
                        Stable
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {source.hasMultiLang && (
                      <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[8px] px-1 py-0 uppercase">
                        Multi-Langue
                      </Badge>
                    )}
                    {source.hasPub && (
                      <Badge className="bg-orange-500/10 text-orange-400 border-orange-500/20 text-[8px] px-1 py-0 uppercase">
                        Pub
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{source.description}</span>
                </div>
                {currentSource === source.id && (
                  <motion.div
                    layoutId="selected-player"
                    className="p-1.5 rounded-full bg-primary shadow-lg"
                  >
                    <Check className="w-3 h-3 text-white" />
                  </motion.div>
                )}
              </DropdownMenuItem>
            </motion.div>
          ))}
        </AnimatePresence>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const PLAYER_SOURCE_LIST = PLAYER_SOURCES;
export default PlayerSwitcher;
