import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { motion } from 'framer-motion';

interface CountdownTimerProps {
    releaseDate: string | Date;
    title?: string;
}

export const CountdownTimer = ({ releaseDate, title }: CountdownTimerProps) => {
    const [timeLeft, setTimeLeft] = useState<{
        days: number;
        hours: number;
        minutes: number;
        seconds: number;
    }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

    const [isReleased, setIsReleased] = useState(false);

    useEffect(() => {
        const targetDate = new Date(releaseDate).getTime();

        const updateTimer = () => {
            const now = new Date().getTime();
            const difference = targetDate - now;

            if (difference <= 0) {
                setIsReleased(true);
                return;
            }

            setTimeLeft({
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
                seconds: Math.floor((difference % (1000 * 60)) / 1000),
            });
        };

        updateTimer(); // Initial call
        const timerInterval = setInterval(updateTimer, 1000);

        return () => clearInterval(timerInterval);
    }, [releaseDate]);

    if (isReleased) {
        return null;
    }

    return (
        <div className="w-full h-[60vh] max-h-[600px] bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl flex flex-col items-center justify-center p-8 relative overflow-hidden group">
            {/* Background elements */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 opacity-50 transition-opacity duration-1000 group-hover:opacity-100" />
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
                className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-[radial-gradient(ellipse_at_center,rgba(168,85,247,0.05)_0%,transparent_50%)]"
            />

            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="relative z-10 flex flex-col items-center text-center space-y-8"
            >
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.2)]">
                    <Clock className="w-10 h-10 text-purple-400" />
                </div>

                <div>
                    <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent mb-2">
                        Patience...
                    </h2>
                    {title && (
                        <p className="text-white/60 text-lg">
                            {title} n'est pas encore disponible
                        </p>
                    )}
                </div>

                <div className="flex items-center gap-4 sm:gap-6 pt-4">
                    <TimeUnit value={timeLeft.days} label="Jours" />
                    <TimeUnit value={timeLeft.hours} label="Heures" />
                    <TimeUnit value={timeLeft.minutes} label="Minutes" />
                    <TimeUnit value={timeLeft.seconds} label="Secondes" />
                </div>

                <p className="text-sm text-white/40 pt-6">
                    Disponible le {new Date(releaseDate).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
            </motion.div>
        </div>
    );
};

const TimeUnit = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-2xl sm:text-3xl font-black text-white shadow-inner backdrop-blur-md mb-2">
            <motion.span
                key={value}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
                {value.toString().padStart(2, '0')}
            </motion.span>
        </div>
        <span className="text-xs font-semibold text-purple-300 uppercase tracking-widest">{label}</span>
    </div>
);
