import { useEffect, useState, memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Sparkle {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  opacity: number;
}

interface SparkleEffectProps {
  count?: number;
  className?: string;
  color?: string;
  minSize?: number;
  maxSize?: number;
  speed?: 'slow' | 'normal' | 'fast';
}

const generateSparkles = (count: number, minSize: number, maxSize: number): Sparkle[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: minSize + Math.random() * (maxSize - minSize),
    delay: Math.random() * 3,
    duration: 2 + Math.random() * 3,
    opacity: 0.5 + Math.random() * 0.5,
  }));
};

export const SparkleEffect = memo(({
  count = 50,
  className = '',
  color = 'hsl(var(--primary))',
  minSize = 3,
  maxSize = 8,
  speed = 'normal',
}: SparkleEffectProps) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      setIsVisible(false);
      return;
    }
    setIsVisible(true);
  }, []);

  const sparkles = useMemo(() => generateSparkles(count, minSize, maxSize), [count, minSize, maxSize]);

  const speedMultiplier = speed === 'slow' ? 1.5 : speed === 'fast' ? 0.6 : 1;

  if (!isVisible) return null;

  return (
    <div className={`fixed top-0 left-0 right-0 bottom-0 pointer-events-none overflow-hidden z-0 ${className}`}>
      {sparkles.map((sparkle) => (
        <motion.div
          key={sparkle.id}
          className="absolute rounded-full blur-sm"
          style={{
            left: `${sparkle.x}%`,
            top: `${sparkle.y}%`,
            width: sparkle.size,
            height: sparkle.size,
            backgroundColor: color,
            boxShadow: `0 0 ${sparkle.size * 2.5}px ${color}, 0 0 ${sparkle.size * 5}px ${color}88, 0 0 ${sparkle.size * 8}px ${color}44`,
            filter: `drop-shadow(0 0 ${sparkle.size}px ${color})`,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, sparkle.opacity * 1.2, sparkle.opacity * 0.8, 0],
            scale: [0, 1.1, 1, 0],
            y: [0, -40, -80, -120],
            x: [0, Math.sin(sparkle.id) * 15, Math.cos(sparkle.id) * 15, 0],
          }}
          transition={{
            duration: sparkle.duration * speedMultiplier,
            delay: sparkle.delay,
            repeat: Infinity,
            ease: 'easeInOut',
            times: [0, 0.3, 0.7, 1],
          }}
        />
      ))}
    </div>
  );
});

export const FloatingParticles = memo(({ count = 40, className = '' }: { count?: number; className?: string }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      setIsVisible(false);
      return;
    }
    setIsVisible(true);
  }, []);

  const particles = useMemo(() => 
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 1 + Math.random() * 2,
      delay: Math.random() * 10,
      duration: 15 + Math.random() * 20,
      moveX: (Math.random() - 0.5) * 100,
      moveY: (Math.random() - 0.5) * 100,
    })),
    [count]
  );

  if (!isVisible) return null;

  return (
    <div className={`fixed top-0 left-0 right-0 bottom-0 pointer-events-none overflow-hidden z-0 ${className}`}>
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-primary/30"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
            backgroundColor: 'var(--theme-primary)',
            opacity: 0.3
          }}
          animate={{
            x: [0, particle.moveX, 0],
            y: [0, particle.moveY, 0],
            opacity: [0.1, 0.4, 0.1],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  );
});

export const GlowingOrbs = memo(({ count = 8, className = '' }: { count?: number; className?: string }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      setIsVisible(false);
      return;
    }
    setIsVisible(true);
  }, []);

  const orbs = useMemo(() => 
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: 10 + Math.random() * 80,
      y: 10 + Math.random() * 80,
      size: 100 + Math.random() * 200,
      delay: Math.random() * 5,
      duration: 20 + Math.random() * 15,
    })),
    [count]
  );

  if (!isVisible) return null;

  return (
    <div className={`fixed top-0 left-0 right-0 bottom-0 pointer-events-none overflow-hidden z-0 ${className}`}>
      {orbs.map((orb) => (
        <motion.div
          key={orb.id}
          className="absolute rounded-full blur-3xl opacity-60"
          style={{
            left: `${orb.x}%`,
            top: `${orb.y}%`,
            width: orb.size,
            height: orb.size,
            background: `radial-gradient(circle, hsl(var(--primary) / 0.08) 0%, transparent 70%)`,
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
            x: [0, 30, 0],
            y: [0, -20, 0],
          }}
          transition={{
            duration: orb.duration,
            delay: orb.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
});

export default SparkleEffect;
