import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface StreakData {
    currentStreak: number;
    longestStreak: number;
    lastLoginDate: string | null;
    isNewStreak: boolean; // true if streak was just updated today
    streakMilestone: number | null; // if hit a milestone today (7, 30, 100, 365)
}

const MILESTONES = [3, 7, 14, 30, 60, 100, 365];

export const updateLoginStreak = async (userId: string): Promise<StreakData | null> => {
    try {
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

        // Fetch current streak data from profiles
        const { data: profile, error: fetchError } = await supabase
            .from('profiles')
            .select('current_streak, longest_streak, last_login_date')
            .eq('id', userId)
            .maybeSingle();

        if (fetchError) {
            console.warn('[Streak] Failed to fetch profile streak:', fetchError.message);
            return null;
        }

        const raw = profile as any;
        const lastLogin: string | null = raw?.last_login_date || null;
        const currentStreak: number = raw?.current_streak || 0;
        const longestStreak: number = raw?.longest_streak || 0;

        // If already logged in today, just return current data
        if (lastLogin === today) {
            return {
                currentStreak,
                longestStreak,
                lastLoginDate: lastLogin,
                isNewStreak: false,
                streakMilestone: null,
            };
        }

        // Calculate new streak value
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        let newStreak: number;
        if (!lastLogin) {
            // First time ever logging in
            newStreak = 1;
        } else if (lastLogin === yesterdayStr) {
            // Consecutive day
            newStreak = currentStreak + 1;
        } else {
            // Streak broken - reset to 1
            newStreak = 1;
        }

        const newLongest = Math.max(longestStreak, newStreak);

        // Update profile with new streak
        const { error: updateError } = await (supabase as any)
            .from('profiles')
            .update({
                current_streak: newStreak,
                longest_streak: newLongest,
                last_login_date: today,
            } as any)
            .eq('id', userId);

        if (updateError) {
            console.warn('[Streak] Failed to update streak:', updateError.message);
            return null;
        }

        // Check if hitting a milestone
        const hitMilestone = MILESTONES.includes(newStreak) ? newStreak : null;

        // Show toast notifications
        if (newStreak > 1) {
            try {
                const { toast } = await import('sonner');
                if (hitMilestone) {
                    toast.success(`🏆 ${hitMilestone} jours de streak ! Incroyable !`, {
                        duration: 5000,
                    });
                } else if (newStreak > (currentStreak || 0)) {
                    toast.success(`🔥 Streak: ${newStreak} jours consécutifs !`, {
                        duration: 3000,
                    });
                }
            } catch (e) {
                // silently fail
            }
        } else if (currentStreak > 1) {
            // Streak was broken
            try {
                const { toast } = await import('sonner');
                toast.info(`💔 Streak réinitialisé. Nouveau départ !`, { duration: 3000 });
            } catch (e) { }
        }

        return {
            currentStreak: newStreak,
            longestStreak: newLongest,
            lastLoginDate: today,
            isNewStreak: true,
            streakMilestone: hitMilestone,
        };
    } catch (err) {
        console.error('[Streak] Unexpected error:', err);
        return null;
    }
};

export const useStreak = (userId: string | undefined | null) => {
    const [streak, setStreak] = useState<StreakData | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchStreak = useCallback(async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const { data, error } = await (supabase as any)
                .from('profiles')
                .select('current_streak, longest_streak, last_login_date')
                .eq('id', userId)
                .maybeSingle();

            if (!error && data) {
                const raw = data as any;
                setStreak({
                    currentStreak: raw.current_streak || 0,
                    longestStreak: raw.longest_streak || 0,
                    lastLoginDate: raw.last_login_date || null,
                    isNewStreak: false,
                    streakMilestone: null,
                });
            }
        } catch (e) {
            console.warn('[Streak] Fetch error:', e);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchStreak();
    }, [fetchStreak]);

    return { streak, loading, refetch: fetchStreak };
};

export const getStreakEmoji = (streak: number): string => {
    if (streak >= 365) return '🌟';
    if (streak >= 100) return '💎';
    if (streak >= 30) return '⚡';
    if (streak >= 14) return '🔥';
    if (streak >= 7) return '✨';
    if (streak >= 3) return '🔥';
    return '⭐';
};

export const getNextMilestone = (current: number): number => {
    return MILESTONES.find(m => m > current) || 365;
};
