# Bibliothèque — Application de gestion de livres

Application web simple (HTML / CSS / JavaScript) permettant à un·e bibliothécaire
d'ajouter, consulter, rechercher, modifier, supprimer, emprunter et retourner des
livres. Aucune installation n'est nécessaire : tout fonctionne dans le navigateur,
et les données sont conservées grâce au **LocalStorage**.

## 1. Structure du projet

```
bibliotheque/
├── index.html   → structure de la page (sidebar, formulaires, tableaux, modales)
├── style.css    → mise en forme (palette, typographie, cartes, responsive)
├── script.js    → toute la logique (CRUD, emprunt/retour, recherche, tri, stats, exports)
└── README.md    → ce document
```

## 2. Installation

Aucune installation, aucun serveur, aucune dépendance à compiler.

1. Téléchargez (ou copiez) le dossier `bibliotheque/` sur votre ordinateur.
2. Double-cliquez sur `index.html` (ou ouvrez-le avec clic droit → Ouvrir avec →
   votre navigateur : Chrome, Firefox, Edge...).
3. L'application s'ouvre directement, aucune connexion internet n'est requise
   pour les fonctionnalités principales (l'internet est utilisé uniquement pour
   charger les polices et les bibliothèques d'export PDF/Excel).

## 3. Premier lancement — jeu de données de test

Au tout premier chargement, si le LocalStorage est vide, l'application charge
**automatiquement 20 livres de test** (romans, informatique, science-fiction,
histoire, sciences, jeunesse...) pour ne pas démarrer sur une page vide.

Vous pouvez recharger ce jeu de données à tout moment via le bouton
**« Charger 20 livres de test »** présent sur le Tableau de bord (une confirmation
vous sera demandée si des livres existent déjà, car cela les remplace).

## 4. Utilisation

La barre latérale gauche donne accès à 5 sections, comme demandé dans le cahier
des charges :

| Section              | Ce qu'on peut y faire |
|-----------------------|------------------------|
| **Tableau de bord**   | Vue d'ensemble : statistiques rapides + derniers livres ajoutés |
| **Ajouter**           | Formulaire d'ajout d'un nouveau livre (titre, auteur, catégorie, année, exemplaires, couverture facultative) |
| **Liste des livres**  | Tableau complet avec recherche (titre / auteur / catégorie), tri (alphabétique ou par catégorie), boutons Modifier / Emprunter / Supprimer, et exports PDF / Excel |
| **Emprunter**         | Cartes des livres disponibles ; un clic diminue le nombre d'exemplaires de 1 |
| **Retourner**         | Cartes des livres actuellement empruntés ; un clic augmente le nombre d'exemplaires de 1 |
| **Statistiques**      | Nombre total de livres, d'exemplaires, de livres disponibles/empruntés, et répartition par catégorie |

### Règles importantes

- **Tous les champs du formulaire sont obligatoires** — un message d'erreur
  s'affiche sous le champ concerné si besoin.
- **Aucun nombre négatif** n'est accepté pour l'année ou le nombre d'exemplaires.
- **L'identifiant (ID)** est toujours généré automatiquement (format `LIV-0001`,
  `LIV-0002`, ...) — il n'est jamais saisi à la main.
- **Un livre à 0 exemplaire est indisponible** : le bouton Emprunter refuse
  l'opération et affiche le message *« Livre indisponible »*.
- **La suppression demande toujours une confirmation** avant d'être définitive.

## 5. Où sont stockées les données ?

Toutes les données sont stockées **dans le navigateur** via `localStorage`,
sous la clé `biblio_books`. Cela signifie :

- Les données restent disponibles même après avoir fermé l'onglet ou redémarré
  l'ordinateur (tant que vous rouvrez le fichier depuis le même navigateur).
- Les données ne sont **pas partagées** entre plusieurs navigateurs ou
  ordinateurs différents.
- Vider le cache/les données de navigation du navigateur effacera la
  bibliothèque (vous pourrez toujours recharger le jeu de test via le bouton dédié).

## 6. Fonctionnalités bonus incluses

- 🖼️ Image de couverture par livre (URL facultative)
- 🔤 Tri alphabétique par titre
- 🗂️ Tri par catégorie
- 📄 Export PDF du catalogue
- 📊 Export Excel (.xlsx) du catalogue

## 7. Technologies utilisées

- HTML5 / CSS3 / JavaScript (vanilla, aucun framework)
- LocalStorage pour la persistance des données
- [jsPDF](https://github.com/parallax/jsPDF) + [jsPDF-AutoTable](https://github.com/simonbengtsson/jsPDF-AutoTable) pour l'export PDF
- [SheetJS (xlsx)](https://sheetjs.com/) pour l'export Excel
- Polices Google Fonts : Fraunces, Inter, JetBrains Mono
