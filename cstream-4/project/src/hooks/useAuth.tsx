import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { updateLoginStreak } from './useStreak';

export type UserRole = 'creator' | 'super_admin' | 'admin' | 'moderator' | 'editor' | 'member';

interface UserProfile {
  id: string;
  username: string;
  avatar_url: string | null;
  is_admin: boolean;
  role: UserRole;
  auth_provider: string | null;
  friend_code: string;
  friend_code_refreshes?: number;
  last_friend_code_refresh?: string;
  verified?: boolean;
  is_verified?: boolean;
  email?: string;
  time_spent?: number;
  xp?: number;
  level?: string;
  all_badges?: boolean;
  current_streak?: number;
  longest_streak?: number;
  last_login_date?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isCreator: boolean;
  isModerator: boolean;
  isEditor: boolean;
  role: UserRole;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, username?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshFriendCode: () => Promise<{ error: Error | null; newCode?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CREATOR_EMAIL = 'chemsdine.kachid@gmail.com';
const ADMIN_EMAIL = 'laylamayacoub@gmail.com';

const XP_CONVERSION = 10; // 1 hour = 10 XP
const XP_LEVELS = [
  { level: '1', minXp: 0, maxXp: 100 },
  { level: '2', minXp: 100, maxXp: 500 },
  { level: '3', minXp: 500, maxXp: 1000 },
  { level: '4', minXp: 1000, maxXp: 2500 },
  { level: '5', minXp: 2500, maxXp: 5000 },
  { level: '6', minXp: 5000, maxXp: 10000 },
  { level: '7', minXp: 10000, maxXp: 25000 },
  { level: '8', minXp: 25000, maxXp: Infinity },
];

// Persist role to localStorage for consistency
const persistRole = (role: UserRole) => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('cstream-user-role', role);
  }
};

const loadPersistedRole = (): UserRole | null => {
  if (typeof localStorage !== 'undefined') {
    return (localStorage.getItem('cstream-user-role') as UserRole) || null;
  }
  return null;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [isModerator, setIsModerator] = useState(false);
  const [isEditor, setIsEditor] = useState(false);
  const [role, setRole] = useState<UserRole>(loadPersistedRole() || 'member');
  const [loading, setLoading] = useState(true);

  const syncUserToUsersTable = async (userId: string, email: string, username: string, avatarUrl: string | null) => {
    try {
      const { data: profileExists } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      if (!profileExists) {
        await supabase.from('profiles').upsert({
          id: userId,
          username: username,
          avatar_url: avatarUrl,
          role: 'member',
          is_admin: false
        }, { onConflict: 'id' });
      }

      const { data: existingUser } = await (supabase as any)
        .from('users')
        .select('id, email, display_code, user_code')
        .eq('id', userId)
        .maybeSingle();

      if (!existingUser) {
        await (supabase as any)
          .from('users')
          .upsert({
            id: userId,
            email: email,
            username: username,
            avatar_url: avatarUrl,
            is_admin: false,
            is_online: true,
          } as any, { onConflict: 'id' });
      } else {
        await (supabase as any)
          .from('users')
          .update({
            is_online: true,
            last_seen: new Date().toISOString(),
            username: username,
            avatar_url: avatarUrl,
          })
          .eq('id', userId);
      }
    } catch (error) {
      console.error('Error syncing user:', error);
    }
  };

  const checkUserProfile = async (userId: string, userEmail?: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') return;

      const isCreatorUser = userEmail?.toLowerCase() === CREATOR_EMAIL.toLowerCase();

      if (data) {
        const profileAny = data as any;
        let userRole: UserRole = (data.role as UserRole) || 'member';

        if (isCreatorUser && userRole !== 'creator') {
          userRole = 'creator';
          await supabase.from('profiles').update({ is_admin: true, role: 'creator' }).eq('id', userId);
        }

        // Fetch display_code from users table (Source of Truth)
        let displayCode = profileAny.display_code || profileAny.friend_code || profileAny.user_code;
        try {
          const { data: userData } = await (supabase as any)
            .from('users')
            .select('display_code, user_code')
            .or(`id.eq.${userId},auth_id.eq.${userId}`)
            .maybeSingle();
          if (userData) {
            displayCode = userData.display_code || userData.user_code || displayCode;
          }
        } catch (e) {
          console.warn('[useAuth] Failed to fetch display_code from users:', e);
        }

        const profileData: UserProfile = {
          id: data.id,
          username: data.username || '',
          avatar_url: data.avatar_url,
          is_admin: !!(data.is_admin || isCreatorUser || data.role === 'super_admin' || data.role === 'admin'),
          role: userRole,
          auth_provider: data.auth_provider || null,
          friend_code: displayCode,
          friend_code_refreshes: data.friend_code_refreshes ?? 0,
          last_friend_code_refresh: data.last_friend_code_refresh ?? null,
          verified: !!(profileAny.verified || profileAny.is_verified || isCreatorUser),
          is_verified: !!(profileAny.is_verified || profileAny.verified || isCreatorUser),
          email: userEmail || undefined,
          xp: isCreatorUser ? 999999 : (profileAny.xp || 0),
          level: isCreatorUser ? 'Creator' : (profileAny.level || '1'),
          all_badges: isCreatorUser ? true : (profileAny.all_badges || false),
          time_spent: profileAny.time_spent || 0,
          current_streak: isCreatorUser ? 9999 : (profileAny.current_streak || 0),
          longest_streak: isCreatorUser ? 9999 : (profileAny.longest_streak || 0),
          last_login_date: profileAny.last_login_date || null,
        };

        setProfile(profileData);
        setIsAdmin(profileData.is_admin);
        setIsSuperAdmin(['creator', 'super_admin'].includes(userRole));
        setIsCreator(isCreatorUser);
        setIsModerator(['creator', 'super_admin', 'admin', 'moderator', 'editor'].includes(userRole));
        setIsEditor(['creator', 'super_admin', 'admin', 'moderator', 'editor'].includes(userRole));
        setRole(userRole);
        persistRole(userRole);

        // Update login streak (non-blocking)
        if (!isCreatorUser) {
          updateLoginStreak(userId).then(streakData => {
            if (streakData) {
              setProfile(prev => prev ? {
                ...prev,
                current_streak: streakData.currentStreak,
                longest_streak: streakData.longestStreak,
                last_login_date: streakData.lastLoginDate || undefined,
              } : prev);
            }
          }).catch(() => { });
        }
      }
    } catch (error) {
      console.error('Error checking profile:', error);
    }
  };

  const refreshProfile = async () => {
    if (user) await checkUserProfile(user.id, user.email);
  };

  const refreshFriendCode = async (): Promise<{ error: Error | null; newCode?: string }> => {
    return { error: new Error("La génération de code est gérée automatiquement par Supabase.") };
  };

  useEffect(() => {
    // FIXED: Don't set loading=false immediately. Wait for getSession first.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        // Use setTimeout to avoid Supabase deadlock in some auth flows
        setTimeout(() => {
          checkUserProfile(session.user.id, session.user.email);
        }, 0);
      } else {
        setProfile(null);
        setIsAdmin(false);
        setIsSuperAdmin(false);
        setIsCreator(false);
        setIsModerator(false);
        setIsEditor(false);
        setRole('member');
      }
    });

    // Get initial session FIRST, then set loading=false
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setSession(session);
        setUser(session.user);
        checkUserProfile(session.user.id, session.user.email).finally(() => {
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // XP & time tracking (every 30s while logged in)
  useEffect(() => {
    if (!user || !profile) return;
    const updatePresence = async () => {
      try {
        const { data: cur } = await supabase.from('profiles').select('time_spent, xp, level').eq('id', user.id).single();
        if (cur) {
          const p = cur as any;
          const isCreatorUser = user.email?.toLowerCase() === CREATOR_EMAIL.toLowerCase();
          const nTime = (p.time_spent || 0) + 30;
          const nXp = isCreatorUser ? 999999 : Math.floor(nTime / 360);
          let nLvl = p.level || '1';
          if (isCreatorUser) nLvl = 'Creator';
          else {
            const lInfo = XP_LEVELS.find(l => nXp >= l.minXp && (l.maxXp === Infinity || nXp < l.maxXp));
            if (lInfo && lInfo.level !== nLvl) {
              nLvl = lInfo.level;
              import('sonner').then(({ toast }) => toast.success(`🎉 Level Up! Vous êtes niveau ${nLvl} !`));
            }
          }
          await (supabase as any).from('profiles').update({ xp: nXp, level: nLvl, time_spent: nTime } as any).eq('id', user.id);
        }
      } catch (e) {
        // silently fail
      }
    };
    const interval = setInterval(updatePresence, 30000);
    return () => clearInterval(interval);
  }, [user?.id, profile?.id]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string, username?: string) => {
    const { error } = await supabase.auth.signUp({
      email, password, options: { data: { username: username || email.split('@')[0] } }
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setUser(null);
    setSession(null);
    setRole('member');
    persistRole('member');
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, isAdmin, isSuperAdmin, isCreator, isModerator, isEditor, role, loading, signIn, signUp, signOut, refreshProfile, refreshFriendCode }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
