import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Sparkles, Film, Tv, Play, Server, Database, Code, 
  ExternalLink, Copy, Check, Lock, Shield, Zap, 
  Globe, Layers, BookOpen, Settings, Terminal, Link as LinkIcon,
  BarChart3, TrendingUp, Users, Eye, Clock, Activity,
  Palette, Bell, Save, RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const STREAMING_APIS = [
  {
    id: 'frembed',
    name: 'Frembed',
    description: 'API française premium optimisée pour films et séries',
    baseUrl: 'https://frembed.buzz',
    endpoints: [
      { name: 'Film', url: '/api/film.php?id={tmdb_id}', example: '/api/film.php?id=695721' },
      { name: 'Série', url: '/api/serie.php?id={tmdb_id}&sa={season}&epi={episode}', example: '/api/serie.php?id=66732&sa=8&epi=7' },
    ],
    color: 'from-pink-500 to-rose-600',
    features: ['Optimisé FR', 'TMDB Sync', 'No Bug'],
  },
  {
    id: 'pstream',
    name: 'PStream',
    description: 'Lecteur stable et rapide avec support multi-langues',
    baseUrl: 'https://iframe.pstream.mov',
    endpoints: [
      { name: 'Film', url: '/media/tmdb-movie-{id}', example: '/media/tmdb-movie-550' },
      { name: 'Série', url: '/media/tmdb-tv-{id}/{s}/{e}', example: '/media/tmdb-tv-1396/1/1' },
    ],
    color: 'from-blue-600 to-indigo-700',
    features: ['Stable', 'Fast', 'Multi-lang'],
  },
  {
    id: 'vidplus',
    name: 'VidPlus',
    description: 'Source Anime et contenu global ultra-stable',
    baseUrl: 'https://player.vidplus.to',
    endpoints: [
      { name: 'Anime', url: '/embed/anime/{id}/{episode}?dub=false', example: '/embed/anime/1/1?dub=false' },
      { name: 'Film', url: '/embed/movie/{id}', example: '/embed/movie/550' },
      { name: 'Série', url: '/embed/tv/{id}/{s}/{e}', example: '/embed/tv/1396/1/1' },
    ],
    color: 'from-orange-500 to-red-600',
    features: ['Anime Focused', 'Ultra-Stable'],
  },
  {
    id: 'autoembed',
    name: 'AutoEmbed',
    description: 'API universelle pour films et séries avec multi-serveurs',
    baseUrl: 'https://player.autoembed.cc',
    endpoints: [
      { name: 'Film', url: '/embed/movie/{tmdb_id}', example: '/embed/movie/tt3359350' },
      { name: 'Série', url: '/embed/tv/{id}/{season}/{episode}', example: '/embed/tv/1396/1/1' },
    ],
    color: 'from-blue-500 to-cyan-500',
    features: ['Auto-update', 'HD Quality', 'Fast Servers'],
  },
  {
    id: 'vidsrc-me',
    name: 'VidSrc.me',
    description: 'Source historique et robuste pour films et séries',
    baseUrl: 'https://vidsrc.me',
    endpoints: [
      { name: 'Film', url: '/embed/movie?tmdb={id}', example: '/embed/movie?tmdb=550' },
      { name: 'Série', url: '/embed/tv?tmdb={id}&season={s}&episode={e}', example: '/embed/tv?tmdb=1396&season=1&episode=1' },
    ],
    color: 'from-blue-600 to-indigo-600',
    features: ['Legacy Support', 'High Uptime'],
  },
  {
    id: 'vidsrc-to',
    name: 'VidSrc.to',
    description: 'Version optimisée de VidSrc avec de nouveaux serveurs',
    baseUrl: 'https://vidsrc.to',
    endpoints: [
      { name: 'Film', url: '/embed/movie/{id}', example: '/embed/movie/550' },
      { name: 'Série', url: '/embed/tv/{id}/{s}/{e}', example: '/embed/tv/1396/1/1' },
    ],
    color: 'from-indigo-500 to-purple-600',
    features: ['New Servers', 'Better UI'],
  },
  {
    id: '2embed',
    name: '2Embed',
    description: 'API alternative stable pour un large catalogue',
    baseUrl: 'https://www.2embed.cc',
    endpoints: [
      { name: 'Film', url: '/embed/{id}', example: '/embed/550' },
      { name: 'Série', url: '/embedtv/{id}&s={s}&e={e}', example: '/embedtv/1396&s=1&e=1' },
    ],
    color: 'from-gray-600 to-slate-700',
    features: ['Broad Library', 'Stable Fallback'],
  },
  {
    id: 'bludclart',
    name: 'Bludclart',
    description: 'Nouveau - Lecteur TMDB ultra-optimisé et rapide',
    baseUrl: 'https://bludclart.com',
    endpoints: [
      { name: 'Film', url: '/movie/{id}/watch', example: '/movie/550/watch' },
      { name: 'Série', url: '/tv/{id}/watch?season={s}&episode={e}', example: '/tv/1396/watch?season=1&episode=1' },
    ],
    color: 'from-cyan-600 to-blue-700',
    features: ['TMDB Native', 'Ultra Fast'],
  },
  {
    id: 'embedso',
    name: 'Embed.so',
    description: 'Solution élégante sans publicités agressives',
    baseUrl: 'https://embed.so',
    endpoints: [
      { name: 'Film', url: '/embed/movie/{id}', example: '/embed/movie/550' },
      { name: 'Série', url: '/embed/tv/{id}/{s}/{e}', example: '/embed/tv/1396/1/1' },
    ],
    color: 'from-purple-400 to-pink-500',
    features: ['Ad-lite', 'Clean UI'],
  },
  {
    id: 'superembed',
    name: 'SuperEmbed',
    description: 'Plateforme multi-sources avec une grande flexibilité',
    baseUrl: 'https://multiembed.mov',
    endpoints: [
      { name: 'Film', url: '/directstream.php?video_id={id}&tmdb=1', example: '/directstream.php?video_id=550&tmdb=1' },
      { name: 'Série', url: '/directstream.php?video_id={id}&tmdb=1&s={s}&e={e}', example: '/directstream.php?video_id=1396&tmdb=1&s=1&e=1' },
    ],
    color: 'from-red-500 to-rose-600',
    features: ['Direct Stream', 'Multi-source'],
  },
  {
    id: 'smashy',
    name: 'Smashy Stream',
    description: 'Lecteur universel HD sans bug avec liste de serveurs',
    baseUrl: 'https://player.smashy.stream',
    endpoints: [
      { name: 'Film', url: '/movie/{tmdb_id}', example: '/movie/550' },
      { name: 'Série', url: '/tv/{id}?s={season}&e={episode}', example: '/tv/1396?s=1&e=1' },
    ],
    color: 'from-rose-500 to-pink-600',
    features: ['Universal HD', 'Multiple players'],
  },
  {
    id: 'warezcdn',
    name: 'WarezCDN',
    description: 'API haute performance pour contenus francophones et internationaux',
    baseUrl: 'https://embed.warezcdn.com',
    endpoints: [
      { name: 'Film', url: '/movie/{id}', example: '/movie/550' },
      { name: 'Série', url: '/tv/{id}/{s}/{e}', example: '/tv/1396/1/1' },
    ],
    color: 'from-orange-600 to-red-700',
    features: ['High Speed', 'Multi-audio'],
  },
  {
    id: 'vidfast',
    name: 'VidFast',
    description: 'Serveur rapide avec streaming HD et multi-langues',
    baseUrl: 'https://vidfast.pro',
    endpoints: [
      { name: 'Film', url: '/movie/{tmdb_id}', example: '/movie/550' },
      { name: 'Série', url: '/tv/{id}/{season}/{episode}', example: '/tv/1396/1/1' },
    ],
    color: 'from-green-500 to-emerald-500',
    features: ['HD Streaming', 'Multi-languages'],
  },
  {
    id: 'vidking',
    name: 'VidKing',
    description: 'Multi-sources avec sélection automatique du meilleur serveur',
    baseUrl: 'https://vidking.online',
    endpoints: [
      { name: 'Film', url: '/embed/movie/{tmdb_id}', example: '/embed/movie/550' },
      { name: 'Série', url: '/embed/tv/{id}/{season}/{episode}', example: '/embed/tv/1396/1/1' },
    ],
    color: 'from-purple-500 to-indigo-500',
    features: ['Multi-sources', 'Auto-switch'],
  },
  {
    id: 'vidsrc',
    name: 'VidSrc',
    description: 'Source stable et fiable avec haute disponibilité',
    baseUrl: 'https://vidsrc.cc',
    endpoints: [
      { name: 'Film', url: '/v2/embed/movie/{tmdb_id}', example: '/v2/embed/movie/550' },
      { name: 'Série', url: '/v2/embed/tv/{id}/{season}/{episode}', example: '/v2/embed/tv/1396/1/1' },
    ],
    color: 'from-orange-500 to-red-500',
    features: ['High availability', 'Stable'],
  },
  {
    id: 'primesrc',
    name: 'PrimeSrc',
    description: 'Multi-serveurs premium avec fallback automatique',
    baseUrl: 'https://primesrc.me',
    endpoints: [
      { name: 'Film', url: '/embed/movie?tmdb={tmdb_id}&fallback=true', example: '/embed/movie?tmdb=550&fallback=true' },
      { name: 'Série', url: '/embed/tv?tmdb={id}&season={s}&episode={e}&fallback=true', example: '/embed/tv?tmdb=1396&season=1&episode=1&fallback=true' },
    ],
    color: 'from-amber-500 to-orange-600',
    features: ['Premium servers', 'Auto-fallback'],
  },
  {
    id: 'videasy',
    name: 'Videasy',
    description: 'Serveur léger avec sélection d\'épisodes intégrée',
    baseUrl: 'https://player.videasy.net',
    endpoints: [
      { name: 'Film', url: '/movie/{tmdb_id}', example: '/movie/550' },
      { name: 'Série', url: '/tv/{id}/{season}/{episode}?episodeSelector=true', example: '/tv/1396/1/1?episodeSelector=true' },
    ],
    color: 'from-teal-500 to-cyan-500',
    features: ['Lightweight', 'Episode selector'],
  },
  {
    id: 'multiembed',
    name: 'MultiEmbed',
    description: 'Système multi-sources ultra complet',
    baseUrl: 'https://multiembed.mov',
    endpoints: [
      { name: 'Direct', url: '/directstream.php?video_id={id}', example: '/directstream.php?video_id=550' }
    ],
    color: 'from-violet-500 to-purple-500',
    features: ['Multi-source', 'Ultra Fast'],
  },
  {
    id: 'cinemana',
    name: 'Cinemana',
    description: 'API spécialisée pour les contenus alternatifs',
    baseUrl: 'https://cinemana.io',
    endpoints: [
      { name: 'Film', url: '/watch/{id}', example: '/watch/550' }
    ],
    color: 'from-rose-400 to-red-500',
    features: ['Exclusive Content', 'Fast CDN'],
  },
  {
    id: 'gdriveplayer',
    name: 'GDPlayer',
    description: 'Lecteur rapide basé sur Google Drive',
    baseUrl: 'https://gdriveplayer.me',
    endpoints: [
      { name: 'Embed', url: '/embed?tmdb={id}', example: '/embed?tmdb=550' }
    ],
    color: 'from-yellow-400 to-amber-500',
    features: ['No Ads', 'Google CDN'],
  },
  {
    id: 'databasegdrive',
    name: 'DB GDrive',
    description: 'Large base de données avec liens directs',
    baseUrl: 'https://databasegdriveplayer.xyz',
    endpoints: [
      { name: 'Film', url: '/player.php?tmdb={id}', example: '/player.php?tmdb=550' }
    ],
    color: 'from-green-400 to-emerald-500',
    features: ['Direct Links', 'Massive DB'],
  },
  {
    id: 'soap2day',
    name: 'Soap2Day API',
    description: 'Accès au catalogue Soap2Day',
    baseUrl: 'https://soap2day.rs',
    endpoints: [
      { name: 'Film', url: '/embed/movie/{id}', example: '/embed/movie/550' }
    ],
    color: 'from-sky-400 to-blue-500',
    features: ['Old School', 'Reliable'],
  },
  {
    id: 'fembed',
    name: 'Fembed',
    description: 'Hébergeur vidéo multi-qualité',
    baseUrl: 'https://fembed.com',
    endpoints: [
      { name: 'Watch', url: '/v/{id}', example: '/v/xyz' }
    ],
    color: 'from-orange-400 to-red-500',
    features: ['Multi-quality', 'Fast'],
  },
  {
    id: 'upstream',
    name: 'Upstream',
    description: 'Serveur de streaming haute performance',
    baseUrl: 'https://upstream.to',
    endpoints: [
      { name: 'Embed', url: '/e/{id}', example: '/e/xyz' }
    ],
    color: 'from-indigo-400 to-purple-500',
    features: ['Stable', 'High Quality'],
  },
  {
    id: 'doodstream',
    name: 'DoodStream',
    description: 'Le favori des streamers pour sa vitesse',
    baseUrl: 'https://doodstream.com',
    endpoints: [
      { name: 'Embed', url: '/e/{id}', example: '/e/xyz' }
    ],
    color: 'from-blue-400 to-cyan-500',
    features: ['Fast', 'Modern'],
  },
  {
    id: 'mixdrop',
    name: 'MixDrop',
    description: 'Solution de streaming fluide',
    baseUrl: 'https://mixdrop.co',
    endpoints: [
      { name: 'Embed', url: '/e/{id}', example: '/e/xyz' }
    ],
    color: 'from-pink-400 to-rose-500',
    features: ['Smooth', 'Low Latency'],
  },
  {
    id: 'vudeo',
    name: 'Vudeo',
    description: 'Hébergeur premium et rapide',
    baseUrl: 'https://vudeo.net',
    endpoints: [
      { name: 'Embed', url: '/embed-{id}.html', example: '/embed-xyz.html' }
    ],
    color: 'from-purple-400 to-indigo-500',
    features: ['Premium', 'Fast'],
  },
  {
    id: 'streamsb',
    name: 'StreamSB',
    description: 'Multi-qualité avec sélection automatique',
    baseUrl: 'https://streamsb.net',
    endpoints: [
      { name: 'Embed', url: '/e/{id}', example: '/e/xyz' }
    ],
    color: 'from-emerald-400 to-teal-500',
    features: ['Multi-quality', 'Responsive'],
  },
  {
    id: 'vidcloud',
    name: 'VidCloud',
    description: 'Infrastructure cloud pour le streaming',
    baseUrl: 'https://vidcloud.one',
    endpoints: [
      { name: 'Film', url: '/embed/{id}', example: '/embed/550' }
    ],
    color: 'from-blue-500 to-indigo-600',
    features: ['Cloud Powered', 'Fast'],
  },
  {
    id: 'hydrahdx',
    name: 'HydraHD',
    description: 'Qualité 4K et 1080p garantie',
    baseUrl: 'https://hydrahd.com',
    endpoints: [
      { name: 'Film', url: '/v/{id}', example: '/v/550' }
    ],
    color: 'from-cyan-500 to-blue-600',
    features: ['4K Support', 'Crystal Clear'],
  },
  {
    id: 'zplayer',
    name: 'ZPlayer',
    description: 'Lecteur minimaliste et performant',
    baseUrl: 'https://zplayer.io',
    endpoints: [
      { name: 'Embed', url: '/v/{id}', example: '/v/xyz' }
    ],
    color: 'from-slate-500 to-gray-600',
    features: ['Minimalist', 'No Lag'],
  },
  {
    id: 'voe',
    name: 'VOE API',
    description: 'Hébergeur européen ultra rapide',
    baseUrl: 'https://voe.sx',
    endpoints: [
      { name: 'Watch', url: '/e/{id}', example: '/e/xyz' }
    ],
    color: 'from-orange-500 to-amber-600',
    features: ['EU Servers', 'Fast'],
  },
  {
    id: 'streamlare',
    name: 'Streamlare',
    description: 'Nouvelle génération de lecteurs vidéo',
    baseUrl: 'https://streamlare.com',
    endpoints: [
      { name: 'Embed', url: '/e/{id}', example: '/e/xyz' }
    ],
    color: 'from-red-400 to-pink-500',
    features: ['Modern UI', 'Fast Buffering'],
  },
  {
    id: 'streamtape',
    name: 'Streamtape',
    description: 'Le plus populaire pour le partage rapide',
    baseUrl: 'https://streamtape.com',
    endpoints: [
      { name: 'Embed', url: '/e/{id}', example: '/e/xyz' }
    ],
    color: 'from-blue-600 to-sky-700',
    features: ['Popular', 'Reliable'],
  },
];

const QUICK_TOOLS = [
  { 
    name: 'TMDB API', 
    description: 'Données films/séries', 
    icon: Database,
    url: 'https://www.themoviedb.org/documentation/api',
    color: 'from-green-500/20 to-emerald-500/20'
  },
  { 
    name: 'Supabase', 
    description: 'Backend & Auth', 
    icon: Server,
    url: 'https://supabase.com/dashboard',
    color: 'from-emerald-500/20 to-teal-500/20'
  },
  { 
    name: 'Consumet', 
    description: 'API Agrégateur', 
    icon: Globe,
    url: 'https://docs.consumet.org/',
    color: 'from-orange-500/20 to-red-500/20'
  },
  { 
    name: 'AniList', 
    description: 'Anime GraphQL', 
    icon: Sparkles,
    url: 'https://anilist.gitbook.io/anilist-apiv2-docs/',
    color: 'from-blue-500/20 to-cyan-500/20'
  },
  { 
    name: 'Jikan', 
    description: 'MAL REST API', 
    icon: Zap,
    url: 'https://jikan.moe/',
    color: 'from-yellow-500/20 to-orange-500/20'
  },
  { 
    name: 'Admin Panel', 
    description: 'Gestion sources', 
    icon: Settings,
    url: '/admin',
    color: 'from-purple-500/20 to-violet-500/20'
  },
];

const StatsCard = ({ title, value, icon: Icon, trend, color }: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: string;
  color: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="relative overflow-hidden"
  >
    <Card className={`bg-gradient-to-br ${color} border-0 shadow-lg hover:shadow-xl transition-all duration-300`}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white/70 font-medium mb-1">{title}</p>
            <p className="text-3xl font-bold text-white">{value}</p>
            {trend && (
              <p className="text-xs text-white/60 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {trend}
              </p>
            )}
          </div>
          <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm">
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

const Creator = () => {
  const { user, isAdmin, isCreator, isSuperAdmin, role, loading } = useAuth();
  const navigate = useNavigate();
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [settings, setSettings] = useState({
    notifications: true,
    autoRefresh: true,
    darkMode: true,
    compactView: false,
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
      return;
    }
    if (!loading && user && !isAdmin && !isCreator && !isSuperAdmin) {
      toast.error('Accès réservé aux administrateurs et créateurs');
      navigate('/');
    }
  }, [user, loading, isAdmin, isCreator, isSuperAdmin, navigate]);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedUrl(text);
      toast.success(`${label} copié !`);
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch {
      toast.error('Impossible de copier');
    }
  };

  const filteredApis = STREAMING_APIS.filter(api => 
    api.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    api.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalEndpoints = STREAMING_APIS.reduce((acc, api) => acc + api.endpoints.length, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user || (!isAdmin && !isCreator && !isSuperAdmin)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="relative overflow-hidden py-12 sm:py-16 bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.08),transparent_60%)]" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8"
          >
            <div>
              <div className="inline-flex items-center gap-2 mb-3 px-4 py-2 bg-primary/10 rounded-full border border-primary/20">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-primary uppercase tracking-wider">
                  Espace Créateur
                </span>
                <Badge variant="secondary" className="ml-2 bg-primary/20 text-primary border-0">
                  {role?.toUpperCase()}
                </Badge>
              </div>
              
              <h1 className="text-3xl sm:text-4xl font-bold mb-2">
                <span className="bg-gradient-to-r from-white via-white/90 to-white/80 bg-clip-text text-transparent">
                  Documentation API & Sources
                </span>
              </h1>
              <p className="text-muted-foreground italic">
                Propulsé par l'écosystème CStream - Intégration TMDB simplifiée
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-primary/20 hover:border-primary/40 bg-primary/5 text-primary"
                onClick={() => navigate('/admin')}
              >
                <Shield className="w-4 h-4" />
                Panel Admin
              </Button>
              <Button
                size="sm"
                className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
                onClick={() => {
                  toast.success('Synchronisation des sources terminée');
                }}
              >
                <RefreshCw className="w-4 h-4" />
                Actualiser
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          >
            <StatsCard
              title="APIs Disponibles"
              value={STREAMING_APIS.length}
              icon={Server}
              trend="+2 ce mois"
              color="from-blue-600/90 to-blue-800/90"
            />
            <StatsCard
              title="Endpoints"
              value={totalEndpoints}
              icon={Globe}
              trend="Actifs"
              color="from-emerald-600/90 to-emerald-800/90"
            />
            <StatsCard
              title="Outils"
              value={QUICK_TOOLS.length}
              icon={Zap}
              color="from-purple-600/90 to-purple-800/90"
            />
            <StatsCard
              title="Statut"
              value="Actif"
              icon={Activity}
              trend="100% uptime"
              color="from-green-600/90 to-green-800/90"
            />
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full max-w-2xl grid grid-cols-4 bg-secondary/30 p-1 rounded-xl mb-8 border border-white/5">
            <TabsTrigger value="dashboard" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white gap-2 text-sm">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="apis" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white gap-2 text-sm">
              <Server className="w-4 h-4" />
              <span className="hidden sm:inline">APIs</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white gap-2 text-sm">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white gap-2 text-sm">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Paramètres</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {QUICK_TOOLS.map((tool, index) => (
                <motion.div
                  key={tool.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card 
                    className={`bg-gradient-to-br ${tool.color} border-0 hover:shadow-lg cursor-pointer transition-all duration-300 hover:scale-[1.02]`}
                    onClick={() => tool.url.startsWith('/') ? navigate(tool.url) : window.open(tool.url, '_blank')}
                  >
                    <CardContent className="p-4 sm:p-5 flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm">
                        <tool.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-white text-sm sm:text-base truncate">{tool.name}</p>
                        <p className="text-xs text-white/60 truncate hidden sm:block">{tool.description}</p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-white/40 shrink-0" />
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="bg-card/50 border-white/5 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Activity className="w-5 h-5 text-primary" />
                    Activité Récente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { action: 'API AutoEmbed mise à jour', time: 'Il y a 2h', icon: Server },
                    { action: 'Nouveau endpoint ajouté', time: 'Il y a 5h', icon: Globe },
                    { action: 'Configuration sauvegardée', time: 'Hier', icon: Save },
                    { action: 'Serveur VidFast synchronisé', time: 'Il y a 2j', icon: RefreshCw },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <item.icon className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.action}</p>
                        <p className="text-xs text-muted-foreground">{item.time}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-white/5 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BookOpen className="w-5 h-5 text-primary" />
                    Guide Rapide
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-primary" />
                      Intégration Iframe
                    </h4>
                    <pre className="text-xs overflow-x-auto p-3 bg-black/30 rounded-lg text-green-400 font-mono">
{`<iframe
  src="https://player.autoembed.cc/embed/movie/{id}"
  allowFullScreen
></iframe>`}
                    </pre>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Consultez l'onglet <strong>APIs</strong> pour voir tous les endpoints disponibles et leurs exemples d'utilisation.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="apis" className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
              <div className="relative flex-1 max-w-md">
                <Input
                  placeholder="Rechercher une API..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11 rounded-xl bg-secondary/30 border-white/10 focus:border-primary/50"
                />
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>
              <Badge variant="outline" className="px-4 py-2 text-sm border-white/10">
                {filteredApis.length} APIs disponibles
              </Badge>
            </div>

            <div className="grid gap-6">
              {filteredApis.map((api, index) => (
                <motion.div
                  key={api.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="overflow-hidden border-white/5 bg-card/50 hover:bg-card/70 transition-all duration-300">
                    <CardHeader className={`bg-gradient-to-r ${api.color} py-4 sm:py-5`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 sm:p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                            <Layers className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-white text-lg sm:text-xl">{api.name}</CardTitle>
                            <CardDescription className="text-white/80 text-xs sm:text-sm">{api.description}</CardDescription>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="gap-2 bg-white/20 hover:bg-white/30 text-white border-0"
                          onClick={() => copyToClipboard(api.baseUrl, 'URL de base')}
                        >
                          {copiedUrl === api.baseUrl ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          <span className="hidden sm:inline">Copier</span>
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {api.features.map((feature) => (
                          <Badge key={feature} variant="secondary" className="text-xs bg-primary/10 text-primary/90 border-0">
                            {feature}
                          </Badge>
                        ))}
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Endpoints</h4>
                        {api.endpoints.map((endpoint) => (
                          <div key={endpoint.name} className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <Badge variant="outline" className="shrink-0 text-xs border-white/10">
                                {endpoint.name}
                              </Badge>
                              <code className="text-xs text-muted-foreground truncate flex-1 font-mono">
                                {api.baseUrl}{endpoint.url}
                              </code>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 px-3 gap-1.5 text-xs hover:bg-white/10"
                                onClick={() => copyToClipboard(`${api.baseUrl}${endpoint.url}`, endpoint.name)}
                              >
                                {copiedUrl === `${api.baseUrl}${endpoint.url}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                Copier
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 px-3 gap-1.5 text-xs hover:bg-white/10"
                                onClick={() => window.open(`${api.baseUrl}${endpoint.example}`, '_blank')}
                              >
                                <ExternalLink className="w-3 h-3" />
                                Tester
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-card/50 border-white/5 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    Utilisation des APIs
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Activity className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>Données d'analyse en temps réel actives</p>
                    <div className="mt-4 flex gap-2 justify-center">
                       <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">99.9% Success</Badge>
                       <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">12ms Latency</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card/50 border-white/5 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Performances Globales
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Zap className="w-12 h-12 mx-auto mb-4 opacity-20 text-yellow-500" />
                    <p className="text-2xl font-bold text-white mb-2">99.98%</p>
                    <p className="text-sm">Uptime global des serveurs</p>
                  </div>
                </CardContent>
              </Card>
            </div>
            <Card className="bg-card/50 border-white/5 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">Top Sources ce mois-ci</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: 'AutoEmbed', calls: '1.2M', growth: '+15%', color: 'bg-blue-500' },
                    { name: 'VidSrc.to', calls: '850K', growth: '+8%', color: 'bg-indigo-500' },
                    { name: 'Bludclart', calls: '620K', growth: '+45%', color: 'bg-cyan-500' },
                    { name: 'Smashy Stream', calls: '410K', growth: '-2%', color: 'bg-rose-500' },
                  ].map((source, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full ${source.color}/20 flex items-center justify-center ${source.color.replace('bg-', 'text-')} font-bold text-xs`}>
                          #{i+1}
                        </div>
                        <span className="font-medium">{source.name}</span>
                      </div>
                      <div className="flex items-center gap-6">
                        <span className="text-sm text-muted-foreground">{source.calls} requêtes</span>
                        <span className={`text-sm font-bold ${source.growth.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                          {source.growth}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card className="bg-card/50 border-white/5 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Settings className="w-5 h-5 text-primary" />
                  Paramètres de l'interface
                </CardTitle>
                <CardDescription>Personnalisez votre expérience de développement</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors">
                  <div className="space-y-0.5">
                    <Label className="text-base cursor-pointer">Notifications en temps réel</Label>
                    <p className="text-sm text-muted-foreground">Recevoir des alertes sur le statut des APIs</p>
                  </div>
                  <Switch checked={settings.notifications} onCheckedChange={(val) => setSettings(s => ({...s, notifications: val}))} />
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors">
                  <div className="space-y-0.5">
                    <Label className="text-base cursor-pointer">Rafraîchissement automatique</Label>
                    <p className="text-sm text-muted-foreground">Actualiser les stats toutes les 5 minutes</p>
                  </div>
                  <Switch checked={settings.autoRefresh} onCheckedChange={(val) => setSettings(s => ({...s, autoRefresh: val}))} />
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors">
                  <div className="space-y-0.5">
                    <Label className="text-base cursor-pointer">Mode Sombre Forcé</Label>
                    <p className="text-sm text-muted-foreground">Maintenir l'interface en mode sombre</p>
                  </div>
                  <Switch checked={settings.darkMode} onCheckedChange={(val) => setSettings(s => ({...s, darkMode: val}))} />
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors">
                  <div className="space-y-0.5">
                    <Label className="text-base cursor-pointer">Vue Compacte</Label>
                    <p className="text-sm text-muted-foreground">Réduire l'espacement entre les éléments</p>
                  </div>
                  <Switch checked={settings.compactView} onCheckedChange={(val) => setSettings(s => ({...s, compactView: val}))} />
                </div>
                
                <div className="pt-4 border-t border-white/5 space-y-4">
                  <div className="flex flex-col gap-2">
                     <Label>Clé API TMDB (Lecture seule)</Label>
                     <div className="relative">
                       <Input value="••••••••••••••••" readOnly className="bg-black/20 border-white/10 pr-10" />
                       <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                     </div>
                  </div>
                </div>

                <Button className="w-full gap-2 bg-primary hover:bg-primary/90 mt-4 shadow-lg shadow-primary/20" onClick={() => toast.success('Paramètres sauvegardés avec succès')}>
                  <Save className="w-4 h-4" />
                  Sauvegarder les modifications
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Creator;
