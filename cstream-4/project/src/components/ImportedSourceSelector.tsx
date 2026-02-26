import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Check, Zap } from 'lucide-react';
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
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ImportedSource {
  id: string;
  label: string;
  url: string;
  tmdb_id: number;
  visible?: boolean;
}

interface ImportedSourceSelectorProps {
  tmdbId: number;
  onSelect: (source: ImportedSource) => void;
  currentSource?: ImportedSource | null;
  className?: string;
  loading?: boolean;
}

export const ImportedSourceSelector = ({
  tmdbId,
  onSelect,
  currentSource,
  className,
  loading = false,
}: ImportedSourceSelectorProps) => {
  const [sources, setSources] = useState<ImportedSource[]>([]);
  const [sourcesLoading, setSourcesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch imported sources that match current TMDB ID
  useEffect(() => {
    const fetchImportedSources = async () => {
      if (!tmdbId) {
        setSources([]);
        return;
      }

      setSourcesLoading(true);
      setError(null);

      try {
        const { data, error: err } = await supabase
          .from('readers')
          .select('id, label, url, tmdb_id, enabled')
          .eq('tmdb_id', tmdbId)
          .eq('enabled', true)
          .order('created_at', { ascending: false });

        if (err) {
          console.error('Error fetching imported sources:', err);
          setError('Impossible de charger les sources');
          return;
        }

        console.log('[ImportedSourceSelector] Fetched sources for TMDB', tmdbId, ':', data);

        // Filter to show only visible sources
        const importedSources = (data || [])
          .filter((s: any) => s.enabled !== false)
          .map((s: any) => ({
            id: s.id,
            label: s.label,
            url: s.url,
            tmdb_id: s.tmdb_id,
            visible: true,
          }));

        console.log('[ImportedSourceSelector] Processed sources:', importedSources);
        setSources(importedSources);
      } catch (err) {
        console.error('Error fetching imported sources:', err);
        setError('Erreur lors du chargement');
      } finally {
        setSourcesLoading(false);
      }
    };

    fetchImportedSources();
  }, [tmdbId]);

  // Don't render if no sources available
  if (!sources.length && !sourcesLoading) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={loading || sourcesLoading}
          className={cn(
            "h-10 sm:h-9 px-3 sm:px-4 gap-2 flex items-center justify-center",
            "bg-zinc-900/40 hover:bg-zinc-800/60",
            "backdrop-blur-xl border border-white/10 hover:border-white/20",
            "rounded-xl transition-all duration-300",
            "shadow-lg shadow-black/20",
            "group disabled:opacity-50",
            className
          )}
        >
          <Zap className="w-4 h-4 text-white/70" />
          <span className="text-xs font-semibold text-white/90">
            {currentSource?.label || 'Sources Admin'}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-white/40 group-hover:text-white/60 transition-colors" />
        </motion.button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={12}
        className="w-80 p-2 bg-zinc-950/98 backdrop-blur-2xl border border-white/10 max-h-[400px] overflow-y-auto shadow-2xl rounded-2xl z-[100]"
      >
        <div className="flex items-center justify-between px-3 py-2 mb-2">
          <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">
            Sources Importées
          </span>
          <span className="text-[10px] text-white/30 bg-white/5 px-2 py-0.5 rounded-full">
            {sources.length} {sources.length > 1 ? 'sources' : 'source'}
          </span>
        </div>
        <DropdownMenuSeparator className="bg-white/5 mb-2" />

        {error && (
          <div className="px-3 py-2 text-xs text-red-400/80 bg-red-500/10 rounded-lg mx-1 mb-2">
            {error}
          </div>
        )}

        {sourcesLoading ? (
          <div className="px-3 py-4 text-xs text-orange-300/60 text-center">
            Chargement des sources...
          </div>
        ) : sources.length > 0 ? (
          <div className="space-y-1">
            {sources.map((source) => (
              <DropdownMenuItem
                key={source.id}
                onSelect={() => {
                  onSelect(source);
                  toast.success(`Source changée: ${source.label}`);
                }}
                className={cn(
                  "cursor-pointer py-2.5 px-3 rounded-xl transition-all duration-200",
                  "focus:bg-white/10 focus:outline-none",
                  currentSource?.id === source.id
                    ? "bg-purple-600/20 border border-purple-500/30 text-white"
                    : "hover:bg-white/5 border border-transparent text-white/70"
                )}
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white/90 truncate">
                      {source.label}
                    </p>
                    <p className="text-xs text-white/40 truncate">{source.url}</p>
                  </div>
                  {currentSource?.id === source.id && (
                    <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  )}
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        ) : (
          <div className="px-3 py-4 text-xs text-orange-300/50 text-center">
            Aucune source importée pour ce contenu
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
