-- ==============================================================================
-- CStream - Supabase Critical Fixes (Storage & Roles)
-- ==============================================================================
-- INSTRUCTIONS:
-- 1. Copiez tout ce script SQL.
-- 2. Allez sur votre dashboard Supabase (https://supabase.com/dashboard/project/fgcekgrymdcwjanwxrwj).
-- 3. Accédez à l'onglet "SQL Editor" (l'icône avec les parenthèses à gauche).
-- 4. Créez une nouvelle requête (New Query), collez-y ce code et cliquez sur "Run".
-- ==============================================================================

-- Ajouter la valeur 'creator' à l'enum app_role si elle n'existe pas déjà
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'creator';

BEGIN;

-- 1. Restauration des Rôles (Créateur)
-- Créer le rôle 'creator' s'il n'existe pas
INSERT INTO public.roles (id, name, label, description)
VALUES (
    uuid_generate_v4(), 
    'creator', 
    'Créateur',
    'Accès aux outils de création et au panel administrateur/créateur'
)
ON CONFLICT (name) DO NOTHING;

-- Assigner automatiquement le rôle 'creator' à votre compte via votre email.
-- Remplacez l'email si ce n'est pas le bon.
DO $$
DECLARE
    v_user_id uuid;
BEGIN
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'chemsdine.kachid@gmail.com';
    
    IF v_user_id IS NOT NULL THEN
        -- S'assurer que l'entrée de profil existe
        INSERT INTO public.profiles (id, username, avatar_url, role)
        VALUES (v_user_id, 'Admin', NULL, 'creator')
        ON CONFLICT (id) DO UPDATE SET role = 'creator';

        -- Ajouter à la table user_roles
        INSERT INTO public.user_roles (user_id, role)
        VALUES (v_user_id, 'creator')
        ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
END $$;


-- 2. Restauration des Buckets Storage (Avatars manquants / Erreurs 400)
-- Vérifier et créer le bucket 'avatars' (qui devient 'public' pour que le front puisse y accéder)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  TRUE,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE 
SET public = TRUE;

-- Vérifier et créer un bucket appelé 'public' (parfois utilisé pour le site-logo)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'public',
  'public',
  TRUE,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE 
SET public = TRUE;

-- 3. Ajout des Policies pour laisser tout le monde voir les avatars
CREATE POLICY "Public Access for avatars bucket" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'avatars');

CREATE POLICY "Public Access for public bucket" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'public');

CREATE POLICY "Users can upload their own avatars" 
ON storage.objects FOR INSERT 
WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid() = owner
);

CREATE POLICY "Users can update their own avatars" 
ON storage.objects FOR UPDATE 
USING (
    bucket_id = 'avatars' 
    AND auth.uid() = owner
);

-- ==============================================================================
-- 4. Correctifs Table "user_settings" (Paramètres qui ne se sauvegardent pas)
-- ==============================================================================
-- Ajout des nouvelles colonnes manquantes pour éviter que l'API plante
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS "displayDensity" text DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS "badgeStyle" text DEFAULT 'default',
ADD COLUMN IF NOT EXISTS "customGradient" jsonb DEFAULT '{"enabled": false, "primaryColor": "#A855F7", "backgroundColor": "#0C0A1A"}'::jsonb,
ADD COLUMN IF NOT EXISTS "snowflakesEnabled" boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS "snowflakeSpeed" numeric DEFAULT 1,
ADD COLUMN IF NOT EXISTS "snowflakeOpacity" numeric DEFAULT 0.8,
ADD COLUMN IF NOT EXISTS "particlesEnabled" boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS "applyThemeToAll" boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS "enableSeasonalThemes" boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS "brightness" numeric DEFAULT 100,
ADD COLUMN IF NOT EXISTS "autoplay" boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS "notifications" jsonb DEFAULT '{"updates": true, "newContent": true, "recommendations": false}'::jsonb;

COMMIT;
