-- =========================================================================
-- SUPABASE SCHEMA — Bibliothèque
-- =========================================================================
-- Copiez et collez ce script dans :
--   Supabase Dashboard → SQL Editor → New Query → Run (F5)
-- =========================================================================

-- -------------------------------------------------------------------------
-- TABLE : LIVRES
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.books (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  biblio_id   text UNIQUE,           -- Identifiant local (ex: LIV-0001)
  isbn        text,                  -- ISBN 10 ou 13
  title       text NOT NULL,
  author      text NOT NULL,
  category    text DEFAULT '',
  year        integer,
  language    text DEFAULT '',
  description text DEFAULT '',
  max_copies  integer DEFAULT 1,
  copies      integer DEFAULT 1,
  cover_url   text,
  content_type text DEFAULT 'text',  -- 'text', 'pdf', ou 'images'
  content     text,                  -- Texte complet avec chapitres
  pdf_data    text,                  -- PDF natif encodé en base64 (legacy)
  pages       jsonb,                 -- Pages images (data URLs ou URLs Storage)
  file_url    text,                  -- URL publique du PDF dans Storage
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- =========================================================================
-- MIGRATION SANS PERTE DE DONNÉES (Pour tables existantes)
-- Ces lignes ajoutent les nouvelles colonnes si la table existait déjà.
-- =========================================================================
ALTER TABLE public.books 
  ADD COLUMN IF NOT EXISTS isbn text,
  ADD COLUMN IF NOT EXISTS language text DEFAULT '',
  ADD COLUMN IF NOT EXISTS description text DEFAULT '',
  ADD COLUMN IF NOT EXISTS content_type text DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS pdf_data text,
  ADD COLUMN IF NOT EXISTS pages jsonb,
  ADD COLUMN IF NOT EXISTS file_url text;

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS books_updated_at ON public.books;
CREATE TRIGGER books_updated_at
  BEFORE UPDATE ON public.books
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- -------------------------------------------------------------------------
-- TABLE : PROFILS UTILISATEURS
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id              uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name    text DEFAULT '',
  avatar_emoji    text DEFAULT '📚',
  bio             text DEFAULT '',
  favorite_genre  text DEFAULT '',
  reading_goal    integer DEFAULT 12,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

DROP TRIGGER IF EXISTS profiles_updated_at ON public.user_profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- -------------------------------------------------------------------------
-- TABLE : PROGRESSION DE LECTURE
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reading_progress (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id      text NOT NULL,        -- biblio_id du livre (LIV-XXXX)
  percent      integer DEFAULT 0 CHECK (percent >= 0 AND percent <= 100),
  chapter_idx  integer DEFAULT 0,
  is_finished  boolean DEFAULT false,
  last_read_at timestamptz DEFAULT now(),
  created_at   timestamptz DEFAULT now(),
  UNIQUE(user_id, book_id)
);

-- -------------------------------------------------------------------------
-- TABLE : FAVORIS
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.favorites (
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id    text NOT NULL,          -- biblio_id du livre
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, book_id)
);

-- -------------------------------------------------------------------------
-- TABLE : EMPRUNTS
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.borrows (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  book_id      text NOT NULL,
  borrowed_at  timestamptz DEFAULT now(),
  returned_at  timestamptz,
  borrower_name text DEFAULT ''      -- Nom si pas de compte
);

-- =========================================================================
-- SÉCURITÉ : Row Level Security (RLS)
-- =========================================================================

-- LIVRES : visibles par tout le monde, modifiables uniquement via service_role
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "books_public_read" ON public.books;
CREATE POLICY "books_public_read"
  ON public.books FOR SELECT
  USING (true);

-- Livres : lecture publique, écriture réservée aux utilisateurs authentifiés
-- (créer le compte admin dans Authentication → Users ; désactiver les signups publics)
DROP POLICY IF EXISTS "books_admin_write" ON public.books;
CREATE POLICY "books_admin_write"
  ON public.books FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- PROFILS : chaque utilisateur voit/modifie son profil
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_own" ON public.user_profiles;
CREATE POLICY "profiles_own"
  ON public.user_profiles FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins peuvent lire tous les profils
DROP POLICY IF EXISTS "profiles_admin_read" ON public.user_profiles;
CREATE POLICY "profiles_admin_read"
  ON public.user_profiles FOR SELECT TO authenticated
  USING (true);

-- PROGRESSION : chaque utilisateur gère sa progression
ALTER TABLE public.reading_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "progress_own" ON public.reading_progress;
CREATE POLICY "progress_own"
  ON public.reading_progress FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- FAVORIS : chaque utilisateur gère ses favoris
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "favorites_own" ON public.favorites;
CREATE POLICY "favorites_own"
  ON public.favorites FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- EMPRUNTS
ALTER TABLE public.borrows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "borrows_own" ON public.borrows;
CREATE POLICY "borrows_own"
  ON public.borrows FOR ALL
  USING (auth.uid() = user_id OR user_id IS NULL)
  WITH CHECK (auth.uid() = user_id);

-- =========================================================================
-- INDEX POUR PERFORMANCE
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_books_biblio_id      ON public.books(biblio_id);
CREATE INDEX IF NOT EXISTS idx_books_category       ON public.books(category);
CREATE INDEX IF NOT EXISTS idx_progress_user        ON public.reading_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_book        ON public.reading_progress(book_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user       ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_borrows_user         ON public.borrows(user_id);

-- =========================================================================
-- STORAGE : Bucket public pour les PDF et images des livres
-- =========================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- Lecture publique des fichiers
DROP POLICY IF EXISTS "media_public_read" ON storage.objects;
CREATE POLICY "media_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'media');

-- Écriture réservée aux utilisateurs authentifiés (admins)
DROP POLICY IF EXISTS "media_public_insert" ON storage.objects;
CREATE POLICY "media_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'media');

DROP POLICY IF EXISTS "media_public_update" ON storage.objects;
CREATE POLICY "media_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'media')
  WITH CHECK (bucket_id = 'media');

DROP POLICY IF EXISTS "media_public_delete" ON storage.objects;
CREATE POLICY "media_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'media');

-- =========================================================================
-- VÉRIFICATION : Lister les tables créées
-- =========================================================================
SELECT table_name, 
       (SELECT count(*) FROM information_schema.columns 
        WHERE table_name = t.table_name AND table_schema = 'public') AS colonnes
FROM information_schema.tables t
WHERE table_schema = 'public'
ORDER BY table_name;
