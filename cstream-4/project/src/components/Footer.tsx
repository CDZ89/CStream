import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/lib/i18n';
import { useThemeMode } from '@/hooks/useThemeMode';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  X, Shield, FileText, HelpCircle, Mail, 
  Globe, Palette, Heart, ExternalLink, Play, Cookie, Lock, Eye, Database, Info, AlertTriangle, RefreshCw
} from 'lucide-react';
import { useCookieConsent } from '@/components/CookieConsent';
import { useSiteLogo } from '@/hooks/useSiteLogo';
import { Badge } from '@/components/ui/badge';

const PolicyOverlay = ({ 
  isOpen, 
  onClose, 
  title, 
  subtitle, 
  icon: Icon, 
  sections 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  title: string; 
  subtitle: string; 
  icon: any; 
  sections: any[] 
}) => {
  const { language } = useI18n();
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative max-w-3xl w-full max-h-[85vh] overflow-hidden bg-gradient-to-br from-card via-card to-secondary rounded-2xl shadow-2xl border border-border"
            onClick={e => e.stopPropagation()}
          >
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div 
                className="absolute -top-1/2 left-1/2 w-[600px] h-[600px] -translate-x-1/2 rounded-full opacity-20"
                style={{ background: 'radial-gradient(circle, rgb(139, 92, 246) 0%, transparent 70%)' }}
              />
            </div>

            <button
              onClick={onClose}
              className="absolute right-4 top-4 z-10 p-2 rounded-full bg-secondary/50 hover:bg-secondary transition-colors group"
            >
              <X className="w-5 h-5 text-foreground/70 group-hover:text-foreground transition-colors" />
            </button>

            <div className="relative p-6 md:p-8 overflow-y-auto max-h-[85vh] scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              <div className="flex items-start gap-4 mb-8">
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20">
                  <Icon className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-1">{title}</h2>
                  <p className="text-muted-foreground text-sm">{subtitle}</p>
                </div>
              </div>

              <div className="space-y-4">
                {sections.map((section, index) => {
                  const IconComponent = section.icon || Info;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.08 }}
                      className="p-5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all group"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                          <IconComponent className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-white mb-2">{section.title}</h3>
                          <div className="text-sm text-gray-400 leading-relaxed space-y-2">
                            {Array.isArray(section.content) ? (
                              <ul className="list-disc pl-4 space-y-1">
                                {section.content.map((item, i) => <li key={i}>{item}</li>)}
                              </ul>
                            ) : (
                              <p>{section.content}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <div className="mt-8 pt-6 border-t border-white/10 text-center">
                <p className="text-xs text-gray-500">CStream © {new Date().getFullYear()} - Version 3.9</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const Footer = () => {
  const { language, setLanguage } = useI18n();
  const [activeOverlay, setActiveOverlay] = useState<'privacy' | 'dmca' | 'content' | null>(null);
  const { resetConsent } = useCookieConsent();
  const { logoUrl } = useSiteLogo();

  const languages = [
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  ];

  const contentPolicies = {
    fr: {
      title: 'Politiques de Contenu',
      subtitle: 'Nos standards de diffusion et règles communautaires',
      sections: [
        { 
          title: 'Qualité & Accessibilité', 
          content: [
            'Flux Haute Définition (720p, 1080p, 4K) priorisés selon disponibilité.',
            'Encodage optimisé pour une lecture fluide même sur connexions limitées.',
            'Support multi-langues et sous-titres (SRT/VTT) pour une accessibilité mondiale.'
          ], 
          icon: Play 
        },
        { 
          title: 'Sécurité de l\'Utilisateur', 
          content: [
            'Analyse proactive des liens externes pour détecter les scripts malveillants.',
            'Environnement de visionnage sécurisé sans publicités intrusives ou pop-ups.',
            'Zéro injection de code tiers dans l\'interface de lecture.'
          ], 
          icon: Shield 
        },
        { 
          title: 'Fréquence de Mise à jour', 
          content: [
            'Mises à jour automatiques du catalogue toutes les 6 heures.',
            'Ajout prioritaire des nouvelles sorties Cinéma et TV.',
            'Vérification périodique de la validité des sources de streaming.'
          ], 
          icon: RefreshCw 
        },
        {
          title: 'Règles Communautaires',
          content: [
            'Respect mutuel obligatoire dans les espaces de commentaires et chat.',
            'Interdiction de partager des contenus haineux, discriminatoires ou illégaux.',
            'Signalement facile des abus via notre système de modération intégré.'
          ],
          icon: Info
        }
      ]
    },
    en: {
      title: 'Content Policies',
      subtitle: 'Our broadcasting standards and community rules',
      sections: [
        { 
          title: 'Quality & Accessibility', 
          content: [
            'High Definition streams (720p, 1080p, 4K) prioritized by availability.',
            'Optimized encoding for smooth playback on limited connections.',
            'Multi-language and subtitle support (SRT/VTT) for global access.'
          ], 
          icon: Play 
        },
        { 
          title: 'User Security', 
          content: [
            'Proactive external link scanning for malicious scripts.',
            'Secure viewing environment without intrusive ads or pop-ups.',
            'Zero third-party code injection in the player interface.'
          ], 
          icon: Shield 
        },
        { 
          title: 'Update Frequency', 
          content: [
            'Automatic catalog updates every 6 hours.',
            'Priority adding for new Cinema and TV releases.',
            'Periodic validity checks of streaming sources.'
          ], 
          icon: RefreshCw 
        },
        {
          title: 'Community Rules',
          content: [
            'Mandatory mutual respect in comments and chat areas.',
            'Prohibition of sharing hateful, discriminatory, or illegal content.',
            'Easy abuse reporting via our integrated moderation system.'
          ],
          icon: Info
        }
      ]
    }
  };

  const dmcaContent = {
    fr: {
      title: 'Politique DMCA',
      subtitle: 'Protection de la propriété intellectuelle',
      sections: [
        { 
          title: 'Nature de la Plateforme', 
          content: 'CStream fonctionne exclusivement comme un index technique de métadonnées et un moteur de recherche. Nous ne stockons, n\'hébergeons, ni ne téléchargeons aucun média sur nos propres infrastructures physiques ou serveurs cloud.',
          icon: Database 
        },
        { 
          title: 'Origine des Contenus', 
          content: 'Tous les liens et flux vidéo sont générés dynamiquement à partir de serveurs tiers totalement indépendants. CStream n\'a aucun contrôle sur ces serveurs et ne peut être tenu responsable de leur contenu.',
          icon: Globe 
        },
        { 
          title: 'Procédure de Retrait', 
          content: [
            'Les demandes de retrait doivent inclure une preuve de propriété des droits.',
            'Indiquez précisément l\'URL ou l\'ID du contenu concerné.',
            'Le traitement et le retrait de l\'indexation s\'effectuent sous 24h à 48h ouvrées.',
            'Contact direct : dmca@cstream.app'
          ],
          icon: AlertTriangle 
        }
      ]
    },
    en: {
      title: 'DMCA Policy',
      subtitle: 'Intellectual Property Protection',
      sections: [
        { 
          title: 'Platform Nature', 
          content: 'CStream operates exclusively as a technical metadata index and search engine. We do not store, host, or upload any media on our own physical infrastructure or cloud servers.',
          icon: Database 
        },
        { 
          title: 'Content Origin', 
          content: 'All links and video streams are dynamically generated from completely independent third-party servers. CStream has no control over these servers and cannot be held responsible for their content.',
          icon: Globe 
        },
        { 
          title: 'Removal Procedure', 
          content: [
            'Removal requests must include proof of rights ownership.',
            'Precisely specify the URL or ID of the affected content.',
            'Processing and de-indexing occur within 24 to 48 business hours.',
            'Direct contact: dmca@cstream.app'
          ],
          icon: AlertTriangle 
        }
      ]
    }
  };

  const privacyContent = {
    fr: {
      title: 'Vie Privée',
      subtitle: 'Transparence et protection des données',
      sections: [
        { 
          title: 'Collecte Minimale', 
          content: [
            'Aucune création de compte obligatoire pour le streaming basique.',
            'Stockage local (LocalStorage) uniquement pour vos préférences de lecture.',
            'Anonymisation systématique des adresses IP dans nos logs techniques.'
          ], 
          icon: Lock 
        },
        { 
          title: 'Cookies & Traceurs', 
          content: 'Nous utilisons uniquement des cookies essentiels au fonctionnement technique (sessions, préférences de langue). Aucun traceur publicitaire tiers n\'est autorisé sur CStream.', 
          icon: Cookie 
        },
        { 
          title: 'Vos Droits', 
          content: [
            'Droit d\'accès et de suppression immédiate de vos données de navigation.',
            'Possibilité de refuser tout stockage via les paramètres de votre navigateur.',
            'Conformité stricte avec les standards RGPD européens.'
          ],
          icon: Eye 
        }
      ]
    },
    en: {
      title: 'Privacy Policy',
      subtitle: 'Transparency and data protection',
      sections: [
        { 
          title: 'Minimal Collection', 
          content: [
            'No mandatory account creation for basic streaming.',
            'Local Storage only used for your playback preferences.',
            'Systematic anonymization of IP addresses in technical logs.'
          ], 
          icon: Lock 
        },
        { 
          title: 'Cookies & Trackers', 
          content: 'We only use essential technical cookies (sessions, language preferences). No third-party advertising trackers are allowed on CStream.', 
          icon: Cookie 
        },
        { 
          title: 'Your Rights', 
          content: [
            'Right to access and immediate deletion of your browsing data.',
            'Ability to refuse all storage via your browser settings.',
            'Strict compliance with European GDPR standards.'
          ],
          icon: Eye 
        }
      ]
    }
  };

  const lang = (language === 'fr' ? 'fr' : 'en') as 'fr' | 'en';

  return (
    <>
      <footer className="relative mt-auto border-t border-white/10 bg-gradient-to-b from-background to-black/50">
        <div className="relative container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-1">
              <Link to="/" className="flex items-center gap-3 mb-4 group">
                <motion.div 
                  whileHover={{ scale: 1.05, rotate: 3 }}
                  className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/30 via-purple-500/20 to-primary/30 flex items-center justify-center shadow-xl shadow-primary/20 border border-primary/30 ring-2 ring-primary/10 overflow-hidden"
                >
                  <img src={logoUrl} alt="CStream" className="w-full h-full object-contain p-1.5 drop-shadow-2xl filter brightness-110" />
                </motion.div>
                <div>
                  <span className="font-bold text-2xl bg-gradient-to-r from-white via-zinc-300 to-white bg-clip-text text-transparent drop-shadow-sm">CStream</span>
                  <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-gradient-to-r from-primary/20 to-purple-500/20 text-primary font-medium border border-primary/30">v3.9</span>
                </div>
              </Link>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Navigation</h4>
              <ul className="space-y-2">
                <li><Link to="/movies" className="text-sm text-gray-400 hover:text-white transition-colors">Movies</Link></li>
                <li><Link to="/tv" className="text-sm text-gray-400 hover:text-white transition-colors">TV Shows</Link></li>
                <li><Link to="/anime" className="text-sm text-gray-400 hover:text-white transition-colors">Anime</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Support & Legal</h4>
              <ul className="space-y-2">
                <li>
                  <button onClick={() => setActiveOverlay('dmca')} className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> DMCA
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveOverlay('privacy')} className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-2">
                    <Lock className="w-4 h-4" /> Privacy
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveOverlay('content')} className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Content Policies
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Language</h4>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-full bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-gray-900 border-white/10">
                  {languages.map((l) => (
                    <SelectItem key={l.code} value={l.code} className="text-white hover:bg-white/10">
                      {l.flag} {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>© {new Date().getFullYear()} CStream.</span>
                <Heart className="w-3 h-3 text-red-500 fill-red-500 animate-pulse" />
              </div>
              <a 
                href="https://drift.rip/cdz" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group flex items-center gap-2 transition-all hover:scale-105 relative z-[100] cursor-pointer"
              >
                <div className="p-2 rounded-lg bg-white/5 border border-white/10 group-hover:border-primary/50 group-hover:bg-primary/10 transition-all">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-primary"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-white/40 group-hover:text-primary transition-colors">drift.rip/cdz</span>
              </a>
            </div>
            <Badge variant="outline" className="border-primary/30 text-primary">v3.9 Premium</Badge>
          </div>
        </div>
      </footer>

      <PolicyOverlay 
        isOpen={activeOverlay === 'privacy'} 
        onClose={() => setActiveOverlay(null)}
        title={privacyContent[lang].title}
        subtitle={privacyContent[lang].subtitle}
        icon={Shield}
        sections={privacyContent[lang].sections}
      />
      <PolicyOverlay 
        isOpen={activeOverlay === 'dmca'} 
        onClose={() => setActiveOverlay(null)}
        title={dmcaContent[lang].title}
        subtitle={dmcaContent[lang].subtitle}
        icon={AlertTriangle}
        sections={dmcaContent[lang].sections}
      />
      <PolicyOverlay 
        isOpen={activeOverlay === 'content'} 
        onClose={() => setActiveOverlay(null)}
        title={contentPolicies[lang].title}
        subtitle={contentPolicies[lang].subtitle}
        icon={FileText}
        sections={contentPolicies[lang].sections}
      />
    </>
  );
};

export default Footer;
