import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { anilistApi } from '@/lib/anilist';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ChevronLeft, Play, Tv, MessageSquare, Star, Heart, Bookmark, Share2 } from 'lucide-react';
import { useWatchHistory } from '@/hooks/useWatchHistory';
import { useAuth } from '@/hooks/useAuth';
import { SEO } from '@/components/SEO';
import { toast } from 'sonner';

interface TMDBEpisode {
  id: number;
  name: string;
  episode_number: number;
  season_number: number;
  overview?: string;
  still_path?: string;
}

interface TMDBShow {
  id: number;
  name: string;
  overview?: string;
  poster_path?: string;
  backdrop_path?: string;
  vote_average?: number;
  vote_count?: number;
  first_air_date?: string;
  status?: string;
  genres?: Array<{ id: number; name: string }>;
  number_of_seasons?: number;
  number_of_episodes?: number;
  seasons?: any[];
}

const AnimeAnilistDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { saveProgress } = useWatchHistory();
  
  const [show, setShow] = useState<TMDBShow | null>(null);
  const [loading, setLoading] = useState(true);
  const [isWatching, setIsWatching] = useState(false);
  const [selectedEpisode, setSelectedEpisode] = useState<number>(1);
  const [episodes, setEpisodes] = useState<TMDBEpisode[]>([]);
  
  useEffect(() => {
    const fetchShow = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const aniData = await anilistApi.getInfo(parseInt(id));
        if (aniData?.data?.Media) {
          const media = aniData.data.Media;
          const mappedShow: TMDBShow = {
            id: media.id,
            name: media.title.english || media.title.romaji || media.title.native,
            overview: media.description,
            poster_path: media.coverImage?.extraLarge || media.coverImage?.large || media.coverImage?.medium,
            backdrop_path: media.bannerImage || media.coverImage?.extraLarge || media.coverImage?.large,
            vote_average: media.averageScore / 10,
            vote_count: media.popularity,
            first_air_date: media.startDate?.year ? `${media.startDate.year}-${String(media.startDate.month || 1).padStart(2, '0')}-${String(media.startDate.day || 1).padStart(2, '0')}` : undefined,
            status: media.status,
            genres: media.genres?.map((g: string, i: number) => ({ id: i, name: g })),
            number_of_seasons: 1,
            number_of_episodes: media.episodes,
          };
          setShow(mappedShow);

          const aniEpisodes = Array.from({ length: media.episodes || 0 }, (_, i) => ({
            id: media.id * 1000 + (i + 1),
            name: `Épisode ${i + 1}`,
            episode_number: i + 1,
            season_number: 1,
            overview: `Regarder l'épisode ${i + 1} de ${media.title.romaji}`,
            still_path: media.coverImage.large
          }));
          setEpisodes(aniEpisodes as any);
          
          const epFromUrl = searchParams.get('episode');
          if (epFromUrl) {
            setSelectedEpisode(parseInt(epFromUrl));
            setIsWatching(true);
          }
        }
      } catch (err) {
        console.error('Failed to fetch anilist details:', err);
        toast.error('Erreur lors du chargement de l\'anime');
      } finally {
        setLoading(false);
      }
    };
    fetchShow();
  }, [id, searchParams]);

  const handleEpisodeClick = (epNum: number) => {
    setSelectedEpisode(epNum);
    setIsWatching(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (id) saveProgress(parseInt(id), 'anilist' as any, 1, epNum, 0);
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;
  if (!show) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="text-center"><h2 className="text-2xl font-bold mb-4">Anime introuvable</h2><Button onClick={() => navigate('/anime')}>Retour</Button></div></div>;

  return (
    <div className="min-h-screen bg-background text-foreground pb-20 overflow-x-hidden">
      <SEO 
        title={`${show.name} - CStream`}
        description={show.overview?.replace(/<[^>]*>/g, '') || `Regardez ${show.name} en streaming HD sur CStream.`}
        image={show.poster_path}
        type="video.tv_show"
      />
      <Navbar />

      <div className="container mx-auto px-4 py-8 mt-16">
        {isWatching ? (
          <div className="space-y-6 animate-in fade-in duration-500">
            <Button variant="ghost" onClick={() => setIsWatching(false)} className="mb-4 text-muted-foreground hover:text-white">
              <ChevronLeft className="mr-2 w-4 h-4" /> Retour aux détails
            </Button>
            
            <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-2xl bg-black border border-white/5 ring-1 ring-white/10 relative">
              <iframe
                src={`https://player.vidplus.to/anilist/${id}/${selectedEpisode}`}
                className="w-full h-full absolute inset-0"
                allowFullScreen
                frameBorder="0"
                allow="autoplay; encrypted-media; picture-in-picture"
              />
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-secondary/20 rounded-2xl border border-white/5 backdrop-blur-sm shadow-xl">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-xl md:text-2xl font-bold">{show.name}</h1>
                  <Badge className="bg-primary text-white font-black">EP {selectedEpisode}</Badge>
                </div>
                <p className="text-sm text-muted-foreground italic">Lecteur VidPlus - HD</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="rounded-xl border-white/10 gap-2 hover:bg-white/5">
                  <Share2 className="w-4 h-4" /> Partager
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Tv className="w-5 h-5 text-primary" /> Sélecteur d'épisodes
              </h2>
              <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
                {episodes.map(ep => (
                  <Button 
                    key={ep.episode_number}
                    variant={selectedEpisode === ep.episode_number ? "default" : "outline"}
                    onClick={() => handleEpisodeClick(ep.episode_number)}
                    className={`w-full rounded-xl transition-all duration-300 ${selectedEpisode === ep.episode_number ? 'shadow-lg shadow-primary/20' : 'border-white/5 hover:border-primary/50'}`}
                  >
                    {ep.episode_number}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 animate-in slide-in-from-bottom-4 duration-700">
            <div className="lg:col-span-3">
              <div className="relative group rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10">
                <img 
                  src={show.poster_path} 
                  alt={show.name} 
                  className="w-full h-auto transition-transform duration-700 group-hover:scale-105" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
              
              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Button className="w-full gap-2 rounded-xl bg-primary hover:bg-primary/90" onClick={() => handleEpisodeClick(1)}>
                    <Play className="w-4 h-4 fill-current" /> Regarder
                  </Button>
                  <Button variant="outline" className="w-full gap-2 rounded-xl border-white/10">
                    <Heart className="w-4 h-4" /> Favoris
                  </Button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-9 space-y-8">
              <div>
                <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tighter bg-gradient-to-r from-white via-white to-white/50 bg-clip-text text-transparent">
                  {show.name}
                </h1>
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 h-7 px-3">
                    <Star className="w-3 h-3 mr-1 fill-current" /> {show.vote_average?.toFixed(1)}
                  </Badge>
                  <span className="text-muted-foreground text-sm font-medium">{show.first_air_date?.split('-')[0]}</span>
                  <div className="flex flex-wrap gap-2">
                    {show.genres?.map(g => (
                      <Badge key={g.id} variant="outline" className="border-white/10 text-[10px] uppercase tracking-widest font-bold">
                        {g.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" /> Synopsis
                </h2>
                <div 
                  className="text-lg text-muted-foreground leading-relaxed prose prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: show.overview || "Aucun synopsis disponible." }}
                />
              </div>

              <div className="pt-8 border-t border-white/5">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                  <Tv className="w-6 h-6 text-primary" /> Liste des Épisodes ({show.number_of_episodes})
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                  {episodes.map(ep => (
                    <Button 
                      key={ep.episode_number}
                      variant="outline"
                      onClick={() => handleEpisodeClick(ep.episode_number)}
                      className="h-20 flex flex-col items-center justify-center gap-1 rounded-2xl border-white/5 hover:border-primary hover:bg-primary/5 transition-all group relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:to-primary/10 transition-all duration-500" />
                      <span className="text-[10px] opacity-50 uppercase font-black tracking-widest relative z-10">Épisode</span>
                      <span className="text-2xl font-black relative z-10">{ep.episode_number}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnimeAnilistDetail;