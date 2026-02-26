-- ==============================================================================
-- 1. KILL TOUTES LES ERREURS 500 SUR PROFILES (Boucle infinie)
-- Cette commande va dynamiquement chercher et SUPPRIMER absolument TOUTES 
-- les politiques de sécurité (RLS) existantes sur la table "profiles", 
-- y compris celles dont on ne connaît pas le nom exact.
-- ==============================================================================
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles') 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', r.policyname);
    END LOOP;
END $$;

-- On recrée UNIQUEMENT les politiques basiques, saines et sans boucle (non-récursives)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view profiles" 
ON public.profiles FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);


-- ==============================================================================
-- 2. FIX 406 ERROR SUR USER_SETTINGS & LIKES
-- L'erreur 406 se produit car l'API de Supabase a gardé en cache l'ancienne 
-- version de la base de données avant la création de nos nouvelles tables.
-- Cette commande force Supabase à recharger son cache instantanément.
-- ==============================================================================
NOTIFY pgrst, 'reload schema';


-- ==============================================================================
-- 3. FIX 400 ERROR SUR LES AVATARS (site-logo.png)
-- L'erreur 400 vient du fait que le dossier (bucket) 'avatars' n'existe pas
-- ou n'est pas bien paramétré. On force sa création et on le met en Public.
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- On s'assure que tout le monde peut lire les images d'avatar
DROP POLICY IF EXISTS "Avatar Read Access" ON storage.objects;
CREATE POLICY "Avatar Read Access" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
