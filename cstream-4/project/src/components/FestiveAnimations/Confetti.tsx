import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface ConfettiPiece {
  id: number;
  left: number;
  color: string;
  size: number;
  duration: number;
  delay: number;
  rotation: number;
  swayAmount: number;
}

const COLORS_2026 = ['#FFD700', '#FFA500', '#FF6347', '#87CEEB', '#FF69B4', '#00CED1', '#32CD32', '#FF1493', '#00FF00', '#FFB6C1', '#FF00FF', '#00FFFF', '#7FFF00', '#FF4500', '#DC143C', '#00FA9A'];

export const Confetti = ({ active = false, intensity = 'medium' }: { active?: boolean; intensity?: 'low' | 'medium' | 'high' }) => {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (!active) return;

    const count = intensity === 'low' ? 50 : intensity === 'high' ? 200 : 120;
    const newPieces: ConfettiPiece[] = Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      color: COLORS_2026[Math.floor(Math.random() * COLORS_2026.length)],
      size: Math.random() * 10 + 4,
      duration: Math.random() * 3 + 2.5,
      delay: Math.random() * 0.8,
      rotation: Math.random() * 360,
      swayAmount: Math.random() * 200 + 100,
    }));
    
    setPieces(newPieces);

    // Spawn new confetti periodically
    const interval = setInterval(() => {
      const newConfetti: ConfettiPiece[] = Array.from({ length: Math.ceil(count / 4) }, (_, i) => ({
        id: Date.now() + i,
        left: Math.random() * 100,
        color: COLORS_2026[Math.floor(Math.random() * COLORS_2026.length)],
        size: Math.random() * 10 + 4,
        duration: Math.random() * 3 + 2.5,
        delay: 0,
        rotation: Math.random() * 360,
        swayAmount: Math.random() * 200 + 100,
      }));
      setPieces(prev => [...prev.slice(-count * 2), ...newConfetti]);
    }, 1500);

    return () => clearInterval(interval);
  }, [active, intensity]);

  if (!active || pieces.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-40">
      {pieces.map(piece => (
        <motion.div
          key={piece.id}
          className="absolute shadow-lg"
          style={{
            left: `${piece.left}%`,
            top: '-20px',
            width: piece.size,
            height: piece.size,
            backgroundColor: piece.color,
            borderRadius: Math.random() > 0.6 ? '50%' : '0',
            boxShadow: `0 0 ${piece.size * 1.5}px ${piece.color}cc, 0 0 ${piece.size * 3}px ${piece.color}88, 0 0 ${piece.size * 5}px ${piece.color}44`,
            filter: `drop-shadow(0 0 ${piece.size * 0.8}px ${piece.color})`,
          }}
          initial={{ y: 0, opacity: 1, rotate: piece.rotation, scale: 1 }}
          animate={{
            y: typeof window !== 'undefined' ? window.innerHeight + 20 : 800,
            opacity: [1, 1, 1, 0],
            rotate: piece.rotation + 720,
            x: Math.sin(piece.id) * piece.swayAmount,
            scale: [1, 0.9, 0.8, 0],
          }}
          transition={{
            duration: piece.duration,
            delay: piece.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
};
