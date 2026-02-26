import React, { useMemo } from "react";
import { motion } from "framer-motion";

const POSTER_URLS = [
  "https://image.tmdb.org/t/p/w300/q719jXXLsJnEYIby2ar9qjhk8t.jpg",
  "https://image.tmdb.org/t/p/w300/8Gxv9mYdh35Xj9QvSTzbXUq7V9z.jpg",
  "https://image.tmdb.org/t/p/w300/39wmItIW9p4m9uA6H2vRlvDYRno.jpg",
  "https://image.tmdb.org/t/p/w300/6oom5QSilvWp3u6H906q6kyyYwb.jpg",
  "https://image.tmdb.org/t/p/w300/966mSqrRw8qq7oZ969v956799.jpg",
  "https://image.tmdb.org/t/p/w300/rAiYVoPDU7pX4p9O7S6V6G2kR9u.jpg",
  "https://image.tmdb.org/t/p/w300/7WsyChnd3KgTcy1fsXBs0057S0w.jpg",
  "https://image.tmdb.org/t/p/w300/1E5baAaEse26fej7uHcjCbG3pX3.jpg",
  "https://image.tmdb.org/t/p/w300/j9v0mU6p9p9M6k9W7S6V6G2kR9u.jpg",
  "https://image.tmdb.org/t/p/w300/4mXOfX1o9p4m9uA6H2vRlvDYRno.jpg",
  "https://image.tmdb.org/t/p/w300/58mSqrRw8qq7oZ969v956799.jpg",
  "https://image.tmdb.org/t/p/w300/2Gxv9mYdh35Xj9QvSTzbXUq7V9z.jpg",
];

const PosterColumn = ({ posters, duration, reverse = false }: { posters: string[], duration: number, reverse?: boolean }) => {
  return (
    <div className="flex flex-col gap-4 relative">
      <motion.div
        className="flex flex-col gap-4"
        animate={{
          y: reverse ? [0, -1500] : [-1500, 0],
        }}
        transition={{
          duration,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        {[...posters, ...posters, ...posters].map((url, i) => (
          <div
            key={i}
            className="w-[120px] sm:w-[180px] aspect-[2/3] rounded-2xl overflow-hidden border border-white/5 bg-white/5 shadow-2xl"
          >
            <img
              src={url}
              alt=""
              className="w-full h-full object-cover opacity-60"
              loading="lazy"
            />
          </div>
        ))}
      </motion.div>
    </div>
  );
};

export const AuthBackground = () => {
  const shuffledPosters = useMemo(() => {
    return Array.from({ length: 6 }).map(() => 
      [...POSTER_URLS].sort(() => Math.random() - 0.5)
    );
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 bg-[#020205]">
      <div className="absolute inset-0 flex justify-center gap-6 opacity-20 skew-y-12 scale-110">
        {shuffledPosters.map((posters, i) => (
          <PosterColumn 
            key={i} 
            posters={posters} 
            duration={45 + i * 8} 
            reverse={i % 2 === 0} 
          />
        ))}
      </div>
      
      <div className="absolute inset-0 bg-gradient-to-b from-[#020205] via-[#020205]/40 to-[#020205]" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#020205] via-transparent to-[#020205]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#020205_100%)]" />
      
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] animate-pulse delay-700" />
    </div>
  );
};
