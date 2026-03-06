import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot, Plus, MessageSquare, Trash2, Search,
  ArrowUp, Mic, MicOff, Copy, ThumbsUp, ThumbsDown,
  Check, Film, Tv, Star, Play, Download, Sparkles,
  ChevronRight, Zap, Heart, Globe, TrendingUp,
  PanelLeft, ChevronDown, Cpu, Loader2,
  Code
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { useNavigate } from "react-router-dom";

const cn = (...c: (string | boolean | undefined | null)[]) => c.filter(Boolean).join(" ");

/* ─── Types ─────────────────────────────────────────────────────────────── */
interface Msg {
  id: string;
  role: "user" | "assistant";
  content: string;
  ts: Date;
  media?: any[];
  modelUsed?: string;
  reactions?: { up: number; down: number; mine?: "up" | "down" };
}
interface Conv { id: string; title: string; msgs: Msg[]; updatedAt: Date }
interface AIModel { id: string; name: string; provider: string; description: string; available: boolean }

/* ─── Markdown renderer ─────────────────────────────────────────────────── */
function MD({ text }: { text: string }) {
  const renderInline = (t: string) => {
    const parts = t.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    return (
      <>
        {parts.map((p, i) => {
          if (p.startsWith("**") && p.endsWith("**")) {
            return <strong key={i} className="text-white font-semibold font-display tracking-wide">{p.slice(2, -2)}</strong>;
          }
          if (p.startsWith("`") && p.endsWith("`")) {
            return <code key={i} className="px-1.5 py-0.5 rounded-md bg-white/10 text-purple-300 text-[13px] font-mono">{p.slice(1, -1)}</code>;
          }
          return <span key={i} className="text-zinc-300 leading-relaxed">{p}</span>;
        })}
      </>
    );
  };

  const blocks = text.split(/(```[\s\S]*?```)/g);

  return (
    <div className="text-[15px] space-y-4 font-sans max-w-none">
      {blocks.map((block, i) => {
        if (block.startsWith("```") && block.endsWith("```")) {
          const content = block.slice(3, -3);
          const lines = content.split('\n');
          const lang = lines[0].trim();
          const code = lines.slice(1).join('\n');
          return (
            <div key={i} className="my-4 rounded-xl overflow-hidden border border-white/10 bg-[#070b14] shadow-xl">
              {lang && (
                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border-b border-white/5 text-xs text-zinc-400 font-medium">
                  <Code className="w-3.5 h-3.5" />
                  {lang}
                </div>
              )}
              <pre className="p-4 overflow-x-auto text-[13px] font-mono text-zinc-300 leading-relaxed">
                <code>{code || content}</code>
              </pre>
            </div>
          );
        }

        return (
          <div key={i} className="space-y-3">
            {block.split("\n").map((line, j) => {
              if (!line.trim()) return null;
              if (line.startsWith("### ")) return <h4 key={j} className="font-bold text-lg text-white mt-5 mb-2">{renderInline(line.slice(4))}</h4>;
              if (line.startsWith("## ")) return <h3 key={j} className="font-bold text-xl text-white mt-6 mb-3">{renderInline(line.slice(3))}</h3>;
              if (line.startsWith("# ")) return <h2 key={j} className="font-black text-2xl text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400 mt-6 mb-4">{renderInline(line.slice(2))}</h2>;
              if (/^[-*]\s/.test(line)) {
                return (
                  <div key={j} className="flex gap-3 items-start ml-2">
                    <span className="mt-[8px] w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0 shadow-[0_0_8px_rgba(168,85,247,0.6)]" />
                    <span className="flex-1">{renderInline(line.replace(/^[-*]\s/, ""))}</span>
                  </div>
                );
              }
              if (/^\d+\.\s/.test(line)) {
                const parts = line.split(". ");
                return (
                  <div key={j} className="flex gap-3 items-start ml-1">
                    <span className="text-purple-400 font-bold shrink-0 min-w-[1.2rem] text-right">{parts[0]}.</span>
                    <span className="flex-1">{renderInline(parts.slice(1).join(". "))}</span>
                  </div>
                );
              }
              if (line.trim() === "---") return <hr key={j} className="border-white/10 my-6" />;
              return <p key={j}>{renderInline(line)}</p>;
            })}
          </div>
        );
      })}
    </div>
  );
}

/* ─── MediaCard ─────────────────────────────────────────────────────────── */
function MediaCard({ data }: { data: any }) {
  const nav = useNavigate();
  if (!data) return null;
  const poster = (() => {
    const p = data.image || data.poster || data.poster_path || data.backdrop_path;
    if (typeof p === "string" && p.startsWith("/")) return `https://image.tmdb.org/t/p/w300${p}`;
    if (typeof p === "string" && p.startsWith("http")) return p;
    return `https://placehold.co/300x450/111/fff?text=${encodeURIComponent(data.title || "?")}`;
  })();
  const type = data.mediaType || data.type || (data.title ? "movie" : "tv");
  const rating = data.rating || data.vote_average;
  const year = data.year || data.release_date?.slice(0, 4) || data.first_air_date?.slice(0, 4);

  return (
    <motion.div whileHover={{ y: -6, scale: 1.03 }}
      onClick={() => nav(`/${type}/${data.tmdbId || data.id}`)}
      className="w-[140px] flex-shrink-0 cursor-pointer group">
      <div className="aspect-[2/3] rounded-2xl overflow-hidden bg-zinc-900 shadow-xl border border-white/5 relative mb-2">
        <img src={poster} alt={data.title || data.name} loading="lazy" decoding="async"
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
        {rating && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/50 backdrop-blur-md rounded-lg px-2 py-1 text-[11px] font-bold text-white border border-white/10 shadow-lg">
            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />{Number(rating).toFixed(1)}
          </div>
        )}
        <div className="absolute top-2 right-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg p-1.5 shadow-lg">
          {type === "movie" ? <Film className="w-3.5 h-3.5 text-white" /> : <Tv className="w-3.5 h-3.5 text-white" />}
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
          <button className="w-full flex items-center justify-center gap-1.5 bg-white/95 hover:bg-white text-black text-[11px] font-bold py-2 rounded-xl shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-all">
            <Play className="w-3.5 h-3.5 fill-black" /> Voir
          </button>
        </div>
      </div>
      <p className="text-[13px] font-semibold text-white/90 line-clamp-2 leading-tight px-1 drop-shadow-md">{data.title || data.name}</p>
      {year && <p className="text-[11px] text-zinc-400 mt-1 px-1 font-medium">{year}</p>}
    </motion.div>
  );
}

/* ─── Suggestion card ───────────────────────────────────────────────────── */
function SuggCard({ icon: Icon, title, desc, onClick }: { icon: any; title: string; desc: string; onClick: () => void }) {
  return (
    <motion.button whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }} onClick={onClick}
      className="group text-left p-5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05] hover:border-purple-500/30 transition-all duration-300 overflow-hidden relative shadow-lg hover:shadow-purple-500/10 backdrop-blur-md">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-indigo-500/0 group-hover:from-purple-500/10 group-hover:to-indigo-500/10 transition-all duration-500" />
      <div className="w-10 h-10 rounded-xl bg-purple-500/10 group-hover:bg-purple-500/20 flex items-center justify-center mb-3 relative transition-colors duration-300 border border-purple-500/10">
        <Icon className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform duration-300" />
      </div>
      <p className="text-[14px] font-bold text-white/95 mb-1.5 leading-tight group-hover:text-purple-300 transition-colors">{title}</p>
      <p className="text-[12px] text-zinc-400 line-clamp-2 leading-relaxed">{desc}</p>
      <div className="absolute right-4 bottom-4 w-6 h-6 rounded-full bg-white/5 flex items-center justify-center translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
        <ChevronRight className="w-3.5 h-3.5 text-purple-400" />
      </div>
    </motion.button>
  );
}

/* ─── Model Selector Dropdown ───────────────────────────────────────────── */
function ModelSelector({ models, selected, onSelect }: { models: AIModel[]; selected: string; onSelect: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const cur = models.find(m => m.id === selected) || models[0];

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const providerColor = (p: string) => ({
    gemini: "text-blue-400", huggingface: "text-yellow-400", groq: "text-emerald-400", auto: "text-purple-400"
  })[p] || "text-zinc-400";

  return (
    <div ref={ref} className="relative z-50">
      <button onClick={() => setOpen(p => !p)}
        className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.05] transition-all text-[13px] font-semibold backdrop-blur-md shadow-sm">
        <Cpu className={cn("w-4 h-4", providerColor(cur?.provider || "auto"))} />
        <span className="text-white/90 max-w-[130px] truncate">{cur?.name || "Auto"}</span>
        <ChevronDown className={cn("w-3.5 h-3.5 text-zinc-500 transition-transform duration-300", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }} transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute top-full right-0 mt-3 w-72 bg-[#0b0f19]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] overflow-hidden z-[100]">
            <div className="p-2 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {models.map(m => (
                <button key={m.id} onClick={() => { onSelect(m.id); setOpen(false); }}
                  disabled={!m.available && m.provider !== "auto"}
                  className={cn("w-full flex items-start gap-3.5 px-3.5 py-3 rounded-xl text-left transition-all duration-200",
                    selected === m.id ? "bg-purple-500/15 border border-purple-500/20" : "hover:bg-white/[0.06] border border-transparent",
                    !m.available && m.provider !== "auto" ? "opacity-40 cursor-not-allowed" : "")}>
                  <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-inner",
                    m.provider === "gemini" ? "bg-blue-500/10 border border-blue-500/20" :
                      m.provider === "huggingface" ? "bg-yellow-500/10 border border-yellow-500/20" :
                        m.provider === "groq" ? "bg-emerald-500/10 border border-emerald-500/20" :
                          "bg-purple-500/10 border border-purple-500/20"
                  )}>
                    <Cpu className={cn("w-4 h-4", providerColor(m.provider))} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn("text-[13px] font-bold", selected === m.id ? "text-purple-300" : "text-white/90")}>{m.name}</span>
                      {!m.available && m.provider !== "auto" && <span className="text-[9px] bg-red-500/20 border border-red-500/30 text-red-300 px-1.5 py-0.5 rounded-md font-black tracking-wider">NO KEY</span>}
                      {m.available && selected === m.id && <Check className="w-3.5 h-3.5 text-purple-400 ml-auto shrink-0" />}
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1 leading-tight">{m.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── MAIN ──────────────────────────────────────────────────────────────── */
export default function AgentPage() {
  const [convs, setConvs] = useState<Conv[]>([]);
  const convsRef = useRef<Conv[]>([]); // To fix closure stale state
  const [curId, setCurId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [sidebar, setSidebar] = useState(true);
  const [search, setSearch] = useState("");
  const [persona, setPersona] = useState<"cai" | "critic" | "director">("cai");
  const [selectedModel, setSelectedModel] = useState("auto");
  const [models, setModels] = useState<AIModel[]>([
    { id: "auto", name: "🤖 Auto (cascade)", provider: "auto", description: "Essaie Gemini → HuggingFace → Groq", available: true },
    { id: "gemini-2.0-flash", name: "⚡ Gemini 2.0 Flash", provider: "gemini", description: "Rapide, intelligent", available: true },
    { id: "gemini-1.5-pro", name: "🧠 Gemini 1.5 Pro", provider: "gemini", description: "Haute précision", available: true },
    { id: "gemini-1.5-flash", name: "💨 Gemini 1.5 Flash", provider: "gemini", description: "Ultra rapide", available: true },
    { id: "llama-3.3-70b", name: "🦙 Llama 3.3 70B", provider: "huggingface", description: "Via HuggingFace", available: true },
    { id: "groq-llama", name: "⚡ Groq Llama 70B", provider: "groq", description: "Très rapide via Groq", available: true },
  ]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [listening, setListening] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recRef = useRef<any>(null);

  /* Sync ref with state */
  useEffect(() => { convsRef.current = convs; }, [convs]);

  /* Fetch models from API */
  useEffect(() => {
    fetch("/api/models")
      .then(r => r.json())
      .then(d => { if (d.models) setModels(d.models); })
      .catch(() => { });
  }, []);

  /* Load from localStorage */
  useEffect(() => {
    try {
      const saved = localStorage.getItem("cstream_aiconv_v4"); // bumped version to avoid old bad state
      if (saved) {
        const parsed = JSON.parse(saved).map((c: any) => ({
          ...c, updatedAt: new Date(c.updatedAt),
          msgs: c.msgs.map((m: any) => ({ ...m, ts: new Date(m.ts) }))
        }));
        setConvs(parsed);
        if (parsed.length > 0) setCurId(parsed[0].id);
      }
    } catch { }
    if (window.innerWidth < 768) setSidebar(false);
  }, []);

  useEffect(() => {
    if (convs.length) localStorage.setItem("cstream_aiconv_v4", JSON.stringify(convs));
  }, [convs]);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight + 1000;
      setTimeout(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight + 1000;
      }, 100);
    });
  }, []);

  useEffect(() => { scrollToBottom(); }, [curId, busy, convs]);

  const newConv = () => {
    const id = crypto.randomUUID();
    setConvs(p => [{ id, title: "Nouvelle discussion", msgs: [], updatedAt: new Date() }, ...p]);
    setCurId(id);
    setInput("");
    if (window.innerWidth < 768) setSidebar(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const deleteConv = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConvs(p => {
      const filtered = p.filter(c => c.id !== id);
      if (curId === id) setCurId(filtered[0]?.id ?? null);
      if (filtered.length === 0) localStorage.removeItem("cstream_aiconv_v4");
      return filtered;
    });
  };

  const toggleVoice = () => {
    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SR) { alert("Reconnaissance vocale non supportée dans ce navigateur."); return; }
    if (listening) { recRef.current?.stop(); setListening(false); return; }
    const r = new SR();
    r.lang = "fr-FR"; r.continuous = false; r.interimResults = false;
    r.onresult = (e: any) => { setInput(p => p + e.results[0][0].transcript + " "); if (inputRef.current) { inputRef.current.style.height = "auto"; } };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    recRef.current = r; r.start(); setListening(true);
  };

  const send = async (textOverride?: string) => {
    const text = (textOverride ?? input).trim();
    if (!text || busy) return;

    let activeId = curId;
    if (!activeId) {
      const id = crypto.randomUUID();
      activeId = id;
      setCurId(id);
      setConvs(p => [{ id, title: text.slice(0, 40) + "...", msgs: [], updatedAt: new Date() }, ...p]);
    }

    const userMsg: Msg = { id: crypto.randomUUID(), role: "user", content: text, ts: new Date() };

    // Optimistic UI update
    setConvs(p => p.map(c => c.id === activeId
      ? { ...c, msgs: [...c.msgs, userMsg], updatedAt: new Date(), title: c.msgs.length === 0 ? text.slice(0, 40) + "..." : c.title }
      : c));

    if (!textOverride) {
      setInput("");
      if (inputRef.current) inputRef.current.style.height = "auto";
    }
    setBusy(true);

    // FIX: Read history dynamically using a functional approach inside the async execution
    // or from the ref so we don't send staled states if sent too quickly.
    const activeConv = convsRef.current.find(c => c.id === activeId);
    const history = activeConv ? activeConv.msgs : [];

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...history, userMsg].map(m => ({ role: m.role, content: m.content })),
          character: persona,
          model: selectedModel,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      let rawContent: string = data.response || data.reply || data.choices?.[0]?.message?.content || "";
      if (!rawContent) throw new Error("Réponse vide du serveur");

      const aMsg: Msg = { id: crypto.randomUUID(), role: "assistant", content: rawContent, ts: new Date(), media: [], reactions: { up: 0, down: 0 }, modelUsed: data.model_used };

      if (rawContent.includes("[MEDIA_DATA]")) {
        const parts = rawContent.split("[MEDIA_DATA]");
        aMsg.content = parts[0].trim();
        for (let i = 1; i < parts.length; i++) {
          const end = parts[i].indexOf("[/MEDIA_DATA]");
          if (end !== -1) {
            try {
              const md = JSON.parse(parts[i].slice(0, end));
              aMsg.media!.push({ id: Number(md.id), tmdbId: Number(md.id), mediaType: md.type || (md.title ? "movie" : "tv"), title: md.title || md.name, poster: md.poster || md.poster_path || md.image, poster_path: md.poster_path || md.image, rating: md.rating || md.vote_average, year: md.year });
            } catch { }
          }
        }
      }

      setConvs(p => p.map(c => c.id === activeId ? { ...c, msgs: [...c.msgs, aMsg], updatedAt: new Date() } : c));
    } catch (err: any) {
      const errMsg: Msg = {
        id: crypto.randomUUID(), role: "assistant",
        content: `⚠️ **Erreur :** ${err.message || "Service indisponible"}\n\n_Vérifiez que le serveur backend est démarré et que les clés API dans \`.env\` sont correctes._`,
        ts: new Date()
      };
      setConvs(p => p.map(c => c.id === activeId ? { ...c, msgs: [...c.msgs, errMsg], updatedAt: new Date() } : c));
    } finally {
      setBusy(false);
      requestAnimationFrame(scrollToBottom);
    }
  };

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const react = (msgId: string, dir: "up" | "down") => {
    setConvs(p => p.map(c => c.id === curId ? {
      ...c, msgs: c.msgs.map(m => {
        if (m.id !== msgId || !m.reactions) return m;
        const prev = m.reactions.mine;
        return { ...m, reactions: { up: m.reactions.up + (dir === "up" ? (prev === "up" ? -1 : 1) : 0), down: m.reactions.down + (dir === "down" ? (prev === "down" ? -1 : 1) : 0), mine: prev === dir ? undefined : dir } };
      })
    } : c));
  };

  const cur = convs.find(c => c.id === curId);
  const filtered = convs.filter(c => !search || c.title.toLowerCase().includes(search.toLowerCase()));
  const personaNames: Record<string, string> = { cai: "🎬 CStream AI", critic: "🎭 Critique", director: "🎥 Réalisateur" };

  const suggestions = [
    { icon: TrendingUp, title: "Films populaires", desc: "Quels films sont tendance cette semaine ?", msg: "Quels sont les films les plus populaires en ce moment ?" },
    { icon: Heart, title: "Romantique méconnu", desc: "Un film romantique sous-coté à recommander", msg: "Recommande-moi un film romantique méconnu et sous-coté" },
    { icon: Globe, title: "Cinéma Coréen", desc: "Les incontournables du cinéma coréen", msg: "Quels sont les meilleurs films et séries coréens à voir absolument ?" },
    { icon: Zap, title: "Série addictive", desc: "Une série récente et ultra-addictive", msg: "Je cherche une nouvelle série hyper addictive avec beaucoup de suspense, style thriller ou sci-fi." },
  ];

  return (
    <div className="h-[100dvh] bg-[#0b0f19] text-white flex flex-col overflow-hidden relative">
      {/* Premium Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-purple-600/10 blur-[120px]" />
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] rounded-full bg-indigo-600/10 blur-[120px]" />
        <div className="absolute -bottom-[20%] left-[20%] w-[60%] h-[50%] rounded-full bg-blue-600/5 blur-[150px]" />
      </div>

      <div className="relative z-10">
        <Navbar />
      </div>

      <div className="flex flex-1 overflow-hidden pt-[64px] relative z-10 max-h-[100dvh]">

        {/* ── Sidebar ── */}
        <AnimatePresence>
          {sidebar && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setSidebar(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden" />

              <motion.aside initial={{ x: -280, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -280, opacity: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 40 }}
                className="fixed md:relative top-0 left-0 h-full z-40 md:z-auto w-[280px] bg-[#0b0f19]/80 backdrop-blur-2xl border-r border-white/[0.05] flex flex-col shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.5)]">

                <div className="p-5 mt-16 md:mt-0">
                  <button onClick={newConv}
                    className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-sm font-bold text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all transform hover:-translate-y-0.5 active:translate-y-0">
                    <Plus className="w-4 h-4 stroke-[3]" /> Nouveau chat
                  </button>
                </div>

                <div className="px-4 pb-4">
                  <div className="relative group">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-purple-400 transition-colors" />
                    <input type="text" placeholder="Rechercher une discussion..." value={search} onChange={e => setSearch(e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl py-2.5 pl-10 pr-4 text-[13px] font-medium text-white/90 placeholder-zinc-500 focus:outline-none focus:border-purple-500/50 focus:bg-purple-500/[0.02] transition-all shadow-sm" />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto py-2 px-3 space-y-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                  {filtered.length === 0 ? (
                    <div className="text-center py-10 text-zinc-500 text-[13px] font-medium flex flex-col items-center gap-3 opacity-60">
                      <MessageSquare className="w-8 h-8 stroke-[1.5]" />
                      Aucune discussion
                    </div>
                  ) : filtered.map(c => (
                    <button key={c.id} onClick={() => { setCurId(c.id); if (window.innerWidth < 768) setSidebar(false); }}
                      className={cn("group w-full text-left flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-200 border",
                        curId === c.id ? "bg-white/[0.08] border-white/[0.05] shadow-sm text-white" : "border-transparent text-zinc-400 hover:bg-white/[0.04] hover:text-white")}>
                      <MessageSquare className={cn("w-4 h-4 shrink-0 transition-colors", curId === c.id ? "text-purple-400" : "text-zinc-500 group-hover:text-zinc-300")} />
                      <div className="flex-1 min-w-0">
                        <div className={cn("text-[13px] font-semibold truncate", curId === c.id ? "text-white" : "text-zinc-300")}>{c.title}</div>
                        <div className="text-[10px] text-zinc-600 font-medium">{c.updatedAt.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</div>
                      </div>
                      <button onClick={e => deleteConv(c.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/20 text-zinc-500 hover:text-red-400 transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </button>
                  ))}
                </div>

                {/* Persona selector */}
                <div className="p-4 bg-black/20 border-t border-white/[0.05]">
                  <p className="text-[10px] uppercase font-black text-zinc-500 mb-3 tracking-widest pl-1">Personnalité</p>
                  <div className="space-y-1.5">
                    {(Object.entries(personaNames) as [typeof persona, string][]).map(([k, v]) => (
                      <button key={k} onClick={() => setPersona(k)}
                        className={cn("w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-all",
                          persona === k ? "bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border border-purple-500/30 text-purple-300 shadow-inner" : "border border-transparent text-zinc-400 hover:bg-white/[0.04] hover:text-white")}>
                        <div className={cn("w-5 h-5 rounded-md flex items-center justify-center shrink-0", persona === k ? "bg-purple-500/20" : "")}>
                          {persona === k ? <Check className="w-3.5 h-3.5 text-purple-400 stroke-[3]" /> : <span className="w-2 h-2 rounded-full border-2 border-zinc-600 group-hover:border-zinc-400" />}
                        </div>
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* ── Main ── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">

          {/* Topbar */}
          <div className="h-16 border-b border-white/[0.03] bg-[#0b0f19]/60 backdrop-blur-xl flex items-center px-4 md:px-6 gap-4 shrink-0 shadow-sm z-20">
            <button onClick={() => setSidebar(p => !p)}
              className="p-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors border border-transparent hover:border-white/5">
              <PanelLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.05] px-4 py-2 rounded-xl backdrop-blur-md shadow-inner">
              <Bot className="w-4 h-4 text-purple-400" />
              <span className="text-[14px] font-bold text-white/90">{personaNames[persona]}</span>
              <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse ml-1" />
            </div>

            {/* Model selector & actions */}
            <div className="ml-auto flex items-center gap-3">
              <ModelSelector models={models} selected={selectedModel} onSelect={setSelectedModel} />
              {cur && cur.msgs.length > 0 && (
                <button onClick={() => {
                  const t = cur.msgs.map(m => `[${m.role === "user" ? "Vous" : "AI"}]\n${m.content}`).join("\n\n---\n\n");
                  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([t])); a.download = "chat.txt"; a.click();
                }} className="p-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors border border-transparent hover:border-white/5" title="Exporter">
                  <Download className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Messages or Welcome */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto scroll-smooth scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent pb-40">
            {(!cur || cur.msgs.length === 0) ? (
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: "easeOut" }}
                className="flex flex-col items-center justify-center min-h-full px-6 py-12 text-center max-w-3xl mx-auto">

                <div className="relative mb-8 group">
                  <div className="absolute inset-0 bg-gradient-to-tr from-purple-500 to-indigo-500 blur-3xl opacity-30 group-hover:opacity-50 transition-opacity duration-700 scale-150 rounded-full" />
                  <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-2xl shadow-purple-500/20 transform group-hover:scale-105 transition-all duration-500 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <Bot className="w-12 h-12 text-white drop-shadow-lg relative z-10" />
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-tr from-green-400 to-green-500 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(34,197,94,0.6)] border-2 border-[#0b0f19] z-20">
                      <Sparkles className="w-3.5 h-3.5 text-white" />
                    </div>
                  </div>
                </div>

                <h1 className="text-4xl sm:text-5xl font-black mb-4 tracking-tight">
                  Bonjour, je suis <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-400 to-indigo-400 drop-shadow-[0_2px_10px_rgba(168,85,247,0.4)]">CStream AI</span>
                </h1>
                <p className="text-zinc-400 text-base sm:text-lg mb-12 max-w-xl leading-relaxed font-medium">
                  Votre assistant cinéma intelligent. Découvrez de nouveaux films, séries et animes. Que voulez-vous regarder aujourd'hui ?
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                  {suggestions.map((s, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1, duration: 0.5 }}>
                      <SuggCard icon={s.icon} title={s.title} desc={s.desc} onClick={() => send(s.msg)} />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <div className="max-w-[800px] mx-auto px-4 py-8 space-y-8">
                {cur.msgs.map(msg => (
                  <motion.div key={msg.id} initial={{ opacity: 0, y: 15, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.4 }}
                    className={cn("flex gap-4 group", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>

                    {msg.role === "assistant" && (
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 backdrop-blur-md flex items-center justify-center shrink-0 shadow-lg mt-1 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-indigo-600/20" />
                        <Bot className="w-5 h-5 text-white relative z-10" />
                      </div>
                    )}

                    <div className={cn("max-w-[85%] flex flex-col gap-2.5", msg.role === "user" ? "items-end" : "items-start")}>
                      <div className={cn("px-5 py-3.5 rounded-3xl shadow-lg relative overflow-hidden",
                        msg.role === "user"
                          ? "bg-gradient-to-br from-purple-600 to-indigo-600 text-white font-medium text-[15px] rounded-tr-sm border border-purple-500/30"
                          : "bg-[#111624]/90 backdrop-blur-xl border border-white/[0.08] text-zinc-200 rounded-tl-sm shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)]")}>
                        {msg.role === "user" && <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />}
                        <div className="relative z-10">
                          {msg.role === "user" ? <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p> : <MD text={msg.content} />}
                        </div>
                      </div>

                      {msg.media && msg.media.length > 0 && (
                        <div className="flex gap-4 flex-wrap mt-2 p-2 rounded-2xl bg-white/[0.02] border border-white/5 w-full">
                          {msg.media.map((m, i) => <MediaCard key={i} data={m} />)}
                        </div>
                      )}

                      {msg.role === "assistant" && (
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 mt-1 pl-1">
                          {msg.modelUsed && (
                            <span className="text-[10px] font-bold tracking-wider text-purple-300/70 uppercase bg-purple-500/10 border border-purple-500/10 px-2 py-1.5 rounded-lg mr-2">
                              {msg.modelUsed}
                            </span>
                          )}
                          <span className="text-[11px] font-medium text-zinc-500 bg-white/5 px-2 py-1 rounded-lg">
                            {msg.ts.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>

                          <div className="w-px h-3 bg-white/10 mx-1" />

                          <button onClick={() => copy(msg.content, msg.id)} className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.08] transition-colors border border-transparent hover:border-white/5">
                            {copiedId === msg.id ? <Check className="w-4 h-4 text-green-400 stroke-[3]" /> : <Copy className="w-4 h-4" />}
                          </button>
                          <button onClick={() => react(msg.id, "up")} className={cn("p-1.5 rounded-lg transition-colors border border-transparent hover:border-white/5", msg.reactions?.mine === "up" ? "bg-green-500/10 text-green-400 border-green-500/20" : "text-zinc-500 hover:text-white hover:bg-white/[0.08]")}>
                            <ThumbsUp className="w-4 h-4" />
                          </button>
                          <button onClick={() => react(msg.id, "down")} className={cn("p-1.5 rounded-lg transition-colors border border-transparent hover:border-white/5", msg.reactions?.mine === "down" ? "bg-red-500/10 text-red-400 border-red-500/20" : "text-zinc-500 hover:text-white hover:bg-white/[0.08]")}>
                            <ThumbsDown className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}

                {busy && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 backdrop-blur-md flex items-center justify-center shrink-0 shadow-lg mt-1 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-indigo-600/20 animate-pulse" />
                      <Loader2 className="w-5 h-5 text-purple-400 animate-spin relative z-10" />
                    </div>
                    <div className="bg-[#111624]/90 backdrop-blur-xl border border-white/[0.08] px-5 py-4 rounded-3xl rounded-tl-sm flex items-center gap-2 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)]">
                      {[0, 0.2, 0.4].map(d => (
                        <motion.span key={d} animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                          transition={{ duration: 1, repeat: Infinity, delay: d, ease: "easeInOut" }}
                          className="w-2 h-2 rounded-full bg-purple-400 block shadow-[0_0_8px_rgba(168,85,247,0.6)]" />
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </div>

          {/* ── Input box ── */}
          <div className="w-full bg-[#0b0f19]/90 backdrop-blur-xl border-t border-white/[0.05] z-30 shrink-0 px-4 py-4">
            <div className="max-w-[800px] mx-auto w-full flex flex-col items-center">
              <div className="w-full relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-3xl blur opacity-25 group-focus-within:opacity-50 transition duration-500" />
                <div className="relative flex items-end bg-[#111624]/80 backdrop-blur-2xl border border-white/[0.1] rounded-3xl shadow-2xl transition-all w-full">

                  <button onClick={toggleVoice}
                    className={cn("absolute left-4 bottom-[14px] p-2 rounded-xl transition-all duration-300",
                      listening ? "bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.4)]" : "text-zinc-400 hover:text-white hover:bg-white/[0.08] hover:scale-105")}>
                    {listening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>

                  <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                    placeholder="Demandez-moi n'importe quoi..."
                    rows={1}
                    className="flex-1 bg-transparent text-[15px] font-medium text-white placeholder-zinc-500 py-[18px] pl-[60px] pr-[64px] resize-none outline-none leading-relaxed min-h-[60px] max-h-[160px] scrollbar-thin scrollbar-thumb-white/10"
                    style={{ height: "auto" }}
                    onInput={e => { const t = e.target as HTMLTextAreaElement; t.style.height = "auto"; t.style.height = Math.min(t.scrollHeight, 160) + "px"; }}
                  />

                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => send()}
                    disabled={!input.trim() || busy}
                    className="absolute right-3.5 bottom-3 w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white flex items-center justify-center disabled:opacity-50 disabled:from-white/10 disabled:to-white/5 disabled:text-zinc-500 transition-all duration-300 shadow-lg disabled:shadow-none font-bold">
                    {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowUp className="w-5 h-5 stroke-[3]" />}
                  </motion.button>
                </div>
              </div>

              <p className="text-center text-[11px] font-medium text-zinc-500 mt-3">
                L'IA peut faire des erreurs. Vérifiez les informations importantes.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
