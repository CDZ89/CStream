import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Bot, Trash2, Star, Play, Plus, Menu, Layout, ChevronDown, 
  Image as ImageIcon, Video, Music, Camera, GraduationCap, LifeBuoy, Code, PenTool, FileText, Settings2, Sparkles, Home,
  Copy, Check as CheckIcon, Maximize2, Terminal, Cpu, Zap, Tv
} from "lucide-react";
import { Button } from "../components/ui/button";
import { cn } from "../lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { MediaCard } from "../components/media/MediaCard";
import { toast } from "sonner";
import "./Agent.css";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  elements: Array<{ type: "text" | "media"; content: any }>;
}

interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  lastUpdate: Date;
}

const TOOL_CATEGORIES = [
  {
    name: "Création",
    tools: [
      { id: 'IMAGE GEN', icon: ImageIcon, label: 'Image Gen', color: 'text-blue-400' },
      { id: 'VIDEO GEN', icon: Video, label: 'Video Gen', color: 'text-purple-400' },
      { id: 'AUDIO GEN', icon: Music, label: 'Audio Gen', color: 'text-pink-400' },
      { id: 'CODE GEN', icon: Code, label: 'Code Gen', color: 'text-emerald-400' },
    ]
  },
  {
    name: "Intelligence",
    tools: [
      { id: 'EDUCATION', icon: GraduationCap, label: 'Education', color: 'text-amber-400' },
      { id: 'PROBLEM SOLVER', icon: Settings2, label: 'Problem Solver', color: 'text-red-400' },
      { id: 'ADVICE', icon: LifeBuoy, label: 'Advice', color: 'text-cyan-400' },
    ]
  },
  {
    name: "Outils",
    tools: [
      { id: 'WRITING', icon: PenTool, label: 'Writing', color: 'text-orange-400' },
      { id: 'SUMMARIZE', icon: FileText, label: 'Summarize', color: 'text-indigo-400' },
      { id: 'PHOTO EDITOR', icon: Camera, label: 'Photo Editor', color: 'text-rose-400' },
    ]
  }
];

export default function AgentPage() {
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    try {
      const saved = localStorage.getItem("cai_v4_convos");
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];
      return parsed.map((c: any) => ({
        ...c,
        lastUpdate: new Date(c.lastUpdate || Date.now()),
        messages: Array.isArray(c.messages) ? c.messages.map((m: any) => ({ 
          ...m, 
          timestamp: new Date(m.timestamp || Date.now()),
          elements: Array.isArray(m.elements) ? m.elements : [] 
        })) : []
      }));
    } catch (e) { 
      return []; 
    }
  });
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isDark, setIsDark] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const currentConvo = conversations.find(c => c.id === currentId);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    localStorage.setItem("cai_v4_convos", JSON.stringify(conversations));
  }, [conversations]);

  useEffect(() => {
    scrollToBottom();
  }, [currentConvo?.messages, isTyping]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const processMsg = (text: string) => {
    if (!text) return [];
    const els: any[] = [];
    const regex = /\[MEDIA_DATA\](.*?)\[\/MEDIA_DATA\]/gs;
    let lastIndex = 0;
    let match;
    let currentMediaBatch: any[] = [];

    while ((match = regex.exec(text)) !== null) {
      const before = text.slice(lastIndex, match.index).trim();
      if (before) {
        if (currentMediaBatch.length > 0) {
          els.push({ type: "media", content: [...currentMediaBatch] });
          currentMediaBatch = [];
        }
        els.push({ type: "text", content: before });
      }
      try {
        const data = JSON.parse(match[1].trim());
        if (data && (data.id || data.title)) {
          currentMediaBatch.push(data);
        }
      } catch (e) {
        console.error("JSON PARSE ERROR:", e);
      }
      lastIndex = regex.lastIndex;
    }
    if (currentMediaBatch.length > 0) {
      els.push({ type: "media", content: [...currentMediaBatch] });
    }
    const after = text.slice(lastIndex).trim();
    if (after) {
      els.push({ type: "text", content: after });
    }
    if (els.length === 0 && text.trim()) {
      els.push({ type: "text", content: text.trim() });
    }
    return els;
  };

  const startChat = (txt?: string) => {
    const id = Date.now().toString();
    const newC: Conversation = {
      id,
      title: txt ? (txt.length > 20 ? txt.slice(0, 20) + "..." : txt) : "New Intelligence Flow",
      messages: [],
      lastUpdate: new Date()
    };
    setConversations(prev => [newC, ...prev]);
    setCurrentId(id);
    if (txt) sendMsg(id, txt);
  };

  const sendMsg = async (id: string, txt: string) => {
    if (!txt.trim() || isTyping) return;
    const userMsg: ChatMessage = { 
      role: "user", 
      content: txt, 
      timestamp: new Date(), 
      elements: [{ type: "text", content: txt }] 
    };
    
    setConversations(prev => prev.map(c => {
      if (c.id === id) {
        const existingMessages = Array.isArray(c.messages) ? c.messages : [];
        return { ...c, messages: [...existingMessages, userMsg], lastUpdate: new Date() };
      }
      return c;
    }));
    setInput("");
    setIsTyping(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages: [userMsg].map(m => ({ role: m.role, content: m.content })),
          character: 'cai'
        }),
      });
      const data = await res.json();
      const reply = data.response || data.reply || data.content || "Connection lost. Please try again.";
      
      const aiMsg: ChatMessage = { 
        role: "assistant", 
        content: reply, 
        timestamp: new Date(), 
        elements: processMsg(reply) 
      };
      
      setConversations(prev => prev.map(c => {
        if (c.id === id) {
          const updatedMessages = Array.isArray(c.messages) ? c.messages : [];
          return { ...c, messages: [...updatedMessages, aiMsg], lastUpdate: new Date() };
        }
        return c;
      }));
    } catch (e) {
      console.error("Chat Error:", e);
      toast.error("Critical engine failure. Check logs.");
    } finally {
      setIsTyping(false);
      setTimeout(scrollToBottom, 50);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <div className={cn(
      "flex h-screen font-sans overflow-hidden relative selection:bg-[#6C6CFF]/30 transition-colors duration-700",
      isDark ? "bg-[#050507] text-white" : "bg-[#F4F5F7] text-black"
    )}>
      {/* Neural Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <motion.div 
          animate={{ 
            x: mousePos.x / 40,
            y: mousePos.y / 40,
          }}
          className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-[#6C6CFF]/10 rounded-full blur-[160px]" 
        />
        <motion.div 
          animate={{ 
            x: -mousePos.x / 50,
            y: -mousePos.y / 50,
          }}
          className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-fuchsia-600/10 rounded-full blur-[160px]" 
        />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
        <div className={cn("absolute inset-0 backdrop-blur-[120px] transition-opacity duration-700", isDark ? "opacity-100" : "opacity-40")} />
      </div>

      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside 
            initial={{ x: -300, opacity: 0 }} 
            animate={{ x: 0, opacity: 1 }} 
            exit={{ x: -300, opacity: 0 }} 
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="h-full bg-black/40 backdrop-blur-3xl border-r border-white/5 flex flex-col z-[80] overflow-hidden w-[280px] shrink-0"
          >
            <div className="flex flex-col h-full p-4">
              <div className="flex items-center justify-between mb-8 px-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#6C6CFF] to-fuchsia-600 flex items-center justify-center shadow-lg shadow-[#6C6CFF]/20">
                    <Terminal className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs font-black tracking-widest uppercase bg-clip-text text-transparent bg-gradient-to-r from-white to-white/40">Nexus</span>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="p-2 hover:bg-white/5 rounded-xl transition-colors text-white/40 hover:text-white">
                  <Menu className="w-4 h-4" />
                </button>
              </div>

              <button 
                onClick={() => startChat()} 
                className="w-full py-3.5 mb-6 flex items-center justify-center gap-3 bg-[#6C6CFF] hover:bg-[#5B5BFF] text-white rounded-2xl transition-all font-bold text-xs shadow-xl shadow-[#6C6CFF]/20 group active:scale-[0.98]"
              >
                <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                New Interface
              </button>

              <div className="flex-1 overflow-y-auto space-y-2 px-1 scrollbar-none">
                <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] px-3 mb-2 block">Recent Sessions</span>
                {conversations.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setCurrentId(c.id)}
                    className={cn(
                      "w-full text-left px-4 py-3 rounded-2xl transition-all flex items-center gap-3 group border border-transparent",
                      currentId === c.id ? "bg-white/10 border-white/5 text-white shadow-lg shadow-black/20" : "text-white/40 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <div className={cn("w-1.5 h-1.5 rounded-full", currentId === c.id ? "bg-[#6C6CFF] animate-pulse" : "bg-white/10")} />
                    <span className="truncate text-xs font-medium">{c.title}</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setConversations(prev => prev.filter(p => p.id !== c.id)); if (currentId === c.id) setCurrentId(null); }}
                      className="ml-auto opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-all active:scale-90"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </button>
                ))}
              </div>

              <div className="mt-auto pt-4 border-t border-white/5 space-y-2">
                <button onClick={() => window.location.href = '/test'} className="w-full flex items-center gap-3 px-4 py-3 text-white/40 hover:text-white hover:bg-white/5 rounded-2xl transition-all text-xs group">
                  <Layout className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
                  Zone de Test
                </button>
                <button onClick={() => window.location.href = '/'} className="w-full flex items-center gap-3 px-4 py-3 text-white/40 hover:text-white hover:bg-white/5 rounded-2xl transition-all text-xs group">
                  <Home className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
                  Main Dashboard
                </button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <main className="flex-1 flex flex-col relative z-30 overflow-hidden page-container">
        <header className="h-16 border-b border-white/[0.05] flex items-center justify-between px-8 backdrop-blur-3xl bg-black/20 shrink-0">
          <div className="flex items-center gap-8">
            {!sidebarOpen && (
              <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-white/5 rounded-xl transition-colors text-white/40 hover:text-white">
                <Menu className="w-4 h-4" />
              </button>
            )}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-[#6C6CFF] blur-lg opacity-20 animate-pulse" />
                  <Cpu className="w-5 h-5 text-[#6C6CFF] relative" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60">Core Intelligence</span>
                  <span className="text-[8px] font-bold text-[#6C6CFF] tracking-[0.1em] italic">V5.0 QUANTUM READY</span>
                </div>
              </div>
              <div className="h-4 w-px bg-white/10" />
              <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[8px] font-black text-green-500 uppercase tracking-widest">Network Online</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="p-2.5 hover:bg-white/5 rounded-2xl transition-all text-white/40 hover:text-white border border-transparent hover:border-white/10 active:scale-95">
              <Settings2 className="w-4 h-4" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-hidden flex flex-col relative chat-container">
          {!currentId ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-5xl mx-auto text-center w-full overflow-y-auto">
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ duration: 0.8 }}
                className="mb-12"
              >
                <h1 className="text-7xl font-black tracking-tighter mb-4 text-white">
                  Interface <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#6C6CFF] to-fuchsia-500">Nexus</span>.
                </h1>
                <p className="text-lg font-medium text-white/30 tracking-wide uppercase">Next generation artificial intelligence</p>
              </motion.div>
              
              <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-4 mb-16 max-w-4xl">
                {TOOL_CATEGORIES.flatMap(c => c.tools).slice(0, 8).map((tool, idx) => (
                  <motion.button 
                    key={tool.id} 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => startChat(tool.id)} 
                    className="bg-white/[0.03] border border-white/[0.05] rounded-[2rem] p-6 flex flex-col items-center gap-4 hover:bg-white/[0.08] hover:border-[#6C6CFF]/30 hover:-translate-y-1 transition-all duration-500 group relative overflow-hidden active:scale-95"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <tool.icon className={cn("w-6 h-6 transition-all duration-500 group-hover:scale-110", tool.color)} />
                    <span className="text-[10px] font-black tracking-widest text-white/20 group-hover:text-white uppercase">{tool.label}</span>
                  </motion.button>
                ))}
              </div>

              <div className="w-full max-w-2xl relative group px-4">
                <div className="absolute -inset-1 bg-[#6C6CFF]/20 rounded-[2rem] blur-3xl opacity-0 group-focus-within:opacity-100 transition-all duration-1000" />
                <div className="relative flex gap-4 items-center bg-white/[0.03] backdrop-blur-3xl border border-white/[0.08] rounded-[2rem] px-8 py-5 focus-within:border-[#6C6CFF]/40 transition-all duration-500 shadow-2xl">
                  <input 
                    className="flex-1 bg-transparent border-none focus:outline-none py-1 text-lg font-light text-white placeholder:text-white/10" 
                    placeholder="Initialize Nexus protocol..." 
                    onKeyDown={(e) => e.key === "Enter" && startChat(e.currentTarget.value)} 
                  />
                  <button onClick={(e) => startChat((e.currentTarget.previousSibling as HTMLInputElement).value)} className="p-3 bg-white text-black hover:bg-[#6C6CFF] hover:text-white rounded-2xl transition-all duration-500 active:scale-90 shadow-xl group/send">
                    <Send className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-12 lg:px-24 xl:px-48 space-y-12 scrollbar-none scroll-smooth chat-messages pb-8">
                <AnimatePresence initial={false}>
                  {currentConvo?.messages?.map((msg, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      className={cn(
                        "flex flex-col group",
                        msg.role === "user" ? "ml-auto items-end max-w-[85%]" : "items-start max-w-[95%]"
                      )}
                    >
                      <div className={cn(
                        "w-full px-6 py-5 md:px-10 md:py-8 rounded-[2.5rem] border backdrop-blur-3xl transition-all duration-500 relative", 
                        msg.role === "user" 
                          ? "bg-[#6C6CFF]/10 border-[#6C6CFF]/30 text-white rounded-tr-sm"
                          : "bg-white/[0.03] border-white/10 text-white/90 rounded-tl-sm shadow-2xl"
                      )}>
                        {msg.role === "assistant" && (
                          <button 
                            onClick={() => copyToClipboard(msg.content)}
                            className="absolute top-6 right-6 p-2 rounded-xl bg-white/5 opacity-0 group-hover:opacity-100 transition-all hover:bg-white/10 active:scale-90"
                          >
                            <Copy className="w-3.5 h-3.5 text-white/40" />
                          </button>
                        )}
                        <div className="space-y-6">
                          {(msg.elements || []).map((el: any, idx: number) => (
                            <div key={idx} className="w-full">
                              {el.type === "text" ? (
                                <div className="prose prose-sm md:prose-base max-w-none prose-invert prose-p:text-white/80 prose-p:leading-relaxed prose-p:text-[16px] md:prose-p:text-[18px] prose-pre:bg-black/40 prose-pre:border prose-pre:border-white/10 prose-pre:rounded-2xl prose-code:text-[#6C6CFF] prose-code:before:content-none prose-code:after:content-none">
                                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {el.content}
                                  </ReactMarkdown>
                                </div>
                              ) : el.type === "media" ? (
                                <div className="my-8 w-full animate-in fade-in zoom-in-95 duration-700">
                                  <div className="flex overflow-x-auto pb-4 gap-6 scrollbar-none snap-x snap-mandatory min-h-[420px]">
                                    {(Array.isArray(el.content) ? el.content : [el.content]).map((media: any, midx: number) => (
                                      <div key={`${media.id}-${midx}`} className="min-w-[280px] md:min-w-[320px] snap-center shrink-0 hover:scale-[1.02] transition-transform duration-500">
                                        <MediaCard 
                                          tmdbId={media.id}
                                          type={media.type || (media.title ? 'movie' : 'tv')}
                                          title={media.title || media.name}
                                          poster={media.poster_path}
                                          score={media.rating}
                                          year={media.year}
                                        />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="mt-4 flex items-center gap-4 px-6 opacity-20 text-[9px] font-black tracking-[0.2em] uppercase italic group-hover:opacity-40 transition-opacity">
                         <span className={cn(msg.role === 'assistant' && "text-[#6C6CFF]")}>
                            {msg.role === 'user' ? 'Transmission' : 'Intelligence'}
                         </span>
                         <div className="h-px w-8 bg-current opacity-20" />
                         <span>
                            {msg.timestamp instanceof Date ? msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                         </span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {isTyping && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-4 ml-12">
                    <div className="flex gap-2">
                      <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.2 }} className="w-2 h-2 rounded-full bg-[#6C6CFF]" />
                      <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0.2 }} className="w-2 h-2 rounded-full bg-[#6C6CFF]" />
                      <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0.4 }} className="w-2 h-2 rounded-full bg-[#6C6CFF]" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Nexus Processing</span>
                  </motion.div>
                )}
              </div>

              <footer className="p-8 md:p-12 bg-gradient-to-t from-[#050507] via-[#050507]/90 to-transparent shrink-0 chat-input-container">
                <div className="max-w-3xl mx-auto relative group">
                  <div className="absolute -inset-1 bg-[#6C6CFF]/15 rounded-[2.5rem] blur-3xl opacity-0 group-focus-within:opacity-100 transition-all duration-1000" />
                  <div className="relative flex gap-4 items-center bg-white/[0.03] backdrop-blur-3xl border border-white/[0.08] rounded-[2.5rem] px-8 py-5 focus-within:border-[#6C6CFF]/40 transition-all duration-500 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)]">
                    <input 
                      className="flex-1 bg-transparent border-none focus:outline-none py-1 text-lg font-light text-white placeholder:text-white/5" 
                      placeholder="Message Nexus intelligence..." 
                      value={input} 
                      onChange={(e) => setInput(e.target.value)} 
                      onKeyDown={(e) => e.key === "Enter" && sendMsg(currentId, input)} 
                    />
                    <button onClick={() => sendMsg(currentId, input)} className="p-3.5 bg-white text-black hover:bg-[#6C6CFF] hover:text-white rounded-2xl transition-all duration-500 active:scale-90 group shadow-xl">
                      <Zap className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    </button>
                  </div>
                </div>
              </footer>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
