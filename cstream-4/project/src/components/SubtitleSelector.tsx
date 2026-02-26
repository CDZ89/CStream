import { useState, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Subtitles,
  Download,
  Globe,
  Loader2,
  Check,
  X,
  ChevronDown,
  Search,
  Filter,
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
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  searchSubtitles,
  getSubtitlesForMovie,
  getSubtitlesForTV,
  SubtitleResult,
  SUPPORTED_LANGUAGES,
} from '@/lib/wyzieSubs';

interface SubtitleSelectorProps {
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  season?: number;
  episode?: number;
  onSubtitleSelect?: (subtitle: SubtitleResult | null) => void;
  selectedSubtitle?: SubtitleResult | null;
  className?: string;
}

export const SubtitleSelector = memo(({
  tmdbId,
  mediaType,
  season,
  episode,
  onSubtitleSelect,
  selectedSubtitle,
  className,
}: SubtitleSelectorProps) => {
  const [subtitles, setSubtitles] = useState<SubtitleResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const fetchSubtitles = useCallback(async () => {
    if (!tmdbId) return;

    setLoading(true);
    setError(null);

    try {
      let results: SubtitleResult[];

      if (mediaType === 'tv' && season && episode) {
        results = await getSubtitlesForTV(tmdbId, season, episode, selectedLanguage || undefined);
      } else {
        results = await getSubtitlesForMovie(tmdbId, selectedLanguage || undefined);
      }

      setSubtitles(results);
    } catch (err) {
      console.error('Error fetching subtitles:', err);
      setError('Impossible de charger les sous-titres');
    } finally {
      setLoading(false);
    }
  }, [tmdbId, mediaType, season, episode, selectedLanguage]);

  useEffect(() => {
    if (isOpen && subtitles.length === 0) {
      fetchSubtitles();
    }
  }, [isOpen, fetchSubtitles, subtitles.length]);

  useEffect(() => {
    if (isOpen) {
      fetchSubtitles();
    }
  }, [selectedLanguage, fetchSubtitles, isOpen]);

  const filteredSubtitles = subtitles.filter((sub) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      sub.lang.toLowerCase().includes(query) ||
      sub.releaseName?.toLowerCase().includes(query) ||
      sub.source.toLowerCase().includes(query)
    );
  });

  const handleSubtitleSelect = useCallback(
    (subtitle: SubtitleResult) => {
      onSubtitleSelect?.(subtitle);
      setIsOpen(false);
    },
    [onSubtitleSelect]
  );

  const handleDisableSubtitles = useCallback(() => {
    onSubtitleSelect?.(null);
    setIsOpen(false);
  }, [onSubtitleSelect]);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'gap-2 h-9 px-3 bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20 text-white/90 hover:text-white transition-all duration-200',
            selectedSubtitle && 'border-primary/50 bg-primary/20',
            className
          )}
          aria-label="Sélectionner les sous-titres"
        >
          <Subtitles className="w-4 h-4" />
          <span className="hidden sm:inline">
            {selectedSubtitle ? selectedSubtitle.lang : 'Sous-titres'}
          </span>
          <ChevronDown className="w-3 h-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-80 sm:w-96 bg-zinc-900/98 backdrop-blur-2xl border-white/10 max-h-[70vh] overflow-hidden shadow-2xl shadow-black/50 rounded-xl z-[100]"
      >
        <DropdownMenuLabel className="text-xs text-white/60 uppercase tracking-wider px-3 py-2 flex items-center gap-2">
          <Subtitles className="w-3 h-3" />
          Sous-titres (Wyzie Subs)
        </DropdownMenuLabel>

        <div className="px-3 py-2 space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher..."
              className="pl-9 h-9 bg-white/5 border-white/10 text-white placeholder:text-white/40"
            />
          </div>

          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-2 h-8 bg-white/5 border-white/10 text-white/80"
                >
                  <Globe className="w-3 h-3" />
                  {selectedLanguage
                    ? SUPPORTED_LANGUAGES.find((l) => l.code === selectedLanguage)?.name || selectedLanguage
                    : 'Toutes les langues'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-zinc-900/98 border-white/10 max-h-60 overflow-y-auto">
                <DropdownMenuItem
                  onClick={() => setSelectedLanguage('')}
                  className="cursor-pointer"
                >
                  Toutes les langues
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => setSelectedLanguage(lang.code)}
                    className="cursor-pointer gap-2"
                  >
                    <span>{lang.flag}</span>
                    <span>{lang.name}</span>
                    {selectedLanguage === lang.code && (
                      <Check className="w-3 h-3 ml-auto text-primary" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="outline"
              size="sm"
              onClick={fetchSubtitles}
              disabled={loading}
              className="h-8 w-8 p-0 bg-white/5 border-white/10"
            >
              {loading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Filter className="w-3 h-3" />
              )}
            </Button>
          </div>
        </div>

        <DropdownMenuSeparator className="bg-white/10" />

        <div className="max-h-64 overflow-y-auto px-1">
          {selectedSubtitle && (
            <DropdownMenuItem
              onClick={handleDisableSubtitles}
              className="cursor-pointer py-2.5 px-3 mx-1 my-0.5 rounded-lg hover:bg-red-500/20 text-red-400"
            >
              <X className="w-4 h-4 mr-2" />
              Désactiver les sous-titres
            </DropdownMenuItem>
          )}

          {loading ? (
            <div className="py-8 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
              <p className="text-sm text-white/60">Chargement des sous-titres...</p>
            </div>
          ) : error ? (
            <div className="py-8 flex flex-col items-center justify-center gap-2">
              <p className="text-sm text-red-400">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchSubtitles}>
                Réessayer
              </Button>
            </div>
          ) : filteredSubtitles.length === 0 ? (
            <div className="py-8 flex flex-col items-center justify-center gap-2">
              <Subtitles className="w-8 h-8 text-white/20" />
              <p className="text-sm text-white/60">Aucun sous-titre trouvé</p>
            </div>
          ) : (
            <AnimatePresence>
              {filteredSubtitles.map((subtitle, index) => (
                <motion.div
                  key={subtitle.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                >
                  <DropdownMenuItem
                    onClick={() => handleSubtitleSelect(subtitle)}
                    className={cn(
                      'cursor-pointer py-2.5 px-3 mx-1 my-0.5 rounded-lg transition-all duration-200',
                      selectedSubtitle?.id === subtitle.id
                        ? 'bg-gradient-to-r from-primary/30 to-accent/20 text-white border border-primary/30'
                        : 'hover:bg-white/10 border border-transparent'
                    )}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center font-bold text-xs">
                        {SUPPORTED_LANGUAGES.find((l) => l.code === subtitle.langCode)?.flag ||
                          subtitle.langCode.toUpperCase()}
                      </div>
                      <div className="flex flex-col flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-medium text-sm">{subtitle.lang}</span>
                          {subtitle.hearingImpaired && (
                            <span className="px-1.5 py-0.5 text-[9px] bg-blue-500/20 text-blue-400 rounded-full font-medium">
                              HI
                            </span>
                          )}
                          <span className="px-1.5 py-0.5 text-[9px] bg-white/10 text-white/60 rounded-full uppercase">
                            {subtitle.format}
                          </span>
                        </div>
                        <span className="text-xs text-white/50 truncate">
                          {subtitle.source} {subtitle.releaseName && `• ${subtitle.releaseName}`}
                        </span>
                      </div>
                      {selectedSubtitle?.id === subtitle.id ? (
                        <Check className="w-4 h-4 text-primary flex-shrink-0" />
                      ) : (
                        <Download className="w-4 h-4 text-white/30 flex-shrink-0" />
                      )}
                    </div>
                  </DropdownMenuItem>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        <DropdownMenuSeparator className="bg-white/10" />
        <div className="px-3 py-2">
          <p className="text-[10px] text-white/40 text-center">
            Powered by Wyzie Subs API v8.0
          </p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

SubtitleSelector.displayName = 'SubtitleSelector';
