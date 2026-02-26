import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface TypewriterMessageProps {
  text: string;
  delay?: number;
  className?: string;
  onComplete?: () => void;
}

export default function TypewriterMessage({
  text,
  delay = 20,
  className = '',
  onComplete,
}: TypewriterMessageProps) {
  const [displayed, setDisplayed] = useState('');
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index < text.length) {
      const timeout = setTimeout(() => {
        setDisplayed((prev) => prev + text[index]);
        setIndex((i) => i + 1);
      }, delay);
      return () => clearTimeout(timeout);
    } else if (index === text.length && text.length > 0 && onComplete) {
      onComplete();
    }
  }, [index, text, delay, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`max-w-xl whitespace-pre-wrap break-words leading-relaxed font-light text-neutral-800 dark:text-neutral-200 ${className}`}
    >
      <span>{displayed}</span>
      {index < text.length && (
        <motion.span
          className='inline-block w-1 h-4 bg-indigo-400 ml-1 align-middle'
          animate={{
            opacity: [1, 0, 1],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
          }}
        />
      )}
    </motion.div>
  );
}
