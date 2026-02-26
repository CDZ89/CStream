import React, { useState, useCallback } from 'react';
import { Download, X, Loader2, ExternalLink, ChevronDown, Film, Tv, Zap, CheckCircle, AlertCircle } from 'lucide-react';
import {
    get111477Downloads,
    getMovieboxDownloads,
    getMoviesmodDownloads,
    getT4tsaDownloads,
    getVidzeeDownloads,
    getAgDownloads,
    getMadplayDownloads,
} from '@/lib/downloadScrapers';

interface DownloadActionsProps {
    tmdbId: string | number;
    title: string;
    mediaType: 'movie' | 'tv';
    mediaItem?: any;
    season?: number;
    episode?: number;
    imdbId?: string;
}

interface DownloadLink {
    title?: string;
    url: string;
    type?: string;
    source?: string;
}

const SCRAPERS = [
    { id: '111477', label: '111477', color: 'from-violet-600 to-purple-700' },
    { id: 'moviebox', label: 'MovieBox', color: 'from-blue-600 to-cyan-600' },
    { id: 'moviesmod', label: 'MoviesMod', color: 'from-orange-600 to-amber-600' },
    { id: 't4tsa', label: 'T4TSA (TV)', color: 'from-green-600 to-emerald-600' },
    { id: 'vidzee', label: 'VidZee', color: 'from-pink-600 to-rose-600' },
    { id: 'ag', label: 'AG', color: 'from-red-600 to-orange-700' },
    { id: 'madplay', label: 'MadPlay', color: 'from-indigo-600 to-blue-700' },
];

export const DownloadActions = ({ tmdbId, title, mediaType, mediaItem, season, episode, imdbId }: DownloadActionsProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [links, setLinks] = useState<DownloadLink[]>([]);
    const [loading, setLoading] = useState(false);
    const [scraperStatus, setScraperStatus] = useState<Record<string, 'pending' | 'done' | 'error'>>({});
    const [fetched, setFetched] = useState(false);

    const fetchLinks = useCallback(async () => {
        if (fetched) return;
        setLoading(true);
        setFetched(true);

        const initial: Record<string, 'pending' | 'done' | 'error'> = {};
        SCRAPERS.forEach(s => { initial[s.id] = 'pending'; });
        setScraperStatus(initial);

        const scraperFns: Array<{ id: string; fn: () => Promise<any[]> }> = [
            {
                id: '111477',
                fn: () => get111477Downloads({ mediaItem, mediaType })
            },
            {
                id: 'moviebox',
                fn: () => getMovieboxDownloads({ tmdbId, mediaItem, mediaType, season, episode })
            },
            {
                id: 'moviesmod',
                fn: () => getMoviesmodDownloads({ imdbId, mediaType })
            },
            {
                id: 't4tsa',
                fn: () => getT4tsaDownloads({ imdbId, mediaItem, mediaType })
            },
            {
                id: 'vidzee',
                fn: () => getVidzeeDownloads(tmdbId, mediaType, mediaItem?.title || mediaItem?.name)
            },
            {
                id: 'ag',
                fn: () => getAgDownloads({ tmdbId, mediaItem, mediaType })
            },
            {
                id: 'madplay',
                fn: () => getMadplayDownloads({ mediaItem, mediaType })
            },
        ];

        // Run all scrapers concurrently, update results as each one finishes
        const allLinks: DownloadLink[] = [];
        const seen = new Set<string>();

        await Promise.allSettled(
            scraperFns.map(async ({ id, fn }) => {
                try {
                    const results = await fn();
                    const arr = Array.isArray(results) ? results.filter(Boolean) : [];
                    arr.forEach(link => {
                        if (link?.url && !seen.has(link.url)) {
                            seen.add(link.url);
                            allLinks.push({ ...link, source: id });
                        }
                    });
                    setScraperStatus(prev => ({ ...prev, [id]: 'done' }));
                } catch {
                    setScraperStatus(prev => ({ ...prev, [id]: 'error' }));
                }
                // Update links progressively
                setLinks([...allLinks]);
            })
        );

        setLinks([...allLinks]);
        setLoading(false);
    }, [fetched, tmdbId, mediaType, mediaItem, season, episode, imdbId]);

    const handleOpen = () => {
        setIsOpen(true);
        fetchLinks();
    };

    const getSourceBadge = (source?: string) => {
        const scraper = SCRAPERS.find(s => s.id === source);
        if (!scraper) return null;
        return (
            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded bg-gradient-to-r ${scraper.color} text-white uppercase tracking-wider`}>
                {scraper.label}
            </span>
        );
    };

    const doneCount = Object.values(scraperStatus).filter(s => s === 'done').length;
    const errorCount = Object.values(scraperStatus).filter(s => s === 'error').length;

    return (
        <div>
            {/* Trigger Button */}
            <button
                onClick={handleOpen}
                className="w-full md:w-auto px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/50 hover:border-purple-500/40 text-white rounded-xl font-bold flex items-center justify-center gap-2.5 transition-all shadow-lg h-11 text-sm relative overflow-hidden group"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-pink-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <Download className="w-4 h-4 text-purple-400 relative z-10" />
                <span className="relative z-10">Télécharger</span>
            </button>

            {/* Modal */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-[200] flex flex-col items-center justify-end md:justify-center bg-black/85 backdrop-blur-md"
                    onClick={e => { if (e.target === e.currentTarget) setIsOpen(false); }}
                >
                    <div className="bg-[#0e0e10] border border-white/[0.07] w-full max-w-2xl rounded-t-3xl md:rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-purple-600/20 flex items-center justify-center border border-purple-500/20">
                                    <Download className="w-4 h-4 text-purple-400" />
                                </div>
                                <div>
                                    <h3 className="font-black text-white text-base leading-tight">Téléchargements</h3>
                                    <p className="text-[11px] text-zinc-500 truncate max-w-[240px]">{title}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Scraper progress pills */}
                        <div className="px-6 py-3 border-b border-white/[0.05] flex-shrink-0">
                            <div className="flex flex-wrap gap-1.5 items-center">
                                <span className="text-[10px] text-zinc-600 font-bold uppercase mr-1">Sources :</span>
                                {SCRAPERS.map(s => {
                                    const status = scraperStatus[s.id] || 'pending';
                                    return (
                                        <div key={s.id} className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-bold transition-all ${status === 'done' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                                status === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                                    'bg-white/[0.04] text-zinc-600 border border-white/[0.04]'
                                            }`}>
                                            {status === 'done' ? <CheckCircle className="w-2.5 h-2.5" /> :
                                                status === 'error' ? <AlertCircle className="w-2.5 h-2.5" /> :
                                                    <Loader2 className="w-2.5 h-2.5 animate-spin" />}
                                            {s.label}
                                        </div>
                                    );
                                })}
                                {loading && (
                                    <span className="text-[9px] text-zinc-600 italic ml-1 animate-pulse">
                                        {doneCount}/{SCRAPERS.length} scrapeurs
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Links list */}
                        <div className="flex-1 overflow-y-auto p-5 space-y-2 min-h-[180px]">
                            {loading && links.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 gap-3">
                                    <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                                    <p className="text-sm text-zinc-500 animate-pulse">Recherche sur le réseau...</p>
                                </div>
                            ) : links.length === 0 && !loading ? (
                                <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
                                    <AlertCircle className="w-8 h-8 text-zinc-700" />
                                    <p className="text-sm font-bold text-zinc-500">Aucun lien de téléchargement trouvé</p>
                                    <p className="text-xs text-zinc-700">Ce média n'est pas encore disponible sur nos sources</p>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="text-xs font-black text-emerald-400">{links.length} lien{links.length > 1 ? 's' : ''} trouvé{links.length > 1 ? 's' : ''}</span>
                                        {loading && <Loader2 className="w-3 h-3 text-purple-400 animate-spin" />}
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {links.map((link, idx) => (
                                            <a
                                                key={idx}
                                                href={link.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-3 p-3.5 bg-white/[0.03] hover:bg-purple-500/10 border border-white/[0.05] hover:border-purple-500/30 rounded-xl transition-all group"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 group-hover:bg-purple-500/20 transition-colors">
                                                    <Download className="w-3.5 h-3.5 text-zinc-500 group-hover:text-purple-400 transition-colors" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-bold text-zinc-300 group-hover:text-white truncate leading-tight transition-colors">
                                                        {link.title || `Lien ${idx + 1}`}
                                                    </p>
                                                    <div className="flex items-center gap-1.5 mt-1">
                                                        {getSourceBadge(link.source)}
                                                    </div>
                                                </div>
                                                <ExternalLink className="w-3.5 h-3.5 text-zinc-700 group-hover:text-purple-400 flex-shrink-0 transition-colors" />
                                            </a>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-3 border-t border-white/[0.05] flex-shrink-0 flex items-center justify-between">
                            <p className="text-[10px] text-zinc-700">⚡ Propulsé par CStream Scraper Engine</p>
                            <button
                                onClick={() => { setFetched(false); setLinks([]); setScraperStatus({}); fetchLinks(); }}
                                className="text-[10px] text-zinc-600 hover:text-purple-400 transition-colors font-bold flex items-center gap-1"
                            >
                                <Loader2 className="w-3 h-3" /> Réessayer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
