import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useI18n } from '@/lib/i18n';
import { ChevronDown, HelpCircle, Play, Tv, Film, Globe, Shield, Zap, MessageCircle } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
  icon: React.ReactNode;
}

const FAQAccordion = ({ item, index, isOpen, onToggle }: { 
  item: FAQItem; 
  index: number; 
  isOpen: boolean; 
  onToggle: () => void;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="border border-white/10 rounded-xl overflow-hidden bg-white/5 backdrop-blur-sm"
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="p-2 rounded-lg bg-primary/20 text-primary">
            {item.icon}
          </div>
          <span className="font-medium text-white">{item.question}</span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-5 h-5 text-gray-400" />
        </motion.div>
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-0">
              <div className="pl-14">
                <p className="text-gray-400 leading-relaxed">{item.answer}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const FAQ = () => {
  const { language } = useI18n();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqContent: Record<string, FAQItem[]> = {
    fr: [
      {
        question: "Comment regarder un film ou une série ?",
        answer: "Parcourez notre catalogue, sélectionnez le contenu qui vous intéresse, et cliquez sur le bouton 'Regarder'. Le lecteur se lancera automatiquement. Vous pouvez choisir entre différents serveurs si l'un ne fonctionne pas.",
        icon: <Play className="w-5 h-5" />
      },
      {
        question: "Pourquoi le lecteur ne fonctionne-t-il pas ?",
        answer: "Si le lecteur ne charge pas, essayez de changer de serveur (VidKing, VidFast, etc.). Certains serveurs peuvent être temporairement indisponibles. Vous pouvez aussi ouvrir la vidéo dans un nouvel onglet.",
        icon: <Tv className="w-5 h-5" />
      },
      {
        question: "CStream est-il gratuit ?",
        answer: "Oui, CStream est entièrement gratuit. Nous ne demandons aucun paiement pour accéder à notre contenu. Créez un compte pour sauvegarder vos favoris et votre historique.",
        icon: <Zap className="w-5 h-5" />
      },
      {
        question: "Quels types de contenus sont disponibles ?",
        answer: "Nous proposons des films, séries TV, anime et sports en streaming. Notre catalogue est régulièrement mis à jour avec les dernières sorties et les classiques.",
        icon: <Film className="w-5 h-5" />
      },
      {
        question: "Comment changer la langue des sous-titres ?",
        answer: "Dans le lecteur, cliquez sur l'icône des paramètres ou sous-titres pour sélectionner votre langue préférée. Les sous-titres disponibles dépendent du serveur utilisé.",
        icon: <Globe className="w-5 h-5" />
      },
      {
        question: "Mes données sont-elles sécurisées ?",
        answer: "Nous prenons la sécurité très au sérieux. Vos données personnelles sont cryptées et ne sont jamais partagées avec des tiers. Consultez notre politique de confidentialité pour plus de détails.",
        icon: <Shield className="w-5 h-5" />
      },
      {
        question: "Comment contacter le support ?",
        answer: "Vous pouvez nous contacter via la page Contact ou utiliser notre assistant IA pour obtenir de l'aide rapidement. Nous répondons généralement dans les 24 heures.",
        icon: <MessageCircle className="w-5 h-5" />
      },
      {
        question: "CStream stocke-t-il des fichiers vidéo ?",
        answer: "Non, CStream ne stocke aucun fichier vidéo, audio ou autre contenu multimédia sur ses serveurs. Nous fournissons uniquement des liens vers des lecteurs externes hébergés par des tiers. Tout le contenu est diffusé directement depuis ces sources externes.",
        icon: <Shield className="w-5 h-5" />
      }
    ],
    en: [
      {
        question: "How do I watch a movie or TV show?",
        answer: "Browse our catalog, select the content you're interested in, and click the 'Watch' button. The player will start automatically. You can choose between different servers if one doesn't work.",
        icon: <Play className="w-5 h-5" />
      },
      {
        question: "Why isn't the player working?",
        answer: "If the player doesn't load, try switching servers (VidKing, VidFast, etc.). Some servers may be temporarily unavailable. You can also open the video in a new tab.",
        icon: <Tv className="w-5 h-5" />
      },
      {
        question: "Is CStream free?",
        answer: "Yes, CStream is completely free. We don't require any payment to access our content. Create an account to save your favorites and watch history.",
        icon: <Zap className="w-5 h-5" />
      },
      {
        question: "What types of content are available?",
        answer: "We offer movies, TV series, anime, and sports streaming. Our catalog is regularly updated with the latest releases and classics.",
        icon: <Film className="w-5 h-5" />
      },
      {
        question: "How do I change subtitle language?",
        answer: "In the player, click on the settings or subtitles icon to select your preferred language. Available subtitles depend on the server being used.",
        icon: <Globe className="w-5 h-5" />
      },
      {
        question: "Is my data secure?",
        answer: "We take security very seriously. Your personal data is encrypted and never shared with third parties. See our privacy policy for more details.",
        icon: <Shield className="w-5 h-5" />
      },
      {
        question: "How do I contact support?",
        answer: "You can reach us via the Contact page or use our AI assistant for quick help. We usually respond within 24 hours.",
        icon: <MessageCircle className="w-5 h-5" />
      },
      {
        question: "Does CStream store video files?",
        answer: "No, CStream does not store any video, audio, or other multimedia files on its servers. We only provide links to external players hosted by third parties. All content is streamed directly from these external sources.",
        icon: <Shield className="w-5 h-5" />
      }
    ],
    es: [
      {
        question: "¿Cómo veo una película o serie?",
        answer: "Navega por nuestro catálogo, selecciona el contenido que te interesa y haz clic en 'Ver'. El reproductor se iniciará automáticamente. Puedes elegir entre diferentes servidores si uno no funciona.",
        icon: <Play className="w-5 h-5" />
      },
      {
        question: "¿Por qué no funciona el reproductor?",
        answer: "Si el reproductor no carga, intenta cambiar de servidor (VidKing, VidFast, etc.). Algunos servidores pueden estar temporalmente no disponibles. También puedes abrir el video en una nueva pestaña.",
        icon: <Tv className="w-5 h-5" />
      },
      {
        question: "¿Es CStream gratis?",
        answer: "Sí, CStream es completamente gratis. No requerimos ningún pago para acceder a nuestro contenido. Crea una cuenta para guardar tus favoritos e historial.",
        icon: <Zap className="w-5 h-5" />
      },
      {
        question: "¿Qué tipos de contenido están disponibles?",
        answer: "Ofrecemos películas, series de TV, anime y deportes en streaming. Nuestro catálogo se actualiza regularmente con los últimos estrenos y clásicos.",
        icon: <Film className="w-5 h-5" />
      },
      {
        question: "¿Cómo cambio el idioma de los subtítulos?",
        answer: "En el reproductor, haz clic en el icono de configuración o subtítulos para seleccionar tu idioma preferido. Los subtítulos disponibles dependen del servidor utilizado.",
        icon: <Globe className="w-5 h-5" />
      },
      {
        question: "¿Están seguros mis datos?",
        answer: "Nos tomamos la seguridad muy en serio. Tus datos personales están encriptados y nunca se comparten con terceros. Consulta nuestra política de privacidad para más detalles.",
        icon: <Shield className="w-5 h-5" />
      },
      {
        question: "¿Cómo contacto al soporte?",
        answer: "Puedes contactarnos a través de la página de Contacto o usar nuestro asistente de IA para ayuda rápida. Generalmente respondemos en 24 horas.",
        icon: <MessageCircle className="w-5 h-5" />
      },
      {
        question: "¿CStream almacena archivos de video?",
        answer: "No, CStream no almacena ningún archivo de video, audio u otro contenido multimedia en sus servidores. Solo proporcionamos enlaces a reproductores externos alojados por terceros. Todo el contenido se transmite directamente desde estas fuentes externas.",
        icon: <Shield className="w-5 h-5" />
      }
    ],
    de: [
      {
        question: "Wie schaue ich einen Film oder eine Serie?",
        answer: "Durchsuchen Sie unseren Katalog, wählen Sie den gewünschten Inhalt aus und klicken Sie auf 'Ansehen'. Der Player startet automatisch. Sie können zwischen verschiedenen Servern wählen, wenn einer nicht funktioniert.",
        icon: <Play className="w-5 h-5" />
      },
      {
        question: "Warum funktioniert der Player nicht?",
        answer: "Wenn der Player nicht lädt, versuchen Sie, den Server zu wechseln (VidKing, VidFast, etc.). Einige Server können vorübergehend nicht verfügbar sein. Sie können das Video auch in einem neuen Tab öffnen.",
        icon: <Tv className="w-5 h-5" />
      },
      {
        question: "Ist CStream kostenlos?",
        answer: "Ja, CStream ist völlig kostenlos. Wir verlangen keine Zahlung für den Zugang zu unseren Inhalten. Erstellen Sie ein Konto, um Ihre Favoriten und Ihren Verlauf zu speichern.",
        icon: <Zap className="w-5 h-5" />
      },
      {
        question: "Welche Arten von Inhalten sind verfügbar?",
        answer: "Wir bieten Filme, TV-Serien, Anime und Sport-Streaming an. Unser Katalog wird regelmäßig mit den neuesten Veröffentlichungen und Klassikern aktualisiert.",
        icon: <Film className="w-5 h-5" />
      },
      {
        question: "Wie ändere ich die Untertitelsprache?",
        answer: "Klicken Sie im Player auf das Einstellungs- oder Untertitel-Symbol, um Ihre bevorzugte Sprache auszuwählen. Die verfügbaren Untertitel hängen vom verwendeten Server ab.",
        icon: <Globe className="w-5 h-5" />
      },
      {
        question: "Sind meine Daten sicher?",
        answer: "Wir nehmen Sicherheit sehr ernst. Ihre persönlichen Daten sind verschlüsselt und werden niemals an Dritte weitergegeben. Weitere Details finden Sie in unserer Datenschutzrichtlinie.",
        icon: <Shield className="w-5 h-5" />
      },
      {
        question: "Wie kontaktiere ich den Support?",
        answer: "Sie können uns über die Kontaktseite erreichen oder unseren KI-Assistenten für schnelle Hilfe nutzen. Wir antworten normalerweise innerhalb von 24 Stunden.",
        icon: <MessageCircle className="w-5 h-5" />
      },
      {
        question: "Speichert CStream Videodateien?",
        answer: "Nein, CStream speichert keine Video-, Audio- oder andere Multimediadateien auf seinen Servern. Wir stellen nur Links zu externen Playern bereit, die von Drittanbietern gehostet werden. Alle Inhalte werden direkt von diesen externen Quellen gestreamt.",
        icon: <Shield className="w-5 h-5" />
      }
    ]
  };

  const faqItems = faqContent[language] || faqContent.en;

  const titles: Record<string, { title: string; subtitle: string }> = {
    fr: {
      title: 'Foire aux Questions',
      subtitle: 'Trouvez rapidement des réponses à vos questions les plus fréquentes'
    },
    en: {
      title: 'Frequently Asked Questions',
      subtitle: 'Quickly find answers to your most common questions'
    },
    es: {
      title: 'Preguntas Frecuentes',
      subtitle: 'Encuentra rápidamente respuestas a tus preguntas más comunes'
    },
    de: {
      title: 'Häufig gestellte Fragen',
      subtitle: 'Finden Sie schnell Antworten auf Ihre häufigsten Fragen'
    }
  };

  const { title, subtitle } = titles[language] || titles.en;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <HelpCircle className="w-5 h-5 text-primary" />
            <span className="text-primary font-medium">FAQ</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{title}</h1>
          <p className="text-gray-400 max-w-2xl mx-auto">{subtitle}</p>
        </motion.div>

        <div className="max-w-3xl mx-auto space-y-4">
          {faqItems.map((item, index) => (
            <FAQAccordion
              key={index}
              item={item}
              index={index}
              isOpen={openIndex === index}
              onToggle={() => setOpenIndex(openIndex === index ? null : index)}
            />
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FAQ;
