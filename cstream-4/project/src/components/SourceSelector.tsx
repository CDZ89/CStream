import { motion } from 'framer-motion';
import { ChevronDown, Zap, Check, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

interface Reader {
  id: string;
  label: string;
  language: string;
  source_type?: 'local' | 'synchronized';
}

interface SourceSelectorProps {
  sources: Reader[];
  currentSource: Reader | null;
  onSourceChange: (source: Reader) => void;
  className?: string;
  loading?: boolean;
}

export const SourceSelector = ({
  sources,
  currentSource,
  onSourceChange,
  className,
  loading = false,
}: SourceSelectorProps) => {
  const localSources = sources.filter(s => s.source_type === 'local');
  const syncSources = sources.filter(s => s.source_type !== 'local');

  if (!sources.length) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={loading}
          className={cn(
            "h-9 px-3 sm:px-4 gap-2 flex items-center",
            "bg-gradient-to-r from-white/5 to-white/10",
            "hover:from-white/10 hover:to-white/15",
            "backdrop-blur-xl border border-white/10 hover:border-white/20",
            "rounded-xl transition-all duration-300",
            "shadow-lg shadow-black/20 hover:shadow-purple-500/10",
            "group disabled:opacity-50",
            className
          )}
        >
          <Globe className="w-4 h-4 text-white/70" />
          <span className="text-xs font-semibold text-white/90 hidden sm:block">
            {currentSource?.label || 'Sources'}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-white/50 group-hover:text-white/70 transition-colors" />
        </motion.button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={12}
        className="w-80 p-2 bg-zinc-900/98 backdrop-blur-2xl border border-white/10 max-h-[400px] overflow-y-auto shadow-2xl shadow-purple-500/10 rounded-2xl z-[100]"
      >
        <div className="flex items-center justify-between px-3 py-2 mb-2">
          <span className="text-xs font-semibold text-white/70 uppercase tracking-wider">
            Sources ({sources.length})
          </span>
          <span className="text-[10px] text-white/40 bg-white/5 px-2 py-0.5 rounded-full">
            {localSources.length} locales, {syncSources.length} sync
          </span>
        </div>
        <DropdownMenuSeparator className="bg-gradient-to-r from-transparent via-white/10 to-transparent mb-2" />

        {localSources.length > 0 && (
          <>
            <div className="px-3 py-2 mb-1">
              <p className="text-xs font-semibold text-yellow-400/80 flex items-center gap-1">
                <Zap className="w-3 h-3" /> Locales
              </p>
            </div>
            <div className="space-y-1 mb-2">
              {localSources.map((source) => (
                <DropdownMenuItem
                  key={source.id}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onSourceChange(source);
                  }}
                  className={cn(
                    "cursor-pointer py-2 px-3 rounded-xl transition-all duration-200",
                    "focus:bg-white/10 focus:outline-none",
                    currentSource?.id === source.id
                      ? "bg-yellow-500/20 border border-yellow-500/30"
                      : "hover:bg-white/5 border border-transparent"
                  )}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{source.label}</p>
                      <p className="text-xs text-white/50">{source.language}</p>
                    </div>
                    {currentSource?.id === source.id && (
                      <Check className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                    )}
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
            <DropdownMenuSeparator className="bg-gradient-to-r from-transparent via-white/10 to-transparent mb-2" />
          </>
        )}

        {syncSources.length > 0 && (
          <>
            <div className="px-3 py-2 mb-1">
              <p className="text-xs font-semibold text-blue-400/80">Synchronisées</p>
            </div>
            <div className="space-y-1">
              {syncSources.map((source) => (
                <DropdownMenuItem
                  key={source.id}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onSourceChange(source);
                  }}
                  className={cn(
                    "cursor-pointer py-2 px-3 rounded-xl transition-all duration-200",
                    "focus:bg-white/10 focus:outline-none",
                    currentSource?.id === source.id
                      ? "bg-blue-500/20 border border-blue-500/30"
                      : "hover:bg-white/5 border border-transparent"
                  )}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{source.label}</p>
                      <p className="text-xs text-white/50">{source.language}</p>
                    </div>
                    {currentSource?.id === source.id && (
                      <Check className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    )}
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
