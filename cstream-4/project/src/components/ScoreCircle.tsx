import { motion } from 'framer-motion';

interface ScoreCircleProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function ScoreCircle({ score, size = 'md', showLabel = false }: ScoreCircleProps) {
  const percentage = (score / 10) * 100;
  
  const sizes = {
    sm: { width: 48, strokeWidth: 3, fontSize: 'text-sm' },
    md: { width: 72, strokeWidth: 4, fontSize: 'text-xl' },
    lg: { width: 96, strokeWidth: 5, fontSize: 'text-2xl' },
  };
  
  const { width, strokeWidth, fontSize } = sizes[size];
  const radius = (width - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  const getColor = (score: number) => {
    if (score >= 7) return { stroke: '#22c55e', bg: 'rgba(34, 197, 94, 0.2)' };
    if (score >= 5) return { stroke: '#eab308', bg: 'rgba(234, 179, 8, 0.2)' };
    return { stroke: '#ef4444', bg: 'rgba(239, 68, 68, 0.2)' };
  };
  
  const colors = getColor(score);
  
  return (
    <div className="flex flex-col items-center gap-1">
      <div 
        className="relative flex items-center justify-center rounded-full"
        style={{ 
          width, 
          height: width,
          backgroundColor: colors.bg,
        }}
      >
        <svg
          className="absolute -rotate-90"
          width={width}
          height={width}
        >
          <circle
            cx={width / 2}
            cy={width / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-muted-foreground/20"
          />
          <motion.circle
            cx={width / 2}
            cy={width / 2}
            r={radius}
            fill="none"
            stroke={colors.stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
          />
        </svg>
        <span className={`${fontSize} font-bold`} style={{ color: colors.stroke }}>
          {score.toFixed(1)}
        </span>
      </div>
      {showLabel && (
        <span className="text-xs text-muted-foreground">Score TMDB</span>
      )}
    </div>
  );
}
