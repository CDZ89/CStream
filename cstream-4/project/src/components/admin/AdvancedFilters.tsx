import { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Filter, ChevronDown, ChevronUp, X, Search, Calendar, 
  Database, Globe, Film, Tv, Star, RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface FilterState {
  search: string;
  mediaType: 'all' | 'movie' | 'tv' | 'anime';
  enabled: 'all' | 'enabled' | 'disabled';
  language: string;
  tmdbLinked: 'all' | 'linked' | 'unlinked';
  dateFrom: string;
  dateTo: string;
  minEpisodes: string;
  maxEpisodes: string;
  hosts: string[];
  region: string;
}

export interface FilterConfig {
  availableLanguages: { code: string; label: string; color: string }[];
  availableHosts: string[];
  stats: {
    totalReaders: number;
    movieReaders: number;
    seriesReaders: number;
    animeReaders: number;
    readersEnabled: number;
    readersWithTmdb: number;
  };
}

interface AdvancedFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  config: FilterConfig;
  onReset: () => void;
}

const REGIONS = [
  'All regions',
  'France', 'United States', 'United Kingdom', 'Canada', 'Germany', 'Spain', 'Italy', 'Netherlands',
  'Belgium', 'Switzerland', 'Austria', 'Poland', 'Russia', 'Japan', 'South Korea', 'China', 'India',
  'Brazil', 'Mexico', 'Argentina', 'Australia', 'New Zealand', 'Singapore', 'Thailand', 'Vietnam',
  'Turkey', 'Saudi Arabia', 'Dubai', 'Egypt', 'South Africa', 'Nigeria', 'Kenya', 'Morocco'
];

export const defaultFilters: FilterState = {
  search: '',
  mediaType: 'all',
  enabled: 'all',
  language: 'all',
  tmdbLinked: 'all',
  dateFrom: '',
  dateTo: '',
  minEpisodes: '',
  maxEpisodes: '',
  hosts: [],
  region: 'All regions'
};

export function AdvancedFilters({ filters, onFiltersChange, config, onReset }: AdvancedFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.mediaType !== 'all') count++;
    if (filters.enabled !== 'all') count++;
    if (filters.language !== 'all') count++;
    if (filters.tmdbLinked !== 'all') count++;
    if (filters.dateFrom) count++;
    if (filters.dateTo) count++;
    if (filters.minEpisodes) count++;
    if (filters.maxEpisodes) count++;
    if (filters.hosts.length > 0) count++;
    if (filters.region !== 'All regions') count++;
    return count;
  }, [filters]);

  const updateFilter = useCallback(<K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  }, [filters, onFiltersChange]);

  const toggleHost = useCallback((host: string) => {
    const newHosts = filters.hosts.includes(host)
      ? filters.hosts.filter(h => h !== host)
      : [...filters.hosts, host];
    updateFilter('hosts', newHosts);
  }, [filters.hosts, updateFilter]);

  const handleReset = useCallback(() => {
    onReset();
    setIsExpanded(false);
  }, [onReset]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, URL, ID TMDB..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={filters.mediaType} onValueChange={(v) => updateFilter('mediaType', v as FilterState['mediaType'])}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Type de média" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types ({config.stats.totalReaders})</SelectItem>
            <SelectItem value="movie">
              <div className="flex items-center gap-2">
                <Film className="w-3 h-3 text-blue-500" />
                Films ({config.stats.movieReaders})
              </div>
            </SelectItem>
            <SelectItem value="tv">
              <div className="flex items-center gap-2">
                <Tv className="w-3 h-3 text-green-500" />
                Séries TV ({config.stats.seriesReaders})
              </div>
            </SelectItem>
            <SelectItem value="anime">
              <div className="flex items-center gap-2">
                <Star className="w-3 h-3 text-pink-500" />
                Anime ({config.stats.animeReaders})
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.enabled} onValueChange={(v) => updateFilter('enabled', v as FilterState['enabled'])}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="État" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="enabled">Activées ({config.stats.readersEnabled})</SelectItem>
            <SelectItem value="disabled">Désactivées ({config.stats.totalReaders - config.stats.readersEnabled})</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant={isExpanded ? "secondary" : "outline"}
          onClick={() => setIsExpanded(!isExpanded)}
          className="gap-2"
        >
          <Filter className="w-4 h-4" />
          Filtres avancés
          {activeFiltersCount > 0 && (
            <Badge variant="default" className="h-5 px-1.5 text-xs">
              {activeFiltersCount}
            </Badge>
          )}
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>

        {activeFiltersCount > 0 && (
          <Button variant="ghost" onClick={handleReset} className="gap-2" title="Réinitialiser les filtres">
            <RotateCcw className="w-4 h-4" />
          </Button>
        )}
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-secondary/20 rounded-lg border border-border/50 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm">
                    <Globe className="w-3 h-3" />
                    Région/Pays
                  </Label>
                  <Select value={filters.region} onValueChange={(v) => updateFilter('region', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All regions" />
                    </SelectTrigger>
                    <SelectContent>
                      {REGIONS.map(region => (
                        <SelectItem key={region} value={region}>
                          {region}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm">
                    <Globe className="w-3 h-3" />
                    Langue
                  </Label>
                  <Select value={filters.language} onValueChange={(v) => updateFilter('language', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Toutes les langues" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les langues</SelectItem>
                      {config.availableLanguages.map(lang => (
                        <SelectItem key={lang.code} value={lang.code}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-2 h-2 rounded-full" 
                              style={{ backgroundColor: lang.color }} 
                            />
                            {lang.label} ({lang.code})
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm">
                    <Database className="w-3 h-3" />
                    Liaison TMDB
                  </Label>
                  <Select value={filters.tmdbLinked} onValueChange={(v) => updateFilter('tmdbLinked', v as FilterState['tmdbLinked'])}>
                    <SelectTrigger>
                      <SelectValue placeholder="Toutes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes</SelectItem>
                      <SelectItem value="linked">Liées à TMDB ({config.stats.readersWithTmdb})</SelectItem>
                      <SelectItem value="unlinked">Non liées ({config.stats.totalReaders - config.stats.readersWithTmdb})</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm">
                    <Calendar className="w-3 h-3" />
                    Date de création (depuis)
                  </Label>
                  <Input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => updateFilter('dateFrom', e.target.value)}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm">
                    <Calendar className="w-3 h-3" />
                    Date de création (jusqu'à)
                  </Label>
                  <Input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => updateFilter('dateTo', e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>

              {config.availableHosts.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm">Hébergeurs vidéo</Label>
                  <div className="flex flex-wrap gap-2">
                    {config.availableHosts.slice(0, 15).map(host => (
                      <Badge
                        key={host}
                        variant={filters.hosts.includes(host) ? "default" : "outline"}
                        className="cursor-pointer transition-colors"
                        onClick={() => toggleHost(host)}
                      >
                        {host}
                        {filters.hosts.includes(host) && (
                          <X className="w-3 h-3 ml-1" />
                        )}
                      </Badge>
                    ))}
                    {config.availableHosts.length > 15 && (
                      <Badge variant="secondary" className="text-xs">
                        +{config.availableHosts.length - 15} autres
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {activeFiltersCount > 0 && (
                <div className="flex items-center justify-between pt-2 border-t border-border/30">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Filter className="w-4 h-4" />
                    {activeFiltersCount} filtre{activeFiltersCount > 1 ? 's' : ''} actif{activeFiltersCount > 1 ? 's' : ''}
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleReset} className="gap-2">
                    <RotateCcw className="w-3 h-3" />
                    Réinitialiser tout
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function applyFilters<T extends {
  label?: string;
  url?: string;
  media_type?: string;
  language?: string;
  enabled?: boolean;
  tmdb_id?: number | null;
  created_at?: string;
}>(items: T[], filters: FilterState): T[] {
  return items.filter(item => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch = 
        item.label?.toLowerCase().includes(searchLower) ||
        item.url?.toLowerCase().includes(searchLower) ||
        String(item.tmdb_id || '').includes(searchLower);
      if (!matchesSearch) return false;
    }

    if (filters.mediaType !== 'all') {
      if (item.media_type !== filters.mediaType) return false;
    }

    if (filters.enabled !== 'all') {
      const isEnabled = filters.enabled === 'enabled';
      if (item.enabled !== isEnabled) return false;
    }

    if (filters.language !== 'all') {
      if (item.language !== filters.language) return false;
    }

    if (filters.tmdbLinked !== 'all') {
      const isLinked = !!item.tmdb_id;
      if (filters.tmdbLinked === 'linked' && !isLinked) return false;
      if (filters.tmdbLinked === 'unlinked' && isLinked) return false;
    }

    if (filters.dateFrom && item.created_at) {
      const itemDate = new Date(item.created_at);
      const fromDate = new Date(filters.dateFrom);
      if (itemDate < fromDate) return false;
    }

    if (filters.dateTo && item.created_at) {
      const itemDate = new Date(item.created_at);
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      if (itemDate > toDate) return false;
    }

    if (filters.hosts.length > 0 && item.url) {
      try {
        const url = new URL(item.url);
        const hostname = url.hostname.toLowerCase();
        const matchesHost = filters.hosts.some(host => 
          hostname.includes(host.toLowerCase())
        );
        if (!matchesHost) return false;
      } catch {
        return false;
      }
    }

    return true;
  });
}
