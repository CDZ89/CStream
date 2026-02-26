import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Shield, Cookie, Settings, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/hooks/useAuth';

interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

const COOKIE_CONSENT_KEY = 'cstream_cookie_consent';
const COOKIE_PREFERENCES_KEY = 'cstream_cookie_preferences';

const translations = {
  fr: {
    title: 'Nous respectons votre vie privée',
    description: 'CStream utilise des cookies pour améliorer votre expérience de navigation. Choisissez les cookies que vous souhaitez accepter.',
    acceptAll: 'Tout accepter',
    rejectAll: 'Tout refuser',
    customize: 'Personnaliser',
    save: 'Enregistrer mes préférences',
    essential: {
      title: 'Cookies essentiels',
      description: 'Nécessaires au fonctionnement du site. Ils ne peuvent pas être désactivés.'
    },
    analytics: {
      title: 'Cookies analytiques',
      description: 'Nous aident à comprendre comment vous utilisez le site pour l\'améliorer.'
    },
    marketing: {
      title: 'Cookies marketing',
      description: 'Utilisés pour vous montrer des contenus personnalisés.'
    },
    preferences: {
      title: 'Cookies de préférences',
      description: 'Mémorisent vos choix et paramètres personnels.'
    },
    moreInfo: 'Plus d\'informations',
    lessInfo: 'Moins d\'informations',
    privacyLink: 'Politique de confidentialité'
  },
  en: {
    title: 'We respect your privacy',
    description: 'CStream uses cookies to enhance your browsing experience. Choose which cookies you want to accept.',
    acceptAll: 'Accept all',
    rejectAll: 'Reject all',
    customize: 'Customize',
    save: 'Save my preferences',
    essential: {
      title: 'Essential cookies',
      description: 'Necessary for the site to function. They cannot be disabled.'
    },
    analytics: {
      title: 'Analytics cookies',
      description: 'Help us understand how you use the site to improve it.'
    },
    marketing: {
      title: 'Marketing cookies',
      description: 'Used to show you personalized content.'
    },
    preferences: {
      title: 'Preference cookies',
      description: 'Remember your choices and personal settings.'
    },
    moreInfo: 'More information',
    lessInfo: 'Less information',
    privacyLink: 'Privacy policy'
  },
  es: {
    title: 'Respetamos su privacidad',
    description: 'CStream utiliza cookies para mejorar su experiencia de navegación. Elija las cookies que desea aceptar.',
    acceptAll: 'Aceptar todo',
    rejectAll: 'Rechazar todo',
    customize: 'Personalizar',
    save: 'Guardar mis preferencias',
    essential: {
      title: 'Cookies esenciales',
      description: 'Necesarias para el funcionamiento del sitio. No se pueden desactivar.'
    },
    analytics: {
      title: 'Cookies analíticas',
      description: 'Nos ayudan a entender cómo usa el sitio para mejorarlo.'
    },
    marketing: {
      title: 'Cookies de marketing',
      description: 'Utilizadas para mostrarle contenido personalizado.'
    },
    preferences: {
      title: 'Cookies de preferencias',
      description: 'Recuerdan sus elecciones y configuraciones personales.'
    },
    moreInfo: 'Más información',
    lessInfo: 'Menos información',
    privacyLink: 'Política de privacidad'
  },
  de: {
    title: 'Wir respektieren Ihre Privatsphäre',
    description: 'CStream verwendet Cookies, um Ihr Browsing-Erlebnis zu verbessern. Wählen Sie, welche Cookies Sie akzeptieren möchten.',
    acceptAll: 'Alle akzeptieren',
    rejectAll: 'Alle ablehnen',
    customize: 'Anpassen',
    save: 'Meine Einstellungen speichern',
    essential: {
      title: 'Essentielle Cookies',
      description: 'Notwendig für die Funktion der Website. Sie können nicht deaktiviert werden.'
    },
    analytics: {
      title: 'Analytische Cookies',
      description: 'Helfen uns zu verstehen, wie Sie die Website nutzen, um sie zu verbessern.'
    },
    marketing: {
      title: 'Marketing-Cookies',
      description: 'Werden verwendet, um Ihnen personalisierte Inhalte zu zeigen.'
    },
    preferences: {
      title: 'Präferenz-Cookies',
      description: 'Merken sich Ihre Auswahl und persönlichen Einstellungen.'
    },
    moreInfo: 'Mehr Informationen',
    lessInfo: 'Weniger Informationen',
    privacyLink: 'Datenschutzrichtlinie'
  }
};

export const CookieConsent = () => {
  const { language } = useI18n();
  const { user } = useAuth();
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true,
    analytics: false,
    marketing: false,
    preferences: false
  });

  const t = translations[language as keyof typeof translations] || translations.en;

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      const timer = setTimeout(() => setShowBanner(true), 1500);
      return () => clearTimeout(timer);
    } else {
      try {
        const savedPrefs = localStorage.getItem(COOKIE_PREFERENCES_KEY);
        if (savedPrefs) {
          setPreferences(JSON.parse(savedPrefs));
        }
      } catch (e) {}
    }
  }, []);

  const notifyAdmin = useCallback(async (prefs: CookiePreferences) => {
    try {
      const response = await fetch('/api/cookie-consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferences: prefs,
          userEmail: user?.email || null,
          username: user ? (user as any).user_metadata?.username || user.email?.split('@')[0] : null,
          userAgent: navigator.userAgent,
          language: language,
          timestamp: new Date().toISOString(),
          screenResolution: `${window.screen.width}x${window.screen.height}`,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          referrer: document.referrer || null,
          platform: navigator.platform,
          isLoggedIn: !!user
        })
      });
      
      if (!response.ok) {
        console.warn('Cookie consent API returned non-ok status:', response.status);
      }
    } catch (err) {
      console.warn('Cookie consent notification failed:', err);
    }
  }, [user, language]);

  const saveConsent = useCallback((prefs: CookiePreferences) => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'true');
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(prefs));
    setPreferences(prefs);
    setShowBanner(false);
    
    notifyAdmin(prefs);
  }, [notifyAdmin]);

  const handleAcceptAll = () => {
    saveConsent({
      essential: true,
      analytics: true,
      marketing: true,
      preferences: true
    });
  };

  const handleRejectAll = () => {
    saveConsent({
      essential: true,
      analytics: false,
      marketing: false,
      preferences: false
    });
  };

  const handleSavePreferences = () => {
    saveConsent(preferences);
  };

  const togglePreference = (key: keyof CookiePreferences) => {
    if (key === 'essential') return;
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed bottom-0 left-0 right-0 z-[100] p-4 md:p-6"
        >
          <div className="max-w-4xl mx-auto">
            <div className="relative bg-gradient-to-br from-gray-900/98 via-gray-900/98 to-gray-800/98 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div 
                  className="absolute -top-20 -right-20 w-40 h-40 rounded-full opacity-20"
                  style={{ background: 'radial-gradient(circle, rgb(139, 92, 246) 0%, transparent 70%)' }}
                />
                <div 
                  className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full opacity-15"
                  style={{ background: 'radial-gradient(circle, rgb(34, 197, 94) 0%, transparent 70%)' }}
                />
              </div>

              <div className="relative p-4 md:p-6">
                <div className="flex items-start gap-4">
                  <div className="hidden sm:flex w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 items-center justify-center flex-shrink-0 border border-primary/20">
                    <Cookie className="w-6 h-6 text-primary" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-5 h-5 text-green-500 sm:hidden" />
                      <h3 className="text-lg font-semibold text-white">{t.title}</h3>
                    </div>
                    <p className="text-sm text-gray-400 mb-4 leading-relaxed">
                      {t.description}
                    </p>

                    <AnimatePresence>
                      {showDetails && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden mb-4"
                        >
                          <div className="space-y-3 pt-2 pb-4 border-t border-white/10">
                            {[
                              { key: 'essential' as const, locked: true },
                              { key: 'analytics' as const, locked: false },
                              { key: 'marketing' as const, locked: false },
                              { key: 'preferences' as const, locked: false }
                            ].map((item) => {
                              const cookieInfo = t[item.key];
                              return (
                              <div 
                                key={item.key}
                                className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors"
                              >
                                <div className="flex-1 min-w-0 pr-4">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-white text-sm">
                                      {cookieInfo.title}
                                    </span>
                                    {item.locked && (
                                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                                        {language === 'fr' ? 'Requis' : 'Required'}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {cookieInfo.description}
                                  </p>
                                </div>
                                <Switch
                                  checked={preferences[item.key as keyof CookiePreferences]}
                                  onCheckedChange={() => togglePreference(item.key as keyof CookiePreferences)}
                                  disabled={item.locked}
                                  className="data-[state=checked]:bg-green-600"
                                />
                              </div>
                            );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="flex flex-wrap items-center gap-2 md:gap-3">
                      <Button
                        onClick={handleAcceptAll}
                        className="gap-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg shadow-green-600/20"
                        size="sm"
                      >
                        <Check className="w-4 h-4" />
                        {t.acceptAll}
                      </Button>
                      
                      <Button
                        onClick={handleRejectAll}
                        variant="outline"
                        size="sm"
                        className="gap-2 border-white/20 text-gray-300 hover:bg-white/10"
                      >
                        <X className="w-4 h-4" />
                        {t.rejectAll}
                      </Button>

                      {showDetails ? (
                        <Button
                          onClick={handleSavePreferences}
                          variant="secondary"
                          size="sm"
                          className="gap-2 bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30"
                        >
                          <Check className="w-4 h-4" />
                          {t.save}
                        </Button>
                      ) : (
                        <Button
                          onClick={() => setShowDetails(true)}
                          variant="ghost"
                          size="sm"
                          className="gap-2 text-gray-400 hover:text-white hover:bg-white/10"
                        >
                          <Settings className="w-4 h-4" />
                          {t.customize}
                          <ChevronDown className="w-3 h-3" />
                        </Button>
                      )}
                      
                      {showDetails && (
                        <Button
                          onClick={() => setShowDetails(false)}
                          variant="ghost"
                          size="sm"
                          className="gap-1 text-gray-500 hover:text-gray-300"
                        >
                          <ChevronUp className="w-3 h-3" />
                          {t.lessInfo}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const CookieSettingsButton = ({ onClick }: { onClick: () => void }) => {
  const { language } = useI18n();
  const label = language === 'fr' ? 'Paramètres cookies' : 
                language === 'es' ? 'Configuración de cookies' :
                language === 'de' ? 'Cookie-Einstellungen' : 'Cookie settings';
  
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
    >
      <Cookie className="w-4 h-4" />
      {label}
    </button>
  );
};

export const useCookieConsent = () => {
  const resetConsent = () => {
    localStorage.removeItem(COOKIE_CONSENT_KEY);
    localStorage.removeItem(COOKIE_PREFERENCES_KEY);
    window.location.reload();
  };

  const getPreferences = (): CookiePreferences | null => {
    try {
      const prefs = localStorage.getItem(COOKIE_PREFERENCES_KEY);
      return prefs ? JSON.parse(prefs) : null;
    } catch {
      return null;
    }
  };

  return { resetConsent, getPreferences };
};

export default CookieConsent;
