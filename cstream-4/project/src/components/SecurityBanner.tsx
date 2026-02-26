import { useState } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Shield as ShieldIcon, Globe as GlobeIcon, ChevronDown as ChevronDownIcon } from "lucide-react";

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

export const SecurityBanner = () => {
  const [language, setLanguage] = useState("fr");
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const currentLang = TRANSLATIONS[language as keyof typeof TRANSLATIONS];

  return (
    <div className="bg-zinc-900/60 backdrop-blur-2xl border border-white/5 rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-2xl overflow-hidden relative mb-4 sm:mb-6">
      <div className="absolute top-0 left-0 w-1 h-full bg-purple-600" />
      
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-purple-600/10 rounded-lg sm:rounded-xl shrink-0">
              <ShieldIcon className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
            </div>
            <h3 className="text-[10px] sm:text-sm font-black uppercase tracking-wider text-white/90">
              {currentLang.title}
            </h3>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowLangDropdown(!showLangDropdown)}
              className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-white/5 hover:bg-white/10 rounded-lg sm:rounded-xl text-[8px] sm:text-[10px] font-bold text-white/80 transition-all border border-white/5"
            >
              <GlobeIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-purple-500" />
              {language.toUpperCase()}
              <ChevronDownIcon className={cn("w-3 h-3 sm:w-3.5 sm:h-3.5 transition-transform", showLangDropdown && "rotate-180")} />
            </button>
            <AnimatePresence>
              {showLangDropdown && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full mt-2 right-0 bg-zinc-950 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-[100] min-w-[120px] sm:min-w-[140px]"
                >
                  {Object.keys(TRANSLATIONS).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => {
                        setLanguage(lang);
                        setShowLangDropdown(false);
                      }}
                      className={cn(
                        "w-full px-3 sm:px-4 py-2 sm:py-2.5 text-[8px] sm:text-[10px] font-bold text-left hover:bg-white/5 transition-colors border-b border-white/5 last:border-0",
                        language === lang ? "text-purple-500 bg-purple-500/5" : "text-white/60"
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

        <p className="text-[9px] sm:text-[11px] text-white/60 leading-relaxed font-medium">
          {currentLang.loading}
        </p>

          <div className="flex flex-wrap items-center gap-2 sm:gap-4 pt-3 sm:pt-4 border-t border-white/5">
            <div className="hidden sm:flex items-center gap-3">
              <div className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[8px] sm:text-[10px] font-black uppercase tracking-wider bg-purple-600 text-white border border-purple-600 shadow-[0_0_15px_rgba(147,51,234,0.3)]">
                Lecteur Media Complet
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 ml-auto">
              <a
                href="https://chromewebstore.google.com/detail/adblock-%E2%80%94-block-ads-acros/gighmmpiobklfepjocnamgkkbiglidom"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 sm:gap-2.5 px-2.5 sm:px-4 py-1.5 sm:py-2 bg-white/5 hover:bg-white/10 rounded-lg sm:rounded-xl transition-all border border-white/5 group/btn"
              >
                <img
                  src="https://lh3.googleusercontent.com/mgNKV-3VMXD556WVUiWSbcukQQN-il4Zlqq03efTjG2B5j9YP7Fxr3idTQ_G0JFD7E6o4TMwvTQTleDn_8UdFLf5VQ=s120"
                  alt="AdBlock"
                  className="w-4 h-4 sm:w-5 sm:h-5 rounded shadow-sm group-hover/btn:scale-110 transition-transform"
                />
                <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-wider text-white/80">AdBlock</span>
              </a>
              <a
                href="https://chromewebstore.google.com/detail/ublock-origin-lite/ddkjiahejlhfcafbddmgiahcphecmpfh"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 sm:gap-2.5 px-2.5 sm:px-4 py-1.5 sm:py-2 bg-white/5 hover:bg-white/10 rounded-lg sm:rounded-xl transition-all border border-white/5 group/btn"
              >
                <img
                  src="https://lh3.googleusercontent.com/lsanoOfx5N_t-7gh5Qg9FGIirVEjdCqalZXyLZYRd5d7Fydm83FQhu4Oq0JmlRyMtyF_LfwuQQZyKRTHs6emnFirsA=s120"
                  alt="uBlock"
                  className="w-4 h-4 sm:w-5 sm:h-5 rounded shadow-sm group-hover/btn:scale-110 transition-transform"
                />
                <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-wider text-white/80">uBlock</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  };
