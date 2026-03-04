import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot, Plus, MessageSquare, Trash2, Search,
  ArrowUp, Mic, MicOff, Copy, ThumbsUp, ThumbsDown,
  Check, Film, Tv, Star, Play, Download, Sparkles,
  ChevronRight, Zap, Heart, Globe, TrendingUp,
  PanelLeft, ChevronDown, Cpu, Loader2
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
  return (
    <div className="text-[14.5px] leading-[1.7] space-y-1.5">
      {text.split("\n").map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1.5" />;
        if (line.startsWith("## ")) return <p key={i} className="font-bold text-base text-white mt-3">{line.slice(3)}</p>;
        if (line.startsWith("# ")) return <p key={i} className="font-black text-lg text-white mt-3">{line.slice(2)}</p>;
        if (/^[-*]\s/.test(line)) {
          const content = line.replace(/^[-*]\s/, "");
          return <div key={i} className="flex gap-2 items-start"><span className="mt-[6px] w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" /><span>{renderInline(content)}</span></div>;
        }
        if (/^\d+\.\s/.test(line)) {
          const [num, ...rest] = line.split(". ");
          return <div key={i} className="flex gap-2 items-start"><span className="text-purple-400 font-bold shrink-0 w-4 text-right">{num}.</span><span>{renderInline(rest.join(". "))}</span></div>;
        }
        if (line.trim() === "---") return <hr key={i} className="border-white/10 my-2" />;
        return <p key={i}>{renderInline(line)}</p>;
      })}
    </div>
  );
}
function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return <>{parts.map((p, i) => p.startsWith("**") ? <strong key={i} className="text-white font-semibold">{p.slice(2, -2)}</strong> : <span key={i} className="text-zinc-300">{p}</span>)}</>;
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
    <motion.div whileHover={{ y: -4, scale: 1.02 }}
      onClick={() => nav(`/${type}/${data.tmdbId || data.id}`)}
      className="w-[130px] flex-shrink-0 cursor-pointer group">
      <div className="aspect-[2/3] rounded-xl overflow-hidden bg-zinc-900 relative mb-2">
        <img src={poster} alt={data.title || data.name} loading="lazy" decoding="async"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        {rating && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/70 backdrop-blur rounded-md px-1.5 py-0.5 text-[10px] font-bold text-white">
            <Star className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />{Number(rating).toFixed(1)}
          </div>
        )}
        <div className="absolute top-2 right-2 bg-purple-600/90 rounded-md p-1">
          {type === "movie" ? <Film className="w-3 h-3 text-white" /> : <Tv className="w-3 h-3 text-white" />}
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="w-full flex items-center justify-center gap-1 bg-white text-black text-[10px] font-bold py-1.5 rounded-lg">
            <Play className="w-3 h-3 fill-black" /> Voir
          </button>
        </div>
      </div>
      <p className="text-xs font-medium text-white/80 line-clamp-2 leading-tight px-0.5">{data.title || data.name}</p>
      {year && <p className="text-[10px] text-zinc-500 mt-0.5 px-0.5">{year}</p>}
    </motion.div>
  );
}

/* ─── Suggestion card ───────────────────────────────────────────────────── */
function SuggCard({ icon: Icon, title, desc, onClick }: { icon: any; title: string; desc: string; onClick: () => void }) {
  return (
    <motion.button whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }} onClick={onClick}
      className="group text-left p-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.07] hover:border-purple-500/30 transition-all overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-indigo-500/0 group-hover:from-purple-500/5 group-hover:to-indigo-500/5 transition-all" />
      <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center mb-3 relative">
        <Icon className="w-4 h-4 text-purple-400" />
      </div>
      <p className="text-[13px] font-semibold text-white/90 mb-1 leading-tight">{title}</p>
      <p className="text-[11px] text-zinc-500 line-clamp-2 leading-relaxed">{desc}</p>
      <ChevronRight className="absolute right-4 bottom-4 w-4 h-4 text-zinc-600 group-hover:text-purple-400 transition-colors" />
    </motion.button>
  );
}

/* ─── Model Selector Dropdown ───────────────────────────────────────────── */
function ModelSelector({ models, selected, onSelect }: { models: AIModel[]; selected: string; onSelect: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const cur = models.find(m => m.id === selected);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const providerColor = (p: string) => ({
    gemini: "text-blue-400", huggingface: "text-yellow-400", groq: "text-green-400", auto: "text-purple-400"
  })[p] || "text-zinc-400";

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(p => !p)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.08] transition-all text-[13px] font-medium">
        <Cpu className={cn("w-3.5 h-3.5", providerColor(cur?.provider || "auto"))} />
        <span className="text-white/80 max-w-[120px] truncate">{cur?.name || "Auto"}</span>
        <ChevronDown className={cn("w-3.5 h-3.5 text-zinc-500 transition-transform", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }} transition={{ duration: 0.12 }}
            className="absolute top-full right-0 mt-2 w-64 bg-[#18181e] border border-white/[0.1] rounded-2xl shadow-2xl z-50 overflow-hidden">
            <div className="p-2 max-h-80 overflow-y-auto">
              {models.map(m => (
                <button key={m.id} onClick={() => { onSelect(m.id); setOpen(false); }}
                  disabled={!m.available && m.provider !== "auto"}
                  className={cn("w-full flex items-start gap-3 px-3 py-2.5 rounded-xl text-left transition-all",
                    selected === m.id ? "bg-purple-500/15" : "hover:bg-white/[0.05]",
                    !m.available && m.provider !== "auto" ? "opacity-40 cursor-not-allowed" : "")}>
                  <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                    m.provider === "gemini" ? "bg-blue-500/10" :
                      m.provider === "huggingface" ? "bg-yellow-500/10" :
                        m.provider === "groq" ? "bg-green-500/10" :
                          "bg-purple-500/10"
                  )}>
                    <Cpu className={cn("w-3.5 h-3.5", providerColor(m.provider))} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn("text-[13px] font-semibold", selected === m.id ? "text-white" : "text-white/80")}>{m.name}</span>
                      {!m.available && m.provider !== "auto" && <span className="text-[9px] bg-red-500/15 text-red-400 px-1.5 py-0.5 rounded-full font-bold">NO KEY</span>}
                      {m.available && selected === m.id && <Check className="w-3 h-3 text-purple-400" />}
                    </div>
                    <p className="text-[11px] text-zinc-500">{m.description}</p>
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

  /* Fetch models from API */
  useEffect(() => {
    fetch("/api/models")
      .then(r => r.json())
      .then(d => { if (d.models) setModels(d.models); })
      .catch(() => { }); // keep defaults if server not ready
  }, []);

  /* Load from localStorage */
  useEffect(() => {
    try {
      const saved = localStorage.getItem("cstream_aiconv_v3");
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
    if (convs.length) localStorage.setItem("cstream_aiconv_v3", JSON.stringify(convs));
  }, [convs]);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    });
  }, []);
  useEffect(() => { scrollToBottom(); }, [curId, busy]);

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
      return filtered;
    });
  };

  const toggleVoice = () => {
    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SR) { alert("Reconnaissance vocale non supportée dans ce navigateur."); return; }
    if (listening) { recRef.current?.stop(); setListening(false); return; }
    const r = new SR();
    r.lang = "fr-FR"; r.continuous = false; r.interimResults = false;
    r.onresult = (e: any) => setInput(p => p + e.results[0][0].transcript + " ");
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
      setConvs(p => [{ id, title: text.slice(0, 40), msgs: [], updatedAt: new Date() }, ...p]);
      setCurId(id); activeId = id;
    }

    const userMsg: Msg = { id: crypto.randomUUID(), role: "user", content: text, ts: new Date() };
    setConvs(p => p.map(c => c.id === activeId
      ? { ...c, msgs: [...c.msgs, userMsg], updatedAt: new Date(), title: c.msgs.length === 0 ? text.slice(0, 40) : c.title }
      : c));
    if (!textOverride) setInput("");
    setBusy(true);

    const history = convs.find(c => c.id === activeId)?.msgs ?? [];

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
      setTimeout(scrollToBottom, 50);
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
    { icon: Zap, title: "Série addictive", desc: "Une série récente et ultra-addictive", msg: "Je cherche une nouvelle série hyper addictive avec beaucoup de suspense" },
  ];

  return (
    <div className="h-[100dvh] bg-[#0d0d10] text-white flex flex-col overflow-hidden">
      <Navbar />

      <div className="flex flex-1 overflow-hidden pt-[64px]">

        {/* ── Sidebar ── */}
        <AnimatePresence>
          {sidebar && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setSidebar(false)}
                className="fixed inset-0 bg-black/60 z-30 md:hidden" />

              <motion.aside initial={{ x: -264 }} animate={{ x: 0 }} exit={{ x: -264 }}
                transition={{ type: "spring", stiffness: 400, damping: 38 }}
                className="fixed md:relative top-0 left-0 h-full z-40 md:z-auto w-[260px] bg-[#111114] border-r border-white/[0.06] flex flex-col shrink-0">
                <div className="p-4 mt-16 md:mt-0 border-b border-white/[0.06]">
                  <button onClick={newConv}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-sm font-medium text-white/80 hover:text-white transition-all">
                    <Plus className="w-4 h-4" /> Nouveau chat
                  </button>
                </div>

                <div className="px-3 py-3 border-b border-white/[0.04]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                    <input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)}
                      className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl py-2 pl-8 pr-3 text-[13px] text-white/70 placeholder-zinc-600 focus:outline-none focus:border-purple-500/40 transition-all" />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
                  {filtered.length === 0 ? (
                    <div className="text-center py-8 text-zinc-600 text-xs">Aucune discussion</div>
                  ) : filtered.map(c => (
                    <button key={c.id} onClick={() => { setCurId(c.id); if (window.innerWidth < 768) setSidebar(false); }}
                      className={cn("group w-full text-left flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all",
                        curId === c.id ? "bg-white/[0.07] text-white" : "text-zinc-400 hover:bg-white/[0.04] hover:text-white")}>
                      <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                      <span className="flex-1 text-[13px] font-medium truncate">{c.title}</span>
                      <button onClick={e => deleteConv(c.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-red-500/20 text-zinc-600 hover:text-red-400 transition-all">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </button>
                  ))}
                </div>

                {/* Persona selector */}
                <div className="p-3 border-t border-white/[0.06]">
                  <p className="text-[10px] uppercase font-bold text-zinc-600 px-2 mb-2 tracking-wider">Mode IA</p>
                  {(Object.entries(personaNames) as [typeof persona, string][]).map(([k, v]) => (
                    <button key={k} onClick={() => setPersona(k)}
                      className={cn("w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] transition-all mb-0.5",
                        persona === k ? "bg-purple-500/15 text-purple-300 font-semibold" : "text-zinc-400 hover:bg-white/[0.04] hover:text-white")}>
                      {persona === k && <Check className="w-3.5 h-3.5" />}
                      {v}
                    </button>
                  ))}
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* ── Main ── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">

          {/* Topbar */}
          <div className="h-12 border-b border-white/[0.05] bg-[#0d0d10]/90 backdrop-blur-xl flex items-center px-4 gap-3 shrink-0">
            <button onClick={() => setSidebar(p => !p)}
              className="p-2 rounded-xl text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-colors">
              <PanelLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 text-[13px] font-semibold text-white/70">
              <Bot className="w-4 h-4 text-purple-400" />
              {personaNames[persona]}
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse ml-1" />
            </div>

            {/* Model selector — RIGHT side */}
            <div className="ml-auto flex items-center gap-2">
              <ModelSelector models={models} selected={selectedModel} onSelect={setSelectedModel} />
              {cur && cur.msgs.length > 0 && (
                <button onClick={() => {
                  const t = cur.msgs.map(m => `[${m.role === "user" ? "Vous" : "AI"}]\n${m.content}`).join("\n\n---\n\n");
                  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([t])); a.download = "chat.txt"; a.click();
                }} className="p-2 rounded-xl text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-colors" title="Exporter">
                  <Download className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Messages or Welcome */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto scroll-smooth scrollbar-thin scrollbar-thumb-white/5 scrollbar-track-transparent">
            {(!cur || cur.msgs.length === 0) ? (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}
                className="flex flex-col items-center justify-center min-h-full px-6 py-10 text-center max-w-2xl mx-auto">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-purple-500/20 blur-2xl rounded-full scale-150" />
                  <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center shadow-xl shadow-purple-500/20">
                    <Bot className="w-8 h-8 text-white" />
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/40">
                      <Sparkles className="w-3 h-3 text-white" />
                    </div>
                  </div>
                </div>

                <h1 className="text-3xl sm:text-4xl font-black mb-2 tracking-tight">
                  Bonjour, je suis <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">CStream AI</span>
                </h1>
                <p className="text-zinc-400 text-sm sm:text-base mb-10 max-w-md leading-relaxed">
                  Votre assistant cinéma. Films, séries, animes — posez vos questions ou choisissez une suggestion.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                  {suggestions.map((s, i) => (
                    <SuggCard key={i} icon={s.icon} title={s.title} desc={s.desc} onClick={() => send(s.msg)} />
                  ))}
                </div>
              </motion.div>
            ) : (
              <div className="max-w-[760px] mx-auto px-4 py-6 space-y-6 pb-36">
                {cur.msgs.map(msg => (
                  <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className={cn("flex gap-3 group", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>

                    {msg.role === "assistant" && (
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-700 to-indigo-800 flex items-center justify-center shrink-0 mt-0.5 shadow-md shadow-purple-500/20">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                    )}

                    <div className={cn("max-w-[80%] flex flex-col gap-2", msg.role === "user" ? "items-end" : "items-start")}>
                      <div className={cn("px-4 py-3 rounded-2xl",
                        msg.role === "user"
                          ? "bg-white text-zinc-900 font-medium text-[14.5px] rounded-tr-sm"
                          : "bg-[#1a1a20] border border-white/[0.07] text-zinc-200 rounded-tl-sm")}>
                        {msg.role === "user" ? <p>{msg.content}</p> : <MD text={msg.content} />}
                      </div>

                      {msg.media && msg.media.length > 0 && (
                        <div className="flex gap-3 flex-wrap mt-1">
                          {msg.media.map((m, i) => <MediaCard key={i} data={m} />)}
                        </div>
                      )}

                      {msg.role === "assistant" && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5">
                          {msg.modelUsed && (
                            <span className="text-[10px] text-zinc-600 bg-white/[0.04] px-2 py-0.5 rounded-full mr-1">
                              {msg.modelUsed}
                            </span>
                          )}
                          <span className="text-[10px] text-zinc-600">{msg.ts.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                          <button onClick={() => copy(msg.content, msg.id)} className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.07] transition-colors">
                            {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                          <button onClick={() => react(msg.id, "up")} className={cn("p-1.5 rounded-lg transition-colors hover:bg-white/[0.07]", msg.reactions?.mine === "up" ? "text-green-400" : "text-zinc-500 hover:text-white")}>
                            <ThumbsUp className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => react(msg.id, "down")} className={cn("p-1.5 rounded-lg transition-colors hover:bg-white/[0.07]", msg.reactions?.mine === "down" ? "text-red-400" : "text-zinc-500 hover:text-white")}>
                            <ThumbsDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}

                {busy && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-700 to-indigo-800 flex items-center justify-center shrink-0 mt-0.5">
                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                    </div>
                    <div className="bg-[#1a1a20] border border-white/[0.07] px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1.5">
                      {[0, 0.2, 0.4].map(d => (
                        <motion.span key={d} animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.2, 1] }}
                          transition={{ duration: 1.2, repeat: Infinity, delay: d }}
                          className="w-1.5 h-1.5 rounded-full bg-purple-400 block" />
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </div>

          {/* ── Input area ── */}
          <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 pt-8 bg-gradient-to-t from-[#0d0d10] via-[#0d0d10]/95 to-transparent">
            <div className="max-w-[760px] mx-auto">
              <div className="relative flex items-end bg-[#1a1a20] border border-white/[0.08] rounded-2xl focus-within:border-purple-500/40 focus-within:ring-1 focus-within:ring-purple-500/20 transition-all shadow-xl shadow-black/30">
                <button onClick={toggleVoice}
                  className={cn("absolute left-3 bottom-3 p-2 rounded-xl transition-colors",
                    listening ? "bg-red-500/20 text-red-400 animate-pulse" : "text-zinc-500 hover:text-white hover:bg-white/[0.06]")}>
                  {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                  placeholder="Posez votre question à l'IA…"
                  rows={1}
                  className="flex-1 bg-transparent text-[14.5px] text-white placeholder-zinc-600 py-3.5 pl-12 pr-14 resize-none outline-none leading-relaxed min-h-[52px] max-h-[160px]"
                  style={{ height: "auto" }}
                  onInput={e => { const t = e.target as HTMLTextAreaElement; t.style.height = "auto"; t.style.height = Math.min(t.scrollHeight, 160) + "px"; }}
                />

                <motion.button whileTap={{ scale: 0.9 }} onClick={() => send()}
                  disabled={!input.trim() || busy}
                  className="absolute right-3 bottom-3 w-8 h-8 rounded-xl bg-white text-black flex items-center justify-center disabled:opacity-30 disabled:bg-white/10 disabled:text-zinc-500 transition-all shadow-sm">
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-4 h-4" strokeWidth={2.5} />}
                </motion.button>
              </div>

              <p className="text-center text-[11px] text-zinc-700 mt-2">
                Entrée pour envoyer · Maj+Entrée pour nouvelle ligne · L'IA peut faire des erreurs.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
