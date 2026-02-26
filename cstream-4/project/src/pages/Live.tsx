import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { StreamedAPI } from '@/lib/streamed';
import {
  Play, RefreshCw, Trophy, X, Search, Star, Calendar,
  Globe, Zap, Radio, Clock, ChevronRight, Maximize2, Minimize2,
  Volume2, VolumeX, Signal, Wifi, WifiOff, Eye, Filter,
  ChevronDown, TrendingUp, Activity, Shield, Swords, Heart
} from 'lucide-react';

const PROXY_BASE = '/api/sports';
const imageCache = new Map<string, string>();

interface Sport { id: string; name: string; }
interface Match {
  id: string; title: string; category: string; date: number;
  poster?: string | null;
  teams?: { home?: { name: string; badge: string | null }; away?: { name: string; badge: string | null } };
  sources: Array<{ source: string; id: string; url?: string; language?: string; quality?: string }>;
  popular: boolean;
  score?: { home: number; away: number };
  viewers?: number;
}
interface Stream {
  id: string; streamNo: number; language: string; hd: boolean; embedUrl: string; source: string;
}

const langFlags: Record<string, string> = {
  'French': '🇫🇷', 'English': '🇬🇧', 'Spanish': '🇪🇸', 'Arabic': '🇸🇦',
  'Korean': '🇰🇷', 'Italian': '🇮🇹', 'German': '🇩🇪', 'Multi': '🌐',
  'fr': '🇫🇷', 'en': '🇬🇧', 'es': '🇪🇸', 'ar': '🇸🇦', 'ko': '🇰🇷',
  'it': '🇮🇹', 'de': '🇩🇪', 'fra': '🇫🇷', 'fre': '🇫🇷',
};

const sportIcons: Record<string, string> = {
  football: '⚽', basketball: '🏀', tennis: '🎾', mma: '🥊',
  hockey: '🏒', baseball: '⚾', rugby: '🏉', boxing: '🥊',
  cricket: '🏏', darts: '🎯', billiards: '🎱', golf: '⛳',
  'american football': '🏈', 'motor sports': '🏎️', 'fight sports': '🥊'
};

export default function LivePage() {
  const [allSports, setAllSports] = useState<Sport[]>([]);
  const [selectedSport, setSelectedSport] = useState('live');
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiType, setApiType] = useState<'streamed' | 'footy'>('streamed');
  const [vpnMode, setVpnMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [playerState, setPlayerState] = useState<{ match: Match; streams: Stream[]; selectedStream: Stream } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [previewMatch, setPreviewMatch] = useState<Match | null>(null);
  const [ticker, setTicker] = useState(0);
  const playerRef = useRef<HTMLDivElement>(null);
  const refreshInterval = useRef<any>(null);

  const getImageUrl = useCallback((url: string | null | undefined, type: 'badge' | 'poster' = 'badge') => {
    if (!url) return '';
    if (apiType === 'footy') {
      return url.startsWith('/api/v1/') ? `https://api.watchfooty.st${url}` : url;
    }
    const key = url + vpnMode + type;
    if (imageCache.has(key)) return imageCache.get(key)!;
    let final = url;
    if (!vpnMode) {
      final = url.includes('streamed.pk')
        ? url.replace('/api/images/badge/', '/api/images/proxy/')
        : url.startsWith('/api/images/')
          ? `https://streamed.pk${url.replace('/api/images/', '/api/images/proxy/')}`
          : url;
    }
    final += final.includes('?') ? `&w=${type === 'badge' ? 80 : 400}` : `?w=${type === 'badge' ? 80 : 400}`;
    imageCache.set(key, final);
    return final;
  }, [apiType, vpnMode]);

  const fetchSports = useCallback(async () => {
    try {
      const res = await fetch(PROXY_BASE);
      const data = await res.json();
      const arr = Array.isArray(data) ? data : (data?.sports || []);
      setAllSports([
        { id: 'live', name: '🔴 LIVE' },
        { id: 'schedule', name: '📅 Programme' },
        { id: 'all', name: '🌍 Tous' },
        ...arr.slice(0, 14).map((s: any) => ({ id: s.id || s.name?.toLowerCase(), name: `${sportIcons[s.id || s.name?.toLowerCase()] || '🏆'} ${s.name || s.id}` }))
      ]);
    } catch {
      setAllSports([
        { id: 'live', name: '🔴 LIVE' },
        { id: 'schedule', name: '📅 Programme' },
        { id: 'all', name: '🌍 Tous' },
        { id: 'football', name: '⚽ Football' },
        { id: 'basketball', name: '🏀 Basketball' },
        { id: 'american football', name: '🏈 American Football' },
        { id: 'hockey', name: '🏒 Hockey' },
        { id: 'tennis', name: '🎾 Tennis' },
        { id: 'motor sports', name: '🏎️ Motorsports' },
        { id: 'fight sports', name: '🥊 Combat' },
        { id: 'rugby', name: '🏉 Rugby' },
        { id: 'baseball', name: '⚾ Baseball' },
        { id: 'golf', name: '⛳ Golf' },
        { id: 'cricket', name: '🏏 Cricket' },
      ]);
    }
  }, []);

  const fetchMatches = useCallback(async (sportId: string) => {
    setLoading(true);
    try {
      let data: any[] = [];

      if (apiType === 'footy') {
        const url = sportId === 'live'
          ? `https://api.watchfooty.st/api/v1/matches/live`
          : `https://api.watchfooty.st/api/v1/matches/${['all', 'schedule'].includes(sportId) ? 'all' : sportId}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error();
        const raw = await res.json();
        data = (Array.isArray(raw) ? raw : []).map((m: any) => ({
          id: m.matchId || Math.random().toString(36).slice(2),
          title: m.title || `${m.teams?.home?.name || 'Home'} vs ${m.teams?.away?.name || 'Away'}`,
          category: m.sport || 'Sport',
          date: m.timestamp ? m.timestamp * 1000 : Date.now(),
          teams: { home: { name: m.teams?.home?.name || 'Home', badge: m.teams?.home?.logoUrl || null }, away: { name: m.teams?.away?.name || 'Away', badge: m.teams?.away?.logoUrl || null } },
          poster: m.poster || null,
          popular: m.isEvent || false,
          sources: (m.streams || []).map((s: any) => ({ source: 'footy', id: s.id || Math.random().toString(36).slice(2), url: s.url, language: s.language || 'Multi', quality: s.quality || 'HD' })),
          viewers: Math.floor(Math.random() * 50000) + 1000,
        }));
      } else {
        const raw = sportId === 'live' ? await StreamedAPI.getLiveMatches()
          : sportId === 'all' || sportId === 'schedule' ? await StreamedAPI.getAllMatches()
            : await StreamedAPI.getSportMatches(sportId);

        data = (raw || []).map((m: any) => ({
          id: m.slug || Math.random().toString(36).slice(2),
          title: m.title,
          category: m.sport || 'Sport',
          date: m.date ? new Date(m.date).getTime() : Date.now(),
          teams: { home: { name: m.teams?.home || 'Home', badge: null }, away: { name: m.teams?.away || 'Away', badge: null } },
          poster: m.poster || null,
          popular: false,
          sources: m.sources || [],
          viewers: Math.floor(Math.random() * 80000) + 2000,
        }));
      }
      setMatches(data);
    } catch {
      setMatches([]);
      toast.error('Impossible de charger les matches.');
    } finally {
      setLoading(false);
    }
  }, [apiType]);

  useEffect(() => { fetchSports(); }, [fetchSports]);
  useEffect(() => { fetchMatches(selectedSport); }, [selectedSport, apiType, fetchMatches]);

  // Live ticker animation
  useEffect(() => {
    const t = setInterval(() => setTicker(p => p + 1), 3000);
    return () => clearInterval(t);
  }, []);

  // Auto-refresh live matches every 2 min
  useEffect(() => {
    if (selectedSport === 'live') {
      refreshInterval.current = setInterval(() => fetchMatches('live'), 120000);
    }
    return () => clearInterval(refreshInterval.current);
  }, [selectedSport, fetchMatches]);

  const filteredMatches = useMemo(() =>
    matches.filter(m =>
      m.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.category?.toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a, b) => (b.popular ? 1 : 0) - (a.popular ? 1 : 0))
    , [matches, searchQuery]);

  const liveMatches = useMemo(() =>
    matches.filter(m => m.date < Date.now() && (m.date + 7200000) > Date.now())
    , [matches]);

  const groupedByDate = useMemo(() => {
    if (selectedSport !== 'schedule') return null;
    const groups: Record<string, Match[]> = {};
    filteredMatches.forEach(m => {
      const d = new Date(m.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
      if (!groups[d]) groups[d] = [];
      groups[d].push(m);
    });
    return groups;
  }, [filteredMatches, selectedSport]);

  const openPlayer = async (match: Match) => {
    if (!match.sources?.length) {
      toast.error('Aucune source disponible pour ce match');
      return;
    }

    try {
      if (apiType === 'footy') {
        const streams: Stream[] = match.sources.map((s: any) => ({
          id: s.id, streamNo: 1, language: s.language || 'Multi',
          hd: true, embedUrl: s.url, source: 'footy',
        }));
        setPlayerState({ match, streams, selectedStream: streams[0] });
        return;
      }

      const src = match.sources[0];
      const trySources = [
        fetch(`${PROXY_BASE}/stream/${src.source}/${src.id}`, { signal: AbortSignal.timeout(12000) }),
      ];

      let streams: Stream[] = [];
      for (const req of trySources) {
        try {
          const res = await req;
          if (res.ok) {
            const d = await res.json();
            streams = Array.isArray(d) ? d : (d?.streams || []);
            if (streams.length) break;
          }
        } catch { }
      }

      if (!streams.length) { toast.error('Aucun flux disponible'); return; }

      const sorted = [...streams].sort((a, b) => {
        const aFr = a.language?.toLowerCase().includes('fr') ? -1 : 0;
        const bFr = b.language?.toLowerCase().includes('fr') ? -1 : 0;
        return aFr - bFr;
      });

      setPlayerState({ match, streams: sorted, selectedStream: sorted[0] });
      toast.success(`✅ ${sorted.length} flux disponible(s)`);
    } catch { toast.error('Impossible de charger les flux'); }
  };

  const toggleFullscreen = () => {
    if (!playerRef.current) return;
    if (!document.fullscreenElement) {
      playerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => { });
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => { });
    }
  };

  const isMatchLive = (m: Match) => m.date < Date.now() && (m.date + 7200000) > Date.now();
  const formatViewers = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n.toString();

  // ── Match Card ──────────────────────────────────────────────────────────────
  const MatchCard = ({ match, idx }: { match: Match; idx: number }) => {
    const live = isMatchLive(match);
    const homeBadge = getImageUrl(match.teams?.home?.badge, 'badge');
    const awayBadge = getImageUrl(match.teams?.away?.badge, 'badge');
    const poster = getImageUrl(match.poster, 'poster');

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: Math.min(idx * 0.03, 0.4), duration: 0.4, ease: "easeOut" }}
        whileHover={{ y: -6, scale: 1.02 }}
        className="group relative bg-white/[0.02] backdrop-blur-xl rounded-[24px] overflow-hidden border border-white/[0.08] hover:border-purple-500/50 transition-all duration-500 cursor-pointer shadow-[0_8px_30px_rgb(0,0,0,0.4)] hover:shadow-[0_12px_50px_rgba(168,85,247,0.25)]"
        onClick={() => openPlayer(match)}
        onMouseEnter={() => setPreviewMatch(match)}
        onMouseLeave={() => setPreviewMatch(null)}
      >
        {/* Poster background */}
        <div className="aspect-[16/9] relative overflow-hidden bg-[#131315]">
          {poster && (
            <img
              src={poster} alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 group-hover:scale-105 transition-all duration-700 blur-[2px] group-hover:blur-0"
              loading="lazy"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c0e] via-[#0c0c0e]/50 to-transparent" />

          {/* Top badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
            <div className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-[10px] font-bold text-white/90 border border-white/10 shadow-lg">
              {new Date(match.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            {live && (
              <div className="px-2.5 py-1 rounded-lg bg-red-600/90 backdrop-blur-md text-[10px] font-black text-white flex items-center gap-1.5 shadow-[0_0_20px_rgba(220,38,38,0.6)] border border-red-500/50">
                <span className="w-2 h-2 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)] animate-pulse" />
                EN DIRECT
              </div>
            )}
          </div>

          {/* Viewers */}
          {match.viewers && (
            <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/50 backdrop-blur-md text-[10px] text-white font-medium border border-white/10 shadow-lg">
              <Eye className="w-3 h-3 text-purple-400" />
              {formatViewers(match.viewers)}
            </div>
          )}

          {/* Teams */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none mt-2">
            <div className="flex items-center gap-5 scale-95 group-hover:scale-105 transition-transform duration-500 ease-out">
              <div className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center group-hover:border-purple-500/60 group-hover:shadow-[0_0_25px_rgba(168,85,247,0.3)] transition-all overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  {homeBadge ? (
                    <img src={homeBadge} alt="" className="w-11 h-11 object-contain drop-shadow-2xl relative z-10" loading="lazy" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ) : <Shield className="w-6 h-6 text-white/30" />}
                </div>
                <span className="text-[10px] text-white font-extrabold uppercase tracking-widest max-w-[64px] text-center truncate drop-shadow-xl">{match.teams?.home?.name}</span>
              </div>

              <div className="flex flex-col items-center gap-1">
                {match.score ? (
                  <div className="text-white font-black text-2xl tracking-tighter drop-shadow-[0_0_20px_rgba(168,85,247,0.9)] bg-black/30 px-3 py-0.5 rounded-lg backdrop-blur-sm border border-white/5">
                    {match.score.home} <span className="text-purple-400 mx-1">-</span> {match.score.away}
                  </div>
                ) : (
                  <span className="text-transparent bg-clip-text bg-gradient-to-br from-purple-400 to-indigo-500 font-black text-2xl italic tracking-tighter drop-shadow-[0_0_20px_rgba(168,85,247,0.6)]">VS</span>
                )}
              </div>

              <div className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center group-hover:border-indigo-500/60 group-hover:shadow-[0_0_25px_rgba(99,102,241,0.3)] transition-all overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  {awayBadge ? (
                    <img src={awayBadge} alt="" className="w-11 h-11 object-contain drop-shadow-2xl relative z-10" loading="lazy" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ) : <Shield className="w-6 h-6 text-white/30" />}
                </div>
                <span className="text-[10px] text-white font-extrabold uppercase tracking-widest max-w-[64px] text-center truncate drop-shadow-xl">{match.teams?.away?.name}</span>
              </div>
            </div>
          </div>

          {/* Play overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-purple-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white text-black text-xs font-black shadow-[0_0_30px_rgba(255,255,255,0.4)] transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
              <Play className="w-3.5 h-3.5 fill-black" /> Lancer le flux
            </div>
          </div>
        </div>

        {/* Info footer */}
        <div className="p-3.5 bg-gradient-to-b from-transparent to-black/40">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 rounded-md bg-purple-500/20 border border-purple-500/30 text-[9px] font-black text-purple-300 uppercase tracking-widest">{match.category}</span>
            {match.sources.length > 1 && (
              <span className="text-[9px] text-zinc-500 font-medium">{match.sources.length} sources HD</span>
            )}
          </div>
          <h3 className="text-xs font-bold text-white/95 line-clamp-1 uppercase tracking-wider">{match.title}</h3>
        </div>
      </motion.div>
    );
  };

  // ── Player Modal ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#050507] to-[#020203] text-white">
      <SEO title="🔴 Sports Live - CStream" description="Streaming sportif en direct: Football, Basketball, Tennis, MMA et plus encore" />
      <Navbar />

      <main className="container mx-auto px-4 pt-28 pb-20">
        {/* Page Header */}
        <div className="mb-12 relative">
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px] pointer-events-none" />
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 relative z-10">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-black tracking-widest shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-pulse" />
                  {liveMatches.length} DIRECTS
                </div>
                <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.05] backdrop-blur-md border border-white/10 text-zinc-300 text-xs font-bold tracking-wide">
                  <Activity className="w-3.5 h-3.5 text-purple-400" />
                  {matches.length} MATCHS AU TOTAL
                </div>
              </div>
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter bg-gradient-to-b from-white via-white to-white/40 bg-clip-text text-transparent drop-shadow-sm uppercase">
                🔴 Sports Live
              </h1>
              <p className="text-white/50 text-base md:text-lg mt-3 max-w-xl font-medium">L'ultime plateforme de streaming sportif. Football, Combat, F1 & NBA en Haute Définition. Toujours fluide, sans interruption.</p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* API Toggle */}
              <div className="flex bg-white/5 p-1 rounded-xl border border-white/8">
                {(['streamed', 'footy'] as const).map(api => (
                  <button
                    key={api}
                    onClick={() => setApiType(api)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all uppercase tracking-wide ${apiType === api ? 'bg-purple-600 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                  >
                    {api === 'streamed' ? '📡 Streamed' : '⚽ Footy'}
                  </button>
                ))}
              </div>

              {/* VPN Badge */}
              <button
                onClick={() => setVpnMode(!vpnMode)}
                className={`px-3 py-2 rounded-xl text-[10px] font-black border flex items-center gap-2 transition-all ${vpnMode ? 'bg-purple-500/15 border-purple-500/30 text-purple-400' : 'bg-white/5 border-white/10 text-white/50 hover:text-white'}`}
              >
                {vpnMode ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
                {vpnMode ? 'VPN Actif' : 'Proxy'}
              </button>

              {/* Refresh */}
              <button
                onClick={() => fetchMatches(selectedSport)}
                className="px-3 py-2 rounded-xl bg-white/5 border border-white/8 text-[10px] font-bold flex items-center gap-2 hover:bg-white/10 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:block">Actualiser</span>
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-lg">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text" placeholder="Rechercher un match, une équipe..."
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-10 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] focus:border-purple-500/40 focus:outline-none text-sm text-white placeholder-zinc-600 transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Live Spotlight */}
        {selectedSport === 'live' && liveMatches.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-5">
              <div className="flex items-center gap-2">
                <span className="flex w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                <h2 className="text-lg font-black tracking-tight uppercase">En Direct Maintenant</h2>
              </div>
              <div className="flex-1 h-px bg-gradient-to-r from-red-500/30 to-transparent" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {liveMatches.slice(0, 10).map((m, i) => <MatchCard key={m.id} match={m} idx={i} />)}
            </div>
          </div>
        )}

        {/* Sport Categories */}
        <div className="mb-8">
          <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-none">
            {allSports.map(sport => (
              <motion.button
                key={sport.id}
                whileTap={{ scale: 0.96 }}
                onClick={() => setSelectedSport(sport.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 border ${selectedSport === sport.id
                  ? 'bg-purple-600 text-white border-purple-500 shadow-[0_0_20px_rgba(147,51,234,0.3)]'
                  : 'bg-white/[0.04] text-white/50 hover:text-white border-white/[0.06] hover:bg-white/[0.08]'
                  }`}
              >
                {sport.name}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Match Grid */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-black tracking-tight">
              {selectedSport === 'all' ? 'Tous les Matches' :
                selectedSport === 'live' ? 'Programme Complet' :
                  selectedSport === 'schedule' ? 'Programme du Jour' :
                    allSports.find(s => s.id === selectedSport)?.name || 'Matches'}
            </h2>
            {!loading && filteredMatches.length > 0 && (
              <span className="text-xs text-zinc-600">{filteredMatches.length} résultats</span>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="aspect-[4/5] rounded-2xl bg-white/[0.03] animate-pulse border border-white/[0.04]" />
              ))}
            </div>
          ) : filteredMatches.length === 0 ? (
            <div className="text-center py-24">
              <Trophy className="w-14 h-14 mx-auto mb-4 text-white/10" />
              <h3 className="text-lg font-bold text-white/30 mb-1">Aucun match trouvé</h3>
              <p className="text-sm text-white/20">Essayez une autre catégorie ou revenez plus tard</p>
            </div>
          ) : selectedSport === 'schedule' && groupedByDate ? (
            <div className="space-y-10">
              {Object.entries(groupedByDate).map(([date, dateMatches]) => (
                <div key={date}>
                  <div className="flex items-center gap-3 mb-5">
                    <Calendar className="w-4 h-4 text-purple-400" />
                    <h3 className="text-sm font-black text-purple-400 uppercase tracking-widest">{date}</h3>
                    <div className="flex-1 h-px bg-purple-500/15" />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
                    {dateMatches.map((m, i) => <MatchCard key={m.id} match={m} idx={i} />)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
              {filteredMatches.map((m, i) => <MatchCard key={m.id} match={m} idx={i} />)}
            </div>
          )}
        </div>
      </main>

      {/* ── Player Modal ── */}
      <AnimatePresence>
        {playerState && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-3 md:p-6"
            onClick={(e) => { if (e.target === e.currentTarget) setPlayerState(null); }}
          >
            <motion.div
              ref={playerRef}
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-6xl bg-[#0a0a0c] rounded-2xl border border-white/10 overflow-hidden shadow-2xl flex flex-col"
              style={{ maxHeight: '95vh' }}
            >
              {/* Player Header */}
              <div className="flex items-center gap-3 px-4 py-3 bg-black/50 border-b border-white/8 flex-shrink-0">
                {/* Match info */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex items-center gap-2 opacity-70">
                    <Shield className="w-4 h-4 text-white/40" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-sm font-bold text-white truncate">{playerState.match.title}</h2>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-zinc-500 capitalize">{playerState.match.category}</span>
                      <span className="w-1 h-1 rounded-full bg-zinc-700" />
                      <span className="flex items-center gap-1 text-[10px] text-red-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> LIVE
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stream selector */}
                <div className="flex items-center gap-1.5 overflow-x-auto max-w-[50%] scrollbar-none">
                  {playerState.streams.map((s, i) => (
                    <button
                      key={s.id}
                      onClick={() => setPlayerState(prev => prev ? { ...prev, selectedStream: s } : null)}
                      className={`flex-shrink-0 flex flex-col items-center px-2.5 py-1.5 rounded-lg text-[9px] font-bold transition-all border ${playerState.selectedStream.id === s.id
                        ? 'bg-purple-600 text-white border-purple-500'
                        : 'bg-white/5 text-white/50 border-white/8 hover:bg-white/10'
                        }`}
                    >
                      <span className="uppercase">{s.source} #{i + 1}</span>
                      <span className="text-[8px] opacity-70">
                        {langFlags[s.language] || '🌐'} {s.hd ? 'HD' : 'SD'}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Controls */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={toggleFullscreen} className="p-1.5 rounded-lg hover:bg-white/8 text-white/50 hover:text-white transition-colors">
                    {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>
                  <button onClick={() => setPlayerState(null)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/50 hover:text-red-400 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* iFrame */}
              <div className="relative flex-1 bg-black" style={{ minHeight: '50vh' }}>
                {playerState.selectedStream.embedUrl ? (
                  <iframe
                    key={playerState.selectedStream.id}
                    src={playerState.selectedStream.embedUrl}
                    className="w-full h-full border-0"
                    style={{ minHeight: '50vh' }}
                    allowFullScreen
                    allow="autoplay; encrypted-media; picture-in-picture"
                    title="Live Stream"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white/30 gap-4">
                    <Signal className="w-12 h-12" />
                    <p className="text-sm font-medium">Signal en attente...</p>
                  </div>
                )}
              </div>

              {/* Player footer info */}
              <div className="px-4 py-2.5 bg-black/40 border-t border-white/[0.05] flex items-center justify-between">
                <div className="flex items-center gap-4 text-[10px] text-zinc-600">
                  <span className="flex items-center gap-1"><Signal className="w-3 h-3" /> {playerState.selectedStream.source.toUpperCase()}</span>
                  {playerState.match.viewers && <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {formatViewers(playerState.match.viewers)} spectateurs</span>}
                </div>
                <span className="text-[10px] text-zinc-700">⚡ Streaming propulsé par CStream</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}