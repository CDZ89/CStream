import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://fgcekgrymdcwjanwxrwj.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnY2VrZ3J5bWRjd2phbnd4cndqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExMjU1ODAsImV4cCI6MjA3NjcwMTU4MH0.8_aiA-AeB4Qv85tEIx1bcGicOf8cyV9KdVCWY4HNTy4";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    debug: process.env.NODE_ENV === 'development',
  },
  global: {
    headers: {
      'x-client-info': 'cstream-app',
    },
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  db: {
    schema: 'public',
  },
});

const queryCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

export const cachedQuery = async <T>(
  key: string,
  queryFn: () => Promise<{ data: T | null; error: any }>,
  ttlMs: number = 30000
): Promise<{ data: T | null; error: any }> => {
  const cached = queryCache.get(key);
  const now = Date.now();

  if (cached && now - cached.timestamp < cached.ttl) {
    return { data: cached.data as T, error: null };
  }

  try {
    const result = await queryFn();

    if (!result.error && result.data) {
      queryCache.set(key, { data: result.data, timestamp: now, ttl: ttlMs });
    }

    return result;
  } catch (err: any) {
    console.warn(`[Supabase] Cached query failed for ${key}:`, err);
    return { data: null, error: err };
  }
};

export const invalidateCache = (keyPattern?: string) => {
  if (!keyPattern) {
    queryCache.clear();
    return;
  }

  for (const key of queryCache.keys()) {
    if (key.includes(keyPattern)) {
      queryCache.delete(key);
    }
  }
};

export const batchQuery = async <T>(
  queries: Array<{
    key: string;
    queryFn: () => Promise<{ data: T | null; error: any }>;
    ttlMs?: number;
  }>
): Promise<Array<{ key: string; data: T | null; error: any }>> => {
  const results = await Promise.all(
    queries.map(async ({ key, queryFn, ttlMs = 30000 }) => {
      const result = await cachedQuery(key, queryFn, ttlMs);
      return { key, ...result };
    })
  );
  return results;
};

export const prefetchData = async () => {
  const now = Date.now();

  const readersKey = 'readers:all';
  const profilesKey = 'profiles:all';

  if (!queryCache.has(readersKey) || now - (queryCache.get(readersKey)?.timestamp || 0) > 60000) {
    supabase.from('readers').select('*').order('created_at', { ascending: false }).then(result => {
      if (!result.error && result.data) {
        queryCache.set(readersKey, { data: result.data, timestamp: now, ttl: 60000 });
      }
    });
  }
};

let connectionRetries = 0;
const MAX_RETRIES = 3;

export const withRetry = async <T>(
  operation: () => Promise<{ data: T | null; error: any }>,
  retries: number = MAX_RETRIES
): Promise<{ data: T | null; error: any }> => {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await operation();

      if (!result.error) {
        connectionRetries = 0;
        return result;
      }

      if (result.error?.code === 'PGRST301' || result.error?.message?.includes('JWT')) {
        await supabase.auth.refreshSession();
        continue;
      }
    } catch (err: any) {
      console.warn(`[Supabase] Retry attempt ${i + 1} failed:`, err);
      if (i === retries - 1) return { data: null, error: err };
    }

    if (i < retries - 1) {
      await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
    }
  }

  try {
    const result = await operation();
    return result;
  } catch (err: any) {
    return { data: null, error: err };
  }
};

export const getConnectionStatus = () => {
  return {
    retries: connectionRetries,
    isHealthy: connectionRetries < MAX_RETRIES,
  };
};
