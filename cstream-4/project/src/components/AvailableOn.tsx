import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronDown, ExternalLink } from 'lucide-react';
import { tmdbApi } from '@/lib/tmdb';

interface WatchProvider {
  logo_path: string;
  provider_id: number;
  provider_name: string;
}

interface AvailableOnProps {
  movie?: any;
  tv?: any;
  watchProvidersData?: any;
}

const PROVIDER_URLS: Record<string, string> = {
  'Netflix': 'https://www.netflix.com',
  'Disney Plus': 'https://www.disneyplus.com',
  'Amazon Prime Video': 'https://www.primevideo.com',
  'Apple TV': 'https://www.apple.com/tv',
  'HBO Max': 'https://www.hbomax.com',
  'Hulu': 'https://www.hulu.com',
  'Peacock': 'https://www.peacocktv.com',
  'Paramount Plus': 'https://www.paramountplus.com',
  'YouTube': 'https://www.youtube.com',
  'Google Play': 'https://play.google.com',
  'Apple TV+': 'https://www.apple.com/tv',
};

const MAX_DISPLAY = 6;

export const AvailableOn = ({ movie, tv, watchProvidersData }: AvailableOnProps) => {
  const [showAll, setShowAll] = useState(false);

  const allProviders: WatchProvider[] = [
    ...(watchProvidersData?.flatrate || []),
    ...(watchProvidersData?.rent || []),
    ...(watchProvidersData?.buy || []),
  ];
  
  // Deduplicate by provider_id
  const providers = Array.from(
    new Map(allProviders.map(p => [p.provider_id, p])).values()
  );

  if (providers.length === 0) {
    return null;
  }

  const displayedProviders = showAll ? providers : providers.slice(0, MAX_DISPLAY);
  const hasMore = providers.length > MAX_DISPLAY;

  return (
    <Card className="overflow-hidden bg-gradient-to-br from-blue-950/30 via-purple-950/20 to-pink-950/20 border-white/10 backdrop-blur-sm">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-400 to-pink-400 animate-pulse" />
          <p className="text-sm font-bold text-white uppercase tracking-widest">
            Regarder Maintenant
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
          {displayedProviders.map((provider: WatchProvider) => {
            const providerUrl = PROVIDER_URLS[provider.provider_name] || 'https://www.google.com/search?q=' + encodeURIComponent(provider.provider_name);
            
            return (
              <a
                key={provider.provider_id}
                href={providerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-gradient-to-br from-white/10 to-white/5 hover:from-white/20 hover:to-white/10 transition-all duration-300 border border-white/20 hover:border-primary/50 group cursor-pointer hover:shadow-xl hover:shadow-primary/20 hover:scale-105"
                title={`Regarder sur ${provider.provider_name}`}
              >
                {provider.logo_path && (
                  <div className="relative w-12 h-12 flex items-center justify-center">
                    <img
                      src={tmdbApi.getImageUrl(provider.logo_path, 'w200')}
                      alt={provider.provider_name}
                      className="h-10 w-10 object-contain rounded group-hover:scale-125 transition-transform duration-300 filter drop-shadow-md"
                      loading="lazy"
                    />
                  </div>
                )}
                <span className="text-[11px] font-semibold text-white/90 text-center line-clamp-2 group-hover:text-white transition-colors">
                  {provider.provider_name}
                </span>
                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-primary/70 group-hover:text-primary" />
              </a>
            );
          })}
        </div>

        {hasMore && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAll(!showAll)}
            className="w-full mt-4 gap-2 border-white/20 hover:border-primary/50 hover:bg-white/5"
          >
            {showAll ? 'Afficher moins' : `+${providers.length - MAX_DISPLAY} autres plateformes`}
            <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showAll ? 'rotate-180' : ''}`} />
          </Button>
        )}

        <p className="text-[11px] text-white/50 mt-4 text-center italic">
          Disponibilité selon votre région
        </p>
      </CardContent>
    </Card>
  );
};
