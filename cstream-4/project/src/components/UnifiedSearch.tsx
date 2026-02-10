import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Film,
  Tv,
  User,
  X,
  Star,
  Calendar,
  History,
  Trash2,
  Heart,
  Play,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { tmdbApi, TMDBSearchResult } from "@/lib/tmdb";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n";

const SEARCH_HISTORY_KEY = "cstream_search_history";
const MAX_HISTORY_ITEMS = 15;
const DEBOUNCE_DELAY = 250;
const MIN_QUERY_LENGTH = 2;
const MAX_RESULTS = 12;

interface SearchHistoryItem {
  id: number;
  title: string;
  media_type: string;
  poster_path?: string | null;
  timestamp: number;
}

export const UnifiedSearch = () => {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TMDBSearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileOverlayOpen, setIsMobileOverlayOpen] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [hoveredIndex, setHoveredIndex] = useState<number>(-1);

  const navigate = useNavigate();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();
  const abortControllerRef = useRef<AbortController>();

  // Load search history
  useEffect(() => {
    const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSearchHistory(Array.isArray(parsed) ? parsed : []);
      } catch (error) {
        console.error("[UnifiedSearch] Failed to parse search history:", error);
        setSearchHistory([]);
      }
    }
  }, []);

  // Save to history
  const saveToHistory = useCallback((item: TMDBSearchResult) => {
    const title =
      "title" in item ? item.title : "name" in item ? item.name : "";
    const poster =
      "poster_path" in item
        ? item.poster_path
        : "profile_path" in item
          ? item.profile_path
          : null;

    const historyItem: SearchHistoryItem = {
      id: item.id,
      title: title || "",
      media_type: item.media_type || "movie",
      poster_path: poster,
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

  // Handle search
  useEffect(() => {
    if (query.trim().length < MIN_QUERY_LENGTH) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);

    debounceRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const data = (await tmdbApi.searchMulti(query)) as {
          results?: TMDBSearchResult[];
        };

        if (controller.signal.aborted) return;

        const searchResults = data.results?.slice(0, MAX_RESULTS) || [];
        setResults(searchResults);
        setIsOpen(searchResults.length > 0);
      } catch (error: any) {
        if (error.name !== "AbortError") {
          console.error("[UnifiedSearch] Search error:", error);
          setResults([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, DEBOUNCE_DELAY);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [query]);

  // Handle selection
  const handleSelect = useCallback(
    (item: TMDBSearchResult) => {
      setIsOpen(false);
      setIsMobileOverlayOpen(false);
      setQuery("");
      setHoveredIndex(-1);
      saveToHistory(item);

      if (item.media_type === "movie") navigate(`/movie/${item.id}`);
      else if (item.media_type === "tv") navigate(`/tv/${item.id}`);
      else if (item.media_type === "person") navigate(`/person/${item.id}`);
    },
    [navigate, saveToHistory],
  );

  // Clear search
  const handleClear = useCallback(() => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
    setHoveredIndex(-1);
    inputRef.current?.focus();
  }, []);

  // Handle search collapse
  const handleCollapseSearch = useCallback(() => {
    if (!query.trim()) {
      setIsSearchExpanded(false);
      setIsOpen(false);
    }
  }, [query]);

  // Clear history
  const clearHistory = useCallback(() => {
    setSearchHistory([]);
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  }, []);

  // Get icon by type
  const getIcon = useCallback((type?: string) => {
    switch (type) {
      case "movie":
        return <Film className="w-4 h-4 text-red-400" />;
      case "tv":
        return <Tv className="w-4 h-4 text-blue-400" />;
      case "person":
        return <User className="w-4 h-4 text-green-400" />;
      default:
        return <Search className="w-4 h-4 text-gray-400" />;
    }
  }, []);

  // Get badge color
  const getBadgeColor = useCallback((type?: string) => {
    switch (type) {
      case "movie":
        return "bg-red-500/20 text-red-400 ring-red-500/30";
      case "tv":
        return "bg-blue-500/20 text-blue-400 ring-blue-500/30";
      case "person":
        return "bg-green-500/20 text-green-400 ring-green-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 ring-gray-500/30";
    }
  }, []);

  const resultCard = (
    item: TMDBSearchResult | SearchHistoryItem,
    index: number,
    isHistory = false,
  ) => {
    const title =
      "title" in item ? item.title : "name" in item ? item.name : "";
    const posterPath =
      item.media_type === "person" && "profile_path" in item
        ? item.profile_path
        : "poster_path" in item
          ? item.poster_path
          : null;

    // Get rating if available
    const rating =
      "vote_average" in item ? (item.vote_average as number) : null;

    // Get year if available
    let year = null;
    if ("release_date" in item && item.release_date) {
      year = new Date(item.release_date).getFullYear();
    } else if ("first_air_date" in item && item.first_air_date) {
      year = new Date(item.first_air_date).getFullYear();
    }

    const isFocused = hoveredIndex === index;

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
            setIsMobileOverlayOpen(false);
            setQuery("");
          } else {
            handleSelect(item as TMDBSearchResult);
          }
        }}
        onMouseEnter={() => setHoveredIndex(index)}
        onMouseLeave={() => setHoveredIndex(-1)}
        className={`w-full flex items-center gap-4 p-2.5 rounded-xl text-left transition-all duration-300 group relative ${
          isFocused
            ? "bg-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)] border-white/20"
            : "hover:bg-white/5 border-transparent"
        } border`}
      >
        {isFocused && (
          <motion.div
            layoutId="search-focus"
            className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/5 to-transparent rounded-xl -z-10"
            initial={false}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
        )}

        {/* Poster Image */}
        <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-white/5 shadow-2xl transition-transform duration-500 group-hover:scale-110">
          <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-transparent z-10" />
          {posterPath ? (
            <img
              src={`https://image.tmdb.org/t/p/w185${posterPath}`}
              alt={title}
              className="w-full h-full object-cover transform transition-all duration-700"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-white/10 to-white/5">
              {getIcon(item.media_type)}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-xs font-bold text-white leading-tight truncate group-hover:text-primary transition-colors">
              {title || "Sans titre"}
            </p>
            {isHistory && (
              <div className="flex-shrink-0 p-0.5 bg-white/5 rounded-md border border-white/10 shadow-inner">
                <History className="w-2 h-2 text-primary/60" />
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`inline-flex items-center gap-1 px-1.5 py-0 rounded-md text-[8px] font-black uppercase tracking-wider shadow-sm ring-1 ring-inset ${getBadgeColor(item.media_type)}`}
            >
              <div className="w-2.5 h-2.5 flex items-center justify-center">
                {getIcon(item.media_type)}
              </div>
              {item.media_type === "movie"
                ? "Film"
                : item.media_type === "tv"
                  ? "Série"
                  : "Star"}
            </span>

            {year && (
              <span className="text-[10px] text-white/40 font-bold flex items-center gap-1">
                {year}
              </span>
            )}

            {rating !== null && rating > 0 && (
              <span className="text-[10px] font-black text-amber-400 flex items-center gap-1 bg-amber-400/10 px-1 rounded">
                <Star className="w-2 h-2 fill-amber-400" />
                {rating.toFixed(1)}
              </span>
            )}
          </div>
        </div>

        {/* Action button */}
        <div className="flex-shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 duration-300">
          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
            <Play className="w-2.5 h-2.5 text-primary fill-current" />
          </div>
        </div>
      </motion.button>
    );
  };

  return (
    <>
      {/* DESKTOP: Search Icon (Collapsible) */}
      <div className="hidden md:flex items-center gap-2 relative">
        <AnimatePresence mode="wait">
          {!isSearchExpanded ? (
            <motion.button
              key="search-icon"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              onClick={() => {
                setIsSearchExpanded(true);
                setTimeout(() => inputRef.current?.focus(), 0);
              }}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/40 to-accent/30 hover:from-primary/50 hover:to-accent/40 border-2 border-primary/60 hover:border-primary/80 flex items-center justify-center transition-all duration-300 shadow-[0_0_20px_rgba(168,85,247,0.5)] group"
              title="Ouvrir la recherche"
              aria-label="Ouvrir la recherche"
            >
              <Search className="w-6 h-6 text-white group-hover:scale-110 transition-all duration-300" />
            </motion.button>
          ) : (
            <motion.div
              key="search-input"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "100%" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.3 }}
              ref={wrapperRef}
              className="relative flex-1 min-w-[150px] lg:min-w-[200px] group"
              onBlur={handleCollapseSearch}
            >
              <div className="relative flex items-center gap-2">
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder={t("search.placeholder")}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 h-9 bg-transparent text-sm font-medium tracking-tight text-white placeholder:text-white/40 border-none outline-none ring-0 focus:ring-0 focus-visible:ring-0 focus:outline-none focus-visible:outline-none p-0"
                  onBlur={() => {
                    setTimeout(() => {
                      if (!query.trim()) {
                        setIsSearchExpanded(false);
                        setIsOpen(false);
                      }
                    }, 100);
                  }}
                />
                {loading && (
                  <div className="flex items-center flex-shrink-0">
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  </div>
                )}
                {query && (
                  <button
                    onClick={handleClear}
                    className="p-1 hover:bg-white/10 rounded-full transition-colors flex-shrink-0"
                  >
                    <X className="w-3.5 h-3.5 text-white/60 hover:text-white/80" />
                  </button>
                )}
              </div>

              {/* Desktop Results Dropdown */}
              <AnimatePresence mode="wait">
                {isOpen && (results.length > 0 || loading) && (
                  <motion.div
                    initial={{ opacity: 0, y: -15, scaleY: 0.85 }}
                    animate={{ opacity: 1, y: 0, scaleY: 1 }}
                    exit={{ opacity: 0, y: -15, scaleY: 0.85 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-0 right-0 mt-3 bg-gradient-to-b from-[rgba(15,15,25,0.98)] to-[rgba(10,10,18,0.95)] backdrop-blur-xl rounded-xl border border-primary/30 shadow-2xl shadow-primary/20 overflow-hidden z-50"
                  >
                    {loading && (
                      <div className="p-4 text-center">
                        <div className="inline-block">
                          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                        </div>
                      </div>
                    )}

                    {!loading && results.length > 0 && (
                      <div className="max-h-[500px] overflow-y-auto p-3 space-y-2">
                        {results.map((item, idx) => resultCard(item, idx, false))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* MOBILE: Search Button + Overlay */}
      <div className="md:hidden">
        <button
          onClick={() => setIsMobileOverlayOpen(true)}
          className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 flex items-center justify-center transition-all"
        >
          <Search className="w-5 h-5 text-gray-300" />
        </button>

        {/* Mobile Overlay */}
        <AnimatePresence>
          {isMobileOverlayOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/75 backdrop-blur-xl z-[100]"
                onClick={() => setIsMobileOverlayOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: -40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                className="fixed inset-x-3 top-16 z-[100]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="bg-[rgba(10,10,18,0.95)] backdrop-blur-3xl rounded-2xl border border-white/20 shadow-xl overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-center gap-3 bg-white/5 border border-white/15 rounded-xl px-4 focus-within:border-primary/50 focus-within:bg-white/10">
                      <Search className="w-5 h-5 text-primary flex-shrink-0" />
                      <input
                        autoFocus
                        type="text"
                        placeholder={t("search.placeholder")}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="flex-1 h-12 bg-transparent text-white placeholder:text-gray-500 focus:outline-none border-0"
                      />
                      {query && (
                        <button
                          onClick={() => {
                            setQuery("");
                            setResults([]);
                          }}
                          className="p-1 hover:bg-white/10 rounded"
                        >
                          <X className="w-4 h-4 text-gray-400" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="max-h-[60vh] overflow-y-auto px-4 pb-4 space-y-2">
                    {loading && (
                      <div className="flex flex-col items-center justify-center py-12 gap-3">
                        <div className="relative">
                          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
                        </div>
                        <p className="text-sm font-medium text-white/40 animate-pulse">
                          Recherche en cours...
                        </p>
                      </div>
                    )}

                    {!loading && query && results.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-12 text-center bg-white/[0.02] rounded-2xl border border-dashed border-white/10 mx-2">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10 shadow-xl">
                          <Search className="w-8 h-8 text-white/20" />
                        </div>
                        <p className="text-white/60 font-bold tracking-tight">
                          Aucun résultat trouvé
                        </p>
                        <p className="text-[11px] text-white/30 mt-1 uppercase tracking-widest font-black">
                          Essayez d'autres mots-clés
                        </p>
                      </div>
                    )}

                    {results.length > 0 &&
                      results.map((item, idx) => resultCard(item, idx, false))}

                    {!query && searchHistory.length > 0 && (
                      <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-500">
                        <div className="flex items-center justify-between pt-4 border-t border-white/10">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-primary/10 rounded-lg">
                              <History className="w-4 h-4 text-primary" />
                            </div>
                            <p className="text-sm font-black text-white uppercase tracking-widest">
                              Récent
                            </p>
                          </div>
                          <button
                            onClick={clearHistory}
                            className="text-[11px] font-bold text-white/40 hover:text-red-400 transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-red-400/10"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Effacer tout
                          </button>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                          {searchHistory.map((item, idx) =>
                            resultCard(item, idx, true),
                          )}
                        </div>
                      </div>
                    )}

                    {!query && searchHistory.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-16 text-center bg-white/[0.02] rounded-2xl border border-dashed border-white/10 mx-2">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-white/5 to-transparent flex items-center justify-center mb-4 border border-white/10 shadow-2xl">
                          <History className="w-10 h-10 text-white/10" />
                        </div>
                        <p className="text-sm font-black text-white/40 uppercase tracking-tighter">
                          Votre historique est vide
                        </p>
                        <p className="text-[11px] max-w-[220px] mt-3 leading-relaxed text-white/20 font-medium italic">
                          Les films et séries que vous recherchez apparaîtront
                          ici pour un accès ultra-rapide.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};
