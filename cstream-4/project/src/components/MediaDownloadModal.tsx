import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, AlertCircle, Loader2, HardDrive, Film, Tv } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useI18n } from '@/lib/i18n';

interface DownloadLink {
    url: string;
    type: string;
    quality?: string;
    size?: string;
}

interface MediaDownloadModalProps {
    isOpen: boolean;
    onClose: () => void;
    mediaItem: any;
    mediaType: "movie" | "tv";
}

export const MediaDownloadModal = ({ isOpen, onClose, mediaItem, mediaType }: MediaDownloadModalProps) => {
    const [links, setLinks] = useState<DownloadLink[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { t } = useI18n();

    useEffect(() => {
        const fetchDownloads = async () => {
            if (!isOpen || !mediaItem) return;

            setIsLoading(true);
            setError(null);
            setLinks([]);

            try {
                const tmdbTitle = mediaItem?.title || mediaItem?.name;
                const releaseYear = mediaItem?.release_date?.slice(0, 4) || mediaItem?.first_air_date?.slice(0, 4) || '';
                const searchName = (tmdbTitle || '').replace(/:/g, ' - ');
                const listingUrl = mediaType === 'tv' ? 'https://a.111477.xyz/tvs/' : 'https://a.111477.xyz/movies/';

                // We use a cors proxy because a.111477.xyz likely doesn't have CORS enabled for browser fetching
                const corsProxy = 'https://corsproxy.io/?';
                const encodedUrl = encodeURIComponent(listingUrl);

                const listingHtml = await fetch(`${corsProxy}${encodedUrl}`, {
                    headers: { 'User-Agent': navigator.userAgent }
                }).then(r => r.text());

                if (!listingHtml) throw new Error("No response from index server");

                const parser = new DOMParser();
                const listingDoc = parser.parseFromString(listingHtml, 'text/html');
                const rows = listingDoc.querySelectorAll('tr[data-name][data-url]');

                // Find exact or closest match
                let targetRow = Array.from(rows).find((row) => {
                    const dataName = row.getAttribute('data-name') || '';
                    const normalized = dataName.toLowerCase();
                    return normalized.includes(searchName.toLowerCase()) && (!releaseYear || normalized.includes(releaseYear));
                });

                if (!targetRow) {
                    targetRow = Array.from(rows).find((row) => {
                        const dataName = row.getAttribute('data-name') || '';
                        return dataName.toLowerCase().includes(searchName.toLowerCase());
                    });
                }

                if (!targetRow) {
                    setError("Aucun lien de téléchargement direct trouvé pour ce titre.");
                    setIsLoading(false);
                    return;
                }

                const detailHref = targetRow.getAttribute('data-url');
                if (!detailHref) throw new Error("Invalid detail link");

                let detailUrl = detailHref;
                if (detailUrl.startsWith('/')) detailUrl = `https://a.111477.xyz${detailUrl}`;
                else if (!detailUrl.startsWith('http')) detailUrl = `https://a.111477.xyz/${detailUrl}`;

                const encodedDetailUrl = encodeURIComponent(detailUrl);
                const detailHtml = await fetch(`${corsProxy}${encodedDetailUrl}`, {
                    headers: { 'User-Agent': navigator.userAgent }
                }).then(r => r.text());

                if (!detailHtml) throw new Error("Failed to load detail page");

                const detailDoc = parser.parseFromString(detailHtml, 'text/html');
                const downloadNodes = detailDoc.querySelectorAll('a[href][class*="maxbutton"]');

                const extractedLinks = Array.from(downloadNodes).map((node) => {
                    const titleText = node.textContent || 'Lien de téléchargement';
                    // Try to extract quality or size from text content if possible
                    const qualityMatch = titleText.match(/(1080p|720p|4K|2160p)/i);
                    const sizeMatch = titleText.match(/(\d+(?:\.\d+)?\s*(?:GB|MB|Go|Mo))/i);

                    return {
                        url: node.getAttribute('href') || '',
                        type: 'download',
                        quality: qualityMatch ? qualityMatch[1] : 'Direct',
                        size: sizeMatch ? sizeMatch[1] : undefined,
                        rawText: titleText.trim()
                    };
                }).filter(link => link.url && link.url.startsWith('http'));

                if (extractedLinks.length === 0) {
                    setError("Les liens de téléchargement sont actuellement hors service ou inaccessibles.");
                } else {
                    setLinks(extractedLinks as DownloadLink[]);
                }

            } catch (err: any) {
                console.error("Scraping error:", err);
                setError("Erreur technique lors de la recherche des fichiers (CORS ou Serveur).");
            } finally {
                setIsLoading(false);
            }
        };

        if (isOpen) {
            fetchDownloads();
        }
    }, [isOpen, mediaItem, mediaType]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md bg-[#12141c]/95 backdrop-blur-3xl border-white/10 text-white rounded-2xl overflow-hidden p-0">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="flex items-center gap-3 text-xl font-bold">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                            <HardDrive className="w-5 h-5 text-blue-400" />
                        </div>
                        <span>Télécharger {mediaType === "movie" ? "le film" : "la série"}</span>
                    </DialogTitle>
                    <p className="text-white/50 text-sm mt-1 flex gap-2 items-center">
                        {mediaType === 'movie' ? <Film className="w-4 h-4" /> : <Tv className="w-4 h-4" />}
                        {mediaItem?.title || mediaItem?.name}
                    </p>
                </DialogHeader>

                <div className="p-6 pt-4 min-h-[200px] flex flex-col">
                    {isLoading ? (
                        <div className="flex-1 flex flex-col items-center justify-center py-8 space-y-4">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                            <p className="text-white/50 text-sm animate-pulse">Recherche des fichiers disponibles sur les serveurs 111z...</p>
                        </div>
                    ) : error ? (
                        <div className="flex-1 flex flex-col items-center justify-center py-8 text-center space-y-3">
                            <div className="w-12 h-12 rounded-full bg-red-400/10 flex items-center justify-center">
                                <AlertCircle className="w-6 h-6 text-red-400" />
                            </div>
                            <p className="text-red-300/90 text-sm max-w-[250px]">{error}</p>
                        </div>
                    ) : links.length > 0 ? (
                        <div className="space-y-3">
                            <p className="text-xs font-bold uppercase tracking-wider text-white/40 mb-3">{links.length} Liens Directs (HD/4K)</p>
                            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {links.map((link, idx) => (
                                    <motion.a
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        key={idx}
                                        href={link.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-blue-500/30 transition-all group"
                                    >
                                        <div className="flex flex-col">
                                            <span className="font-bold text-sm text-white group-hover:text-blue-400 transition-colors">
                                                Lien Serveur Prive {idx + 1}
                                            </span>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-xs bg-black/40 text-white/70 px-2 py-0.5 rounded-md font-medium">{link.quality || 'Auto'}</span>
                                                {link.size && <span className="text-xs text-white/40">{link.size}</span>}
                                            </div>
                                        </div>
                                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 shrink-0">
                                            <Download className="w-4 h-4 mr-2" />
                                            Télécharger
                                        </Button>
                                    </motion.a>
                                ))}
                            </div>
                        </div>
                    ) : null}
                </div>
            </DialogContent>
        </Dialog>
    );
};
