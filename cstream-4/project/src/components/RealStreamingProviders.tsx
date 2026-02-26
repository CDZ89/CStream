import { useMemo, useState } from 'react';
import { tmdbApi } from '@/lib/tmdb';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';

interface WatchProvider {
  logo_path: string;
  provider_id: number;
  provider_name: string;
}

interface RealStreamingProvidersProps {
  movie?: any;
  tv?: any;
}

const MAX_DISPLAY = 6;

export const RealStreamingProviders = ({ movie, tv }: RealStreamingProvidersProps) => {
  const [showAll, setShowAll] = useState(false);
  
  console.log('[RealStreamingProviders] Rendering with movie:', movie?.id, 'tv:', tv?.id);

  const providers = useMemo(() => {
    const data = movie || tv;
    console.log('[RealStreamingProviders] Data received:', data?.id);
    if (!data) {
      console.log('[RealStreamingProviders] No data provided');
      return [];
    }

    // Essaie différentes clés pour accéder aux watch/providers
    let watchData = data['watch/providers'] || data.watch_providers || data['watch_providers'];
    
    if (!watchData?.results) {
      console.log('[RealStreamingProviders] No watch/providers data found');
      return [];
    }

    const region = 'FR';
    const regionData = watchData.results[region];
    
    if (!regionData) {
      console.log('[RealStreamingProviders] No data for region FR');
      return [];
    }

    // Priorité: flatrate (abonnement) > rent (location) > buy (achat)
    const allProviders = regionData.flatrate || regionData.rent || regionData.buy || [];
    
    if (allProviders.length > 0) {
      console.log(`[RealStreamingProviders] Found ${allProviders.length} providers for FR:`, allProviders);
    }
    
    return allProviders;
  }, [movie, tv]);

  if (providers.length === 0) {
    return null;
  }

  const displayedProviders = showAll ? providers : providers.slice(0, MAX_DISPLAY);
  const hasMore = providers.length > MAX_DISPLAY;

  return (
    <Card className="overflow-hidden bg-gradient-to-br from-slate-900 to-slate-950 border-slate-800">
      <CardContent className="p-4 sm:p-6">
        <p className="text-xs text-muted-foreground mb-4 font-semibold uppercase tracking-wide">
          Disponible sur
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {displayedProviders.map((provider: WatchProvider) => (
            <div
              key={provider.provider_id}
              className="flex flex-col items-center gap-2 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/10 hover:border-primary/50 group cursor-pointer"
              title={provider.provider_name}
            >
              {provider.logo_path && (
                <img
                  src={tmdbApi.getImageUrl(provider.logo_path, 'w200')}
                  alt={provider.provider_name}
                  className="h-10 w-10 object-contain rounded group-hover:scale-110 transition-transform"
                  loading="lazy"
                />
              )}
              <span className="text-xs font-medium text-white/80 text-center line-clamp-2">
                {provider.provider_name}
              </span>
            </div>
          ))}
        </div>

        {hasMore && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAll(!showAll)}
            className="w-full mt-4 gap-2"
          >
            {showAll ? 'Afficher moins' : `Voir +${providers.length - MAX_DISPLAY} autres`}
            <ChevronDown className={`w-4 h-4 transition-transform ${showAll ? 'rotate-180' : ''}`} />
          </Button>
        )}

        <p className="text-xs text-muted-foreground mt-4 text-center">
          Offres disponibles en {new Date().toLocaleDateString('fr-FR', { month: 'long' })}
        </p>
      </CardContent>
    </Card>
  );
};
