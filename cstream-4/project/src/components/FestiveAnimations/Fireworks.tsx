import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  angle: number;
  velocity: number;
}

const FIREWORK_COLORS = ['#FF1744', '#00E676', '#00B0FF', '#FFD600', '#FF6D00', '#FF00E5', '#FF69B4', '#00CED1', '#FFA500', '#FF4500', '#DC143C', '#00FA9A', '#FF00FF', '#00FFFF', '#7FFF00'];

export const Fireworks = ({ active = false, intensity = 'medium' }: { active?: boolean; intensity?: 'low' | 'medium' | 'high' }) => {
  const [explosions, setExplosions] = useState<Particle[][]>([]);

  useEffect(() => {
    if (!active) return;

    const particleCount = intensity === 'low' ? 30 : intensity === 'high' ? 80 : 50;
    const frequency = intensity === 'low' ? 1200 : intensity === 'high' ? 400 : 700;

    const interval = setInterval(() => {
      const x = Math.random() * window.innerWidth;
      const y = Math.random() * (window.innerHeight * 0.7);
      
      const particles: Particle[] = Array.from({ length: particleCount }, (_, i) => ({
        id: i,
        x,
        y,
        color: FIREWORK_COLORS[Math.floor(Math.random() * FIREWORK_COLORS.length)],
        angle: (Math.PI * 2 * i) / particleCount,
        velocity: Math.random() * 400 + 150,
      }));

      setExplosions(prev => [...prev, particles].slice(-8));
    }, frequency);

    return () => clearInterval(interval);
  }, [active, intensity]);

  if (!active) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-40">
      {explosions.map((particles, explosionIdx) => (
        <div key={explosionIdx}>
          {particles.map(particle => {
            const endX = particle.x + Math.cos(particle.angle) * particle.velocity;
            const endY = particle.y + Math.sin(particle.angle) * particle.velocity;

            return (
              <motion.div
                key={`${explosionIdx}-${particle.id}`}
                className="absolute rounded-full"
                style={{
                  left: particle.x,
                  top: particle.y,
                  width: 12,
                  height: 12,
                  backgroundColor: particle.color,
                  boxShadow: `0 0 20px ${particle.color}ff, 0 0 40px ${particle.color}cc, 0 0 60px ${particle.color}88`,
                  filter: `drop-shadow(0 0 8px ${particle.color}) drop-shadow(0 0 4px rgba(255,255,255,0.8))`,
                  borderRadius: Math.random() > 0.7 ? '50%' : '2px',
                }}
                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                animate={{
                  x: endX - particle.x,
                  y: endY - particle.y,
                  opacity: [1, 0.8, 0],
                  scale: [1, 0.7, 0],
                }}
                transition={{
                  duration: 1.8,
                  ease: 'easeOut',
                }}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
};
