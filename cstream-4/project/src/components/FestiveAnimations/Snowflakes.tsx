import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useUserSettings } from '@/hooks/useUserSettings';

interface Snowflake {
  id: number;
  left: number;
  size: number;
  duration: number;
  delay: number;
  swayAmount: number;
  rotation: number;
}

export const Snowflakes = ({ active = false, intensity = 'medium' }: { active?: boolean; intensity?: 'low' | 'medium' | 'high' }) => {
  const [snowflakes, setSnowflakes] = useState<Snowflake[]>([]);
  const { settings } = useUserSettings();
  
  const snowflakeSettings = useMemo(() => ({
    speed: settings.snowflakeSpeed ?? 1,
    opacity: settings.snowflakeOpacity ?? 0.8,
    enabled: settings.snowflakesEnabled !== false,
  }), [settings.snowflakeSpeed, settings.snowflakeOpacity, settings.snowflakesEnabled]);

  useEffect(() => {
    if (!active || !snowflakeSettings.enabled) {
      setSnowflakes([]);
      return;
    }

    const count = intensity === 'low' ? 20 : intensity === 'high' ? 100 : 50;
    const flakes: Snowflake[] = Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: Math.random() * 8 + 3,
      duration: (Math.random() * 10 + 15) / snowflakeSettings.speed,
      delay: Math.random() * 2,
      swayAmount: Math.random() * 100 + 30,
      rotation: Math.random() * 360,
    }));
    
    setSnowflakes(flakes);
  }, [active, intensity, snowflakeSettings.enabled, snowflakeSettings.speed]);

  if (!active || snowflakes.length === 0 || !snowflakeSettings.enabled) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-40">
      {snowflakes.map(flake => (
        <motion.div
          key={flake.id}
          className="absolute will-change-transform"
          style={{
            left: `${flake.left}%`,
            width: flake.size,
            height: flake.size,
            background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,1) 0%, rgba(255,255,255,0.8) 40%, rgba(255,255,255,0.4) 100%)`,
            borderRadius: '50%',
            boxShadow: `0 0 ${flake.size}px rgba(255,255,255,${snowflakeSettings.opacity}), inset -1px -1px 2px rgba(255,255,255,0.3)`,
            filter: `drop-shadow(0 0 2px rgba(255,255,255,${snowflakeSettings.opacity * 0.7}))`,
          }}
          initial={{ y: -50, opacity: 0, rotate: flake.rotation, x: 0 }}
          animate={{
            y: typeof window !== 'undefined' ? window.innerHeight + 100 : 900,
            opacity: [0, snowflakeSettings.opacity, snowflakeSettings.opacity, 0],
            x: [0, Math.sin(flake.id) * flake.swayAmount, -Math.sin(flake.id) * flake.swayAmount, 0],
            rotate: flake.rotation + 360,
          }}
          transition={{
            duration: flake.duration,
            delay: flake.delay,
            repeat: Infinity,
            ease: 'easeInOut',
            times: [0, 0.15, 0.85, 1],
          }}
          whileInView={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      ))}
    </div>
  );
};
