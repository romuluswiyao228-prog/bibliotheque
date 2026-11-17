# Bibliothèque — Application de gestion et lecture de livres

Application web (HTML / CSS / JavaScript) avec deux espaces :

- **`index.html`** — site public : catalogue, liseuse (texte, PDF, images),
  progression de lecture, favoris, emprunts, profil.
- **`admin.html`** — portail administrateur : gestion des livres, import
  PDF/images/CSV/Excel/ISBN, synchronisation Supabase.

Les livres peuvent être **hébergés en ligne** via **Supabase** : les PDF et
images sont stockés dans Supabase Storage (bucket `media`), les métadonnées
dans la table `books`. Le site public lit le catalogue depuis le cloud —
tout visiteur peut lire les livres **sans compte**.

## Structure du projet

```
bibliotheque/
├── index.html           → site public (catalogue + liseuse)
├── script.js            → logique publique (catalogue cloud, lecteur, stats)
├── style.css            → styles publics
├── admin.html           → portail administrateur
├── admin.js             → logique admin (CRUD, imports, Supabase, auth)
├── admin.css            → styles admin
├── supabase-config.js   → URL + clé anon Supabase (à remplir)
├── supabase_schema.sql  → schéma complet (tables, RLS, bucket Storage)
├── supabase/
│   └── migrations/      → migrations CLI Supabase (déjà poussées)
└── README.md            → ce document
```

## Installation

Aucune installation nécessaire : double-cliquez sur `index.html`.

### Connexion Supabase (optionnel mais recommandé)

1. `supabase-config.js` : renseignez `SUPABASE_URL` et `SUPABASE_ANON_KEY`
   (Dashboard → Project Settings → API). Une copie peut être lue depuis `.env`.
2. Le schéma est déjà appliqué via `supabase db push` (CLI). Pour une nouvelle
   base : collez `supabase_schema.sql` dans le SQL Editor, ou utilisez la CLI
   (`supabase link` puis `supabase db push --remote`).

## Espace public (`index.html`)

- Catalogue avec recherche, filtres par catégorie, tri
- Fiche livre : description, exemplaires, bouton **Lire** / **Emprunter**
- Liseuse : texte (chapitres, sommaire, marque-pages, recherche, thèmes),
  **PDF** (rendu pdf.js page par page, zoom), **images** (pages scannées)
- Progression de lecture, favoris, profil personnel, exports PDF/Excel

## Espace admin (`admin.html`)

Authentification par **email + mot de passe Supabase Auth** (compte à créer
dans *Authentication → Users*). Sans Supabase configuré, un mot de passe
local sert de fallback.

- **Ajouter un livre** : formulaire manuel, recherche ISBN (Open Library),
  contenu texte, **PDF** (upload → Supabase Storage), **images**
- **Imports** : CSV, Excel (.xlsx/.xls via SheetJS), JSON
- **Tous les livres** : recherche, édition, suppression unitaire ou totale
  (avec confirmation « Cette action est irréversible »)
- **Base de données** : statut connexion, « Pousser vers Supabase »
  (synchronise tout le catalogue local vers le cloud), liste des utilisateurs

## Sécurité

- Lecture publique : `SELECT` ouvert sur `books` et fichiers `media`
- Écriture : réservée aux utilisateurs **authentifiés** (RLS)
- Le compte admin est le seul utilisateur possible (signups désactivés)
- Les PDF/images ne transitent plus par le LocalStorage (~5 Mo) mais par
  Supabase Storage — plus de limite pratique de taille

## Technologies

- HTML5 / CSS3 / JavaScript vanilla
- Supabase (Postgres + Auth + Storage) via `@supabase/supabase-js`
- pdf.js (rendu PDF), jsPDF + AutoTable (exports PDF), SheetJS (Excel)
- LocalStorage : progression, favoris, profil (cache local du visiteur)
