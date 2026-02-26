import { useState, useRef, useEffect } from 'react';
import { useI18n } from '@/lib/i18n';
import { useSettingsStore } from '@/hooks/useUserSettings';
import { motion, AnimatePresence } from 'framer-motion';
import './LanguageSelector.css';

const languages = [
  { code: 'fr', flag: '🇫🇷', native: 'Français', english: 'French' },
  { code: 'en', flag: '🇬🇧', native: 'English', english: 'English' },
  { code: 'es', flag: '🇪🇸', native: 'Español', english: 'Spanish' },
  { code: 'de', flag: '🇩🇪', native: 'Deutsch', english: 'German' },
  { code: 'it', flag: '🇮🇹', native: 'Italiano', english: 'Italian' },
  { code: 'pt', flag: '🇵🇹', native: 'Português', english: 'Portuguese' },
  { code: 'ar', flag: '🇸🇦', native: 'العربية', english: 'Arabic' },
  { code: 'ko', flag: '🇰🇷', native: '한국어', english: 'Korean' },
  { code: 'ja', flag: '🇯🇵', native: '日本語', english: 'Japanese' },
  { code: 'ru', flag: '🇷🇺', native: 'Русский', english: 'Russian' },
];

export const LanguageSelector = () => {
  const { language, setLanguage } = useI18n();
  const { language: settingsLang, setLanguage: setSettingsLanguage } = useSettingsStore();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const currentLang = languages.find(l => l.code === language);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className="lang-switcher" ref={menuRef}>
      <motion.button
        className="lang-btn"
        data-bg={currentLang?.code.toUpperCase() || 'EN'}
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title={`${currentLang?.native || 'Language'} (${currentLang?.english || 'English'})`}
        aria-label={`Language selector: ${currentLang?.native || 'Language'}`}
        aria-expanded={isOpen}
      >
        <span className="flag">{currentLang?.flag}</span>
        <span className="code">{currentLang?.code.toUpperCase()}</span>
        <span className="native">{currentLang?.native}</span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="lang-menu"
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
              {languages.map((l) => (
                <motion.button
                  key={l.code}
                  data-lang={l.code.toUpperCase()}
                  onClick={() => {
                    setLanguage(l.code as any);
                    setSettingsLanguage(l.code as any);
                    setIsOpen(false);
                    // Force refresh to ensure all components and API calls use the new language
                    window.location.reload();
                  }}
                  whileHover={{ translateX: 3, scale: 1.02 }}
                  className={`lang-menu-item ${language === l.code ? 'active' : ''}`}
                  title={`${l.native} (${l.english})`}
                >
                  <span className="flag">{l.flag}</span>
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-semibold">{l.native}</span>
                    <span className="text-[10px] opacity-50 uppercase tracking-wider">{l.english}</span>
                  </div>
                  {language === l.code && (
                    <div className="ml-auto w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.6)]" />
                  )}
                </motion.button>
              ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
