import { motion } from "framer-motion";
import { tmdbApi } from "@/lib/tmdb";

interface PosterOverlayProps {
  posterPath?: string | null;
  title: string;
  mediaType: "movie" | "tv";
}

export function PosterOverlay({ posterPath, title }: PosterOverlayProps) {
  if (!posterPath) return null;

  const imageUrl = tmdbApi.getImageUrl(posterPath, "w500");

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="relative group cursor-default overflow-hidden rounded-xl shadow-2xl w-full h-full"
    >
      <img
        src={imageUrl}
        alt={title}
        loading="lazy"
        className="w-full h-full object-cover rounded-xl transition-transform duration-300 group-hover:scale-105 bg-slate-900"
      />
    </motion.div>
  );
}
