import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader, MessageCircle, Settings, Sparkles, Activity, Search, Layout, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { MediaCard } from '@/components/media/MediaCard';

const CHARACTERS = [
  {
    id: 'cai',
    name: 'Agent CAi',
    description: 'Assistant IA premium avec intégration TMDB',
    avatar: '🤖',
    color: 'from-blue-600 to-indigo-600',
    systemPrompt: 'You are Agent CAi, a premium AI assistant. You can help with development, UI/UX, and searching for movies/series via TMDB. When someone asks about a movie, search for it and provide details.'
  },
  {
    id: 'einstein',
    name: 'Albert Einstein',
    description: 'Physicien brillant avec une curiosité pour l\'univers',
    avatar: '🧪',
    color: 'from-amber-500 to-orange-500',
    systemPrompt: 'You are Albert Einstein, a brilliant theoretical physicist.'
  }
];

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  media?: any;
}

export default function Chat() {
  const [selectedCharacter, setSelectedCharacter] = useState<typeof CHARACTERS[0] | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCharacterSelector, setShowCharacterSelector] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedCharacter || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const assistantMessage: Message = {
      role: 'assistant',
      content: '',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, assistantMessage]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          })),
          character: selectedCharacter.id,
          systemPrompt: selectedCharacter.systemPrompt,
          stream: true
        })
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error('No response body');

      let fullContent = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                fullContent += parsed.content;
                
                // Logic to trigger TMDB search if content looks like a movie title request
                // In a real scenario, this would be more sophisticated (NLP or tool use)
                // For this MVP, we detect "SEARCH:" prefix as a hack or just simple trigger
                
                setMessages(prev => {
                  const newMessages = [...prev];
                  const lastMsg = newMessages[newMessages.length - 1];
                  if (lastMsg && lastMsg.role === 'assistant') {
                    lastMsg.content = fullContent;
                  }
                  return newMessages;
                });
              }

              // Check if we should search for a movie based on user input or assistant logic
              if (parsed.action === 'search_movie' && parsed.movieTitle) {
                const searchMovies = async () => {
                   const movies = await fetch(`/api/tmdb/search?q=${encodeURIComponent(parsed.movieTitle)}&lang=fr-FR`).then(r => r.json());
                   if (movies.results?.length > 0) {
                     const first = movies.results[0];
                     const details = await fetch(`/api/tmdb/details/${first.id}?lang=fr-FR`).then(r => r.json());
                     setMessages(prev => {
                        const newMessages = [...prev];
                        const lastMsg = newMessages[newMessages.length - 1];
                        if (lastMsg && lastMsg.role === 'assistant') {
                           lastMsg.media = {
                              title: details.title,
                              year: (details.release_date || "").slice(0, 4),
                              score: details.vote_average,
                              genres: (details.genres || []).map((g: any) => g.name),
                              overview: details.overview,
                              poster: details.poster_path ? `https://image.tmdb.org/t/p/w342${details.poster_path}` : undefined,
                              tmdbId: details.id,
                              lang: "fr-FR"
                           };
                        }
                        return newMessages;
                     });
                   }
                };
                searchMovies();
              }

              if (parsed.action === 'show_trending' && parsed.movies) {
                  setMessages(prev => {
                      const newMessages = [...prev];
                      const lastMsg = newMessages[newMessages.length - 1];
                      if (lastMsg && lastMsg.role === 'assistant') {
                          // For MVP, we just show the first trending movie as a card
                          const m = parsed.movies[0];
                          lastMsg.media = m;
                          lastMsg.content = `Voici le film tendance du moment : **${m.title}**. ` + lastMsg.content;
                      }
                      return newMessages;
                  });
              }
            } catch (e) {}
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCharacterSelect = (character: typeof CHARACTERS[0]) => {
    setSelectedCharacter(character);
    setMessages([]);
    setShowCharacterSelector(false);
  };

  const handleChangeCharacter = () => {
    setShowCharacterSelector(true);
  };

  return (
    <div className="h-screen flex flex-col bg-black selection:bg-blue-500/30">
      <Dialog open={showCharacterSelector} onOpenChange={setShowCharacterSelector}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-neutral-900 border-neutral-800 p-8">
          <DialogHeader className="mb-8">
            <DialogTitle className="text-3xl text-white font-bold flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-blue-500" />
              Intelligence Center
            </DialogTitle>
            <DialogDescription className="text-neutral-400 text-lg">
              Choisissez l'agent qui orchestrera vos besoins.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {CHARACTERS.map(character => (
              <button
                key={character.id}
                onClick={() => handleCharacterSelect(character)}
                className="group relative p-6 rounded-2xl border border-neutral-800 bg-neutral-950/50 hover:bg-neutral-800/50 hover:border-blue-500/50 transition-all duration-300 text-left overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">{character.avatar}</div>
                <h3 className="text-xl font-bold text-white mb-2">{character.name}</h3>
                <p className="text-sm text-neutral-400 leading-relaxed">{character.description}</p>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {selectedCharacter && (
        <>
            <header className="h-16 border-b border-white/5 bg-black/40 backdrop-blur-2xl px-6 flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-neutral-900 border border-white/10 flex items-center justify-center text-xl shadow-inner">
                  {selectedCharacter.avatar}
                </div>
                <div>
                  <h1 className="text-sm font-bold text-white flex items-center gap-2">
                    {selectedCharacter.name}
                    <span className="flex items-center gap-1.5 text-[9px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full font-bold tracking-wider border border-blue-500/20">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                      SYSTEM ONLINE
                    </span>
                  </h1>
                  <p className="text-[9px] text-white/30 uppercase tracking-[0.2em] font-bold">Neural Engine v3.9</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleChangeCharacter}
                  className="p-2 hover:bg-white/5 rounded-xl transition-all text-white/40 hover:text-white border border-transparent hover:border-white/10"
                >
                  <Settings className="w-5 h-5" />
                </button>
              </div>
            </header>

          <ScrollArea className="flex-1 px-4 py-8">
            <div className="max-w-3xl mx-auto space-y-12">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                  <div className="w-24 h-24 rounded-full bg-neutral-900 border border-white/5 flex items-center justify-center text-5xl mb-8 shadow-[0_0_50px_-12px_rgba(59,130,246,0.5)]">
                    {selectedCharacter.avatar}
                  </div>
                  <h2 className="text-4xl font-black text-white mb-4 tracking-tight">Intelligence Ready.</h2>
                  <p className="text-white/40 text-center max-w-sm leading-relaxed text-sm font-medium">
                    Bonjour, je suis {selectedCharacter.name}. Je suis prêt à orchestrer vos requêtes TMDB, analyses de code et optimisations UI.
                  </p>
                  <div className="flex gap-3 mt-10">
                    <button 
                      onClick={() => {
                        const msg = "Quels sont les films tendance 2024 ?";
                        setInput(msg);
                      }}
                      className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/60 text-xs font-bold hover:bg-white/10 hover:text-white transition-all"
                    >
                      🎬 FILMS TENDANCE
                    </button>
                    <button 
                      onClick={() => setInput("Analyse ce bug dans mon code...")}
                      className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/60 text-xs font-bold hover:bg-white/10 hover:text-white transition-all"
                    >
                      🔍 ANALYSE BUG
                    </button>
                  </div>
                </div>
              )}
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in duration-500`}>
                  <div className={`flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-[85%]`}>
                    <div className={`px-5 py-3 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user' 
                        ? 'bg-blue-600 text-white font-medium rounded-tr-none shadow-lg shadow-blue-500/20' 
                        : 'bg-[#1a1a1a] text-neutral-200 border border-white/10 rounded-tl-none shadow-2xl relative z-10'
                    }`}>
                      {msg.content || (isLoading && idx === messages.length - 1 ? "En cours d'analyse..." : "...")}
                    </div>
                    {msg.media && (
                      <div className="mt-2 w-full min-w-[300px]">
                        <MediaCard {...msg.media} />
                      </div>
                    )}
                    <span className="text-[9px] text-neutral-600 font-mono">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start animate-pulse">
                  <div className="bg-neutral-900 border border-neutral-800 rounded-2xl rounded-tl-none px-4 py-2 flex items-center gap-3">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Processing</span>
                  </div>
                </div>
              )}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          <footer className="p-6 bg-black/80 backdrop-blur-xl border-t border-neutral-900">
            <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto relative group">
              <div className="absolute inset-0 bg-blue-500/5 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
              <div className="relative flex items-center gap-2 bg-neutral-950 border border-neutral-900 rounded-2xl p-2 pr-3 focus-within:border-neutral-700 transition-all">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={`Command ${selectedCharacter.name.split(' ')[0]}...`}
                  className="flex-1 bg-transparent border-none text-white placeholder-neutral-600 focus-visible:ring-0 text-sm h-12"
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="w-10 h-10 rounded-xl bg-white hover:bg-neutral-200 text-black p-0 shrink-0 shadow-xl transition-all active:scale-95"
                >
                  {isLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </form>
          </footer>
        </>
      )}
    </div>
  );
}
