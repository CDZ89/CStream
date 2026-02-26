import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Bot, Trash2, Plus, Sparkles, User, MessageSquare,
  Zap, Heart, Home, Star, Play, X, Settings, Search,
  ChevronRight, Command, Cpu, Activity, ArrowUp, Mic, MicOff,
  Copy, ThumbsUp, ThumbsDown, Download, Share2, Film,
  Tv, Clapperboard, TrendingUp, Clock, Hash, Filter,
  BookOpen, Globe, RotateCcw, ChevronDown, Check, Info,
  Palette, ChevronLeft, Volume2, VolumeX, Layout, Pin
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { useNavigate } from "react-router-dom";

const cn = (...classes: any[]) => classes.filter(Boolean).join(" ");

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  elements?: Array<{ type: string; content: any }>;
  reactions?: { thumbsUp: number; thumbsDown: number; userReaction?: "up" | "down" };
  isTyping?: boolean;
}

interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  lastUpdate: Date;
  isPinned?: boolean;
  category?: string;
}

// ─── Markdown-like rich text renderer ─────────────────────────────────────────
function RichText({ text, messageId }: { text: string; messageId: string }) {
  const hasAnimatedRef = useRef<Record<string, boolean>>({});
  const isFirstRender = !hasAnimatedRef.current[messageId];

  useEffect(() => { hasAnimatedRef.current[messageId] = true; }, [messageId]);

  const renderWord = (word: string, i: number) => (
    <motion.span
      key={i}
      initial={isFirstRender ? { opacity: 0, filter: "blur(6px)" } : { opacity: 1, filter: "blur(0)" }}
      animate={{ opacity: 1, filter: "blur(0)" }}
      transition={{ duration: 0.25, delay: isFirstRender ? i * 0.008 : 0 }}
      className="inline-block mr-[0.25em]"
    >
      {word}
    </motion.span>
  );

  const renderLine = (line: string, lineIdx: number) => {
    // Code block
    if (line.startsWith("```") || line.startsWith("    ")) {
      return (
        <div key={lineIdx} className="font-mono text-xs bg-black/50 px-3 py-2 rounded-xl border border-white/10 my-2 overflow-x-auto text-green-300">
          {line.replace(/^```\w*/, "").trim()}
        </div>
      );
    }
    // Headings
    if (line.startsWith("## ")) return (
      <h3 key={lineIdx} className="text-base font-bold text-white mb-1 mt-3">
        {line.replace("## ", "")}
      </h3>
    );
    if (line.startsWith("# ")) return (
      <h2 key={lineIdx} className="text-lg font-black text-white mb-2 mt-3">
        {line.replace("# ", "")}
      </h2>
    );
    // Bold
    if (line.includes("**")) {
      const parts = line.split("**");
      return (
        <div key={lineIdx} className="mb-1 leading-relaxed">
          {parts.map((part, idx) =>
            idx % 2 === 1
              ? <strong key={idx} className="text-purple-300 font-bold">{part.split(" ").map((w, i) => renderWord(w, i))}</strong>
              : <span key={idx}>{part.split(" ").map((w, i) => renderWord(w, i))}</span>
          )}
        </div>
      );
    }
    // Lists
    if (line.trim().startsWith("- ") || line.trim().startsWith("* ") || /^\d+\.\s/.test(line.trim())) {
      const isNumbered = /^\d+\.\s/.test(line.trim());
      const content = line.replace(/^[-*]\s/, "").replace(/^\d+\.\s/, "");
      return (
        <div key={lineIdx} className="flex gap-2.5 mb-1.5 ml-1">
          <span className={cn("flex-shrink-0 mt-1.5", isNumbered ? "text-purple-400 text-xs font-bold" : "w-1.5 h-1.5 rounded-full bg-purple-500 mt-2")}>
            {isNumbered ? line.match(/^\d+/)?.[0] + "." : ""}
          </span>
          <span className="text-white/85 leading-relaxed">{content.split(" ").map((w, i) => renderWord(w, i))}</span>
        </div>
      );
    }
    // Separator
    if (line.trim() === "---") return <hr key={lineIdx} className="border-white/10 my-3" />;
    // Empty line
    if (!line.trim()) return <div key={lineIdx} className="h-2" />;
    // Regular
    return (
      <div key={lineIdx} className="mb-1.5 leading-relaxed text-white/88">
        {line.split(" ").map((w, i) => renderWord(w, i))}
      </div>
    );
  };

  return <div>{text.split("\n").map((line, i) => renderLine(line, i))}</div>;
}

// ─── Media Card ───────────────────────────────────────────────────────────────
function MediaCard({ data }: { data: any }) {
  const navigate = useNavigate();
  if (!data) return null;

  const getPosterUrl = () => {
    const tmdbPath = data.image || data.poster || data.poster_path || data.backdrop_path;
    if (typeof tmdbPath === "string" && tmdbPath.startsWith("/"))
      return `https://image.tmdb.org/t/p/w500${tmdbPath}`;
    if (typeof tmdbPath === "string" && (tmdbPath.startsWith("http") || tmdbPath.includes("tmdb.org")))
      return tmdbPath;
    return `https://placehold.co/500x750/1a1a2e/ffffff?text=${encodeURIComponent(data.title || data.name || "?")}`;
  };

  const type = data.mediaType || data.type || (data.title ? "movie" : "tv");
  const rating = data.rating || data.vote_average;
  const year = data.year || data.release_date?.slice(0, 4) || data.first_air_date?.slice(0, 4);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="group relative rounded-2xl overflow-hidden bg-black/50 border border-white/10 hover:border-purple-500/60 transition-all duration-300 hover:shadow-[0_8px_40px_rgba(168,85,247,0.2)] w-[150px] flex-shrink-0"
    >
      <div className="aspect-[2/3] relative overflow-hidden">
        <img
          src={getPosterUrl()}
          alt={data.title || data.name}
          onError={(e) => { (e.target as HTMLImageElement).src = `https://placehold.co/500x750/1a1a2e/ffffff?text=${encodeURIComponent(data.title || "?")}`; }}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

        {rating && (
          <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-bold text-white">
            <Star className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />
            {Number(rating).toFixed(1)}
          </div>
        )}

        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-lg bg-purple-600/80 text-[9px] font-bold text-white uppercase">
          {type === "movie" ? <Film className="w-3 h-3" /> : <Tv className="w-3 h-3" />}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-2.5">
        <h3 className="text-white font-bold text-[11px] mb-0.5 line-clamp-2 leading-tight">{data.title || data.name}</h3>
        {year && <p className="text-[9px] text-white/50 mb-2">{year}</p>}
        <button
          onClick={() => navigate(`/${type}/${data.tmdbId || data.id}`)}
          className="w-full bg-white/15 hover:bg-purple-600 text-white py-1.5 rounded-lg text-[9px] font-bold transition-all flex items-center justify-center gap-1 border border-white/10 hover:border-purple-500"
        >
          <Play size={10} className="fill-current" />
          Regarder
        </button>
      </div>
    </motion.div>
  );
}

// ─── Suggestion Chip ──────────────────────────────────────────────────────────
const SuggestionChip = ({ label, onClick, icon: Icon }: any) => (
  <motion.button
    whileHover={{ scale: 1.02, y: -2 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className="group relative flex items-center gap-3 p-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] hover:border-purple-500/40 transition-all duration-200 text-left overflow-hidden backdrop-blur-sm"
  >
    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500/15 to-indigo-500/15 flex items-center justify-center border border-white/5 flex-shrink-0">
      <Icon className="w-4 h-4 text-purple-400" />
    </div>
    <span className="text-sm text-white/60 group-hover:text-white/90 transition-colors relative z-10 leading-snug">{label}</span>
    <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-purple-400 ml-auto transition-all transform group-hover:translate-x-0.5 flex-shrink-0" />
  </motion.button>
);

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AgentPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [aiPersona, setAiPersona] = useState<"cai" | "critic" | "director">("cai");
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  // ── Load conversations ─────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem("cstream_ai_v16");
      if (saved) {
        const parsed = JSON.parse(saved);
        setConversations(parsed.map((c: any) => ({
          ...c,
          lastUpdate: new Date(c.lastUpdate),
          messages: c.messages.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })),
        })));
      }
    } catch (e) { }
  }, []);

  useEffect(() => {
    localStorage.setItem("cstream_ai_v16", JSON.stringify(conversations));
  }, [conversations]);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, []);

  useEffect(() => { setTimeout(scrollToBottom, 80); }, [currentId, conversations, isTyping]);

  // ── Voice ──────────────────────────────────────────────────────────────────
  const toggleVoice = useCallback(() => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      alert("La reconnaissance vocale n'est pas supportée par ce navigateur.");
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const rec = new SpeechRecognition();
    rec.lang = "fr-FR";
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setInput(prev => prev + transcript);
    };
    rec.onend = () => setIsListening(false);
    rec.onerror = () => setIsListening(false);
    recognitionRef.current = rec;
    rec.start();
    setIsListening(true);
  }, [isListening]);

  // ── Chat handling ──────────────────────────────────────────────────────────
  const createNewChat = () => {
    const id = Date.now().toString();
    setConversations(prev => [{ id, title: "Nouvelle Discussion", messages: [], lastUpdate: new Date() }, ...prev]);
    setCurrentId(id);
    setInput("");
    inputRef.current?.focus();
  };

  const personaLabels: Record<string, string> = {
    cai: "🎬 CStream AI",
    critic: "🎭 Critique Expert",
    director: "🎥 Réalisateur",
  };
  const personaPrompts: Record<string, string> = {
    cai: "cai",
    critic: "critic",
    director: "director",
  };

  const handleSendMessage = async (textToUse?: string) => {
    const messageText = (textToUse || input).trim();
    if (!messageText || isTyping) return;

    let activeId = currentId;
    if (!activeId) {
      const id = Date.now().toString();
      const newChat: Conversation = { id, title: messageText.slice(0, 35), messages: [], lastUpdate: new Date() };
      setConversations(prev => [newChat, ...prev]);
      setCurrentId(id);
      activeId = id;
    }

    const userMsg: ChatMessage = {
      id: Date.now().toString(), role: "user", content: messageText, timestamp: new Date(),
    };

    setConversations(prev => prev.map(c =>
      c.id === activeId ? { ...c, messages: [...c.messages, userMsg], lastUpdate: new Date(), title: c.messages.length === 0 ? messageText.slice(0, 35) : c.title } : c
    ));

    if (!textToUse) setInput("");
    setIsTyping(true);

    const currentConv = conversations.find(c => c.id === activeId) || { messages: [] as ChatMessage[] };

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...(currentConv.messages || []), userMsg].map(m => ({ role: m.role, content: m.content })),
          character: personaPrompts[aiPersona],
          includeMedia: true,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("[Chat API Error]", response.status, errText);
        throw new Error(`API a répondu avec le statut ${response.status}`);
      }

      const data = await response.json();
      const rawContent = data.response || data.reply || data.choices?.[0]?.message?.content || "";

      if (!rawContent) throw new Error("Réponse vide de l'API");

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(), role: "assistant",
        content: rawContent || "Je suis là pour vous aider ! Posez-moi une question sur le cinéma.",
        timestamp: new Date(), elements: [], reactions: { thumbsUp: 0, thumbsDown: 0 },
      };

      // Parse [MEDIA_DATA] tags
      if (rawContent?.includes("[MEDIA_DATA]")) {
        const parts = rawContent.split("[MEDIA_DATA]");
        assistantMsg.content = parts[0].trim();
        for (let i = 1; i < parts.length; i++) {
          const endIdx = parts[i].indexOf("[/MEDIA_DATA]");
          if (endIdx !== -1) {
            try {
              const mediaData = JSON.parse(parts[i].substring(0, endIdx));
              assistantMsg.elements?.push({
                type: "media",
                content: {
                  id: Number(mediaData.id), tmdbId: Number(mediaData.id),
                  mediaType: mediaData.type || (mediaData.title ? "movie" : "tv"),
                  title: mediaData.title || mediaData.name,
                  poster: mediaData.poster || mediaData.poster_path || mediaData.image,
                  poster_path: mediaData.poster_path || mediaData.image,
                  rating: mediaData.rating || mediaData.vote_average,
                  year: mediaData.year,
                  overview: mediaData.overview,
                },
              });
            } catch { }
            const remaining = parts[i].substring(endIdx + 13).trim();
            if (remaining) assistantMsg.content += "\n\n" + remaining;
          }
        }
      }

      setConversations(prev => prev.map(c =>
        c.id === activeId ? { ...c, messages: [...c.messages, assistantMsg], lastUpdate: new Date() } : c
      ));
    } catch (err: any) {
      console.error("Chat Fetch catch:", err);
      setConversations(prev => prev.map(c =>
        c.id === activeId ? {
          ...c, messages: [...c.messages, {
            id: (Date.now() + 1).toString(), role: "assistant" as const,
            content: `Impossible d'obtenir une réponse actuellement (${err.message || 'Erreur réseau'}). L'IA de secours est peut-être hors-ligne. 🔄\n\nEssayez de vérifier que le port 5000 est en ligne.`,
            timestamp: new Date(), elements: [], reactions: { thumbsUp: 0, thumbsDown: 0 },
          }], lastUpdate: new Date(),
        } : c
      ));
    } finally {
      setIsTyping(false);
      setTimeout(scrollToBottom, 50);
    }
  };

  const deleteChat = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConversations(prev => {
      const filtered = prev.filter(c => c.id !== id);
      if (currentId === id) setCurrentId(filtered.length > 0 ? filtered[0].id : null);
      return filtered;
    });
  };

  const handleReaction = (msgId: string, reaction: "up" | "down") => {
    setConversations(prev => prev.map(c =>
      c.id === currentId ? {
        ...c, messages: c.messages.map(m => {
          if (m.id !== msgId) return m;
          const prev = m.reactions?.userReaction;
          return {
            ...m, reactions: {
              thumbsUp: (m.reactions?.thumbsUp || 0) + (reaction === "up" ? (prev === "up" ? -1 : 1) : 0),
              thumbsDown: (m.reactions?.thumbsDown || 0) + (reaction === "down" ? (prev === "down" ? -1 : 1) : 0),
              userReaction: prev === reaction ? undefined : reaction,
            },
          };
        }),
      } : c
    ));
  };

  const copyMessage = (content: string, msgId: string) => {
    navigator.clipboard.writeText(content).then(() => {
      setCopiedId(msgId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const exportConversation = () => {
    const chat = conversations.find(c => c.id === currentId);
    if (!chat) return;
    const text = chat.messages.map(m => `[${m.role === "user" ? "Vous" : "CStream AI"}]\n${m.content}`).join("\n\n---\n\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${chat.title}.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  const currentChat = conversations.find(c => c.id === currentId);
  const filteredConvos = conversations.filter(c =>
    !searchQuery || c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const suggestions = [
    { icon: TrendingUp, label: "Films les plus populaires cette semaine", message: "Quels sont les films les plus populaires en ce moment ?" },
    { icon: Heart, label: "Recommande-moi un film romantique sous-côté", message: "Recommande-moi un film romantique sous-côté et méconnu" },
    { icon: Zap, label: "Meilleures séries animées 2024", message: "Quelles sont les meilleures séries animées sorties en 2024 ?" },
    { icon: Film, label: "Films d'action avec des twists incroyables", message: "Donne-moi des films d'action avec des retournements de situation surprenants" },
    { icon: Globe, label: "Chefs-d'œuvre du cinéma mondial", message: "Présente-moi des chefs-d'œuvre du cinéma international à voir absolument" },
    { icon: Clapperboard, label: "Séries récentes à commencer ce soir", message: "Quelle série récente dois-je commencer ce soir ? Je veux quelque chose d'addictif" },
  ];

  return (
    <div className="min-h-screen bg-[#030303] text-white flex flex-col font-sans selection:bg-purple-500/30">
      <Navbar />

      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-[700px] h-[700px] bg-purple-600/10 rounded-full blur-[160px] animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-[700px] h-[700px] bg-indigo-600/10 rounded-full blur-[160px] animate-pulse" style={{ animationDelay: "2s" }} />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-violet-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="flex-1 flex pt-16 md:pt-20 h-screen overflow-hidden relative z-10">

        {/* ── Sidebar Overlay (Static over main content) ── */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              {/* Overlay sombre pour mobile (et cliquable pour fermer) */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSidebarOpen(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
              />

              <motion.aside
                initial={{ x: "-100%", opacity: 0, filter: "blur(10px)" }}
                animate={{ x: 0, opacity: 1, filter: "blur(0px)" }}
                exit={{ x: "-100%", opacity: 0, filter: "blur(10px)" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="absolute top-0 left-0 bottom-0 z-40 h-full w-[300px] border-r border-white/10 bg-[#0a0a0f]/95 backdrop-blur-3xl flex flex-col shadow-[20px_0_50px_rgba(0,0,0,0.5)] md:shadow-[0_0_80px_rgba(139,92,246,0.1)]"
              >
                {/* Header de la sidebar */}
                <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
                  <h3 className="text-sm font-bold text-white tracking-widest uppercase">CStream IA</h3>
                  {/* Bouton pour cacher la sidebar (très pratique sur mobile et desktop) */}
                  <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors">
                    <X size={18} />
                  </button>
                </div>

                {/* New chat */}
                <div className="p-4 border-b border-white/[0.04]">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={createNewChat}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-sm shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:shadow-[0_0_30px_rgba(147,51,234,0.6)] transition-all border border-purple-400/30 group"
                  >
                    <Plus size={18} className="transition-transform group-hover:rotate-90 duration-300" /> Nouvelle Conversation
                  </motion.button>
                </div>

                {/* Search */}
                <div className="px-4 py-3">
                  <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-black/50 border border-white/10 focus-within:border-purple-500/50 focus-within:ring-2 focus-within:ring-purple-500/20 transition-all">
                    <Search className="w-4 h-4 text-zinc-400" />
                    <input
                      type="text" placeholder="Rechercher historique..."
                      value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                      className="bg-transparent text-sm text-white placeholder-zinc-500 outline-none flex-1"
                    />
                  </div>
                </div>

                {/* Conversation list */}
                <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-1.5 scrollbar-thin scrollbar-thumb-white/10">
                  {filteredConvos.length === 0 ? (
                    <div className="text-center py-10 text-zinc-500 text-sm font-medium">Aucune conversation</div>
                  ) : (
                    filteredConvos.map(c => (
                      <motion.div
                        whileHover={{ scale: 1.01 }}
                        key={c.id}
                        onClick={() => setCurrentId(c.id)}
                        className={cn(
                          "group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border",
                          currentId === c.id
                            ? "bg-purple-500/10 border-purple-500/30 text-white shadow-[0_0_15px_rgba(147,51,234,0.15)]"
                            : "bg-transparent border-transparent hover:bg-white/[0.04] text-zinc-400 hover:text-zinc-200"
                        )}
                      >
                        <MessageSquare size={16} className={cn("flex-shrink-0", currentId === c.id ? "text-purple-400" : "text-zinc-500")} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{c.title || "Nouvelle discussion"}</p>
                          <p className="text-[11px] text-zinc-500 tracking-wide mt-0.5">{c.messages.length} msg · {c.lastUpdate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                        </div>
                        <button onClick={e => deleteChat(c.id, e)} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/20 hover:text-red-400 transition-all text-zinc-500">
                          <Trash2 size={14} />
                        </button>
                      </motion.div>
                    ))
                  )}
                </div>

                {/* AI Info */}
                <div className="p-4 border-t border-white/10 bg-black/40">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-purple-900/40 to-indigo-900/40 border border-purple-500/20 shadow-inner">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-500/30">
                      <Bot size={20} className="text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white tracking-wide">CStream AI</p>
                      <p className="text-xs text-purple-300 font-medium">Gemini 2.0 Cascade</p>
                    </div>
                    <div className="ml-auto w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_10px_#22c55e] animate-pulse" />
                  </div>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* ── Main Chat Area ── */}
        <main className="flex-1 flex flex-col h-full w-full overflow-hidden relative">

          {/* Header */}
          <header className="h-[72px] border-b border-white/[0.08] bg-black/40 backdrop-blur-xl flex items-center justify-between px-4 lg:px-6 flex-shrink-0 z-20">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className={cn("p-2 rounded-xl border border-white/10 text-white transition-all shadow-lg", sidebarOpen ? "hidden" : "bg-white/5 hover:bg-white/10 hover:border-white/20 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]")}
              >
                <Layout size={20} />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-[0_0_20px_rgba(147,51,234,0.4)] border border-white/10">
                  <Bot size={20} className="text-white" />
                </div>
                <div className="hidden sm:block">
                  <div className="text-sm font-black text-white flex items-center gap-2">
                    {personaLabels[aiPersona]}
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_5px_#4ade80]" />
                  </div>
                  <p className="text-xs text-zinc-400 font-medium tracking-wide">Assistant Cinéma Personnel</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {/* Persona Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowPersonaMenu(!showPersonaMenu)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium text-white transition-all hover:border-purple-500/40"
                >
                  <Palette size={16} className="text-purple-400" />
                  <span className="hidden md:block">Changer de mode</span>
                  <ChevronDown size={14} className="text-zinc-500" />
                </button>
                <AnimatePresence>
                  {showPersonaMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 top-full mt-3 w-56 bg-zinc-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] z-50 overflow-hidden ring-1 ring-white/5"
                    >
                      {Object.entries(personaLabels).map(([key, label]) => (
                        <button
                          key={key}
                          onClick={() => { setAiPersona(key as any); setShowPersonaMenu(false); }}
                          className={cn("w-full flex items-center gap-3 px-4 py-3.5 text-sm text-left transition-colors font-medium border-b border-white/[0.02] last:border-0", aiPersona === key ? "bg-purple-500/20 text-purple-300" : "text-zinc-200 hover:bg-white/5")}
                        >
                          {aiPersona === key ? <Check size={16} className="text-purple-400" /> : <div className="w-4 h-4" />}
                          {label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {currentChat && currentChat.messages.length > 0 && (
                <>
                  <button onClick={exportConversation} title="Exporter" className="p-2 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white transition-colors border border-transparent hover:border-white/10">
                    <Download size={18} />
                  </button>
                  <button onClick={() => { setConversations(prev => prev.map(c => c.id === currentId ? { ...c, messages: [] } : c)); }} title="Effacer" className="hidden sm:block p-2 rounded-xl hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors border border-transparent hover:border-red-500/20">
                    <Trash2 size={18} />
                  </button>
                </>
              )}
              <button onClick={createNewChat} className="sm:hidden p-2 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/40 focus:ring-2 ring-purple-500/50">
                <Plus size={20} />
              </button>
            </div>
          </header>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scroll-smooth scrollbar-thin scrollbar-thumb-white/10">
            {!currentChat || currentChat.messages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, type: "spring", damping: 25 }}
                className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto text-center space-y-10 py-10 min-h-[60vh]"
              >
                {/* Logo & Glow */}
                <div className="relative">
                  <div className="absolute inset-0 scale-[1.8] bg-gradient-to-tr from-purple-600/30 to-indigo-600/30 blur-[80px] rounded-full" />
                  <motion.div
                    className="relative w-28 h-28 rounded-[2rem] bg-[#0a0a0f] border border-white/10 flex items-center justify-center mx-auto shadow-[0_0_80px_rgba(139,92,246,0.3)] ring-1 ring-purple-500/20 overflow-hidden"
                    animate={{ rotateY: [0, 8, -8, 0] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-indigo-500/20" />
                    <Bot size={54} className="text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] relative z-10" />
                    <motion.div
                      className="absolute -right-1 -top-1 w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-[0_0_20px_#4ade80]"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    >
                      <Sparkles size={18} className="text-white" />
                    </motion.div>
                  </motion.div>
                </div>

                <div className="space-y-4">
                  <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight bg-gradient-to-r from-white via-purple-200 to-indigo-400 bg-clip-text text-transparent drop-shadow-sm leading-tight">
                    Comment puis-je vous aider ?
                  </h2>
                  <p className="text-zinc-400/80 max-w-lg mx-auto text-sm md:text-base leading-relaxed font-medium">
                    Je suis <span className="text-purple-400 font-bold">CStream AI</span>, votre expert cinéma personnel.
                    Films, séries, anime, analyses — parlez-moi de tout ! ✨
                  </p>
                </div>

                {/* Suggestions grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 w-full">
                  {suggestions.map((s, i) => (
                    <SuggestionChip
                      key={i}
                      icon={s.icon}
                      label={s.label}
                      onClick={() => handleSendMessage(s.message)}
                    />
                  ))}
                </div>

                {/* Quick stats */}
                <div className="flex items-center gap-6 text-[11px] font-medium text-zinc-500 bg-white/5 py-2 px-6 rounded-full border border-white/5 shadow-inner backdrop-blur-sm">
                  <div className="flex items-center gap-2"><Hash size={12} className="text-purple-400" /><span>{conversations.length} chats</span></div>
                  <div className="flex items-center gap-2"><Cpu size={12} className="text-indigo-400" /><span>Gemini 2.0 Flash</span></div>
                  <div className="flex items-center gap-2"><Globe size={12} className="text-emerald-400" /><span>Multi-langues</span></div>
                </div>
              </motion.div>
            ) : (
              currentChat.messages.map((msg, idx) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={cn("flex gap-3 group max-w-4xl", msg.role === "user" ? "flex-row-reverse ml-auto" : "flex-row")}
                >
                  {/* Avatar */}
                  <div className={cn(
                    "w-10 h-10 rounded-[0.8rem] flex items-center justify-center shrink-0 shadow-lg border relative overflow-hidden",
                    msg.role === "assistant"
                      ? "bg-gradient-to-br from-purple-800 to-indigo-900 border-purple-500/30 text-white shadow-[0_0_15px_rgba(147,51,234,0.3)]"
                      : "bg-gradient-to-br from-zinc-800 to-zinc-900 border-white/10 text-zinc-300"
                  )}>
                    {msg.role === "assistant" && <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />}
                    {msg.role === "assistant" ? <Bot size={20} className="relative z-10" /> : <User size={18} className="relative z-10" />}
                  </div>

                  {/* Bubble */}
                  <div className={cn("flex flex-col gap-2 max-w-[85%] md:max-w-[75%]", msg.role === "user" ? "items-end" : "items-start")}>
                    <div className={cn(
                      "px-5 py-4 text-sm md:text-[15px] leading-relaxed tracking-wide shadow-2xl relative",
                      msg.role === "assistant"
                        ? "bg-[#101018]/90 backdrop-blur-xl border border-white/[0.08] text-zinc-200 rounded-[2rem] rounded-tl-sm"
                        : "bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-[2rem] rounded-tr-sm shadow-[0_10px_40px_rgba(139,92,246,0.3)] ring-1 ring-white/10"
                    )}>
                      {msg.role === "assistant"
                        ? <RichText text={msg.content} messageId={msg.id} />
                        : <p className="leading-relaxed font-medium">{msg.content}</p>
                      }
                    </div>

                    {/* Media cards */}
                    {msg.elements && msg.elements.length > 0 && (
                      <div className="flex flex-wrap gap-3 mt-1">
                        {msg.elements.map((el, i) => el.type === "media" && <MediaCard key={i} data={el.content} />)}
                      </div>
                    )}

                    {/* Actions row */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[10px] text-zinc-600 font-medium px-1">
                        {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      {msg.role === "assistant" && (
                        <>
                          <button onClick={() => copyMessage(msg.content, msg.id)} className={cn("p-1 rounded-md transition-colors text-zinc-600 hover:text-white", copiedId === msg.id ? "text-green-400" : "")}>
                            {copiedId === msg.id ? <Check size={13} /> : <Copy size={13} />}
                          </button>
                          <button onClick={() => handleReaction(msg.id, "up")} className={cn("p-1 rounded-md transition-colors", msg.reactions?.userReaction === "up" ? "text-green-400" : "text-zinc-600 hover:text-white")}>
                            <ThumbsUp size={13} />
                            {(msg.reactions?.thumbsUp || 0) > 0 && <span className="text-[10px] ml-0.5">{msg.reactions?.thumbsUp}</span>}
                          </button>
                          <button onClick={() => handleReaction(msg.id, "down")} className={cn("p-1 rounded-md transition-colors", msg.reactions?.userReaction === "down" ? "text-red-400" : "text-zinc-600 hover:text-white")}>
                            <ThumbsDown size={13} />
                          </button>
                          <button onClick={() => handleSendMessage(`Développe davantage : ${msg.content.slice(0, 100)}`)} className="p-1 rounded-md text-zinc-600 hover:text-white transition-colors" title="Développer">
                            <RotateCcw size={13} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}

            {/* Typing indicator */}
            <AnimatePresence>
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="flex gap-3 max-w-4xl"
                >
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-900/60 to-indigo-900/60 border border-purple-500/20 flex items-center justify-center shrink-0 relative overflow-hidden">
                    <motion.div
                      animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 via-transparent to-indigo-500/20"
                    />
                    <Bot size={18} className="text-purple-400 relative z-10" />
                  </div>
                  <div className="bg-white/[0.04] border border-white/[0.08] px-5 py-4 rounded-2xl rounded-tl-none flex items-center gap-3 min-w-[140px]">
                    <motion.div className="flex items-center gap-1.5">
                      {[0, 0.2, 0.4].map((delay, i) => (
                        <motion.div
                          key={i}
                          className="w-2 h-2 rounded-full bg-purple-500"
                          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 1.2, repeat: Infinity, delay }}
                        />
                      ))}
                    </motion.div>
                    <span className="text-xs text-zinc-500">Réflexion en cours...</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="h-2" />
          </div>

          {/* ── Input Area ── */}
          <div className="p-3 md:p-6 bg-black/60 backdrop-blur-3xl border-t border-white/[0.08] relative z-20 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-end gap-3">
                <div className="relative flex-1 bg-white/[0.03] hover:bg-white/[0.05] focus-within:bg-[#0a0a0f]/80 border border-white/[0.08] focus-within:border-purple-500/50 rounded-2xl transition-all duration-300 overflow-hidden shadow-inner focus-within:ring-4 ring-purple-500/10">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                    placeholder={isListening ? "Écoute en cours..." : "Posez une question sur un film, une série..."}
                    className="w-full bg-transparent text-white placeholder-zinc-500 text-[15px] p-4 pr-12 min-h-[56px] max-h-[160px] resize-none outline-none scrollbar-none font-medium transition-all"
                    rows={1}
                  />
                  {input.length > 0 && (
                    <button onClick={() => setInput("")} className="absolute right-3 bottom-3 p-1.5 rounded-full bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors">
                      <X size={14} strokeWidth={3} />
                    </button>
                  )}
                </div>

                {/* Voice */}
                <motion.button
                  whileTap={{ scale: 0.93 }}
                  onClick={toggleVoice}
                  className={cn(
                    "h-[56px] w-[56px] shrink-0 rounded-2xl flex items-center justify-center transition-all border shadow-lg",
                    isListening
                      ? "bg-red-500/20 border-red-500/50 text-red-400 shadow-[0_0_30px_rgba(239,68,68,0.4)] animate-pulse"
                      : "bg-white/[0.03] border-white/[0.08] text-zinc-400 hover:text-white hover:bg-white/[0.08] hover:border-white/20"
                  )}
                  title={isListening ? "Arrêter" : "Parler"}
                >
                  {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                </motion.button>

                {/* Send */}
                <motion.button
                  whileTap={{ scale: 0.93 }}
                  onClick={() => handleSendMessage()}
                  disabled={!input.trim() || isTyping}
                  className="h-[56px] w-[56px] shrink-0 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold hover:brightness-110 active:scale-95 transition-all disabled:opacity-30 disabled:hover:brightness-100 disabled:hover:scale-100 shadow-[0_0_30px_rgba(168,85,247,0.5)] border border-white/20"
                >
                  {isTyping ? <Cpu size={18} className="animate-spin" /> : <ArrowUp size={18} strokeWidth={2.5} />}
                </motion.button>
              </div>

              <div className="flex items-center justify-between mt-2 px-1">
                <p className="text-[10px] text-zinc-700">⌨️ Entrée pour envoyer · Maj+Entrée pour sauter une ligne</p>
                <p className="text-[10px] text-zinc-700">© CStream AI · {personaLabels[aiPersona]}</p>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Click outside persona menu */}
      {showPersonaMenu && (
        <div className="fixed inset-0 z-40" onClick={() => setShowPersonaMenu(false)} />
      )}
    </div>
  );
}
