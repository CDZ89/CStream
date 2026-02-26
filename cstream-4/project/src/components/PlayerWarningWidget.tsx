import { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Shield, ExternalLink, Globe, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';

const DISMISSED_KEY = 'cstream_player_warning_dismissed';
const DISMISSAL_DURATION = 24 * 60 * 60 * 1000;

const translations = {
  fr: {
    title: 'Conseil pour une meilleure experience',
    vfMessage: 'Si vous preferez le contenu en VF (Version Francaise) au lieu de VOSTFR (sous-titres), utilisez le lecteur Frembed qui propose plus de contenus en francais.',
    adblockTitle: 'Bloqueur de publicites recommande',
    adblockMessage: 'Pour eviter les publicites intrusives sur les lecteurs externes, nous vous recommandons d\'installer un bloqueur de publicites.',
    adblockLink: 'Installer AdBlock Plus',
    gotIt: 'Compris',
    dontShowAgain: 'Ne plus afficher',
  },
  en: {
    title: 'Tip for a better experience',
    vfMessage: 'If you prefer French dubbed content (VF) instead of subtitled (VOSTFR), use the Frembed player which offers more French content.',
    adblockTitle: 'Ad blocker recommended',
    adblockMessage: 'To avoid intrusive ads on external players, we recommend installing an ad blocker.',
    adblockLink: 'Install AdBlock Plus',
    gotIt: 'Got it',
    dontShowAgain: 'Don\'t show again',
  },
  es: {
    title: 'Consejo para una mejor experiencia',
    vfMessage: 'Si prefieres contenido doblado al frances (VF) en lugar de subtitulado (VOSTFR), usa el reproductor Frembed que ofrece mas contenido frances.',
    adblockTitle: 'Bloqueador de anuncios recomendado',
    adblockMessage: 'Para evitar anuncios intrusivos en reproductores externos, recomendamos instalar un bloqueador de anuncios.',
    adblockLink: 'Instalar AdBlock Plus',
    gotIt: 'Entendido',
    dontShowAgain: 'No mostrar de nuevo',
  },
  de: {
    title: 'Tipp fur ein besseres Erlebnis',
    vfMessage: 'Wenn Sie franzosisch synchronisierte Inhalte (VF) anstelle von Untertiteln (VOSTFR) bevorzugen, verwenden Sie den Frembed-Player.',
    adblockTitle: 'Werbeblocker empfohlen',
    adblockMessage: 'Um aufdringliche Werbung auf externen Playern zu vermeiden, empfehlen wir die Installation eines Werbeblockers.',
    adblockLink: 'AdBlock Plus installieren',
    gotIt: 'Verstanden',
    dontShowAgain: 'Nicht mehr anzeigen',
  },
};

interface PlayerWarningWidgetProps {
  showVFTip?: boolean;
}

const checkIsFrenchUser = (lang: string): boolean => {
  try {
    const browserLang = typeof navigator !== 'undefined' ? navigator.language || (navigator as any).userLanguage : '';
    const isFr = browserLang?.toLowerCase().startsWith('fr') || lang === 'fr';

    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const isFrenchTimezone = timezone?.includes('Paris') || timezone?.includes('Europe/Paris');

    return isFr || isFrenchTimezone;
  } catch {
    return lang === 'fr';
  }
};

const checkDismissal = (): boolean => {
  try {
    const dismissed = localStorage.getItem(DISMISSED_KEY);
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      if (Date.now() - dismissedTime < DISMISSAL_DURATION) {
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
};

export const PlayerWarningWidget = memo(({ showVFTip = true }: PlayerWarningWidgetProps) => {
  const { language } = useI18n();

  const isFrenchUser = checkIsFrenchUser(language);
  const isDismissed = checkDismissal();

  const [isVisible, setIsVisible] = useState(!isDismissed && isFrenchUser);

  const t = translations[language as keyof typeof translations] || translations.en;

  useEffect(() => {
    if (!isDismissed && isFrenchUser) {
      const timer = setTimeout(() => setIsVisible(true), 300);
      return () => clearTimeout(timer);
    }
  }, [language, isFrenchUser, isDismissed]);

  const handleDismiss = (permanent = false) => {
    setIsVisible(false);
    if (permanent) {
      try {
        localStorage.setItem(DISMISSED_KEY, Date.now().toString());
      } catch { }
    }
  };

  if (!isVisible || !isFrenchUser) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="mb-4"
      >
        <div className="relative overflow-hidden rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 backdrop-blur-sm">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div
              className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-20"
              style={{ background: 'radial-gradient(circle, rgb(245, 158, 11) 0%, transparent 70%)' }}
            />
          </div>

          <div className="relative p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center border border-amber-500/30">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>

              <div className="flex-1 min-w-0 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-semibold text-amber-500 text-sm flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    {t.title}
                  </h4>
                  <button
                    onClick={() => handleDismiss(false)}
                    className="p-1 rounded-lg hover:bg-amber-500/20 text-amber-500/70 hover:text-amber-500 transition-colors flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {showVFTip && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <Volume2 className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-blue-300/90 leading-relaxed">
                      {t.vfMessage}
                    </p>
                  </div>
                )}

                <div className="flex items-start gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <Shield className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-green-300/90 leading-relaxed mb-2">
                      {t.adblockMessage}
                    </p>
                    <button
                      onClick={() => window.open('https://adblockplus.org/', '_blank', 'noopener,noreferrer')}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-green-400 hover:text-green-300 transition-colors bg-transparent border-none p-0 cursor-pointer text-left"
                    >
                      <ExternalLink className="w-3 h-3" />
                      {t.adblockLink}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Button
                    onClick={() => handleDismiss(false)}
                    size="sm"
                    className="gap-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30"
                  >
                    {t.gotIt}
                  </Button>
                  <Button
                    onClick={() => handleDismiss(true)}
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    {t.dontShowAgain}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
});

export default PlayerWarningWidget;
