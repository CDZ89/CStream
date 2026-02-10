import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Bot,
  Trash2,
  Plus,
  Sparkles,
  User,
  MessageSquare,
  Zap,
  Share2,
  Heart,
  Home,
  Paperclip,
  Star,
  Play,
  Menu,
  X,
  Settings,
  LogOut,
  Search,
  Globe,
  ChevronLeft,
  ChevronRight,
  Pin,
  PinOff,
  Layout,
  Command,
  Cpu,
  Activity,
  ArrowUp
} from "lucide-react";
import { Navbar } from "@/components/Navbar";

// Utility function for class names
const cn = (...classes: any[]) => classes.filter(Boolean).join(" ");

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  elements?: Array<{ type: string; content: any }>;
}

interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  lastUpdate: Date;
  isPinned?: boolean;
}

function BlurText({
  text,
  theme,
  messageId,
}: {
  text: string;
  theme: "dark" | "light";
  messageId: string;
}) {
  if (!text) return null;

  const hasAnimatedRef = useRef<Record<string, boolean>>({});
  const isFirstRender = !hasAnimatedRef.current[messageId];

  useEffect(() => {
    hasAnimatedRef.current[messageId] = true;
  }, [messageId]);

  const renderWord = (word: string, i: number, isCode: boolean = false) => (
    <motion.span
      key={i}
      initial={
        isFirstRender
          ? { opacity: 0, filter: "blur(8px)" }
          : { opacity: 1, filter: "blur(0px)" }
      }
      animate={{ opacity: 1, filter: "blur(0px)" }}
      transition={{ duration: 0.3, delay: isFirstRender ? i * 0.01 : 0 }} // Faster typing
      className={cn("inline-block", !isCode && "mr-[0.25em]")}
    >
      {word}
    </motion.span>
  );

  const renderLine = (line: string, lineIdx: number) => {
    // Handle code blocks
    if (line.startsWith("```")) {
      return (
        <div
          key={lineIdx}
          className="font-mono text-sm bg-black/40 px-4 py-3 rounded-xl border border-white/10 my-2 overflow-x-auto"
        >
          {line}
        </div>
      );
    }

    // Handle bold text
    if (line.includes("**")) {
      const parts = line.split("**");
      return (
        <div key={lineIdx} className="mb-1 leading-relaxed">
          {parts.map((part, idx) =>
            idx % 2 === 1 ? (
              <strong key={idx} className="text-purple-300 font-bold">
                {part.split(" ").map((w, i) => renderWord(w, i))}
              </strong>
            ) : (
              <span key={idx}>
                {part.split(" ").map((w, i) => renderWord(w, i))}
              </span>
            ),
          )}
        </div>
      );
    }

    // Handle lists
    if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
      return (
        <div key={lineIdx} className="flex gap-2 mb-1 ml-1">
          <span className="text-purple-400 mt-1.5 w-1.5 h-1.5 rounded-full bg-purple-500 flex-shrink-0" />
          <span>
            {line
              .replace(/^[-*]\s/, "")
              .split(" ")
              .map((w, i) => renderWord(w, i))}
          </span>
        </div>
      );
    }

    // Regular text
    return (
      <div key={lineIdx} className="mb-2 last:mb-0 leading-relaxed text-white/90">
        {line.split(" ").map((word, i) => renderWord(word, i))}
      </div>
    );
  };

  return (
    <div className="">
      {text.split("\n").map((line, lineIdx) => renderLine(line, lineIdx))}
    </div>
  );
}

function MediaCard({ data }: { data: any }) {
  if (!data) return null;

  const getPosterUrl = () => {
    if (data.poster && data.poster !== "N/A" && !data.poster.startsWith("/"))
      return data.poster;

    const tmdbPath =
      data.image || data.poster || data.poster_path || data.backdrop_path;
    if (typeof tmdbPath === "string" && tmdbPath.startsWith("/")) {
      return `https://image.tmdb.org/t/p/w500${tmdbPath}`;
    }
    if (typeof tmdbPath === "string" && tmdbPath.includes("tmdb.org")) {
      return tmdbPath;
    }

    return `https://placehold.co/500x750/1a1a2e/ffffff?text=${encodeURIComponent(data.title || data.name || "CStream")}`;
  };

  const fullPosterUrl = getPosterUrl();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="group relative rounded-2xl overflow-hidden bg-black/40 border border-white/10 hover:border-purple-500/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(168,85,247,0.15)] max-w-[200px]"
    >
      <div className="aspect-[2/3] relative overflow-hidden">
        <img
          src={fullPosterUrl}
          alt={data.title || data.name}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = `https://placehold.co/500x750/1a1a2e/ffffff?text=${encodeURIComponent(data.title || data.name || "CStream")}`;
          }}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

        <div className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-bold text-white flex items-center gap-1">
          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
          {data.rating || data.vote_average ? Number(data.rating || data.vote_average).toFixed(1) : "N/A"}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-3">
        <h3 className="text-white font-bold text-sm mb-1 line-clamp-1 leading-tight">
          {data.title || data.name}
        </h3>
        <p className="text-xs text-white/50 mb-3 line-clamp-1">
          {data.year || (data.release_date ? data.release_date.split('-')[0] : 'Inconnu')}
        </p>
        <button
          onClick={() => window.location.href = `/${data.mediaType || 'movie'}/${data.tmdbId || data.id}`}
          className="w-full bg-white/10 hover:bg-white/20 hover:text-purple-300 text-white py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 backdrop-blur-sm border border-white/5"
        >
          <Play size={12} className="fill-current" />
          Regarder
        </button>
      </div>
    </motion.div>
  );
}

const SuggestionButton = ({ icon: Icon, label, onClick, delay }: any) => (
  <motion.button
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    onClick={onClick}
    className="group relative flex items-center gap-3 p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-purple-500/30 transition-all duration-300 text-left overflow-hidden"
  >
    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 border border-white/5">
      <Icon className="w-5 h-5 text-white/70 group-hover:text-purple-400 transition-colors" />
    </div>
    <span className="text-sm font-medium text-white/60 group-hover:text-white transition-colors relative z-10">
      {label}
    </span>
    <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-purple-400 ml-auto transition-colors transform group-hover:translate-x-1" />
  </motion.button>
);

export default function AgentPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("cstream_ai_v15");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setConversations(
          parsed.map((c: any) => ({
            ...c,
            lastUpdate: new Date(c.lastUpdate),
            messages: c.messages.map((m: any) => ({
              ...m,
              timestamp: new Date(m.timestamp),
            })),
          })),
        );
      } catch (e) {
        console.error("Erreur chargement:", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("cstream_ai_v15", JSON.stringify(conversations));
  }, [conversations]);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [currentId, conversations, isTyping, scrollToBottom]);

  const createNewChat = () => {
    const id = Date.now().toString();
    const newChat: Conversation = {
      id,
      title: "Nouvelle Discussion",
      messages: [],
      lastUpdate: new Date(),
    };
    setConversations((prev) => [newChat, ...prev]);
    setCurrentId(id);
    setInput("");
  };

  const handleSendMessage = async (textToUse?: string) => {
    const messageText = textToUse || input;
    if (!messageText.trim() || isTyping) return;

    let activeId = currentId;
    if (!activeId) {
      const id = Date.now().toString();
      const newChat: Conversation = {
        id,
        title: messageText.slice(0, 30),
        messages: [],
        lastUpdate: new Date(),
      };
      setConversations((prev) => [newChat, ...prev]);
      setCurrentId(id);
      activeId = id;
    }

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeId
          ? { ...c, messages: [...c.messages, userMsg], lastUpdate: new Date() }
          : c,
      ),
    );

    if (!textToUse) setInput("");
    setIsTyping(true);

    const currentConv = conversations.find((c) => c.id === activeId) || { messages: [] };

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...(currentConv.messages || []), userMsg].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          character: "cai",
          includeMedia: true,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        const assistantContent =
          data.response ||
          data.reply ||
          data.choices?.[0]?.message?.content ||
          "";

        const assistantMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: assistantContent || "Je réfléchis...",
          timestamp: new Date(),
          elements: [],
        };

        if (data.response?.startsWith("Erreur neuronale")) {
          assistantMsg.content = `🚨 Erreur Serveur : ${data.response}`;
        }

        const textToParse =
          assistantContent ||
          (typeof data.response === "string" ? data.response : "");
        if (textToParse?.includes("[MEDIA_DATA]")) {
          const parts = textToParse.split("[MEDIA_DATA]");
          assistantMsg.content = parts[0].trim();

          for (let i = 1; i < parts.length; i++) {
            const endTagIndex = parts[i].indexOf("[/MEDIA_DATA]");
            if (endTagIndex !== -1) {
              const mediaPart = parts[i].substring(0, endTagIndex);
              try {
                const mediaData = JSON.parse(mediaPart);
                const normalizedMedia = {
                  id: Number(mediaData.id),
                  tmdbId: Number(mediaData.id),
                  type: mediaData.type || (mediaData.title ? "movie" : "tv"),
                  mediaType:
                    mediaData.type || (mediaData.title ? "movie" : "tv"),
                  title: mediaData.title || mediaData.name,
                  poster:
                    mediaData.poster ||
                    mediaData.poster_path ||
                    mediaData.image,
                  posterPath: mediaData.poster_path || mediaData.image,
                  voteAverage: mediaData.rating || mediaData.vote_average,
                  releaseDate: mediaData.year
                    ? `${mediaData.year}-01-01`
                    : undefined,
                  poster_path: mediaData.poster_path || mediaData.image,
                  rating: mediaData.rating || mediaData.vote_average,
                  overview: mediaData.overview,
                  year: mediaData.year,
                };
                assistantMsg.elements?.push({
                  type: "media",
                  content: normalizedMedia,
                });
              } catch (e) {
                console.error("Error parsing media:", e);
              }

              const remainingText = parts[i].substring(endTagIndex + 13).trim();
              if (remainingText) {
                assistantMsg.content += "\n\n" + remainingText;
              }
            }
          }
        }

        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeId
              ? {
                ...c,
                messages: [...c.messages, assistantMsg],
                lastUpdate: new Date(),
              }
              : c,
          ),
        );
      } else {
        const assistantMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Désolé, je rencontre des difficultés de connexion. Réessayez dans un instant.",
          timestamp: new Date(),
          elements: [],
        };
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeId
              ? { ...c, messages: [...c.messages, assistantMsg], lastUpdate: new Date() }
              : c,
          ),
        );
      }
    } catch (e: any) {
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Erreur de réseau. Verifiez votre connexion.",
        timestamp: new Date(),
        elements: [],
      };
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeId
            ? { ...c, messages: [...c.messages, assistantMsg], lastUpdate: new Date() }
            : c,
        ),
      );
    } finally {
      setIsTyping(false);
      setTimeout(scrollToBottom, 50);
    }
  };

  const deleteChat = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConversations((prev) => {
      const filtered = prev.filter((c) => c.id !== id);
      if (currentId === id) {
        setCurrentId(filtered.length > 0 ? filtered[0].id : null);
      }
      return filtered;
    });
  };

  const currentChat = conversations.find((c) => c.id === currentId);

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans selection:bg-purple-500/30">
      <Navbar />

      {/* Enhanced Background Ambience */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-gradient-to-br from-purple-600/20 via-purple-900/10 to-transparent rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-gradient-to-tl from-blue-600/20 via-indigo-900/10 to-transparent rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40%] h-[40%] bg-gradient-to-r from-pink-500/5 to-violet-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="flex-1 flex pt-16 md:pt-20 h-[calc(100vh)] overflow-hidden relative z-10">

        {/* Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 300, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="h-full border-r border-white/5 bg-black/40 backdrop-blur-xl flex flex-col hidden md:flex"
            >
              <div className="p-4 border-b border-white/5">
                <button
                  onClick={createNewChat}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold text-sm hover:shadow-[0_0_20px_rgba(147,51,234,0.3)] transition-all active:scale-95 border border-white/10"
                >
                  <Plus size={18} />
                  Nouvelle Conversation
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                <p className="px-3 text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 mt-2">Historique</p>
                {conversations.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => setCurrentId(c.id)}
                    className={cn(
                      "group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border border-transparent",
                      currentId === c.id
                        ? "bg-white/10 border-white/10 text-white"
                        : "hover:bg-white/5 text-zinc-400 hover:text-zinc-200"
                    )}
                  >
                    <MessageSquare size={16} className={cn("flex-shrink-0", currentId === c.id ? "text-purple-400" : "text-zinc-600")} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{c.title || "Nouvelle discussion"}</p>
                      <p className="text-[10px] text-zinc-600 truncate">{c.lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <button
                      onClick={(e) => deleteChat(c.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/20 hover:text-red-400 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-white/5">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-white/5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                    <Sparkles size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Version Beta</p>
                    <p className="text-[10px] text-zinc-400">Powered by Gemini 2.0</p>
                  </div>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col h-full relative">
          {/* Header */}
          <header className="h-16 border-b border-white/5 bg-black/20 backdrop-blur-md flex items-center justify-between px-6 flex-shrink-0 z-20">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors"
              >
                <Layout size={20} />
              </button>
              <div>
                <h1 className="text-sm font-bold text-white flex items-center gap-2">
                  <Bot className="w-4 h-4 text-purple-400" />
                  CStream Agent
                </h1>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[10px] text-zinc-500 font-medium tracking-wide">ONLINE</span>
                </div>
              </div>
            </div>
            <div>
              <button
                onClick={createNewChat}
                className="md:hidden p-2 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30"
              >
                <Plus size={20} />
              </button>
            </div>
          </header>

          {/* Messages */}
          <div
            className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scroll-smooth"
            ref={scrollRef}
          >
            {!currentChat || currentChat.messages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto text-center space-y-8 pb-20"
              >
                {/* Premium Logo with Glow */}
                <div className="relative">
                  <div className="absolute inset-0 scale-150 bg-gradient-to-r from-purple-500/30 via-blue-500/20 to-purple-500/30 blur-3xl rounded-full animate-pulse" />
                  <motion.div
                    className="relative w-28 h-28 rounded-3xl bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 flex items-center justify-center mx-auto shadow-2xl shadow-purple-500/40 border border-white/20"
                    animate={{ rotateY: [0, 5, -5, 0] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Bot size={56} className="text-white drop-shadow-lg" />
                    <motion.div
                      className="absolute -right-3 -top-3 w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center border-4 border-[#050505] shadow-lg shadow-green-500/30"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Sparkles size={18} className="text-white" />
                    </motion.div>
                  </motion.div>
                </div>

                <div className="space-y-4">
                  <h2 className="text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
                    Comment puis-je vous aider ?
                  </h2>
                  <p className="text-zinc-400 max-w-lg mx-auto text-base md:text-lg leading-relaxed">
                    Je suis <span className="text-purple-400 font-semibold">CStream AI</span>, votre assistant cinéma personnel.
                    Films, séries, anime — demandez-moi tout ! 🎬
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                  <SuggestionButton
                    icon={Star}
                    label="Quels sont les films populaires cette semaine ?"
                    delay={0.1}
                    onClick={() => handleSendMessage("Quels sont les films populaires cette semaine ?")}
                  />
                  <SuggestionButton
                    icon={Heart}
                    label="Recommande-moi un film romantique"
                    delay={0.2}
                    onClick={() => handleSendMessage("Recommande-moi un film romantique")}
                  />
                  <SuggestionButton
                    icon={Zap}
                    label="Nouveautés Anime 2024"
                    delay={0.3}
                    onClick={() => handleSendMessage("Quelles sont les nouveautés Anime de 2024 ?")}
                  />
                  <SuggestionButton
                    icon={Activity}
                    label="Analyse mon profil"
                    delay={0.4}
                    onClick={() => handleSendMessage("Analyse mon profil et mes goûts.")}
                  />
                </div>
              </motion.div>
            ) : (
              currentChat.messages.map((msg, idx) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex gap-4 max-w-4xl mx-auto group",
                    msg.role === "user" ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg border border-white/5",
                    msg.role === "assistant"
                      ? "bg-black text-purple-400"
                      : "bg-gradient-to-br from-white to-zinc-300 text-black"
                  )}>
                    {msg.role === "assistant" ? <Bot size={20} /> : <User size={20} />}
                  </div>

                  <div className={cn(
                    "flex flex-col gap-2 max-w-[85%] md:max-w-[75%]",
                    msg.role === "user" ? "items-end" : "items-start"
                  )}>
                    <div className={cn(
                      "p-4 md:p-6 rounded-3xl shadow-sm text-sm md:text-base",
                      msg.role === "assistant"
                        ? "bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/10 text-zinc-200 rounded-tl-none backdrop-blur-xl shadow-[0_0_15px_rgba(168,85,247,0.05)]"
                        : "bg-gradient-to-br from-white to-zinc-100 text-black rounded-tr-none font-medium shadow-lg"
                    )}>
                      {msg.role === "assistant" ? (
                        <BlurText text={msg.content} theme="dark" messageId={msg.id} />
                      ) : (
                        <p>{msg.content}</p>
                      )}
                    </div>

                    {msg.elements && msg.elements.length > 0 && (
                      <div className="flex flex-wrap gap-4 mt-2">
                        {msg.elements.map((el, i) => (
                          el.type === "media" && <MediaCard key={i} data={el.content} />
                        ))}
                      </div>
                    )}

                    <span className="text-[10px] text-zinc-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity px-2">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </motion.div>
              ))
            )}

            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-4 max-w-4xl mx-auto"
              >
                <div className="w-10 h-10 rounded-xl bg-black border border-white/5 flex items-center justify-center shrink-0 relative overflow-hidden">
                  {/* Animated Logo Spinner */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 via-transparent to-blue-500/20"
                  />
                  <Bot size={20} className="text-purple-400 relative z-10" />
                </div>
                <div className="bg-white/[0.03] border border-white/10 p-5 rounded-3xl rounded-tl-none min-w-[200px]">
                  <div className="flex items-center gap-3 mb-2">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="w-2 h-2 rounded-full bg-purple-500"
                    />
                    <span className="text-sm font-medium text-white/70">Réflexion en cours</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <motion.div
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: 0 }}
                      className="h-1 w-8 bg-gradient-to-r from-purple-500 to-purple-400 rounded-full"
                    />
                    <motion.div
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}
                      className="h-1 w-12 bg-gradient-to-r from-purple-400 to-blue-500 rounded-full"
                    />
                    <motion.div
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
                      className="h-1 w-6 bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
                    />
                  </div>
                </div>
              </motion.div>
            )}
            <div className="h-4" /> {/* Spacer */}
          </div>

          {/* Input Area */}
          <div className="p-4 md:p-6 bg-black/40 backdrop-blur-xl border-t border-white/5 relative z-30">
            <div className="max-w-4xl mx-auto relative md:flex items-end gap-3">
              <div className="relative flex-1 bg-white/5 hover:bg-white/10 focus-within:bg-white/10 border border-white/5 focus-within:border-purple-500/50 rounded-2xl transition-all duration-300">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Posez une question sur un film, une série..."
                  className="w-full bg-transparent text-white placeholder-zinc-500 text-sm md:text-base p-4 min-h-[56px] max-h-[140px] resize-none outline-none scrollbar-none"
                  rows={1}
                />
                <div className="absolute right-3 bottom-2.5 flex items-center gap-2">
                  {input.length > 0 && (
                    <button
                      onClick={() => setInput('')}
                      className="p-1.5 text-zinc-500 hover:text-white transition-colors"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              <button
                onClick={() => handleSendMessage()}
                disabled={!input.trim() || isTyping}
                className="hidden md:flex h-[56px] w-[56px] items-center justify-center rounded-2xl bg-white text-black font-bold hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
              >
                {isTyping ? (
                  <Cpu className="w-6 h-6 animate-spin" />
                ) : (
                  <ArrowUp className="w-6 h-6" strokeWidth={3} />
                )}
              </button>
            </div>
            <p className="text-center text-[10px] text-zinc-600 mt-3 font-medium">
              L'IA peut faire des erreurs. Vérifiez les informations importantes.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}

