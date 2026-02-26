import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

interface PremiumBubbleProps {
  message: string;
  role: 'user' | 'assistant';
  timestamp: string;
  isStreaming?: boolean;
}

export default function PremiumBubble({
  message,
  role,
  timestamp,
  isStreaming = false,
}: PremiumBubbleProps) {
  const [isCollapsed, setIsCollapsed] = useState(message.length > 500);
  const [displayedText, setDisplayedText] = useState(isStreaming ? '' : (message.length > 500 ? message.slice(0, 500) : message));
  const [isTyping, setIsTyping] = useState(role === 'assistant');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Machine-à-écrire animation logic
  useEffect(() => {
    if (role === 'assistant' && !isStreaming) {
      let currentIndex = 0;
      const interval = setInterval(() => {
        if (currentIndex <= message.length) {
          const textToDisplay = isCollapsed ? message.slice(0, 500) : message;
          setDisplayedText(textToDisplay.slice(0, currentIndex));
          currentIndex++;
        } else {
          setIsTyping(false);
          clearInterval(interval);
        }
      }, 20);
      return () => clearInterval(interval);
    } else if (isStreaming) {
       setDisplayedText(isCollapsed ? message.slice(0, 500) : message);
       setIsTyping(true);
    } else {
       setDisplayedText(isCollapsed ? message.slice(0, 500) : message);
       setIsTyping(false);
    }
  }, [message, role, isStreaming, isCollapsed]);

  // Auto-scroll logic
  useEffect(() => {
    if (isTyping && scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [displayedText, isTyping]);

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    toast.success('Message copié! ✨');
  };

  const isAssistant = role === 'assistant';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`flex w-full mb-6 group ${!isAssistant ? 'justify-end' : 'justify-start'}`}
    >
      <div 
        ref={scrollRef}
        className={`relative max-w-xl px-4 py-3 rounded-3xl transition-all duration-300 transform hover:scale-[1.01] 
        ${isAssistant 
          ? 'bg-gradient-to-r from-indigo-50 to-white dark:from-slate-800 dark:to-slate-900 shadow-md shadow-indigo-100/50 dark:shadow-none border border-indigo-100/20 dark:border-slate-700' 
          : 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none'
        }
        hover:shadow-xl hover:shadow-indigo-200/40 dark:hover:shadow-none
      `}>
        <div className={`font-light leading-relaxed break-words whitespace-pre-wrap ${isAssistant ? 'text-neutral-800 dark:text-neutral-200' : 'text-white'}`}>
          {displayedText}
          
          {isTyping && isAssistant && (
            <motion.span
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className="inline-block w-1.5 h-4 ml-1 bg-indigo-400 align-middle rounded-full"
            />
          )}
        </div>

        {message.length > 500 && (
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`mt-2 flex items-center gap-1 text-xs font-medium transition-colors ${isAssistant ? 'text-indigo-600 hover:text-indigo-700' : 'text-indigo-100 hover:text-white'}`}
          >
            {isCollapsed ? (
              <><ChevronDown className="w-3 h-3" /> Lire plus</>
            ) : (
              <><ChevronUp className="w-3 h-3" /> Réduire</>
            )}
          </button>
        )}

        <div className={`flex items-center gap-3 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200`}>
          <span className={`text-[10px] ${isAssistant ? 'text-neutral-400' : 'text-indigo-200'}`}>
            {new Date(timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <button
            onClick={handleCopy}
            className={`p-1.5 rounded-full transition-all ${isAssistant ? 'hover:bg-indigo-50 text-neutral-400 hover:text-indigo-600' : 'hover:bg-white/10 text-indigo-100 hover:text-white'}`}
            title="Copier"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
