import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Server, Check, ExternalLink, Maximize, Minimize, 
  ChevronDown, Globe, Zap, Wifi, Shield, Tv
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
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';

interface ServerOption {
  id: string;
  name: string;
  description: string;
  icon?: React.ReactNode;
  quality?: 'high' | 'medium' | 'low';
}

interface PlayerControlsProps {
  currentServer: string;
  onServerChange: (serverId: string) => void;
  onOpenExternal?: () => void;
  onToggleFullscreen?: () => void;
  isFullscreen?: boolean;
  playerType?: 'vidking' | 'vidfast';
  mediaType?: 'movie' | 'tv';
  season?: number;
  episode?: number;
  showName?: string;
  className?: string;
}

const VIDKING_SERVERS: ServerOption[] = [
  { id: 'auto', name: 'Auto', description: 'Sélection automatique', icon: <Zap className="w-4 h-4" />, quality: 'high' },
  { id: 'vidsrc', name: 'VidSrc', description: 'Serveur principal', icon: <Tv className="w-4 h-4" />, quality: 'high' },
  { id: 'vidsrcpro', name: 'VidSrc Pro', description: 'Qualité HD', icon: <Shield className="w-4 h-4" />, quality: 'high' },
  { id: 'embedsu', name: 'EmbedSU', description: 'Alternative rapide', icon: <Zap className="w-4 h-4" />, quality: 'medium' },
  { id: 'superembed', name: 'SuperEmbed', description: 'Multi-sources', icon: <Globe className="w-4 h-4" />, quality: 'medium' },
  { id: 'moviee', name: 'Moviee', description: 'Serveur stable', icon: <Wifi className="w-4 h-4" />, quality: 'medium' },
];

const VIDFAST_SERVERS: ServerOption[] = [
  { id: 'auto', name: 'Auto', description: 'Serveur automatique', icon: <Zap className="w-4 h-4" />, quality: 'high' },
  { id: 'vidcloud', name: 'VidCloud', description: 'Serveur rapide', icon: <Zap className="w-4 h-4" />, quality: 'high' },
  { id: 'upcloud', name: 'UpCloud', description: 'Haute qualité', icon: <Shield className="w-4 h-4" />, quality: 'high' },
  { id: 'mixdrop', name: 'MixDrop', description: 'Alternative stable', icon: <Wifi className="w-4 h-4" />, quality: 'medium' },
];

const getQualityColor = (quality?: string) => {
  switch (quality) {
    case 'high': return 'bg-green-500';
    case 'medium': return 'bg-yellow-500';
    case 'low': return 'bg-red-500';
    default: return 'bg-white/30';
  }
};

export const PlayerControls = ({
  currentServer,
  onServerChange,
  onOpenExternal,
  onToggleFullscreen,
  isFullscreen = false,
  playerType = 'vidking',
  mediaType,
  season,
  episode,
  showName,
  className,
}: PlayerControlsProps) => {
  const { language } = useI18n();
  const servers = playerType === 'vidfast' ? VIDFAST_SERVERS : VIDKING_SERVERS;
  const currentServerInfo = servers.find(s => s.id === currentServer) || servers[0];
  
  const playerLabel = playerType === 'vidfast' ? 'VidFast' : 'VidKing';
  const selectServerLabel = language === 'fr' ? 'Choisir un serveur' : 'Select server';

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 p-3 sm:p-4",
        "bg-gradient-to-r from-zinc-900/95 via-zinc-900/90 to-zinc-900/95",
        "backdrop-blur-xl border border-white/10 rounded-xl sm:rounded-2xl",
        "shadow-xl shadow-black/20",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-lg",
          playerType === 'vidfast' 
            ? "bg-gradient-to-r from-emerald-500/20 to-green-500/20 border border-emerald-500/30" 
            : "bg-gradient-to-r from-purple-500/20 to-violet-500/20 border border-purple-500/30"
        )}>
          <div className={cn(
            "w-2 h-2 rounded-full animate-pulse",
            playerType === 'vidfast' ? "bg-emerald-500" : "bg-purple-500"
          )} />
          <span className={cn(
            "text-sm font-semibold",
            playerType === 'vidfast' ? "text-emerald-400" : "text-purple-400"
          )}>
            {playerLabel}
          </span>
        </div>

        {mediaType === 'tv' && season && episode && (
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 text-xs font-medium bg-white/10 backdrop-blur-sm rounded-lg text-white/80 border border-white/5">
              S{String(season).padStart(2, '0')} E{String(episode).padStart(2, '0')}
            </span>
          </div>
        )}

        {showName && (
          <span className="text-sm text-white/60 truncate max-w-[200px] hidden lg:block">
            {showName}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline"
              size="sm"
              className={cn(
                "gap-2 h-9 px-3 sm:px-4",
                "bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20",
                "text-white/90 hover:text-white transition-all duration-200"
              )}
            >
              <Server className="w-4 h-4" />
              <span className="hidden sm:inline font-medium">{currentServerInfo.name}</span>
              <ChevronDown className="w-3.5 h-3.5 text-white/50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="end" 
            className="w-64 bg-zinc-900/98 backdrop-blur-xl border-white/10 shadow-2xl"
          >
            <DropdownMenuLabel className="text-xs text-white/50 uppercase tracking-wider px-3 py-2">
              {selectServerLabel}
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/10" />
            {servers.map((server) => (
              <DropdownMenuItem
                key={server.id}
                onClick={() => onServerChange(server.id)}
                className={cn(
                  "cursor-pointer transition-all duration-200 mx-1 my-0.5 rounded-lg",
                  currentServer === server.id 
                    ? playerType === 'vidfast'
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-purple-500/20 text-purple-400" 
                    : "hover:bg-white/10"
                )}
              >
                <div className="flex items-center gap-3 w-full py-1">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center",
                    currentServer === server.id 
                      ? playerType === 'vidfast' ? "bg-emerald-500/30" : "bg-purple-500/30"
                      : "bg-white/10"
                  )}>
                    {server.icon}
                  </div>
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{server.name}</span>
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        getQualityColor(server.quality)
                      )} />
                    </div>
                    <span className="text-xs text-white/50">{server.description}</span>
                  </div>
                  {currentServer === server.id && (
                    <Check className={cn(
                      "w-4 h-4",
                      playerType === 'vidfast' ? "text-emerald-400" : "text-purple-400"
                    )} />
                  )}
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {onOpenExternal && (
          <Button 
            variant="outline"
            size="sm"
            onClick={onOpenExternal}
            className={cn(
              "gap-2 h-9 px-3",
              "bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20",
              "text-white/90 hover:text-white transition-all duration-200"
            )}
          >
            <ExternalLink className="w-4 h-4" />
            <span className="hidden sm:inline">Externe</span>
          </Button>
        )}

        {onToggleFullscreen && (
          <Button 
            variant="outline"
            size="sm"
            onClick={onToggleFullscreen}
            className={cn(
              "h-9 w-9 p-0",
              "bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20",
              "text-white/90 hover:text-white transition-all duration-200"
            )}
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </Button>
        )}
      </div>
    </motion.div>
  );
};

export default PlayerControls;
