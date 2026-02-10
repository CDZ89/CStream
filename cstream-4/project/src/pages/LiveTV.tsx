import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Tv,
  Play,
  Search,
  Heart,
  RefreshCw,
  Calendar,
  Info,
  Shield,
  Clock,
  Globe,
  ChevronDown,
} from "lucide-react";
import { Navbar } from "../components/Navbar";

import { cn } from "../lib/utils";

const CATEGORIES = ["Sports", "General", "Premium", "Kids", "News"];

const TRANSLATIONS = {
  en: {
    title: "Optimization & Security",
    loading: "Images may take a few seconds to load. For the best performance and to avoid ads or unwanted redirects, use multiple ad blockers and a low-latency VPN. Click on the tools below to enable full protection.",
    tools: "Recommended Tools",
    protection: "Full Protection Recommended",
  },
  fr: {
    title: "Optimisation & Sécurité",
    loading: "Les images peuvent mettre quelques secondes à s’afficher. Pour des performances optimales et éviter les publicités ou redirections indésirables, utilisez plusieurs bloqueurs de pubs ainsi qu’un VPN performant. Cliquez sur les outils ci-dessous pour une protection complète.",
    tools: "Outils Recommandés",
    protection: "Protection Complète Recommandée",
  },
  ar: {
    title: "التحسين والأمان",
    loading: "قد يستغرق تحميل الصور بضع ثوانٍ. للحصول على أفضل أداء وتجنب الإعلانات أو عمليات إعادة التوجيه المزعجة، استخدم عدة أدوات لحظر الإعلانات مع VPN منخفض الكمون. اضغط على الأدوات أدناه لتفعيل الحماية الكاملة.",
    tools: "أدوات موصى بها",
    protection: "يوصى بحماية كاملة",
  },
  ko: {
    title: "최적화 및 보안",
    loading: "이미지가 표시되기까지 몇 초가 걸릴 수 있습니다. 최상의 성능과 광고/원치 않는 리디렉션을 방지하려면 여러 광고 차단기와 지연이 낮은 VPN을 함께 사용하세요. 아래 도구를 클릭하면 전체 보호가 활성화됩니다.",
    tools: "추천 도구",
    protection: "전체 보호 권장",
  },
  es: {
    title: "Optimización y Seguridad",
    loading: "Las imágenes pueden tardar unos segundos en mostrarse. Para obtener el mejor rendimiento y evitar anuncios o redirecciones no deseadas, utilice varios bloqueadores de anuncios junto con una VPN de baja latencia. Haga clic en las herramientas de abajo para la protección completa.",
    tools: "Herramientas Recomendadas",
    protection: "Protección Completa Recomendada",
  },
};

const LiveTV = () => {
  const [channels, setChannels] = useState<any[]>([]);
  const [schedule, setSchedule] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedChannel, setSelectedChannel] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Toutes");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [language, setLanguage] = useState("en");
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [activeApi, setActiveApi] = useState("base");

  useEffect(() => {
    const fetchData = async () => {
      try {
























































































































































































































        
        setLoading(true);
        const [channelsRes, scheduleRes] = await Promise.all([
          fetch(`/api/livetv/channels?t=${Date.now()}`),
          fetch(`/api/livetv/schedule?t=${Date.now()}`),
        ]);

        const channelsData = await channelsRes.json();
        const scheduleData = await scheduleRes.json();

        if (Array.isArray(channelsData) && channelsData.length > 0) {
          setChannels(channelsData);
          setSelectedChannel(channelsData[0]);
        } else {
          setChannels(channelsData);
        }

        if (scheduleData && scheduleData.success) {
          setSchedule(scheduleData.data);
        }
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const isFav = prev.includes(id);
      return isFav ? prev.filter((f) => f !== id) : [...prev, id];
    });
  };

  const filteredChannels = useMemo(() => {
    return channels.filter((channel) => {
      const name = channel.name || "";
      const matchesSearch = name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "Toutes" ||
        (selectedCategory === "Favoris" && favorites.includes(channel.id)) ||
        (channel.category &&
          channel.category.toLowerCase() === selectedCategory.toLowerCase());
      return matchesSearch && matchesCategory;
    });
  }, [channels, searchQuery, selectedCategory, favorites]);

  const currentLang = TRANSLATIONS[language as keyof typeof TRANSLATIONS];

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <Tv className="w-12 h-12 text-purple-500" />
        </motion.div>
        <p className="text-[10px] font-black tracking-[0.4em] uppercase text-white/40">
          Connexion DaddyHD Engine v5.1...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-4">
            {/* Bannière minimaliste avec sélecteur de langue */}
            <div className="bg-neutral-900/80 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-2xl overflow-hidden relative">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
              
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-xl shrink-0">
                      <Shield className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-white">
                      {currentLang.title}
                    </h3>
                  </div>

                  <div className="relative">
                    <button
                      onClick={() => setShowLangDropdown(!showLangDropdown)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-bold text-white transition-all border border-white/10"
                    >
                      <Globe className="w-3.5 h-3.5 text-primary" />
                      {language.toUpperCase()}
                      <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", showLangDropdown && "rotate-180")} />
                    </button>
                    <AnimatePresence>
                      {showLangDropdown && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute top-full mt-2 right-0 bg-neutral-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-[100] min-w-[140px]"
                        >
                          {Object.keys(TRANSLATIONS).map((lang) => (
                            <button
                              key={lang}
                              onClick={() => {
                                setLanguage(lang);
                                setShowLangDropdown(false);
                              }}
                              className={cn(
                                "w-full px-4 py-2.5 text-[10px] font-bold text-left hover:bg-white/5 transition-colors border-b border-white/5 last:border-0",
                                language === lang ? "text-primary bg-primary/5" : "text-white/60"
                              )}
                            >
                              {lang.toUpperCase()} - {
                                lang === "en" ? "English" : 
                                lang === "fr" ? "Français" : 
                                lang === "ar" ? "العربية" : 
                                lang === "ko" ? "한국어" : "Español"
                              }
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <p className="text-[11px] text-white/70 leading-relaxed font-medium">
                  {currentLang.loading}
                </p>

                  <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-white/5">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setActiveApi("base")}
                        className={cn(
                          "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border",
                          activeApi === "base" 
                            ? "bg-primary text-white border-primary shadow-[0_0_15px_rgba(var(--color-primary),0.3)]" 
                            : "bg-white/5 text-white/40 border-white/10 hover:bg-white/10"
                        )}
                      >
                        Lecteur Media Complet
                      </button>
                    </div>
                    <div className="flex items-center gap-3 ml-auto">
                      <a
                        href="https://chromewebstore.google.com/detail/adblock-%E2%80%94-block-ads-acros/gighmmpiobklfepjocnamgkkbiglidom"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2.5 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/10"
                      >
                        <img
                          src="https://lh3.googleusercontent.com/mgNKV-3VMXD556WVUiWSbcukQQN-il4Zlqq03efTjG2B5j9YP7Fxr3idTQ_G0JFD7E6o4TMwvTQTleDn_8UdFLf5VQ=s120"
                          alt="AdBlock"
                          className="w-5 h-5 rounded shadow-sm"
                        />
                        <span className="text-[10px] font-black uppercase tracking-wider text-white">AdBlock</span>
                      </a>
                      <a
                        href="https://chromewebstore.google.com/detail/ublock-origin-lite/ddkjiahejlhfcafbddmgiahcphecmpfh"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2.5 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/10"
                      >
                        <img
                          src="https://lh3.googleusercontent.com/lsanoOfx5N_t-7gh5Qg9FGIirVEjdCqalZXyLZYRd5d7Fydm83FQhu4Oq0JmlRyMtyF_LfwuQQZyKRTHs6emnFirsA=s120"
                          alt="uBlock"
                          className="w-5 h-5 rounded shadow-sm"
                        />
                        <span className="text-[10px] font-black uppercase tracking-wider text-white">uBlock</span>
                      </a>
                    </div>
                  </div>
              </div>
            </div>

            {/* Lecteur vidéo Zero-Border 16:9 */}
            <div className="bg-black backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
              <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/70">Live DaddyHD Engine v5.1</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="px-2.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/20 text-[9px] font-bold uppercase">1080P HD</div>
                  <div className="px-2.5 py-0.5 rounded-full bg-white/5 text-white/40 border border-white/10 text-[9px] font-bold uppercase">Secured</div>
                </div>
              </div>
              
              <div className="relative bg-black aspect-video overflow-hidden">
                {selectedChannel ? (
                  <iframe
                    src={selectedChannel.url}
                    className="absolute inset-[-2px] w-[calc(100%+4px)] h-[calc(100%+4px)]"
                    style={{ border: "none", background: "black" }}
                    allowFullScreen
                    loading="eager"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-black">
                    <Play className="w-12 h-12 text-neutral-700 animate-pulse mb-4" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-600">
                      Select a channel
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Info chaîne sélectionnée */}
            {selectedChannel && (
              <div className="p-4 bg-neutral-800/40 border border-neutral-700/30 rounded-2xl backdrop-blur-sm flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-16 h-10 bg-white rounded-xl p-2 shrink-0 flex items-center justify-center shadow-lg transition-transform hover:scale-105">
                    <img
                      src={selectedChannel.logo}
                      alt=""
                      className="w-full h-full object-contain mix-blend-multiply"
                    />
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-lg font-black uppercase tracking-tight truncate leading-none mb-1 text-white">
                      {selectedChannel.name}
                    </h1>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                        <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-500">
                          ONLINE
                        </span>
                      </div>
                      <div className="border border-neutral-700/50 text-[8px] px-2 py-0.5 h-4 font-bold uppercase tracking-wider text-neutral-500 rounded">
                        HD 1080P
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    className={`h-10 w-10 rounded-xl border transition-all flex items-center justify-center ${favorites.includes(selectedChannel.id) ? "text-red-500 border-red-500/30 bg-red-500/10" : "border-neutral-700/50 hover:bg-neutral-700/30 text-neutral-400"}`}
                    onClick={() => toggleFavorite(selectedChannel.id)}
                  >
                    <Heart
                      className={`w-4 h-4 ${favorites.includes(selectedChannel.id) ? "fill-current" : ""}`}
                    />
                  </button>
                  <button
                    className="h-10 px-5 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-bold text-[10px] uppercase tracking-wider flex items-center gap-2 transition-colors"
                    onClick={() => window.location.reload()}
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    REFRESH
                  </button>
                </div>
              </div>
            )}

            {/* Guide TV */}
            {schedule && (
              <div className="p-4 bg-neutral-800/30 border border-neutral-700/30 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-purple-500" />
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                      TV GUIDE • TODAY
                    </h3>
                  </div>
                  <div className="bg-neutral-700/30 text-neutral-500 text-[8px] font-bold px-2 py-1 rounded-lg uppercase">
                    DaddyAPI
                  </div>
                </div>

                <div
                  className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[180px] overflow-y-auto pr-2"
                  style={{
                    scrollbarWidth: "thin",
                    scrollbarColor: "rgba(115,115,115,0.3) transparent",
                  }}
                >
                  {Object.keys(schedule)
                    .slice(0, 1)
                    .map((day) =>
                      Object.keys(schedule[day])
                        .slice(0, 5)
                        .map((category) =>
                          schedule[day][category]
                            .slice(0, 5)
                            .map((event: any, idx: number) => (
                              <div
                                key={`${day}-${category}-${idx}`}
                                className="group p-3 bg-neutral-800/30 hover:bg-neutral-700/30 rounded-xl border border-neutral-700/30 transition-all flex items-center justify-between gap-4"
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[8px] font-bold uppercase tracking-wider text-purple-400/70">
                                      {category}
                                    </span>
                                    <div className="w-1 h-1 rounded-full bg-neutral-600" />
                                    <div className="flex items-center gap-1">
                                      <Clock className="w-2.5 h-2.5 text-neutral-600" />
                                      <span className="text-[9px] font-bold text-neutral-500 uppercase">
                                        {event.time}
                                      </span>
                                    </div>
                                  </div>
                                  <p className="text-[11px] font-semibold text-neutral-300 truncate group-hover:text-white transition-colors">
                                    {event.event}
                                  </p>
                                </div>
                                <div className="shrink-0 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button className="h-7 w-7 rounded-lg hover:bg-neutral-700/50 flex items-center justify-center">
                                    <Info className="w-3.5 h-3.5 text-neutral-500" />
                                  </button>
                                </div>
                              </div>
                            )),
                        ),
                    )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar chaînes */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-neutral-800/40 border border-neutral-700/30 rounded-2xl p-4 flex flex-col h-[calc(100vh-140px)]">
              <div className="space-y-4 mb-6">
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600 group-focus-within:text-purple-500 transition-colors" />
                  <input
                    type="text"
                    placeholder="Search channels..."
                    className="w-full h-11 pl-11 pr-4 bg-neutral-700/30 border border-neutral-700/50 rounded-xl outline-none focus:border-purple-500/50 text-[11px] font-medium tracking-wide transition-all placeholder:text-neutral-600"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div
                  className="flex gap-2 overflow-x-auto pb-1"
                  style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                  {["Toutes", "Favoris", ...CATEGORIES].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg border transition-all shrink-0 font-bold text-[9px] uppercase tracking-wider ${selectedCategory === cat ? "bg-purple-500 border-purple-500 text-white" : "bg-neutral-700/30 border-neutral-700/50 text-neutral-400 hover:text-neutral-200 hover:border-neutral-600"}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div
                className="flex-1 overflow-y-auto space-y-1.5 pr-2"
                style={{
                  scrollbarWidth: "thin",
                  scrollbarColor: "rgba(115,115,115,0.3) transparent",
                }}
              >
                <AnimatePresence mode="popLayout">
                  {filteredChannels.length > 0 ? (
                    filteredChannels.map((channel, i) => (
                      <motion.button
                        layout
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.01 }}
                        key={channel.id}
                        onClick={() => setSelectedChannel(channel)}
                        className={`w-full group flex items-center gap-3 p-2.5 rounded-xl transition-all border text-left ${selectedChannel?.id === channel.id ? "bg-purple-500/15 border-purple-500/40" : "bg-neutral-800/30 border-neutral-700/30 hover:bg-neutral-700/40 hover:border-neutral-600/50"}`}
                      >
                        <div className="w-12 h-8 bg-black rounded-lg flex items-center justify-center p-1 shrink-0 shadow-sm transition-transform group-hover:scale-105 border border-neutral-700/40 overflow-hidden">
                          <img
                            src={channel.logo}
                            alt=""
                            className="w-full h-full object-contain filter brightness-110"
                            loading="lazy"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src =
                                "https://via.placeholder.com/48x32?text=TV";
                            }}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-[10px] font-bold uppercase tracking-tight truncate ${selectedChannel?.id === channel.id ? "text-purple-400" : "text-neutral-300 group-hover:text-white"}`}
                          >
                            {channel.name}
                          </p>
                          <p className="text-[8px] font-semibold text-neutral-600 uppercase tracking-wider truncate">
                            {channel.category || "LIVE"}
                          </p>
                        </div>
                        {selectedChannel?.id === channel.id && (
                          <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse shadow-[0_0_8px_rgba(168,85,247,0.6)]" />
                        )}
                      </motion.button>
                    ))
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center opacity-20 py-20">
                      <Search className="w-8 h-8 mb-4 text-neutral-700" />
                      <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-600">
                        No results
                      </p>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LiveTV;
