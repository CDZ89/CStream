import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useLayoutEffect,
  useMemo,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Film,
  Tv,
  User,
  X,
  History,
  Trash2,
  Star,
  Calendar,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { tmdbApi, TMDBSearchResult } from "@/lib/tmdb";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { useLanguageStore, t } from "@/lib/i18n";

const SEARCH_HISTORY_KEY = "cstream_search_history_overlay";
const MAX_HISTORY_ITEMS = 15;
const DEBOUNCE_DELAY = 120;
const MAX_RESULTS = 15;

interface SearchHistoryItem {
  id: number;
  title: string;
  media_type: string;
  poster_path?: string | null;
  year?: string;
  rating?: number;
  timestamp?: number;
}

interface SearchBarOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const shimmerVariants = {
  initial: { x: "-100%" },
  animate: {
    x: "200%",
    transition: {
      repeat: Infinity,
      duration: 2,
      easing: [0, 0, 1, 1],
    },
  },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.02,
      staggerDirection: -1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20, scale: 0.95 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 500,
      damping: 35,
    },
  },
  exit: {
    opacity: 0,
    x: -10,
    scale: 0.98,
    transition: { duration: 0.15 },
  },
};

export const SearchBarOverlay = ({
  isOpen,
  onClose,
}: SearchBarOverlayProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TMDBSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();
  const abortControllerRef = useRef<AbortController | null>(null);
  const latestQueryRef = useRef<string>("");
  const isOpenRef = useRef<boolean>(isOpen);
  const resultsRef = useRef<HTMLDivElement>(null);
  const { language } = useLanguageStore();
  const inputControls = useAnimation();

  useLayoutEffect(() => {
    isOpenRef.current = isOpen;
    if (!isOpen) {
      latestQueryRef.current = "";
      setLoading(false);
      setResults([]);
      setQuery("");
      setFocusedIndex(-1);
    }
  }, [isOpen]);

  useEffect(() => {
    const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSearchHistory(Array.isArray(parsed) ? parsed : []);
      } catch {
        setSearchHistory([]);
      }
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
        inputControls.start({
          scale: [1, 1.02, 1],
          transition: { duration: 0.3 },
        });
      }, 100);

      return () => clearTimeout(timer);
    }

    if (!isOpen) {
      latestQueryRef.current = "";
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    }

    return () => {
      latestQueryRef.current = "";
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [isOpen, inputControls]);

  const saveToHistory = useCallback((item: TMDBSearchResult) => {
    const title =
      "title" in item ? item.title : "name" in item ? item.name : "";
    const poster =
      "poster_path" in item
        ? item.poster_path
        : "profile_path" in item
          ? item.profile_path
          : null;
    const date =
      "release_date" in item
        ? item.release_date
        : "first_air_date" in item
          ? item.first_air_date
          : "";
    const rating = "vote_average" in item ? item.vote_average : 0;

    const historyItem: SearchHistoryItem = {
      id: item.id,
      title: title || "",
      media_type: item.media_type || "movie",
      poster_path: poster,
      year: date ? new Date(date).getFullYear().toString() : undefined,
      rating: rating as number,
      timestamp: Date.now(),
    };

    setSearchHistory((prev) => {
      const filtered = prev.filter(
        (h) => !(h.id === item.id && h.media_type === item.media_type),
      );
      const updated = [historyItem, ...filtered].slice(0, MAX_HISTORY_ITEMS);
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const handleSearch = useCallback(async (searchQuery: string) => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;

    if (!searchQuery.trim()) {
      latestQueryRef.current = "";
      setResults([]);
      setLoading(false);
      setFocusedIndex(-1);
      return;
    }

    latestQueryRef.current = searchQuery;
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setFocusedIndex(-1);

    try {
      const data = (await tmdbApi.searchMulti(searchQuery)) as {
        results: TMDBSearchResult[];
      };

      if (!isOpenRef.current || latestQueryRef.current !== searchQuery) {
        return;
      }

      if (data && Array.isArray(data.results)) {
        const filteredResults = data.results
          .filter(
            (item) =>
              item.media_type !== "person" ||
              ("profile_path" in item && item.profile_path),
          )
          .slice(0, MAX_RESULTS);
        setResults(filteredResults);
      } else {
        setResults([]);
      }
    } catch (error: any) {
      if (error?.name === "AbortError") return;
      console.error("Search error:", error);
      if (isOpenRef.current) {
        setResults([]);
      }
    } finally {
      if (isOpenRef.current && latestQueryRef.current === searchQuery) {
        setLoading(false);
      }
    }
  }, []);

  const handleQueryChange = useCallback(
    (value: string) => {
      setQuery(value);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        handleSearch(value);
      }, DEBOUNCE_DELAY);
    },
    [handleSearch],
  );

  const handleResultClick = useCallback(
    (item: TMDBSearchResult) => {
      saveToHistory(item);

      const routes = {
        movie: `/movie/${item.id}`,
        tv: `/tv/${item.id}`,
        person: `/person/${item.id}`,
      };

      const route = routes[item.media_type as keyof typeof routes];
      if (route) navigate(route);

      onClose();
    },
    [saveToHistory, navigate, onClose],
  );

  const clearSearch = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    latestQueryRef.current = "";
    setQuery("");
    setResults([]);
    setLoading(false);
    setFocusedIndex(-1);
    inputRef.current?.focus();
  }, []);

  const handleClearHistory = useCallback(() => {
    setSearchHistory([]);
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const items = results.length > 0 ? results : searchHistory;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setFocusedIndex((prev) => (prev < items.length - 1 ? prev + 1 : prev));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : -1));
      } else if (e.key === "Enter" && focusedIndex >= 0) {
        e.preventDefault();
        const item = items[focusedIndex];
        if ("media_type" in item) {
          handleResultClick(item as TMDBSearchResult);
        } else {
          navigate(
            item.media_type === "movie"
              ? `/movie/${item.id}`
              : item.media_type === "tv"
                ? `/tv/${item.id}`
                : `/person/${item.id}`,
          );
          onClose();
        }
      } else if (e.key === "Escape") {
        onClose();
      }
    },
    [
      results,
      searchHistory,
      focusedIndex,
      handleResultClick,
      navigate,
      onClose,
    ],
  );

  useEffect(() => {
    if (focusedIndex >= 0 && resultsRef.current) {
      const focusedElement = resultsRef.current.children[
        focusedIndex
      ] as HTMLElement;
      focusedElement?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [focusedIndex]);

  const typeConfig = useMemo(
    () => ({
      movie: {
        icon: Film,
        color: "text-red-400 bg-red-500/20 ring-red-500/30",
        gradient: "from-red-500/20 to-pink-500/20",
      },
      tv: {
        icon: Tv,
        color: "text-blue-400 bg-blue-500/20 ring-blue-500/30",
        gradient: "from-blue-500/20 to-cyan-500/20",
      },
      person: {
        icon: User,
        color: "text-green-400 bg-green-500/20 ring-green-500/30",
        gradient: "from-green-500/20 to-emerald-500/20",
      },
    }),
    [],
  );

  const getTypeIcon = (type?: string) => {
    const Icon = typeConfig[type as keyof typeof typeConfig]?.icon || Search;
    return <Icon className="w-4 h-4" />;
  };

  const getTypeLabel = (type?: string) => {
    const labels = {
      movie: t("search.movie", language),
      tv: t("search.series", language),
      person: t("search.person", language),
    };
    return labels[type as keyof typeof labels] || "";
  };

  const getTypeColor = (type?: string) => {
    return (
      typeConfig[type as keyof typeof typeConfig]?.color ||
      "text-gray-400 bg-gray-500/20 ring-gray-500/30"
    );
  };

  const getTypeGradient = (type?: string) => {
    return (
      typeConfig[type as keyof typeof typeConfig]?.gradient ||
      "from-gray-500/20 to-gray-600/20"
    );
  };

  const getYear = useCallback((item: TMDBSearchResult) => {
    const date =
      "release_date" in item && item.release_date
        ? item.release_date
        : "first_air_date" in item && item.first_air_date
          ? item.first_air_date
          : null;
    if (!date || date.length < 4) return null;
    const year = new Date(date).getFullYear();
    return isNaN(year) ? null : year;
  }, []);

  const getRating = useCallback((item: TMDBSearchResult) => {
    if ("vote_average" in item && item.vote_average) {
      return (item.vote_average as number).toFixed(1);
    }
    return null;
  }, []);

  const placeholder = t("search.placeholder", language);

  const renderResultCard = useCallback(
    (
      item: TMDBSearchResult | SearchHistoryItem,
      index: number,
      isHistory = false,
    ) => {
      const year =
        "timestamp" in item ? item.year : getYear(item as TMDBSearchResult);
      const rating =
        "timestamp" in item
          ? item.rating?.toFixed(1)
          : getRating(item as TMDBSearchResult);
      const title = "title" in item ? item.title : "";
      const posterPath =
        item.media_type === "person" && "profile_path" in item
          ? item.profile_path
          : "poster_path" in item
            ? item.poster_path
            : null;
      const isFocused = focusedIndex === index;

      return (
        <motion.button
          key={`${item.media_type}-${item.id}-${isHistory ? "h" : "r"}`}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.2 }}
          onClick={() => {
            if (isHistory) {
              navigate(
                item.media_type === "movie"
                  ? `/movie/${item.id}`
                  : item.media_type === "tv"
                    ? `/tv/${item.id}`
                    : `/person/${item.id}`,
              );
              onClose();
            } else {
              handleResultClick(item as TMDBSearchResult);
            }
          }}
          onMouseEnter={() => setFocusedIndex(index)}
          className={`w-full flex items-center gap-4 p-4 rounded-2xl bg-transparent transition-all duration-300 text-left group relative overflow-hidden ${
            isFocused
              ? "bg-gradient-to-r from-primary/20 via-accent/10 to-transparent border-primary/50 shadow-2xl shadow-primary/20"
              : "hover:bg-white/5 border-transparent hover:border-white/10"
          } border`}
        >
          {isFocused && (
            <motion.div
              layoutId="searchFocus"
              className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/5"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}

          <div
            className={`relative w-14 h-20 rounded-xl overflow-hidden flex-shrink-0 ring-2 transition-all duration-500 ${
              isFocused
                ? "ring-primary/50 shadow-[0_0_30px_rgba(139,92,246,0.4)] scale-110 rotate-1"
                : "ring-white/10 bg-white/5 group-hover:ring-primary/30"
            }`}
          >
            {posterPath ? (
              <>
                <img
                  src={`https://image.tmdb.org/t/p/w92${posterPath}`}
                  alt={title}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </>
            ) : (
              <div
                className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${getTypeGradient(item.media_type)}`}
              >
                {getTypeIcon(item.media_type)}
              </div>
            )}

            {!isHistory && (
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <motion.div
                  variants={shimmerVariants}
                  initial="initial"
                  animate="animate"
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 relative z-10">
            <p
              className={`text-sm font-semibold truncate transition-colors ${
                isFocused
                  ? "text-primary"
                  : "text-white group-hover:text-primary"
              }`}
            >
              {title}
            </p>

            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ring-1 transition-all ${getTypeColor(item.media_type)} ${
                  isFocused ? "scale-105" : ""
                }`}
              >
                {getTypeIcon(item.media_type)}
                {getTypeLabel(item.media_type)}
              </span>

              {year && (
                <span className="inline-flex items-center gap-1 text-[11px] text-gray-400 font-medium">
                  <Calendar className="w-3 h-3" />
                  {year}
                </span>
              )}

              {rating && parseFloat(rating) > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 font-bold">
                  <Star className="w-3 h-3 fill-amber-400" />
                  {rating}
                </span>
              )}

              {isHistory && (
                <span className="inline-flex items-center gap-1 text-[10px] text-purple-400 font-medium">
                  <History className="w-2.5 h-2.5" />
                </span>
              )}
            </div>
          </div>

          {isFocused && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center"
            >
              <Sparkles className="w-3.5 h-3.5 text-primary" />
            </motion.div>
          )}
        </motion.button>
      );
    },
    [
      focusedIndex,
      getYear,
      getRating,
      getTypeIcon,
      getTypeLabel,
      getTypeColor,
      getTypeGradient,
      handleResultClick,
      navigate,
      onClose,
    ],
  );

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-0 bg-black/75 backdrop-blur-xl z-[100]"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.95 }}
            transition={{ type: "spring", damping: 28, stiffness: 350 }}
            className="fixed inset-x-3 top-16 sm:inset-x-auto sm:top-20 sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-xl z-[100]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative bg-[rgba(8,8,14,0.96)] backdrop-blur-3xl rounded-3xl border border-white/20 shadow-[0_35px_90px_rgba(0,0,0,0.8)] overflow-hidden ring-1 ring-white/10">
              <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-purple-500/10 pointer-events-none" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.15),transparent_60%)] pointer-events-none" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(34,197,94,0.05),transparent_60%)] pointer-events-none" />

              <div className="relative p-6">
                <motion.div
                  animate={inputControls}
                  className="relative flex items-center gap-4 bg-white/5 border border-white/15 rounded-2xl px-5 py-2 transition-all focus-within:border-primary/60 focus-within:bg-white/10 focus-within:shadow-[0_0_50px_rgba(139,92,246,0.3)] focus-within:ring-4 focus-within:ring-primary/10 group"
                >
                  <Search className="w-6 h-6 text-primary flex-shrink-0 group-focus-within:scale-110 group-focus-within:rotate-3 transition-all duration-300" />
                  <div className="relative flex-1 flex items-center">
                    <input
                      ref={inputRef}
                      type="text"
                      placeholder={placeholder}
                      value={query}
                      onChange={(e) => handleQueryChange(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="w-full h-12 sm:h-14 bg-transparent text-lg sm:text-xl text-white placeholder:text-gray-500/70 focus:outline-none font-bold tracking-tight"
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck="false"
                    />
                    {loading && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute right-0 flex items-center gap-2 pr-2"
                      >
                        <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                      </motion.div>
                    )}
                  </div>
                  <AnimatePresence>
                    {query && (
                      <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        whileHover={{ scale: 1.1, rotate: 90 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={clearSearch}
                        className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4 text-gray-400 hover:text-white transition-colors" />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>

              <div
                ref={resultsRef}
                className="max-h-[65vh] sm:max-h-[450px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent hover:scrollbar-thumb-white/20"
              >
                <AnimatePresence mode="wait">
                  {loading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="p-8 text-center"
                    >
                      <div className="inline-flex flex-col items-center gap-3">
                        <div className="relative w-10 h-10">
                          <div className="absolute inset-0 border-3 border-primary/30 rounded-full" />
                          <div className="absolute inset-0 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                        <span className="text-sm text-gray-400 font-medium">
                          {t("player.searching", language)}
                        </span>
                      </div>
                    </motion.div>
                  )}

                  {!loading && query && results.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="p-8 text-center"
                    >
                      <div className="inline-flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-gray-500/10 flex items-center justify-center mb-2">
                          <Search className="w-6 h-6 text-gray-500" />
                        </div>
                        <p className="text-gray-400 text-sm font-medium">
                          {t("common.noResults", language)}
                        </p>
                        <p className="text-gray-500 text-xs">"{query}"</p>
                      </div>
                    </motion.div>
                  )}

                  {results.length > 0 && (
                    <motion.div
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="p-3 space-y-1"
                    >
                      {results.map((item, index) =>
                        renderResultCard(item, index, false),
                      )}
                    </motion.div>
                  )}

                  {!query && !loading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="p-3"
                    >
                      {searchHistory.length > 0 ? (
                        <>
                          <div className="flex items-center justify-between mb-3 px-2">
                            <motion.p
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="text-xs font-bold text-gray-300 flex items-center gap-2 uppercase tracking-wider"
                            >
                              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center ring-1 ring-purple-500/30">
                                <History className="w-3.5 h-3.5 text-purple-400" />
                              </div>
                              {t("profile.history", language)}
                            </motion.p>
                            <motion.button
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={handleClearHistory}
                              className="text-[10px] text-gray-500 hover:text-red-400 flex items-center gap-1.5 transition-colors uppercase tracking-wider font-bold px-2 py-1 rounded-lg hover:bg-red-500/10"
                            >
                              <Trash2 className="w-3 h-3" />
                              {t("common.delete", language)}
                            </motion.button>
                          </div>
                          <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className="space-y-1"
                          >
                            {searchHistory.map((item, index) =>
                              renderResultCard(item, index, true),
                            )}
                          </motion.div>
                        </>
                      ) : (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-center py-8"
                        >
                          <div className="inline-flex flex-col items-center gap-3">
                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center ring-1 ring-white/10">
                              <TrendingUp className="w-6 h-6 text-primary" />
                            </div>
                            <p className="text-gray-400 text-sm font-medium max-w-[200px]">
                              {t("search.startTyping", language)}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
