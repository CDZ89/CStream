import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import {
    get111477Downloads,
    getMovieboxDownloads,
    getMoviesmodDownloads,
    getVidzeeDownloads,
    getAgDownloads,
    getMadplayDownloads
} from '@/lib/downloadScrapers';

export const DownloadsSection = ({ mediaItem, mediaType, tmdbId, imdbId }: any) => {
    const [downloads, setDownloads] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasFetched, setHasFetched] = useState(false);

    const fetchDownloads = async () => {
        setLoading(true);
        setHasFetched(true);
        try {
            const results = await Promise.allSettled([
                get111477Downloads({ mediaItem, mediaType }),
                getMovieboxDownloads({ tmdbId, mediaItem, mediaType }),
                imdbId ? getMoviesmodDownloads({ imdbId, mediaType }) : Promise.resolve([]),
                getVidzeeDownloads(tmdbId, mediaType),
                getAgDownloads({ tmdbId, mediaItem, mediaType }),
                getMadplayDownloads({ mediaItem, mediaType })
            ]);

            const allDownloads = results
                .filter((r): r is PromiseFulfilledResult<any[]> => r.status === 'fulfilled')
                .flatMap(r => (r as any).value)
                .filter(d => !!d?.url);

            // Remove duplicates by URL
            const unique = Array.from(new Map(allDownloads.map(item => [item.url, item])).values());
            setDownloads(unique);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-3xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-widest text-white/30 flex items-center gap-2">
                    <Download className="w-4 h-4 text-purple-400" />
                    Téléchargements
                </h3>
                {!hasFetched && !loading && (
                    <Button variant="outline" size="sm" onClick={fetchDownloads} className="text-[10px] h-7 px-3 bg-purple-600/10 border-purple-500/20 text-purple-400 hover:bg-purple-600/30">
                        Chercher
                    </Button>
                )}
            </div>

            {loading && (
                <div className="flex items-center justify-center p-6">
                    <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                </div>
            )}

            {hasFetched && !loading && downloads.length === 0 && (
                <p className="text-xs text-zinc-500 text-center py-4">Aucun lien trouvé.</p>
            )}

            {downloads.length > 0 && (
                <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                    {downloads.map((d, i) => (
                        <a key={i} href={d.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors border border-white/5 group">
                            <Download className="w-4 h-4 text-zinc-400 group-hover:text-white" />
                            <div className="flex flex-col min-w-0 flex-1">
                                <span className="text-sm font-medium text-zinc-200 truncate">{d.title || `Lien direct ${i + 1}`}</span>
                                <span className="text-[10px] text-zinc-500 truncate">{new URL(d.url.startsWith('/') ? 'https://moviesmod.cards' : d.url).hostname.replace('www.', '')}</span>
                            </div>
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
};
