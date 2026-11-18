-- Index de performance pour le catalogue public (tri par date, recherche par titre/auteur)
CREATE INDEX IF NOT EXISTS idx_books_created_at ON public.books(created_at);
CREATE INDEX IF NOT EXISTS idx_books_title      ON public.books(title);
CREATE INDEX IF NOT EXISTS idx_books_author     ON public.books(author);
-- idx_books_category et idx_borrows_user existent déjà dans 20261117000000_init.sql
