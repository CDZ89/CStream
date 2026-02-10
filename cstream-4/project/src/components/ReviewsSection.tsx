import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  MessageSquare,
  Send,
  User,
  Calendar,
  Loader2,
  Sparkles,
  TrendingUp,
  ThumbsUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { InfiniteMovingCards } from "@/components/ui/infinite-moving-cards";
import { cn } from "@/lib/utils";

interface Review {
  id: string;
  user_id: string;
  username: string;
  profile_url?: string | null;
  comment: string;
  rating: number;
  created_at: string;
  media_id: string;
  badge?: string | null;
}

interface ReviewsSectionProps {
  mediaType: "movie" | "tv";
  mediaId: string | number;
  className?: string;
}

const StarRating = ({
  rating,
  interactive = false,
  onChange,
  size = "md",
}: {
  rating: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
  size?: "sm" | "md" | "lg";
}) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => interactive && onChange?.(star * 2)}
          className={cn(
            "transition-all duration-300",
            interactive &&
              "focus:outline-none group cursor-pointer hover:scale-110",
          )}
          type="button"
          disabled={!interactive}
        >
          <Star
            className={cn(
              sizeClasses[size],
              star <= Math.ceil(rating / 2)
                ? "fill-yellow-400 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]"
                : interactive
                  ? "text-white/20 group-hover:text-yellow-400/50"
                  : "text-white/10",
            )}
          />
        </button>
      ))}
    </div>
  );
};

const ReviewCard = ({ review }: { review: Review }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    whileHover={{ y: -4, transition: { duration: 0.2 } }}
    className="group p-6 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 hover:border-purple-500/30 hover:bg-white/10 transition-all duration-300 backdrop-blur-sm relative overflow-hidden"
  >
    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-pink-500/0 group-hover:from-purple-500/5 group-hover:to-pink-500/5 transition-all duration-500" />

    <div className="relative z-10">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {review.profile_url ? (
            <img
              src={review.profile_url}
              alt={review.username}
              className="w-12 h-12 rounded-full object-cover ring-2 ring-purple-500/30 group-hover:ring-purple-500/60 transition-all duration-300"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-white/10 group-hover:border-purple-500/50 transition-all duration-300">
              <User className="w-6 h-6 text-purple-400" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-white truncate">
                {review.username}
              </h3>
              {review.badge && (
                <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 whitespace-nowrap text-xs">
                  {review.badge}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <StarRating rating={review.rating} size="sm" />
              <span className="text-xs text-white/50">
                {new Date(review.created_at).toLocaleDateString("fr-FR")}
              </span>
            </div>
          </div>
        </div>
      </div>

      <p className="text-white/80 text-sm leading-relaxed line-clamp-4">
        {review.comment}
      </p>

      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/5">
        <button className="flex items-center gap-2 text-white/60 hover:text-purple-400 transition-colors text-sm group/btn">
          <ThumbsUp className="w-4 h-4 group-hover/btn:fill-purple-400" />
          <span>J'aime</span>
        </button>
        <button className="flex items-center gap-2 text-white/60 hover:text-purple-400 transition-colors text-sm">
          <MessageSquare className="w-4 h-4" />
          <span>Répondre</span>
        </button>
      </div>
    </div>
  </motion.div>
);

const ReviewStatsCard = ({ reviews }: { reviews: Review[] }) => {
  const averageRating = useMemo(
    () =>
      reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : 0,
    [reviews],
  );

  const ratingDistribution = useMemo(() => {
    const dist = [0, 0, 0, 0, 0];
    reviews.forEach((r) => {
      const starIndex = Math.ceil(r.rating / 2) - 1;
      if (starIndex >= 0 && starIndex < 5) {
        dist[starIndex]++;
      }
    });
    return dist;
  }, [reviews]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      className="p-8 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 backdrop-blur-sm"
    >
      <div className="flex items-center justify-between gap-8">
        <div className="text-center">
          <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-500 mb-2">
            {averageRating}
          </div>
          <StarRating rating={Number(averageRating) * 2} />
          <p className="text-white/50 text-xs mt-1">{reviews.length} avis</p>
        </div>

        <div className="h-16 w-px bg-white/10" />

        <div className="space-y-1 flex-1">
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = ratingDistribution[stars - 1];
            const percentage =
              reviews.length > 0 ? (count / reviews.length) * 100 : 0;
            return (
              <div key={stars} className="flex items-center gap-2 text-xs">
                <span className="text-white/60 w-8">{stars}★</span>
                <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.8, delay: stars * 0.1 }}
                    className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500"
                  />
                </div>
                <span className="text-white/40 w-12 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

export const ReviewsSection = ({
  mediaType,
  mediaId,
  className = "",
}: ReviewsSectionProps) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [newRating, setNewRating] = useState(5);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);

  const mediaIdStr = `${mediaType}_${mediaId}`;

  useEffect(() => {
    const fetchReviews = async () => {
      if (!mediaId) return;
      setReviewsLoading(true);
      try {
        const { data, error } = await supabase
          .from("reviews")
          .select("id, user_id, username, profile_url, comment, rating, created_at, media_id, badge")
          .eq("media_id", mediaIdStr)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setReviews(data ? (data as unknown as Review[]) : []);
      } catch (err) {
        console.error("Failed to fetch reviews:", err);
      } finally {
        setReviewsLoading(false);
      }
    };
    fetchReviews();
  }, [mediaId, mediaType, mediaIdStr]);

  const addReview = useCallback(async () => {
    if (!user) {
      toast.error("Veuillez vous connecter pour laisser un avis");
      return;
    }

    if (!newComment.trim()) {
      toast.error("Veuillez écrire un commentaire");
      return;
    }

    if (newComment.trim().length < 10) {
      toast.error("Votre commentaire doit contenir au moins 10 caractères");
      return;
    }

    setSubmittingReview(true);
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("username, avatar_url")
        .eq("id", user.id)
        .maybeSingle();

      const { data, error } = await supabase
        .from("reviews")
        .insert({
          user_id: user.id,
          username: profile?.username || user.email?.split("@")[0] || "Utilisateur",
          profile_url: profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`,
          comment: newComment.trim(),
          rating: newRating,
          media_id: mediaIdStr,
          badge: null,
        })
        .select("*")
        .single();

      if (error) throw error;

      const newReview: Review = {
        id: (data as any).id,
        user_id: user.id,
        username: (data as any).username,
        profile_url: (data as any).profile_url,
        comment: (data as any).comment,
        rating: (data as any).rating,
        created_at: (data as any).created_at,
        media_id: (data as any).media_id,
        badge: (data as any).badge,
      };

      setReviews((prev) => [newReview, ...prev]);
      setNewComment("");
      setNewRating(5);
      setShowCommentForm(false);
      toast.success("Avis publié avec succès !", {
        icon: "✨",
        description: "Merci pour votre contribution !",
      });
    } catch (error) {
      console.error("Error adding review:", error);
      toast.error("Erreur lors de la publication de votre avis");
    } finally {
      setSubmittingReview(false);
    }
  }, [user, newComment, newRating, mediaIdStr]);

  const testimonials = useMemo(
    () =>
      reviews.map((r) => ({
        quote: r.comment,
        name: r.username || "Utilisateur",
        avatar: r.profile_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${r.user_id}`,
        rating: Math.ceil(r.rating / 2),
        title: r.badge || "Membre CStream",
      })),
    [reviews],
  );

  return (
    <section className={cn("py-12 space-y-12", className)}>
      {reviews.length > 0 && (
        <>
          <ReviewStatsCard reviews={reviews} />

          <div>
            <h3 className="text-2xl font-bold mb-8 flex items-center gap-3">
              <MessageSquare className="w-6 h-6 text-purple-400" />
              Avis des Spectateurs
            </h3>
            {reviewsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {reviews.slice(0, 4).map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {!showCommentForm ? (
        <Button
          onClick={() => setShowCommentForm(true)}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          <Send className="w-4 h-4 mr-2" />
          Laisser un Avis
        </Button>
      ) : (
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle>Donnez votre avis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Note (/10)
              </label>
              <StarRating rating={newRating} interactive onChange={setNewRating} />
              <p className="text-xs text-white/50 mt-1">{newRating}/10</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Votre avis
              </label>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Partagez votre expérience..."
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white placeholder-white/40 focus:outline-none focus:border-purple-500/50"
                rows={4}
              />
              <p className="text-xs text-white/50 mt-1">
                {newComment.length} caractères (minimum 10)
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={addReview}
                disabled={submittingReview}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {submittingReview ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Publication...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Publier
                  </>
                )}
              </Button>
              <Button
                onClick={() => setShowCommentForm(false)}
                variant="outline"
                className="border-white/10"
              >
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  );
};
