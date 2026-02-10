// src/pages/WatchPage.tsx
import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { tmdbApi } from "@/lib/tmdb";
import { useAuth } from "@/hooks/useAuth";
import { useWatchHistory } from "@/hooks/useWatchHistory";
import { Navbar } from "@/components/Navbar";
import { MediaGrid } from "@/components/MediaGrid";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Star,
  Heart,
  Share2,
  ChevronLeft,
  Loader2,
  MessageSquare,
  ChevronRight,
  AlertTriangle,
  ThumbsUp,
  Eye,
  Play,
  Info,
  RefreshCw,
} from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { UniversalPlayer, SOURCES } from "@/components/UniversalPlayer";
import { useI18n } from "@/lib/i18n";
import { ImportedSourceSelector } from "@/components/ImportedSourceSelector";
import { PayPalButton } from "@/components/PayPalButton";
import { SecurityBanner } from "@/components/SecurityBanner";
import { CloudHint } from "@/components/player/CloudHint";

/* ============================ Types ============================ */
interface Comment {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  role: string | null;
  content: string;
  created_at: string;
}

interface TMDBMovie {
  id: number;
  title: string;
  tagline?: string;
  overview?: string;
  poster_path?: string;
  backdrop_path?: string;
  vote_average?: number;
  vote_count?: number;
  release_date?: string;
  runtime?: number;
  genres?: Array<{ id: number; name: string }>;
  credits?: {
    crew?: Array<{ job: string; name: string; id: number }>;
    cast?: Array<{
      id: number;
      name: string;
      character: string;
      profile_path?: string;
    }>;
  };
  videos?: {
    results?: Array<{
      key: string;
      type: string;
      site: string;
    }>;
  };
  recommendations?: {
    results?: any[];
  };
}

const formatDuration = (minutes?: number | null): string => {
  if (!minutes || minutes <= 0) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}min` : `${m}min`;
};

const WatchPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { saveProgress } = useWatchHistory();

  const [movie, setMovie] = useState<TMDBMovie | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [likes, setLikes] = useState(0);
  const [views, setViews] = useState(0);
  const [currentSource, setCurrentSource] = useState<any>(undefined);

  useEffect(() => {
    const fetchMovie = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const lang = useI18n.getState().getTMDBLanguage();
        const data = (await tmdbApi.getMovieDetails(
          parseInt(id),
          lang,
        )) as TMDBMovie;
        setMovie(data);
        setLikes(Math.floor(Math.random() * 5000) + 100);
        setViews(Math.floor(Math.random() * 50000) + 1000);
      } catch (err) {
        console.error("Failed to fetch movie:", err);
        toast.error("Impossible de charger les détails du film.");
      } finally {
        setLoading(false);
      }
    };
    fetchMovie();
  }, [id]);

  useEffect(() => {
    const loadFavorite = async () => {
      if (!id || !user) return;
      try {
        const { data } = await supabase
          .from("favorites")
          .select("id")
          .eq("user_id", user.id)
          .eq("media_id", id)
          .eq("media_type", "movie")
          .maybeSingle();
        setIsFavorite(!!data);
      } catch (err) {
        console.error("Error loading favorite:", err);
      }
    };
    loadFavorite();
  }, [id, user]);

  const toggleFavorite = useCallback(async () => {
    if (!id || !user) {
      toast.error("Connectez-vous pour ajouter aux favoris");
      return;
    }
    try {
      if (isFavorite) {
        await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("media_id", id);
        setIsFavorite(false);
        toast.success("Retiré des favoris");
      } else {
        await supabase
          .from("favorites")
          .insert({ user_id: user.id, media_id: id, media_type: "movie" });
        setIsFavorite(true);
        toast.success("Ajouté aux favoris");
      }
    } catch (err) {
      toast.error("Erreur favoris");
    }
  }, [id, user, isFavorite]);

  const fetchComments = useCallback(async () => {
    if (!id) return;
    setLoadingComments(true);
    try {
      const { data: commentsData } = await supabase
        .from("comments")
        .select("id, content, created_at, user_id")
        .eq("tmdb_id", parseInt(id))
        .eq("media_type", "movie")
        .order("created_at", { ascending: false });

      if (commentsData) {
        const userIds = [...new Set(commentsData.map((c) => c.user_id))];
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, username, avatar_url, role")
          .in("id", userIds);
        const profilesMap = (profilesData || []).reduce(
          (acc: any, p) => ({ ...acc, [p.id]: p }),
          {},
        );

        setComments(
          commentsData.map((c) => ({
            ...c,
            username: profilesMap[c.user_id]?.username || "Utilisateur",
            avatar_url: profilesMap[c.user_id]?.avatar_url || null,
            role: profilesMap[c.user_id]?.role || null,
            created_at: c.created_at || new Date().toISOString(),
          })),
        );
      }
    } finally {
      setLoadingComments(false);
    }
  }, [id]);

  useEffect(() => {
    if (movie) fetchComments();
  }, [movie, fetchComments]);

  const addComment = useCallback(async () => {
    if (!user || !newComment.trim() || !id) return;
    setSubmittingComment(true);
    try {
      const { data } = await supabase
        .from("comments")
        .insert({
          user_id: user.id,
          tmdb_id: parseInt(id),
          media_type: "movie",
          content: newComment.trim(),
        })
        .select()
        .single();
      if (data) {
        await fetchComments();
        setNewComment("");
        toast.success("Commentaire ajouté !");
      }
    } finally {
      setSubmittingComment(false);
    }
  }, [user, newComment, id, fetchComments]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Lien copié !");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#06080b] flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto" />
            <p className="text-white/40 font-medium animate-pulse">
              Chargement...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-[#06080b] flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md w-full bg-zinc-900/50 border-white/10 backdrop-blur-xl">
            <CardContent className="pt-12 pb-8 text-center">
              <AlertTriangle className="w-16 h-16 text-red-600 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-white mb-2">
                Contenu Introuvable
              </h2>
              <Button
                onClick={() => navigate("/")}
                className="mt-4 bg-purple-600 hover:bg-purple-700"
              >
                Retour à l'accueil
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#06080b] text-white selection:bg-zinc-500/30 overflow-x-hidden">
      <Navbar />

      {/* Background Backdrop */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-5 blur-[100px] scale-125"
          style={{
            backgroundImage: `url(https://image.tmdb.org/t/p/original${movie.backdrop_path})`,
          }}
        />
        <div className="absolute inset-0 bg-[#06080b]/80" />
      </div>

      <main className="relative z-10 pt-16 sm:pt-20 pb-10 sm:pb-20 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 sm:p-2 hover:bg-white/5 rounded-xl transition-colors group shrink-0"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-white/40 group-hover:text-white" />
            </button>
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <h1 className="text-base sm:text-xl md:text-2xl font-bold tracking-tight truncate">
                {movie.title}
              </h1>
              <Badge
                variant="outline"
                className="border-white/10 text-white/60 bg-white/5 uppercase text-[8px] sm:text-[10px] font-bold px-1.5 sm:px-2 shrink-0 h-4 sm:h-5"
              >
                ULTRA HD
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:grid lg:grid-cols-[1fr,400px] gap-4 sm:gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="space-y-4 sm:space-y-6 lg:space-y-8 min-w-0">
            <SecurityBanner />
            <div className="px-0 sm:px-4">
              <PayPalButton planId="P-97B807020U2062216NGAN3EA" />
            </div>

            {/* Player & Sources Combined */}
            <div className="bg-zinc-900/60 backdrop-blur-2xl border border-white/5 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl">
              {/* Header inside player area */}
              <div className="p-3 sm:p-4 border-b border-white/5 bg-white/5 flex flex-wrap items-center justify-between gap-2 sm:gap-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-purple-500 animate-pulse" />
                  <span className="text-[9px] sm:text-xs font-bold uppercase tracking-widest text-white/70">
                    Lecteur Principal
                  </span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 text-[8px] sm:text-[10px] font-bold px-1 sm:px-1.5">
                    HD 1080P
                  </Badge>
                  <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20 text-[8px] sm:text-[10px] font-bold px-1 sm:px-1.5">
                    AUTO-SWITCH
                  </Badge>
                </div>
              </div>

              {/* Player */}
              <div className="relative group bg-black aspect-video w-full">
                <UniversalPlayer
                  tmdbId={movie.id}
                  mediaType="movie"
                  title={movie.title}
                  posterPath={movie.poster_path}
                  autoPlay
                  currentSource={currentSource}
                  setCurrentSource={setCurrentSource}
                />
              </div>

              <div className="p-3 sm:p-4 bg-zinc-950/80">
                <div className="flex flex-col gap-3 sm:gap-4">
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-white/40">
                        Sélecteur de Source
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 sm:pt-3 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-4">
                      <ImportedSourceSelector
                        tmdbId={movie.id}
                        onSelect={(s) => {
                          setCurrentSource(s.id as any);
                          toast.success(`Lecture via ${s.label}`);
                        }}
                        currentSource={null}
                        className="w-auto h-8 sm:h-9"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentSource(undefined)}
                        className="text-[8px] sm:text-[10px] font-bold bg-zinc-900/40 border-white/10 hover:bg-zinc-800/60 h-8 sm:h-9"
                      >
                        <Play className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1.5 sm:mr-2" />
                        AUTO
                      </Button>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <Button variant="ghost" size="sm" onClick={() => window.location.reload()} className="text-[8px] sm:text-[10px] font-bold text-white/40 hover:text-white h-8 sm:h-9">
                        <RefreshCw className="w-2.5 h-2.5 sm:w-3 sm:h-3 sm:mr-2" />
                        <span className="hidden sm:inline">REFRESH</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Interaction Bar */}
            <div className="flex flex-col xs:flex-row items-stretch xs:items-center justify-between gap-4 bg-zinc-900/60 backdrop-blur-xl border border-white/5 rounded-xl sm:rounded-2xl p-4">
              <div className="flex items-center justify-center xs:justify-start gap-4 sm:gap-6 text-xs sm:text-sm order-2 xs:order-1 border-t xs:border-t-0 border-white/5 pt-3 xs:pt-0">
                <div className="flex items-center gap-1.5 sm:gap-2 text-white/60">
                  <ThumbsUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400" />
                  <span className="font-bold">
                    {likes.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 text-white/60">
                  <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" />
                  <span className="font-bold">
                    {views.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 text-white/60 border-l border-white/10 pl-4 sm:pl-6">
                  <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-pink-400" />
                  <span className="font-bold">{comments.length}</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 sm:gap-4 order-1 xs:order-2">
                <Button
                  variant="outline"
                  onClick={toggleFavorite}
                  className={cn(
                    "flex-1 xs:flex-none rounded-xl border-white/10 bg-white/5 hover:bg-white/10 transition-all active:scale-95 h-10 sm:h-11 text-[11px] sm:text-sm px-4",
                    isFavorite && "text-white border-purple-500/50 bg-purple-500/10",
                  )}
                >
                  <Heart
                    className={cn(
                      "w-4 h-4 mr-2",
                      isFavorite && "fill-purple-500 text-purple-500",
                    )}
                  />
                  <span>
                    {isFavorite ? "Enregistré" : "Favori"}
                  </span>
                </Button>
                <Button
                  variant="outline"
                  onClick={handleShare}
                  className="rounded-xl border-white/10 bg-white/5 hover:bg-white/10 active:scale-95 h-10 sm:h-11 w-10 sm:w-11 p-0 flex items-center justify-center shrink-0"
                >
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr,240px] gap-4 sm:gap-6 lg:gap-8">
              {/* Synopsis & Cast */}
              <div className="space-y-4 sm:space-y-6">
                {/* Synopsis */}
                <div className="bg-zinc-900/40 backdrop-blur-xl rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 border border-white/5 space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-4 sm:h-5 bg-purple-500/50 rounded-full" />
                    <h3 className="text-sm sm:text-lg font-bold">Synopsis</h3>
                  </div>
                  <p className="text-white/60 leading-relaxed text-[11px] sm:text-base font-medium">
                    {movie.overview ||
                      "Aucun synopsis disponible pour ce titre."}
                  </p>
                </div>

                {/* Cast */}
                <div className="space-y-3 sm:space-y-4">
                  <h3 className="text-[9px] sm:text-sm font-black uppercase tracking-widest text-white/40 px-2">
                    Distribution
                  </h3>
                  <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 sm:gap-3">
                    {movie.credits?.cast?.slice(0, 4).map((person) => (
                      <Link
                        key={person.id}
                        to={`/person/${person.id}`}
                        className="flex items-center gap-2.5 sm:gap-3 bg-zinc-900/40 border border-white/5 rounded-xl sm:rounded-2xl p-1.5 sm:p-2 hover:bg-white/10 transition-colors group"
                      >
                        <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl overflow-hidden flex-shrink-0 border border-white/10">
                          <img
                            src={
                              person.profile_path
                                ? `https://image.tmdb.org/t/p/w185${person.profile_path}`
                                : "https://via.placeholder.com/185"
                            }
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                            alt={person.name}
                            loading="lazy"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-[10px] sm:text-sm truncate group-hover:text-purple-400 transition-colors">
                            {person.name}
                          </p>
                          <p className="text-[8px] sm:text-xs text-white/40 truncate">
                            {person.character}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quick Info */}
              <div className="space-y-3 sm:space-y-4">
                <div className="bg-zinc-900/60 backdrop-blur-xl rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-white/5 space-y-3 sm:space-y-4">
                  <h4 className="text-[9px] sm:text-xs font-black uppercase tracking-widest text-white/40 border-b border-white/5 pb-2 sm:pb-3">
                    Informations
                  </h4>
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] sm:text-xs text-white/40 font-bold">
                        Score
                      </span>
                      <div className="flex items-center gap-1 text-yellow-500 font-black text-[10px] sm:text-sm">
                        <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-current" />
                        {(movie.vote_average || 0).toFixed(1)}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] sm:text-xs text-white/40 font-bold">
                        Sortie
                      </span>
                      <span className="text-[9px] sm:text-xs font-black">
                        {new Date(movie.release_date || "").getFullYear()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] sm:text-xs text-white/40 font-bold">
                        Durée
                      </span>
                      <span className="text-[9px] sm:text-xs font-black">
                        {formatDuration(movie.runtime)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Comments Section */}
            <section className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-10 space-y-4 sm:space-y-8">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-600/20 shrink-0">
                  <MessageSquare className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-xl lg:text-2xl font-black tracking-tight truncate">
                    Communauté
                  </h2>
                  <p className="text-white/40 text-[8px] sm:text-xs font-bold uppercase tracking-wider">
                    {comments.length} avis
                  </p>
                </div>
              </div>

              {/* Comment Input */}
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-purple-600/20 rounded-xl sm:rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition duration-500" />
                <div className="relative bg-zinc-950/80 border border-white/10 rounded-xl p-3 sm:p-4 space-y-3 sm:space-y-4">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Partagez votre avis..."
                    className="w-full bg-transparent border-none focus:ring-0 text-[11px] sm:text-base resize-none placeholder:text-white/10 h-16 sm:h-24 font-medium"
                  />
                  <div className="flex justify-end">
                    <Button
                      onClick={addComment}
                      disabled={submittingComment || !newComment.trim()}
                      className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg sm:rounded-xl px-4 sm:px-8 h-8 sm:h-10 text-[10px] sm:text-sm font-bold shadow-lg shadow-purple-600/10 transition-all active:scale-95"
                    >
                      {submittingComment ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        "Publier"
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Comments List */}
              <div className="space-y-4 sm:space-y-6">
                {comments.length > 0 ? (
                  comments.map((comment) => (
                    <motion.div
                      key={comment.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex gap-3 sm:gap-4 group"
                    >
                      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl overflow-hidden bg-zinc-800 flex-shrink-0 border border-white/5">
                        {comment.avatar_url ? (
                          <img
                            src={comment.avatar_url}
                            className="w-full h-full object-cover"
                            alt=""
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-white/20 text-sm">
                            {comment.username[0].toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 space-y-1.5 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-bold text-xs sm:text-sm text-white/90 group-hover:text-purple-400 transition-colors truncate">
                              {comment.username}
                            </span>
                            {comment.role === "creator" && (
                              <Badge className="bg-red-600 text-[8px] h-4 py-0 px-1 font-black shrink-0">
                                CREATOR
                              </Badge>
                            )}
                            {comment.role === "admin" && (
                              <Badge className="bg-purple-600 text-[8px] h-4 py-0 px-1 font-black shrink-0">
                                ADMIN
                              </Badge>
                            )}
                          </div>
                          <span className="text-[10px] text-white/20 font-bold shrink-0">
                            {new Date(comment.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3 sm:p-4 text-white/70 text-xs sm:text-sm font-medium leading-relaxed">
                          {comment.content}
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-3xl">
                    <p className="text-white/20 font-bold uppercase tracking-widest text-xs">
                      Aucun commentaire
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6 lg:space-y-8">
            {/* Ratings */}
            <div className="bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-3xl p-5 sm:p-6 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-white/30">
                Évaluations
              </h4>

              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 sm:p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-white/40">TMDB</span>
                  <span className="text-[10px] text-white/40">
                    {movie.vote_count?.toLocaleString()} votes
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl sm:text-3xl font-black text-white">
                    {(movie.vote_average || 0).toFixed(1)}
                  </span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={cn(
                          "w-3 h-3 sm:w-4 sm:h-4",
                          s <= Math.round((movie.vote_average || 0) / 2)
                            ? "text-yellow-500/80 fill-current"
                            : "text-white/5",
                        )}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <CloudHint />

            {/* Poster */}
            <div className="relative group rounded-3xl overflow-hidden border border-white/5 shadow-2xl bg-zinc-900/40">
              <img
                src={
                  movie.poster_path
                    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                    : "https://via.placeholder.com/500x750"
                }
                className="w-full object-cover group-hover:scale-105 transition-transform duration-700"
                alt={movie.title}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#06080b] via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2">
                {movie.genres?.slice(0, 3).map((g) => (
                  <Badge
                    key={g.id}
                    variant="secondary"
                    className="bg-black/60 backdrop-blur-md text-[9px] border-white/10"
                  >
                    {g.name}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div className="space-y-5">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-white/40">
                  À voir ensuite
                </h3>
                <Link
                  to="/movies"
                  className="text-[10px] font-black uppercase tracking-widest text-purple-500 hover:text-purple-400"
                >
                  Tout
                </Link>
              </div>
              <div className="space-y-3">
                {movie.recommendations?.results?.slice(0, 5).map((rec) => (
                  <Link
                    key={rec.id}
                    to={`/watch/${rec.id}`}
                    className="flex items-center gap-3 bg-white/5 border border-white/5 rounded-2xl p-2 hover:bg-white/10 transition-all group"
                  >
                    <div className="w-14 h-[4.5rem] sm:w-16 sm:h-20 rounded-xl overflow-hidden flex-shrink-0 border border-white/10">
                      <img
                        src={`https://image.tmdb.org/t/p/w185${rec.poster_path}`}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        alt=""
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-xs truncate group-hover:text-purple-400 transition-colors">
                        {rec.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-1 text-[10px] text-yellow-500 font-black">
                          <Star className="w-2.5 h-2.5 fill-current" />
                          {(rec.vote_average || 0).toFixed(1)}
                        </div>
                        <span className="text-[10px] text-white/30 font-bold">
                          {new Date(rec.release_date || "").getFullYear()}
                        </span>
                      </div>
                    </div>
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-purple-600/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <Play className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-purple-500 fill-current ml-0.5" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>

        {/* Similar Content */}
        <section className="mt-12 sm:mt-16 lg:mt-20 space-y-6 sm:space-y-8">
          <div className="flex items-center justify-between px-2 border-b border-white/5 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-1 h-5 sm:h-6 bg-purple-600 rounded-full" />
              <h2 className="text-base sm:text-lg lg:text-2xl font-black tracking-tight uppercase">
                Similaires
              </h2>
            </div>
            <Link
              to="/movies"
              className="p-2 sm:p-3 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </Link>
          </div>
          <MediaGrid
            items={movie.recommendations?.results?.slice(0, 10) || []}
            mediaType="movie"
            variant="compact"
          />
        </section>
      </main>
    </div>
  );
};

export default WatchPage;
