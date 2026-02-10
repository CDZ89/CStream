import { useState } from 'react';
import { X } from 'lucide-react';

interface ServerLanguageTipProps {
  onDismiss?: () => void;
}

export const ServerLanguageTip = ({ onDismiss }: ServerLanguageTipProps) => {
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible) return null;

  return (
    <div className="relative mb-4">
      <div className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10 border border-blue-500/30 rounded-2xl p-4 sm:p-6 overflow-hidden">
        {/* Background gradients */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-40 h-40 bg-blue-400 rounded-full blur-3xl opacity-20" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-400 rounded-full blur-3xl opacity-20" />
        </div>

        {/* Content */}
        <div className="relative z-10">
          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 sm:top-4 sm:right-4 p-1.5 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Fermer"
          >
            <X className="w-4 h-4 text-white/60 hover:text-white/100" />
          </button>

          {/* SVG Statique (sans animation) */}
          <svg viewBox="0 0 500 140" className="w-full h-auto mb-4" preserveAspectRatio="xMidYMid meet">
            <defs>
              <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style={{ stopColor: '#3B82F6', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#8B5CF6', stopOpacity: 1 }} />
              </linearGradient>
            </defs>

            {/* Section 1: Serveur/Langue (nuage cliquable) */}
            <g>
              {/* Nuage arrière-plan */}
              <path d="M 40 60 Q 30 45 45 40 Q 55 30 70 35 Q 85 25 90 40 Q 100 35 105 50 Q 105 65 85 70 Q 70 75 40 70 Z" 
                    fill="url(#grad)" opacity="0.3" stroke="url(#grad)" strokeWidth="1.5" />
              
              {/* Icône serveur dans le nuage */}
              <text x="72" y="65" textAnchor="middle" fontSize="20" fill="#3B82F6" fontWeight="700">⚙️</text>
              
              {/* Label SERVEUR/LANGUE */}
              <text x="72" y="95" textAnchor="middle" fontSize="11" fill="#8B5CF6" fontWeight="700">
                SERVEUR
              </text>
              <text x="72" y="110" textAnchor="middle" fontSize="9" fill="#94A3B8">
                ou LANGUE
              </text>
            </g>

            {/* Flèche vers lecteur */}
            <g>
              <line x1="125" y1="55" x2="215" y2="55" stroke="url(#grad)" strokeWidth="2.5" />
              <polygon points="215,55 210,50 210,60" fill="url(#grad)" />
            </g>

            {/* Section 2: Lecteur vidéo (cliquable) */}
            <g>
              {/* Cadre lecteur */}
              <rect x="235" y="25" width="120" height="60" rx="6" fill="url(#grad)" opacity="0.3" stroke="url(#grad)" strokeWidth="1.5" />
              
              {/* Icône vidéo */}
              <text x="295" y="68" textAnchor="middle" fontSize="28" fill="#06B6D4">▶️</text>
              
              {/* Label LECTEUR */}
              <text x="295" y="95" textAnchor="middle" fontSize="11" fill="#8B5CF6" fontWeight="700">
                LECTEUR
              </text>
              <text x="295" y="110" textAnchor="middle" fontSize="9" fill="#94A3B8">
                (change player)
              </text>
            </g>

            {/* Flèche vers région */}
            <g>
              <line x1="365" y1="55" x2="455" y2="55" stroke="url(#grad)" strokeWidth="2.5" />
              <polygon points="455,55 450,50 450,60" fill="url(#grad)" />
            </g>

            {/* Section 3: Région/Pays (cliquable) */}
            <g>
              {/* Carte/globe background */}
              <circle cx="475" cy="55" r="30" fill="url(#grad)" opacity="0.3" stroke="url(#grad)" strokeWidth="1.5" />
              
              {/* Icône globe */}
              <text x="475" y="65" textAnchor="middle" fontSize="24" fill="#06B6D4">🌍</text>
              
              {/* Label RÉGION */}
              <text x="475" y="95" textAnchor="middle" fontSize="11" fill="#8B5CF6" fontWeight="700">
                RÉGION
              </text>
              <text x="475" y="110" textAnchor="middle" fontSize="9" fill="#94A3B8">
                ou PAYS
              </text>
            </g>
          </svg>

          {/* Text explanation */}
          <div className="space-y-2 text-center">
            <p className="text-sm font-semibold text-white">
              Cliquez sur les icônes ci-dessus pour changer:
            </p>
            <div className="grid grid-cols-3 gap-2 text-xs text-white/70">
              <div>
                <span className="block font-medium text-blue-300">Serveur</span>
                Changez la langue
              </div>
              <div>
                <span className="block font-medium text-cyan-300">Lecteur</span>
                Choisissez un player
              </div>
              <div>
                <span className="block font-medium text-green-300">Région</span>
                Filtrez par pays
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
