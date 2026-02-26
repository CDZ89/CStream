import React, { useState, useEffect } from 'react';
import { Download, X, Lock, Loader2, HardDrive, Music, Link2 } from 'lucide-react';
import { useBetaSettings } from '@/hooks/useBetaSettings';
import {
    get111477Downloads,
    getMovieboxDownloads,
    getMoviesmodDownloads,
    getT4tsaDownloads,
    getVidzeeDownloads,
    getAgDownloads,
    getMadplayDownloads
} from '@/lib/downloadScrapers';

interface DownloadActionsProps {
    tmdbId: string | number;
    title: string;
    mediaType: "movie" | "tv";
    mediaItem?: any;
    season?: number;
    episode?: number;
    imdbId?: string;
}

export const DownloadActions = ({ tmdbId, title, mediaType, mediaItem, season, episode, imdbId }: DownloadActionsProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [scrapedLinks, setScrapedLinks] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const { betaMode } = useBetaSettings();

    // Configuration par défaut
    const defaultActions = [
        {
            type: 'download',
            name: 'Téléchargement Direct (Quickwatch Scraper)',
            url: `https://quickwatch.co/api/download/${mediaType}/${tmdbId}`,
            icon: <HardDrive className="w-5 h-5 text-purple-400" />
        },
        {
            type: 'download',
            name: 'Téléchargement Torrent (Alternative)',
            url: `https://ton-scraper-torrent.com/search?tmdb=${tmdbId}`,
            icon: <Link2 className="w-5 h-5 text-blue-400" />
        },
        {
            type: 'music',
            name: 'Écouter l\'OST (Music Proxy)',
            url: `https://ton-proxy-music.com/soundtrack/${tmdbId}`,
            icon: <Music className="w-5 h-5 text-pink-400" />
        }
    ];

    useEffect(() => {
        if (!isOpen || !betaMode) return;

        const fetchLinks = async () => {
            setLoading(true);
            try {
                // Exécute tous les scrapers en parallèle sans bloquer si l'un d'eux échoue
                const promises = [
                    get111477Downloads({ mediaItem, mediaType }),
                    getMovieboxDownloads({ tmdbId, mediaItem, mediaType, season, episode }),
                    getMoviesmodDownloads({ imdbId, mediaType }),
                    getT4tsaDownloads({ imdbId, mediaItem, mediaType }),
                    getVidzeeDownloads({ tmdbId, mediaType, mediaItem }),
                    getAgDownloads({ tmdbId, mediaItem, mediaType }),
                    getMadplayDownloads({ mediaItem, mediaType })
                ];

                const results = await Promise.allSettled(promises);
                let allLinks: any[] = [];

                results.forEach((result) => {
                    if (result.status === 'fulfilled' && Array.isArray(result.value)) {
                        allLinks = [...allLinks, ...result.value];
                    }
                });

                // Retire les doublons basés sur l'URL
                const uniqueLinks = Array.from(new Map(allLinks.map(item => [item.url, item])).values());
                setScrapedLinks(uniqueLinks);
            } catch (err) {
                console.error("Erreur de scraping globale:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchLinks();
    }, [isOpen, betaMode, tmdbId, mediaItem, mediaType, season, episode, imdbId]);

    return (
        <div className="mt-0">
            <button
                onClick={() => setIsOpen(true)}
                className="w-full md:w-auto px-6 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-white rounded-xl font-semibold flex justify-center items-center gap-2 transition-all shadow-lg h-10 sm:h-11 text-sm sm:text-base relative overflow-hidden group"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                {!betaMode ? <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-400" /> : <Download className="w-4 h-4 sm:w-5 sm:h-5 text-white" />}
                <span className="relative z-10">Installer / Télécharger</span>
            </button>

            {/* Modal / Overlay de sélection */}
            {isOpen && (
                <div className="fixed inset-0 z-[150] flex flex-col items-center justify-end md:justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
                    <div className="bg-[#121212]/95 border border-zinc-800/80 w-full max-w-xl rounded-t-3xl md:rounded-3xl p-6 md:p-8 animate-in slide-in-from-bottom-10 md:zoom-in-95 duration-300 shadow-2xl flex flex-col max-h-[85vh]">

                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-xl md:text-2xl font-bold text-white mb-1">Téléchargements</h3>
                                <p className="text-sm text-zinc-400 font-medium">Sources disponibles pour {title}</p>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="bg-zinc-800/50 p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all flex-shrink-0">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {!betaMode ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-zinc-800/50 flex items-center justify-center border border-zinc-700/50">
                                    <Lock className="w-8 h-8 text-zinc-500" />
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold text-white mb-2">Accès Restreint</h4>
                                    <p className="text-sm text-zinc-400 max-w-sm mx-auto leading-relaxed">
                                        Les modules de téléchargement avancés et le scraping P2P nécessitent l'activation du mode <strong>Beta Publique</strong> dans vos paramètres.
                                    </p>
                                </div>
                                <a href="/settings" className="mt-4 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-colors">
                                    Ouvrir les paramètres
                                </a>
                            </div>
                        ) : (
                            <div className="space-y-4 overflow-y-auto custom-scrollbar pr-2 pb-2">
                                {/* Default Options */}
                                <div className="space-y-2.5">
                                    <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider pl-1 mb-2">Partenaires Officiels</h4>
                                    {defaultActions.map((action, index) => (
                                        <a
                                            key={index}
                                            href={action.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-full flex items-center justify-between p-4 bg-zinc-800/40 hover:bg-zinc-800/80 border border-zinc-700/50 hover:border-zinc-500 rounded-2xl transition-all group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="p-2 bg-black/40 rounded-xl group-hover:scale-110 transition-transform">
                                                    {action.icon}
                                                </div>
                                                <span className="text-zinc-200 font-semibold text-sm md:text-base">{action.name}</span>
                                            </div>
                                            <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider bg-zinc-700/50 text-zinc-300 px-3 py-1.5 rounded-full group-hover:bg-zinc-600 group-hover:text-white transition-colors">
                                                Ouvrir
                                            </span>
                                        </a>
                                    ))}
                                </div>

                                {/* Scraped Links */}
                                <div className="pt-4 space-y-2.5">
                                    <div className="flex items-center justify-between pl-1 mb-2">
                                        <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Liens de Scraping Avancé</h4>
                                        {loading && <Loader2 className="w-3.5 h-3.5 text-purple-400 animate-spin" />}
                                    </div>

                                    {loading && scrapedLinks.length === 0 ? (
                                        <div className="py-8 flex flex-col items-center justify-center gap-3">
                                            <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
                                            <p className="text-sm text-zinc-500 animate-pulse">Recherche sur le réseau P2P...</p>
                                        </div>
                                    ) : scrapedLinks.length === 0 ? (
                                        <p className="text-sm text-zinc-500 bg-zinc-800/30 border border-zinc-800 rounded-xl p-4 text-center">Aucun lien avancé n'a été trouvé pour ce média.</p>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                            {scrapedLinks.map((link, idx) => (
                                                <a
                                                    key={idx}
                                                    href={link.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="w-full flex items-center gap-3 p-3 bg-zinc-800/30 hover:bg-purple-900/20 border border-zinc-800 hover:border-purple-500/50 rounded-xl transition-all group"
                                                >
                                                    <Download className="w-4 h-4 text-zinc-500 group-hover:text-purple-400 transition-colors" />
                                                    <span className="text-zinc-300 text-sm font-medium line-clamp-1 group-hover:text-white">{link.title || 'Lien Direct'}</span>
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            )}
        </div>
    );
};
