import React, { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { jikanApi } from '@/lib/jikan';
import { anilistApi } from '@/lib/anilist';
import { tmdbApi } from '@/lib/tmdb';
import { Loader2, Search, Play, Info, ChevronRight, X, ExternalLink, Calendar, Clock, Star, Tv, Database } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

export default function ConsumetTestPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('anime');
  const [apiSource, setApiSource] = useState<'anilist' | 'jikan' | 'tmdb'>('anilist');
  const [info, setInfo] = useState<any>(null);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [recs, setRecs] = useState<any[]>([]);
  const [showTrailer, setShowTrailer] = useState(false);

  const formatDate = (date: any) => {
    if (!date || !date.year) return 'N/A';
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    return `${date.day || ''} ${months[(date.month || 1) - 1]} ${date.year}`;
  };

  const handleSearch = async () => {
    if (!query) return;
    setLoading(true);
    setResults([]);
    setInfo(null);
    setRecs([]);
    try {
      if (apiSource === 'tmdb') {
        const type = activeTab === 'anime' ? 'tv' : 'movie';
        const data = (await tmdbApi.searchByType(query, type as any)) as any;
        if (data?.results) {
          setResults(data.results.map((m: any) => ({
            ...m,
            mal_id: m.id,
            title: m.title || m.name,
            images: { webp: { large_image_url: `https://image.tmdb.org/t/p/w500${m.poster_path}` } },
            score: m.vote_average
          })));
        }
      } else if (apiSource === 'jikan') {
        let data;
        if (activeTab === 'anime') data = await jikanApi.anime.search(query);
        else data = await jikanApi.manga.search(query);
        if (data?.data) setResults(data.data);
      } else {
        const type = activeTab === 'anime' ? 'ANIME' : 'MANGA';
        const data = await anilistApi.search(query, type);
        if (data?.data?.Page?.media) {
          setResults(data.data.Page.media.map((m: any) => ({
            ...m,
            mal_id: m.id,
            title: m.title.english || m.title.romaji,
            images: { webp: { large_image_url: m.coverImage.large } },
            score: m.averageScore / 10,
            format: m.format,
            year: m.startDate?.year
          })));
        }
      }
    } catch (e) {
      toast.error("Erreur API");
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (media: any) => {
    setLoadingInfo(true);
    setInfo(null);
    setRecs([]);
    try {
      if (apiSource === 'tmdb') {
        const type = activeTab === 'anime' ? 'tv' : 'movie';
        const data = (type === 'tv' ? await tmdbApi.getTVDetails(media.id) : await tmdbApi.getMovieDetails(media.id)) as any;
        if (data) {
          setInfo({
            ...data,
            title: data.title || data.name,
            synopsis: data.overview,
            score: data.vote_average,
            status: data.status,
            type: activeTab === 'anime' ? 'TV' : 'MOVIE',
            images: { webp: { large_image_url: `https://image.tmdb.org/t/p/w500${data.poster_path}` } }
          });
        }
      } else if (apiSource === 'jikan') {
        let data, recommendations;
        if (activeTab === 'anime') {
          data = await jikanApi.anime.info(media.mal_id);
          recommendations = await jikanApi.anime.recommendations(media.mal_id);
        } else {
          data = await jikanApi.manga.info(media.mal_id);
          recommendations = await jikanApi.manga.recommendations(media.mal_id);
        }
        if (data?.data) setInfo(data.data);
        if (recommendations?.data) setRecs(recommendations.data.slice(0, 6));
      } else {
        const data = await anilistApi.getInfo(media.id || media.mal_id);
        if (data?.data?.Media) {
          const m = data.data.Media;
          setInfo({
            ...m,
            title: m.title.english || m.title.romaji,
            synopsis: m.description?.replace(/<br>/g, '').replace(/<i>/g, '').replace(/<\/i>/g, ''),
            score: m.averageScore / 10,
            url: `https://anilist.co/anime/${m.id}`,
            trailer: m.trailer?.site === 'youtube' ? { embed_url: `https://www.youtube.com/embed/${m.trailer.id}` } : null,
            fullDate: formatDate(m.startDate)
          });
          if (m.recommendations?.nodes) {
            setRecs(m.recommendations.nodes.map((n: any) => ({
              entry: {
                id: n.mediaRecommendation.id,
                title: n.mediaRecommendation.title.romaji || n.mediaRecommendation.title.english,
                images: { webp: { large_image_url: n.mediaRecommendation.coverImage.large } }
              }
            })).slice(0, 8));
          }
        }
      }
    } catch (e) {
      toast.error("Données indisponibles");
    } finally {
      setLoadingInfo(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050508] text-white">
      <Navbar />
      <main className="container mx-auto px-4 pt-28 pb-12 max-w-7xl">
        <div className="flex flex-col gap-8 mb-12">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-5xl font-black italic tracking-tighter uppercase">Ultimate <span className="text-primary underline">Core</span></h1>
              <p className="text-white/30 font-bold uppercase tracking-widest text-xs">Propulsé par AniList GraphQL, Jikan & TMDB</p>
            </div>
            
            <div className="flex flex-wrap bg-white/5 p-1 rounded-xl border border-white/5 gap-1 shadow-2xl">
              <button 
                onClick={() => setApiSource('anilist')}
                className={`px-4 h-9 rounded-lg text-[10px] font-black uppercase transition-all ${apiSource === 'anilist' ? 'bg-primary text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
              >
                AniList (Elite)
              </button>
              <button 
                onClick={() => setApiSource('jikan')}
                className={`px-4 h-9 rounded-lg text-[10px] font-black uppercase transition-all ${apiSource === 'jikan' ? 'bg-primary text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
              >
                Jikan (MAL)
              </button>
              <button 
                onClick={() => setApiSource('tmdb')}
                className={`px-4 h-9 rounded-lg text-[10px] font-black uppercase transition-all ${apiSource === 'tmdb' ? 'bg-primary text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
              >
                TMDB (Classic)
              </button>
            </div>
          </div>
          
          <div className="flex gap-2 bg-white/5 p-1 rounded-2xl border border-white/5 max-w-2xl shadow-2xl">
            <Input 
              value={query} 
              onChange={(e) => setQuery(e.target.value)} 
              placeholder={`Rechercher via ${apiSource.toUpperCase()}...`}
              className="bg-transparent border-none focus-visible:ring-0 text-lg h-12"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={loading} className="rounded-xl h-12 px-6 bg-primary hover:bg-primary/80">
              {loading ? <Loader2 className="animate-spin" /> : <Search size={20} />}
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="bg-white/5 border border-white/5 p-1 h-12 rounded-xl">
            <TabsTrigger value="anime" className="rounded-lg data-[state=active]:bg-primary px-12 font-black italic tracking-tighter">ANIME</TabsTrigger>
            <TabsTrigger value="manga" className="rounded-lg data-[state=active]:bg-primary px-12 font-black italic tracking-tighter">MANGA</TabsTrigger>
          </TabsList>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-8 space-y-12">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {results.map((item) => (
                  <div key={item.id || item.mal_id} onClick={() => handleSelect(item)} className="group cursor-pointer">
                    <div className="aspect-[2/3] rounded-[32px] overflow-hidden border border-white/5 group-hover:border-primary/50 transition-all relative shadow-2xl">
                      <img src={item.images?.webp?.large_image_url || item.coverImage?.large} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-transparent to-transparent opacity-80" />
                      <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
                        <Badge className="bg-black/80 backdrop-blur-xl border-none font-black text-primary text-xs">{(item.score || 0).toFixed(1)}</Badge>
                        {item.format && <Badge className="bg-primary/20 text-primary border-none text-[9px] font-black uppercase tracking-tighter">{item.format}</Badge>}
                      </div>
                    </div>
                    <h3 className="mt-4 text-sm font-black line-clamp-1 group-hover:text-primary transition-colors uppercase italic tracking-tighter">{item.title}</h3>
                    <p className="text-[10px] text-white/30 font-bold uppercase">{item.year || item.seasonYear || item.release_date?.split('-')[0] || ''}</p>
                  </div>
                ))}
              </div>

              {recs.length > 0 && (
                <div className="space-y-8 pt-12 border-t border-white/5">
                  <div className="flex items-center gap-4">
                    <h2 className="text-3xl font-black italic tracking-tighter">RECOMMANDATIONS <span className="text-primary underline">PRO</span></h2>
                    <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                    {recs.map((rec: any) => (
                      <div key={rec.entry.id || rec.entry.mal_id} onClick={() => handleSelect(rec.entry)} className="group cursor-pointer">
                        <div className="aspect-[2/3] rounded-2xl overflow-hidden border border-white/5 group-hover:border-primary/50 transition-all">
                          <img src={rec.entry.images?.webp?.large_image_url || rec.entry.coverImage?.large} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                        </div>
                        <h4 className="mt-2 text-[9px] font-black line-clamp-1 opacity-40 group-hover:opacity-100 transition-opacity uppercase italic">{rec.entry.title}</h4>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-4">
              {info && (
                <div className="p-10 bg-white/5 rounded-[48px] border border-white/5 backdrop-blur-3xl space-y-8 sticky top-28 animate-in fade-in slide-in-from-right-8 overflow-hidden shadow-2xl">
                  <div className="absolute top-0 left-0 w-full h-64 opacity-20 blur-2xl">
                    <img src={info.images?.webp?.large_image_url || info.bannerImage} className="w-full h-full object-cover" />
                  </div>
                  
                  <div className="relative space-y-8">
                    <div className="space-y-6">
                      <div className="flex flex-wrap gap-2">
                         <Badge className="bg-primary text-white border-none px-4 py-1.5 text-[10px] font-black italic shadow-lg shadow-primary/20 tracking-tighter uppercase">{info.type || info.format}</Badge>
                         <Badge className="bg-white/10 text-white border-none px-4 py-1.5 text-[10px] font-black uppercase tracking-widest">{info.status}</Badge>
                         {info.rating && <Badge className="bg-white/10 text-white border-none px-4 py-1.5 text-[10px] font-black uppercase tracking-widest">{info.rating?.split(' ')[0]}</Badge>}
                      </div>
                      <h2 className="text-4xl font-black leading-[0.9] italic tracking-tighter uppercase">{info.title}</h2>
                      <div className="flex items-center gap-6 text-white/40 py-3 border-y border-white/5">
                        <div className="flex items-center gap-2"><Calendar size={14} className="text-primary" /><span className="text-[10px] font-black uppercase">{info.fullDate || info.release_date || 'N/A'}</span></div>
                        <div className="flex items-center gap-2"><Clock size={14} className="text-primary" /><span className="text-[10px] font-black uppercase">{info.duration || info.runtime || '?'} min</span></div>
                        <div className="flex items-center gap-2"><Star size={14} className="text-yellow-500 fill-yellow-500" /><span className="text-[10px] font-black text-white">{info.score?.toFixed(1) || '0.0'}</span></div>
                      </div>
                      <p className="text-xs text-white/50 leading-relaxed line-clamp-8 italic font-medium">{info.synopsis}</p>
                    </div>

                    <div className="space-y-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary/60 italic">Données de production</p>
                      <div className="grid grid-cols-1 gap-3">
                        {(info.studios?.nodes?.[0] || info.production_companies?.[0]) && (
                          <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all">
                            <Database size={18} className="text-primary" />
                            <div>
                              <p className="text-[9px] text-white/30 font-black uppercase">Studio Principal</p>
                              <p className="text-sm font-black italic tracking-tighter uppercase">{info.studios?.nodes?.[0]?.name || info.production_companies?.[0]?.name}</p>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5">
                          <Tv size={18} className="text-primary" />
                          <div>
                            <p className="text-[9px] text-white/30 font-black uppercase">Volume / Épisodes</p>
                            <p className="text-sm font-black italic tracking-tighter uppercase">{info.episodes || info.chapters || info.number_of_episodes || '?'} • {info.format || 'Standard'}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {info.genres && (
                      <div className="flex flex-wrap gap-2">
                        {info.genres.slice(0, 5).map((g: any) => (
                          <span key={g.name || g} className="text-[10px] font-black uppercase tracking-tighter text-white/20 px-3 py-2 bg-white/5 rounded-xl border border-white/5 hover:text-primary hover:border-primary transition-all cursor-default">{g.name || g}</span>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex gap-4 pt-4">
                      {info.trailer?.embed_url && (
                        <Button onClick={() => setShowTrailer(true)} className="flex-1 h-16 rounded-[24px] font-black italic text-xl bg-primary hover:bg-primary/80 shadow-2xl shadow-primary/20 group uppercase">
                          <Play size={24} className="mr-2 fill-current group-hover:scale-110 transition-transform duration-500" /> Trailer
                        </Button>
                      )}
                      <Button asChild variant="secondary" className="w-16 h-16 rounded-[24px] bg-white/5 border-white/5 hover:bg-white/10 p-0 shadow-2xl group transition-all">
                        <a href={info.url || `https://www.themoviedb.org/${activeTab === 'anime' ? 'tv' : 'movie'}/${info.id}`} target="_blank" rel="noopener noreferrer">
                          <ExternalLink size={24} className="group-hover:scale-110 transition-transform duration-500" />
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Tabs>

        {showTrailer && info?.trailer?.embed_url && (
          <div className="fixed inset-0 z-[100] bg-black/98 backdrop-blur-3xl flex items-center justify-center p-4">
            <Button onClick={() => setShowTrailer(false)} className="absolute top-8 right-8 rounded-full w-14 h-14 bg-white/10 hover:bg-white/20 border-none transition-all hover:rotate-90"><X size={32} /></Button>
            <div className="w-full max-w-6xl aspect-video rounded-[56px] overflow-hidden border border-white/10 shadow-[0_0_150px_rgba(139,92,246,0.3)] animate-in zoom-in-95 duration-500">
              <iframe 
                src={`${info.trailer.embed_url}?autoplay=1`}
                className="w-full h-full"
                allow="autoplay; fullscreen"
                allowFullScreen
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
