-- =========================================================================
-- LOCKDOWN : lecture publique, écriture réservée aux utilisateurs authentifiés
-- Nécessite un compte admin créé dans Authentication → Users (signups publics
-- désactivés par défaut, donc seul l'admin peut obtenir une session).
-- =========================================================================

-- LIVRES : lecture publique conservée, écriture = authenticated uniquement
DROP POLICY IF EXISTS "books_admin_write" ON public.books;
CREATE POLICY "books_admin_write"
  ON public.books FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- PROFILS : lecture réservée aux authentifiés (au lieu de tout le monde)
DROP POLICY IF EXISTS "profiles_admin_read" ON public.user_profiles;
CREATE POLICY "profiles_admin_read"
  ON public.user_profiles FOR SELECT TO authenticated
  USING (true);

-- EMPRUNTS : WITH CHECK cohérent avec la policy USING
DROP POLICY IF EXISTS "borrows_own" ON public.borrows;
CREATE POLICY "borrows_own"
  ON public.borrows FOR ALL
  USING (auth.uid() = user_id OR user_id IS NULL)
  WITH CHECK (auth.uid() = user_id);

-- STORAGE : lecture publique conservée, écriture = authenticated uniquement
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
