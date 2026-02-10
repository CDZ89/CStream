import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tv, Play, Zap, Layout, X, Star, Search, Activity, Globe, Trophy, Users, Loader2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { ScrollArea } from "../components/ui/scroll-area";
import { cn } from "../lib/utils";

const Badge = ({ children, className, variant = "default" }: any) => {
  const variants: any = {
    default: "bg-primary text-white",
    outline: "border border-white/10 text-white/60",
    secondary: "bg-white/10 text-white",
  };
  return (
    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold", variants[variant], className)}>
      {children}
    </span>
  );
};

interface Channel {
  name: string;
  code: string;
  url: string;
  image: string;
  status: string;
  viewers: number;
}

interface SportEvent {
  gameID: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamIMG: string;
  awayTeamIMG: string;
  time: string;
  tournament: string;
  country: string;
  status: string;
  channels: Array<{
    channel_name: string;
    url: string;
    image: string;
  }>;
}

export default function TestPage() {
  const [cdnUrl, setCdnUrl] = useState("");
  const [showPlayer, setShowPlayer] = useState(false);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [sports, setSports] = useState<Record<string, SportEvent[]>>({});
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<'channels' | 'sports'>('channels');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [chanRes, sportRes] = await Promise.all([
        fetch('https://api.cdn-live.tv/api/v1/channels/?user=cdnlivetv&plan=free'),
        fetch('https://api.cdn-live.tv/api/v1/events/sports/?user=cdnlivetv&plan=free')
      ]);
      
      const chanData = await chanRes.json();
      const sportData = await sportRes.json();
      
      console.log("Channels Data:", chanData);
      console.log("Sports Data:", sportData);

      let allChannels: Channel[] = [];
      if (chanData.channels) {
        allChannels = chanData.channels;
      } else if (chanData['cdn-live-tv'] && chanData['cdn-live-tv'].channels) {
        allChannels = chanData['cdn-live-tv'].channels;
      } else if (Array.isArray(chanData)) {
        allChannels = chanData;
      } else if (chanData.data && Array.isArray(chanData.data)) {
        allChannels = chanData.data;
      }

      // Ajout manuel de chaînes si la liste est vide ou pour compléter
      const manualChannels: Channel[] = [
        {
          name: "ACC Network",
          code: "us",
          url: "https://cdn-live.tv/api/v1/channels/player/?name=acc-network&code=us&user=cdnlivetv&plan=free",
          image: "https://api.cdn-live.tv/api/v1/channels/images/united-states/acc-network.png",
          status: "online",
          viewers: 1250
        },
        {
          name: "France 3",
          code: "fr",
          url: "https://cdn-live.tv/api/v1/channels/player/?name=france-3&code=fr&user=cdnlivetv&plan=free",
          image: "https://api.cdn-live.tv/api/v1/channels/images/france/france-3.png",
          status: "online",
          viewers: 3420
        },
        {
          name: "TF1",
          code: "fr",
          url: "https://cdn-live.tv/api/v1/channels/player/?name=tf1&code=fr&user=cdnlivetv&plan=free",
          image: "https://api.cdn-live.tv/api/v1/channels/images/france/tf1.png",
          status: "online",
          viewers: 8500
        }
      ];

      // Fusionner les chaînes manuelles avec celles de l'API en évitant les doublons
      const mergedChannels = [...allChannels];
      manualChannels.forEach(mc => {
        if (!mergedChannels.find(c => c.name === mc.name)) {
          mergedChannels.unshift(mc);
        }
      });

      setChannels(mergedChannels);

      if (sportData['cdn-live-tv']) {
        const { total_events, total_events_soccer, total_events_NFL, total_events_nba, total_events_nhl, ...events } = sportData['cdn-live-tv'];
        setSports(events);
      } else if (sportData.events) {
        setSports(sportData.events);
      }
    } catch (error) {
      console.error("API Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const playChannel = (url: string, name?: string) => {
    if (!url) return;

    let playerUrl = url;
    
    if (playerUrl.includes("cdn-live.tv")) {
      try {
        const urlObj = new URL(playerUrl);
        
        urlObj.searchParams.set("user", "cdnlivetv");
        urlObj.searchParams.set("plan", "free");
        
        if (name) {
          const cleanName = name.toLowerCase().trim()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');
          urlObj.searchParams.set("name", cleanName);
        }

        if (urlObj.protocol === "http:") urlObj.protocol = "https:";
        playerUrl = urlObj.toString();
      } catch (e) {
        playerUrl = playerUrl.replace(/plan=[^&]*/, "plan=free");
        if (!playerUrl.includes("user=")) {
          playerUrl += (playerUrl.includes("?") ? "&" : "?") + "user=cdnlivetv";
        }
      }
    }

    setCdnUrl(playerUrl);
    setShowPlayer(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredChannels = channels.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#050507] text-white p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30 shadow-[0_0_30px_rgba(229,9,20,0.3)] relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <Zap className="w-7 h-7 text-primary relative z-10 animate-pulse" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase italic bg-gradient-to-r from-white to-white/40 bg-clip-text text-transparent">
                Nexus <span className="text-primary">Live</span> Lab
              </h1>
              <p className="text-white/40 text-[10px] font-bold tracking-[0.3em] uppercase flex items-center gap-2">
                <Activity className="w-3 h-3 text-primary" /> Integrated CDN Engine v6.2
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="outline"
              className="rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold h-12 px-6"
              onClick={fetchData}
              disabled={loading}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4 mr-2" />}
              REFRESH HUB
            </Button>
            <Button 
              className="rounded-2xl bg-primary shadow-[0_0_20px_rgba(229,9,20,0.4)] hover:shadow-[0_0_30px_rgba(229,9,20,0.6)] text-white font-black h-12 px-8 uppercase italic tracking-tighter transition-all hover:scale-105"
              onClick={() => window.location.href='/test-premium'}
            >
              <Star className="w-4 h-4 mr-2 fill-current" />
              Upgrade Nexus
            </Button>
          </div>
        </header>

        {/* Hero Player Section */}
        <AnimatePresence>
          {showPlayer && (
            <motion.div 
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative group"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/50 to-purple-600/50 rounded-[3rem] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" />
              <div className="relative aspect-video bg-black rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl">
                <div className="absolute top-6 left-6 right-6 flex justify-between items-start z-20 pointer-events-none">
                  <div className="flex items-center gap-3 bg-black/60 backdrop-blur-xl px-5 py-2.5 rounded-2xl border border-white/10 pointer-events-auto">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                    <span className="text-xs font-black uppercase tracking-widest text-white/90">Signal Ultra-HD</span>
                  </div>
                  <Button 
                    size="icon" 
                    onClick={() => setShowPlayer(false)}
                    className="rounded-2xl bg-black/60 backdrop-blur-xl hover:bg-red-500 transition-all border border-white/10 pointer-events-auto h-12 w-12"
                  >
                    <X className="w-6 h-6" />
                  </Button>
                </div>
                <iframe 
                  key={cdnUrl}
                  src={cdnUrl}
                  width="100%" 
                  height="100%" 
                  scrolling="no" 
                  frameBorder="0" 
                  allow="autoplay; encrypted-media" 
                  allowFullScreen
                  className="w-full h-full border-0"
                  title="CDN Live Player"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content Navigation */}
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-80 space-y-4">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-2 flex gap-1">
              <button 
                onClick={() => setActiveTab('channels')}
                className={cn(
                  "flex-1 h-12 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all",
                  activeTab === 'channels' ? "bg-primary text-white shadow-lg shadow-primary/20" : "hover:bg-white/5 text-white/40"
                )}
              >
                Channels
              </button>
              <button 
                onClick={() => setActiveTab('sports')}
                className={cn(
                  "flex-1 h-12 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all",
                  activeTab === 'sports' ? "bg-primary text-white shadow-lg shadow-primary/20" : "hover:bg-white/5 text-white/40"
                )}
              >
                Sports Live
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
              <Input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Find stream..."
                className="bg-white/5 border-white/10 h-14 rounded-2xl pl-12 focus:border-primary/50 transition-all font-medium"
              />
            </div>

            <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-6 space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-primary">System Info</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-white/40">Total Channels</span>
                  <span className="font-mono text-white/80">{channels.length}</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-white/40">Live Events</span>
                  <span className="font-mono text-white/80">{Object.values(sports).flat().length}</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-white/40">API Status</span>
                  <Badge variant="outline" className="text-[9px] border-emerald-500/30 text-emerald-400 bg-emerald-500/5">Operational</Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 min-h-[600px] bg-white/[0.03] border border-white/10 rounded-[3rem] overflow-hidden flex flex-col">
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-6">
                <div className="relative">
                  <div className="w-24 h-24 border-4 border-primary/10 rounded-full" />
                  <div className="absolute inset-0 w-24 h-24 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  <Zap className="absolute inset-0 m-auto w-8 h-8 text-primary animate-pulse" />
                </div>
                <div className="text-center space-y-2">
                  <h4 className="text-sm font-black uppercase tracking-[0.3em] text-primary">Nexus Syncing</h4>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest">Accessing CDN Global Clusters...</p>
                </div>
              </div>
            ) : (
              <ScrollArea className="flex-1 p-6 md:p-8">
                {activeTab === 'channels' ? (
                  <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredChannels.map((channel, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.02 }}
                        onClick={() => playChannel(channel.url, channel.name)}
                        className="group relative bg-white/5 border border-white/5 rounded-2xl p-4 cursor-pointer hover:bg-primary/5 hover:border-primary/20 transition-all hover:-translate-y-1"
                      >
                        <div className="aspect-video rounded-xl bg-black/40 overflow-hidden mb-3 border border-white/10 relative group-hover:border-primary/50 transition-colors">
                          <img 
                            src={channel.image} 
                            alt={channel.name}
                            className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform duration-500"
                            loading="lazy"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              const currentSrc = target.src;
                              
                              // Si l'image contient images6318, on tente avec /images/
                              if (currentSrc.includes("images6318")) {
                                const newSrc = currentSrc.replace("images6318", "images");
                                if (currentSrc !== newSrc) {
                                  target.src = newSrc;
                                  return;
                                }
                              }
                              
                              // Fallback sur placeholder
                              target.src = `https://placehold.co/400x225/111/333?text=${encodeURIComponent(channel.name)}`;
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                            <div className="w-12 h-12 rounded-full bg-white text-primary flex items-center justify-center shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-transform">
                              <Play className="w-6 h-6 fill-current ml-1" />
                            </div>
                          </div>
                          {channel.viewers > 0 && (
                            <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-red-500/80 backdrop-blur-md text-[8px] font-black uppercase flex items-center gap-1">
                              <div className="w-1 h-1 rounded-full bg-white animate-pulse" />
                              {channel.viewers}
                            </div>
                          )}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-black truncate max-w-[100px]">{channel.name}</h4>
                            <Badge variant="outline" className="text-[8px] border-white/10 opacity-60 uppercase">{channel.code}</Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
                            <span className="text-[9px] text-white/40 font-bold uppercase tracking-widest">{channel.status}</span>
                            <span className="text-[9px] text-white/20 ml-auto flex items-center gap-1">
                              <Users className="w-2 h-2" /> {channel.viewers}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-12">
                    {Object.entries(sports).map(([category, events]) => events.length > 0 && (
                      <div key={category} className="space-y-6">
                        <div className="flex items-center gap-4">
                          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
                          <h3 className="text-xs font-black uppercase tracking-[0.4em] text-primary flex items-center gap-2">
                            <Trophy className="w-4 h-4" /> {category}
                          </h3>
                          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {events.map((event, i) => (
                            <motion.div
                              key={event.gameID}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="bg-white/5 border border-white/5 rounded-3xl p-6 hover:bg-primary/5 hover:border-primary/20 transition-all"
                            >
                              <div className="flex items-center justify-between mb-6">
                                <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] px-3">{event.tournament}</Badge>
                                <span className="text-[10px] font-mono text-white/40">{event.time}</span>
                              </div>
                              
                              <div className="flex items-center justify-around mb-8">
                                <div className="flex flex-col items-center gap-3 w-1/3">
                                  <div className="w-16 h-16 rounded-full bg-black/40 p-3 border border-white/10 flex items-center justify-center overflow-hidden">
                                    <img 
                                      src={event.homeTeamIMG} 
                                      alt="" 
                                      className="w-full h-full object-contain"
                                      onError={(e) => (e.target as HTMLImageElement).src = "https://placehold.co/64x64/111/333?text=H"}
                                    />
                                  </div>
                                  <span className="text-[10px] font-bold text-center line-clamp-2 uppercase tracking-tighter">{event.homeTeam}</span>
                                </div>
                                
                                <div className="flex flex-col items-center gap-1">
                                  <span className="text-2xl font-black italic text-white/10">VS</span>
                                  <Badge variant="outline" className={cn(
                                    "text-[8px] border-white/10",
                                    event.status && event.status.toLowerCase() === 'live' ? "bg-red-500/20 text-red-500 animate-pulse" : ""
                                  )}>
                                    {event.status || 'Scheduled'}
                                  </Badge>
                                </div>

                                <div className="flex flex-col items-center gap-3 w-1/3">
                                  <div className="w-16 h-16 rounded-full bg-black/40 p-3 border border-white/10 flex items-center justify-center overflow-hidden">
                                    <img 
                                      src={event.awayTeamIMG} 
                                      alt="" 
                                      className="w-full h-full object-contain"
                                      onError={(e) => (e.target as HTMLImageElement).src = "https://placehold.co/64x64/111/333?text=A"}
                                    />
                                  </div>
                                  <span className="text-[10px] font-bold text-center line-clamp-2 uppercase tracking-tighter">{event.awayTeam}</span>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <span className="text-[8px] font-black uppercase tracking-widest text-white/20 px-1">Available Broadcasters</span>
                                <div className="grid grid-cols-1 gap-2">
                                  {event.channels.map((chan, j) => (
                                    <button
                                      key={j}
                                      onClick={() => playChannel(chan.url, chan.channel_name)}
                                      className="flex items-center gap-3 p-3 rounded-2xl bg-black/40 border border-white/5 hover:border-primary/40 hover:bg-primary/10 transition-all text-left group"
                                    >
                                      <div className="w-8 h-8 rounded-lg bg-white/5 p-1 border border-white/10 overflow-hidden">
                                        <img 
                                          src={chan.image} 
                                          alt="" 
                                          className="w-full h-full object-contain"
                                          onError={(e) => (e.target as HTMLImageElement).src = "https://placehold.co/32x32/111/333?text=TV"}
                                        />
                                      </div>
                                      <span className="text-[10px] font-bold flex-1">{chan.channel_name}</span>
                                      <Play className="w-3 h-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

