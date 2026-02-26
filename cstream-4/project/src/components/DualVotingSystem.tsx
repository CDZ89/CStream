import { useState } from 'react';
import { Star, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

interface VoteData {
  tmdbVote: number;
  tmdbVoteCount: number;
  cstreamVote: number;
  userVote?: number;
}

interface DualVotingSystemProps {
  tmdbVote: number;
  tmdbVoteCount: number;
  cstreamVote?: number;
  onUserVote?: (rating: number) => void;
  userVote?: number;
  mediaId: string;
  mediaType: 'movie' | 'tv';
}

export const DualVotingSystem = ({
  tmdbVote,
  tmdbVoteCount,
  cstreamVote = 7.5,
  onUserVote,
  userVote = 0,
  mediaId,
  mediaType
}: DualVotingSystemProps) => {
  const [newRating, setNewRating] = useState(userVote);
  const [showVoteForm, setShowVoteForm] = useState(false);
  const [hasVoted, setHasVoted] = useState(userVote > 0);

  const handleRatingChange = (rating: number) => {
    setNewRating(rating);
    if (onUserVote) {
      onUserVote(rating);
    }
    setHasVoted(true);
    setTimeout(() => setShowVoteForm(false), 1000);
  };

  return (
    <div className="space-y-4">
      {/* TMDB Vote */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 border border-blue-500/30 rounded-xl p-4"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-blue-300">Vote TMDB</span>
          </div>
          <span className="text-xs text-blue-400/70">({tmdbVoteCount.toLocaleString()} avis)</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-3xl font-bold text-blue-400">
            {tmdbVote.toFixed(1)}
          </div>
          <div className="flex gap-1.5">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.05 }}
              >
                <Star
                  className={`w-6 h-6 ${
                    i < Math.round(tmdbVote / 2)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-600'
                  }`}
                />
              </motion.div>
            ))}
          </div>
          <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
              initial={{ width: 0 }}
              animate={{ width: `${(tmdbVote / 10) * 100}%` }}
              transition={{ delay: 0.3, duration: 0.6 }}
            />
          </div>
        </div>
      </motion.div>

      {/* CStream Vote */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-r from-purple-500/10 to-purple-600/10 border border-purple-500/30 rounded-xl p-4"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium text-purple-300">Vote CStream</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-3xl font-bold text-purple-400">
            {cstreamVote.toFixed(1)}
          </div>
          <div className="flex gap-1.5">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1 + i * 0.05 }}
              >
                <Star
                  className={`w-6 h-6 ${
                    i < Math.round(cstreamVote / 2)
                      ? 'fill-purple-400 text-purple-400'
                      : 'text-gray-600'
                  }`}
                />
              </motion.div>
            ))}
          </div>
          <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 to-purple-600"
              initial={{ width: 0 }}
              animate={{ width: `${(cstreamVote / 10) * 100}%` }}
              transition={{ delay: 0.4, duration: 0.6 }}
            />
          </div>
        </div>
      </motion.div>

      {/* User Vote */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-r from-orange-500/10 to-orange-600/10 border border-orange-500/30 rounded-xl p-4"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-orange-400" />
            <span className="text-sm font-medium text-orange-300">
              {hasVoted ? 'Votre vote' : 'Votez maintenant'}
            </span>
          </div>
          {hasVoted && (
            <span className="text-xs text-orange-400/70 font-medium">✓ Enregistré</span>
          )}
        </div>

        {!showVoteForm && hasVoted ? (
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-orange-400">{newRating}/5</div>
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  whileHover={{ scale: 1.2 }}
                  onClick={() => setShowVoteForm(true)}
                  className="cursor-pointer"
                >
                  <Star
                    className={`w-5 h-5 transition-all ${
                      i < newRating
                        ? 'fill-orange-400 text-orange-400'
                        : 'text-gray-600 hover:text-gray-500'
                    }`}
                  />
                </motion.div>
              ))}
            </div>
            <button
              onClick={() => setShowVoteForm(true)}
              className="text-xs text-orange-400 hover:text-orange-300 underline"
            >
              Modifier
            </button>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-2 justify-center py-2"
          >
            {[1, 2, 3, 4, 5].map((star) => (
              <motion.button
                key={star}
                whileHover={{ scale: 1.3 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleRatingChange(star)}
                className="relative group"
              >
                <Star
                  className={`w-6 h-6 transition-all cursor-pointer ${
                    star <= newRating
                      ? 'fill-orange-400 text-orange-400'
                      : 'text-gray-600 group-hover:text-orange-300'
                  }`}
                />
              </motion.button>
            ))}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};
