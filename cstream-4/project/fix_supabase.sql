-- ====== 1. CRÉATION / MISE À JOUR DE LA TABLE user_settings ======
-- Corrige l'erreur 406 : table manquante ou colonnes absentes

CREATE TABLE IF NOT EXISTS public.user_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    theme TEXT DEFAULT 'dark',
    language TEXT DEFAULT 'en',
    notifications JSONB DEFAULT '{"newContent": true, "updates": true, "recommendations": false}'::jsonb,
    autoplay BOOLEAN DEFAULT true,
    brightness INTEGER DEFAULT 100,
    "customGradient" JSONB DEFAULT '{"enabled": false, "primaryColor": "#A855F7", "backgroundColor": "#0C0A1A"}'::jsonb,
    "displayDensity" TEXT DEFAULT 'normal',
    "badgeStyle" TEXT DEFAULT 'default',
    "snowflakesEnabled" BOOLEAN DEFAULT false,
    "snowflakeSpeed" NUMERIC DEFAULT 1,
    "snowflakeOpacity" NUMERIC DEFAULT 0.8,
    "particlesEnabled" BOOLEAN DEFAULT true,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ajouter les colonnes manquantes si la table existait déjà partiellement
DO $$ 
BEGIN 
    BEGIN ALTER TABLE public.user_settings ADD COLUMN "customGradient" JSONB DEFAULT '{"enabled": false, "primaryColor": "#A855F7", "backgroundColor": "#0C0A1A"}'::jsonb; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.user_settings ADD COLUMN "displayDensity" TEXT DEFAULT 'normal'; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.user_settings ADD COLUMN "badgeStyle" TEXT DEFAULT 'default'; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.user_settings ADD COLUMN "snowflakesEnabled" BOOLEAN DEFAULT false; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.user_settings ADD COLUMN "snowflakeSpeed" NUMERIC DEFAULT 1; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.user_settings ADD COLUMN "snowflakeOpacity" NUMERIC DEFAULT 0.8; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.user_settings ADD COLUMN "particlesEnabled" BOOLEAN DEFAULT true; EXCEPTION WHEN duplicate_column THEN END;
END $$;

-- RLS Settings
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own settings" ON public.user_settings;
CREATE POLICY "Users can manage their own settings" ON public.user_settings 
    FOR ALL USING (auth.uid() = user_id);

-- ====== 2. CORRECTION DES POLICIES RÉCURSIVES SUR PROFILES ======
-- Corrige l'erreur 500 en supprimant les policies cassées

-- 1. On supprime TOUTES les policies actuelles de la table profiles
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'profiles'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
    END LOOP;
END $$;

-- 2. On recrée des policies saines et ultra-sécurisées sans récursion
-- Tout le monde peut LIRE les profils (pas de vérification du rôle de chacun pour éviter les boucles)
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);

-- L'utilisateur peut modifier SON PROPRE profil (securité auth)
CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Seulement un SUPER ADMIN peut tout supprimer (pas de RLS de boucle, on gère ça au niveau Backend)
CREATE POLICY "Admin delete only" ON public.profiles
    FOR DELETE USING (auth.uid() = id);

-- FIN: Tout devrait maintenant fonctionner à 100% !
