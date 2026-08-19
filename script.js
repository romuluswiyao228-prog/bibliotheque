/* =========================================================================
   BIBLIOTHÈQUE — script.js
   -------------------------------------------------------------------------
   Toute l'application fonctionne avec le localStorage du navigateur.
   Structure d'un livre stocké :
   {
     id: "LIV-0001",        -> identifiant généré automatiquement
     title: "...",
     author: "...",
     category: "...",
     year: 1990,
     maxCopies: 3,          -> nombre d'exemplaires déclaré à la création
     copies: 2,              -> nombre d'exemplaires actuellement disponibles
     cover: "https://..."   -> URL de l'image de couverture (facultatif)
   }
   ========================================================================= */

/* ---------------------------------------------------------------------
   1) CONSTANTES & ACCÈS AU LOCALSTORAGE
   --------------------------------------------------------------------- */
const STORAGE_KEY = "biblio_books";
const COUNTER_KEY = "biblio_next_id";

// Palette utilisée pour colorer la "tranche" de chaque livre selon sa catégorie
const SPINE_COLORS = ["#1F3A34", "#B8874A", "#3E7D51", "#7B4B3A", "#4A5E8C", "#8C4A6B", "#A3762F"];

/** Récupère la liste des livres depuis le localStorage (tableau vide si rien) */
function loadBooks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Erreur de lecture du localStorage :", e);
    return [];
  }
}

/** Sauvegarde la liste complète des livres dans le localStorage */
function saveBooks(books) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
  } catch (e) {
    console.error("Erreur d'écriture dans le localStorage :", e);
    showToast("Impossible d'enregistrer les données (localStorage bloqué). Ouvrez la page via un serveur local (http://...) plutôt qu'en double-cliquant sur le fichier.", "error");
  }
}

/** Génère un identifiant unique et incrémental du type LIV-0001, LIV-0002, ... */
function generateId() {
  try {
    let next = parseInt(localStorage.getItem(COUNTER_KEY) || "1", 10);
    const id = "LIV-" + String(next).padStart(4, "0");
    localStorage.setItem(COUNTER_KEY, String(next + 1));
    return id;
  } catch (e) {
    console.error("Erreur d'accès au localStorage :", e);
    // Solution de secours : on génère un id basé sur l'horodatage pour
    // que l'application reste utilisable, même si rien ne sera sauvegardé.
    return "LIV-" + Date.now();
  }
}

/** Associe une couleur stable à une catégorie (même catégorie = même couleur) */
function colorForCategory(category) {
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % SPINE_COLORS.length;
  return SPINE_COLORS[index];
}

/* ---------------------------------------------------------------------
   1 bis) JEU DE DONNÉES DE TEST (au moins 20 livres, comme demandé
   dans les livrables du projet)
   --------------------------------------------------------------------- */
const SEED_TITLES = [
  ["Le Petit Prince", "Antoine de Saint-Exupéry", "Roman", 1943, 5],
  ["Python Facile", "Jean Dupont", "Informatique", 2020, 3],
  ["Les Misérables", "Victor Hugo", "Roman", 1862, 4],
  ["Une Brève Histoire du Temps", "Stephen Hawking", "Science", 1988, 2],
  ["Sapiens", "Yuval Noah Harari", "Histoire", 2011, 6],
  ["1984", "George Orwell", "Science-fiction", 1949, 5],
  ["Le Comte de Monte-Cristo", "Alexandre Dumas", "Roman", 1844, 3],
  ["Introduction à l'Algorithmique", "Claire Morel", "Informatique", 2018, 0],
  ["L'Étranger", "Albert Camus", "Roman", 1942, 4],
  ["Dune", "Frank Herbert", "Science-fiction", 1965, 2],
  ["Histoire de France", "Ernest Lavisse", "Histoire", 1900, 1],
  ["Clean Code", "Robert C. Martin", "Informatique", 2008, 0],
  ["Le Rouge et le Noir", "Stendhal", "Roman", 1830, 3],
  ["Cosmos", "Carl Sagan", "Science", 1980, 2],
  ["Harry Potter à l'École des Sorciers", "J.K. Rowling", "Jeunesse", 1997, 7],
  ["Germinal", "Émile Zola", "Roman", 1885, 3],
  ["La Physique Quantique pour les Nuls", "Sami Boudelal", "Science", 2015, 1],
  ["Fondation", "Isaac Asimov", "Science-fiction", 1951, 0],
  ["Les Fables", "Jean de La Fontaine", "Poésie", 1668, 4],
  ["Petit Cahier d'Exercices de Confiance en Soi", "Charly Cungi", "Développement personnel", 2013, 2,],
];

function seedDemoData() {
  books = SEED_TITLES.map(([title, author, category, year, copies,image]) => ({
    id: generateId(),
    title, author, category, year,
    maxCopies: copies,
    copies: copies,
    cover: "",
  }));
  saveBooks(books);
}

/* ---------------------------------------------------------------------
   2) ÉTAT DE L'APPLICATION
   --------------------------------------------------------------------- */
let books = loadBooks();
let editingId = null;          // id du livre en cours de modification (ou null)
let pendingDeleteId = null;    // id du livre en attente de confirmation de suppression

// Au tout premier lancement (aucun livre en localStorage), on charge
// automatiquement le jeu de données de test pour ne pas partir d'une page vide.
if (books.length === 0) {
  seedDemoData();
}

/* ---------------------------------------------------------------------
   3) NAVIGATION ENTRE LES VUES
   --------------------------------------------------------------------- */
const VIEW_META = {
  dashboard: { title: "Tableau de bord", subtitle: "Vue d'ensemble de votre bibliothèque" },
  add:       { title: "Ajouter un livre", subtitle: "Enregistrer un nouvel ouvrage dans la collection" },
  list:      { title: "Liste des livres", subtitle: "Rechercher, modifier, supprimer ou emprunter" },
  borrow:    { title: "Emprunter", subtitle: "Sélectionner un livre disponible" },
  return:    { title: "Retourner", subtitle: "Enregistrer le retour d'un exemplaire" },
  stats:     { title: "Statistiques", subtitle: "Chiffres clés de la collection" },
};

function switchView(viewName) {
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  document.getElementById("view-" + viewName).classList.add("active");

  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.view === viewName);
  });

  document.getElementById("viewTitle").textContent = VIEW_META[viewName].title;
  document.getElementById("viewSubtitle").textContent = VIEW_META[viewName].subtitle;

  // On redessine la vue à chaque affichage pour être toujours à jour
  renderAll();
}

document.getElementById("mainNav").addEventListener("click", (e) => {
  const btn = e.target.closest(".nav-btn");
  if (!btn) return;
  switchView(btn.dataset.view);
});

/* ---------------------------------------------------------------------
   4) TOASTS (petits messages temporaires, ex : "Livre indisponible")
   --------------------------------------------------------------------- */
function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  const toast = document.createElement("div");
  toast.className = "toast " + type;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3200);
}

/* ---------------------------------------------------------------------
   5) MODALE DE CONFIRMATION (suppression)
   --------------------------------------------------------------------- */
const confirmOverlay = document.getElementById("confirmOverlay");

function askDeleteConfirmation(book) {
  pendingDeleteId = book.id;
  document.getElementById("confirmMessage").textContent =
    `Voulez-vous vraiment supprimer « ${book.title} » ? Cette action est irréversible.`;
  confirmOverlay.hidden = false;
}

document.getElementById("confirmCancelBtn").addEventListener("click", () => {
  pendingDeleteId = null;
  confirmOverlay.hidden = true;
});

document.getElementById("confirmOkBtn").addEventListener("click", () => {
  if (pendingDeleteId) {
    books = books.filter(b => b.id !== pendingDeleteId);
    saveBooks(books);
    showToast("Livre supprimé.", "success");
  }
  pendingDeleteId = null;
  confirmOverlay.hidden = true;
  renderAll();
});

/* ---------------------------------------------------------------------
   6) FORMULAIRE : AJOUT / MODIFICATION D'UN LIVRE
   --------------------------------------------------------------------- */
const bookForm = document.getElementById("bookForm");
const submitBtn = document.getElementById("submitBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");

function clearFormErrors() {
  document.querySelectorAll(".error").forEach(el => (el.textContent = ""));
  document.querySelectorAll(".field input").forEach(el => el.classList.remove("invalid"));
}

function setFieldError(fieldId, message) {
  document.getElementById("err-" + fieldId).textContent = message;
  document.getElementById(fieldId).classList.add("invalid");
}

/** Valide les champs du formulaire. Retourne un objet {valid, data} */
function validateForm() {
  clearFormErrors();
  let valid = true;

  const title = document.getElementById("title").value.trim();
  const author = document.getElementById("author").value.trim();
  const category = document.getElementById("category").value.trim();
  const yearRaw = document.getElementById("year").value;
  const copiesRaw = document.getElementById("copies").value;
  const cover = document.getElementById("cover").value.trim();

  if (!title) { setFieldError("title", "Le titre est obligatoire."); valid = false; }
  if (!author) { setFieldError("author", "L'auteur est obligatoire."); valid = false; }
  if (!category) { setFieldError("category", "La catégorie est obligatoire."); valid = false; }

  const year = parseInt(yearRaw, 10);
  const currentYear = new Date().getFullYear();
  if (yearRaw === "" || isNaN(year)) {
    setFieldError("year", "L'année est obligatoire."); valid = false;
  } else if (year < 0) {
    setFieldError("year", "L'année ne peut pas être négative."); valid = false;
  } else if (year > currentYear) {
    setFieldError("year", `L'année ne peut pas dépasser ${currentYear}.`); valid = false;
  }

  const copies = parseInt(copiesRaw, 10);
  if (copiesRaw === "" || isNaN(copies)) {
    setFieldError("copies", "Le nombre d'exemplaires est obligatoire."); valid = false;
  } else if (copies < 0) {
    setFieldError("copies", "Le nombre d'exemplaires ne peut pas être négatif."); valid = false;
  }

  return { valid, data: { title, author, category, year, copies, cover } };
}

bookForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const { valid, data } = validateForm();
  if (!valid) return;

  if (editingId) {
    // --- Modification d'un livre existant ---
    const book = books.find(b => b.id === editingId);
    if (book) {
      // On ajuste le nombre d'exemplaires disponibles proportionnellement
      // si le total d'exemplaires a changé, sans jamais passer sous 0.
      const diff = data.copies - book.maxCopies;
      book.title = data.title;
      book.author = data.author;
      book.category = data.category;
      book.year = data.year;
      book.maxCopies = data.copies;
      book.copies = Math.max(0, Math.min(data.copies, book.copies + diff));
      book.cover = data.cover;
      saveBooks(books);
      showToast("Livre modifié avec succès.", "success");
    }
    exitEditMode();
  } else {
    // --- Ajout d'un nouveau livre ---
    const newBook = {
      id: generateId(),
      title: data.title,
      author: data.author,
      category: data.category,
      year: data.year,
      maxCopies: data.copies,
      copies: data.copies,
      cover: data.cover,
    };
    books.push(newBook);
    saveBooks(books);
    showToast("Livre ajouté avec succès.", "success");
    bookForm.reset();
  }

  renderAll();
});

function enterEditMode(book) {
  editingId = book.id;
  document.getElementById("bookId").value = book.id;
  document.getElementById("title").value = book.title;
  document.getElementById("author").value = book.author;
  document.getElementById("category").value = book.category;
  document.getElementById("year").value = book.year;
  document.getElementById("copies").value = book.maxCopies;
  document.getElementById("cover").value = book.cover || "";

  submitBtn.textContent = "Enregistrer les modifications";
  cancelEditBtn.hidden = false;
  clearFormErrors();
  switchView("add");
}

function exitEditMode() {
  editingId = null;
  bookForm.reset();
  submitBtn.textContent = "Ajouter le livre";
  cancelEditBtn.hidden = true;
  clearFormErrors();
}

cancelEditBtn.addEventListener("click", exitEditMode);

/* ---------------------------------------------------------------------
   7) EMPRUNTER / RETOURNER
   --------------------------------------------------------------------- */
function borrowBook(id) {
  const book = books.find(b => b.id === id);
  if (!book) return;

  if (book.copies <= 0) {
    // Contrainte obligatoire : empêcher l'emprunt si aucun exemplaire n'est disponible
    showToast("Livre indisponible.", "error");
    return;
  }
  book.copies -= 1;
  saveBooks(books);
  showToast(`« ${book.title} » emprunté avec succès.`, "success");
  renderAll();
}

function returnBook(id) {
  const book = books.find(b => b.id === id);
  if (!book) return;

  if (book.copies >= book.maxCopies) {
    showToast("Tous les exemplaires de ce livre sont déjà disponibles.", "error");
    return;
  }
  book.copies += 1;
  saveBooks(books);
  showToast(`« ${book.title} » retourné avec succès.`, "success");
  renderAll();
}

/* ---------------------------------------------------------------------
   8) RECHERCHE & TRI (vue "Liste des livres")
   --------------------------------------------------------------------- */
const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");

searchInput.addEventListener("input", renderListView);
sortSelect.addEventListener("change", renderListView);

function getFilteredSortedBooks() {
  const query = searchInput.value.trim().toLowerCase();
  let result = books.filter(b =>
    b.title.toLowerCase().includes(query) ||
    b.author.toLowerCase().includes(query) ||
    b.category.toLowerCase().includes(query)
  );

  const sortMode = sortSelect.value;
  if (sortMode === "alpha") {
    result = result.slice().sort((a, b) => a.title.localeCompare(b.title, "fr"));
  } else if (sortMode === "category") {
    result = result.slice().sort((a, b) => a.category.localeCompare(b.category, "fr"));
  }
  return result;
}

document.getElementById("seedDataBtn").addEventListener("click", () => {
  const proceed = books.length === 0
    ? true
    : confirm("Cela remplacera tous les livres actuels par les 20 livres de test. Continuer ?");
  if (!proceed) return;
  seedDemoData();
  showToast("20 livres de test chargés.", "success");
  renderAll();
});

/* ---------------------------------------------------------------------
   9) RENDU — TABLEAU DE BORD
   --------------------------------------------------------------------- */
function computeStats() {
  const totalBooks = books.length;
  const totalCopies = books.reduce((sum, b) => sum + b.maxCopies, 0);
  const availableCopies = books.reduce((sum, b) => sum + b.copies, 0);
  const borrowedCopies = totalCopies - availableCopies;
  const availableTitles = books.filter(b => b.copies > 0).length;
  const unavailableTitles = totalBooks - availableTitles;
  return { totalBooks, totalCopies, availableCopies, borrowedCopies, availableTitles, unavailableTitles };
}

function renderQuickStats() {
  const s = computeStats();
  const el = document.getElementById("quickStats");
  el.innerHTML = `
    <div class="quick-stat"><b>${s.totalBooks}</b><span>Livres</span></div>
    <div class="quick-stat"><b>${s.availableCopies}</b><span>Dispo.</span></div>
    <div class="quick-stat"><b>${s.borrowedCopies}</b><span>Empruntés</span></div>
  `;
}

function renderDashboard() {
  const s = computeStats();
  const cardsEl = document.getElementById("dashboardCards");
  cardsEl.innerHTML = `
    ${statCardHTML("Nombre total de livres", s.totalBooks, "▤")}
    ${statCardHTML("Nombre total d'exemplaires", s.totalCopies, "≣")}
    ${statCardHTML("Livres disponibles", s.availableTitles, "✓")}
    ${statCardHTML("Livres indisponibles", s.unavailableTitles, "✕")}
  `;

  // Cinq derniers livres ajoutés
  const tbody = document.querySelector("#recentTable tbody");
  const recent = books.slice(-5).reverse();
  tbody.innerHTML = recent.length
    ? recent.map(b => `
        <tr>
          <td><span class="id-chip">${b.id}</span></td>
          <td>${escapeHTML(b.title)}</td>
          <td>${escapeHTML(b.author)}</td>
          <td>${escapeHTML(b.category)}</td>
          <td>${availabilityBadge(b)}</td>
        </tr>`).join("")
    : `<tr><td colspan="5" class="empty-state">Aucun livre pour le moment. Ajoutez votre premier livre !</td></tr>`;
}

function statCardHTML(label, value, icon) {
  return `
    <div class="stat-card">
      <div class="stat-icon">${icon}</div>
      <div class="stat-label">${label}</div>
      <div class="stat-value">${value}</div>
    </div>`;
}

function availabilityBadge(book) {
  return book.copies > 0
    ? `<span class="badge available">Disponible (${book.copies}/${book.maxCopies})</span>`
    : `<span class="badge unavailable">Indisponible</span>`;
}

/* ---------------------------------------------------------------------
   10) RENDU — LISTE DES LIVRES (tableau complet + actions)
   --------------------------------------------------------------------- */
function renderListView() {
  const list = getFilteredSortedBooks();
  const tbody = document.querySelector("#booksTable tbody");
  const emptyState = document.getElementById("listEmptyState");

  tbody.innerHTML = list.map(b => `
    <tr>
      <td><span class="mini-spine" style="background:${colorForCategory(b.category)}"></span></td>
      <td><span class="id-chip">${b.id}</span></td>
      <td>${escapeHTML(b.title)}</td>
      <td>${escapeHTML(b.author)}</td>
      <td>${escapeHTML(b.category)}</td>
      <td>${b.year}</td>
      <td>${availabilityBadge(b)}</td>
      <td>
        <div class="row-actions">
          <button class="btn btn-outline btn-sm" data-action="edit" data-id="${b.id}">Modifier</button>
          <button class="btn btn-success btn-sm" data-action="borrow" data-id="${b.id}">Emprunter</button>
          <button class="btn btn-danger btn-sm" data-action="delete" data-id="${b.id}">Supprimer</button>
        </div>
      </td>
    </tr>
  `).join("");

  emptyState.hidden = list.length !== 0;

  // Mise à jour de la liste de suggestions de catégories (datalist)
  const categoryList = document.getElementById("categoryList");
  const uniqueCategories = [...new Set(books.map(b => b.category))];
  categoryList.innerHTML = uniqueCategories.map(c => `<option value="${escapeHTML(c)}"></option>`).join("");
}

// Délégation d'événements pour les boutons Modifier / Emprunter / Supprimer
document.getElementById("booksTable").addEventListener("click", handleTableAction);

function handleTableAction(e) {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  const book = books.find(b => b.id === btn.dataset.id);
  if (!book) return;

  if (btn.dataset.action === "edit") enterEditMode(book);
  if (btn.dataset.action === "delete") askDeleteConfirmation(book);
  if (btn.dataset.action === "borrow") borrowBook(book.id);
}

/* ---------------------------------------------------------------------
   11) RENDU — EMPRUNTER / RETOURNER (cartes)
   --------------------------------------------------------------------- */
function bookCardHTML(book, actionLabel, actionName, btnClass) {
  const spineColor = colorForCategory(book.category);
  const coverContent = book.cover
    ? `style="background-image:url('${escapeAttr(book.cover)}')"`
    : "";
  return `
    <div class="book-card">
      <div class="spine" style="background:${spineColor}"></div>
      <div class="cover" ${coverContent}>${book.cover ? "" : "📖"}</div>
      <div class="info">
        <h3>${escapeHTML(book.title)}</h3>
        <div class="author">${escapeHTML(book.author)}</div>
        <div class="meta">${book.year} · ${book.copies}/${book.maxCopies} exemplaire(s) dispo.</div>
        <span class="tag">${escapeHTML(book.category)}</span>
        <div class="card-actions">
          <button class="btn ${btnClass} btn-sm" data-action="${actionName}" data-id="${book.id}">${actionLabel}</button>
        </div>
      </div>
    </div>`;
}

function renderBorrowView() {
  const grid = document.getElementById("borrowGrid");
  const available = books.filter(b => b.copies > 0);
  grid.innerHTML = available.map(b => bookCardHTML(b, "Emprunter", "borrow", "btn-success")).join("");
  document.getElementById("borrowEmptyState").hidden = available.length !== 0;
}

function renderReturnView() {
  const grid = document.getElementById("returnGrid");
  const borrowed = books.filter(b => b.copies < b.maxCopies);
  grid.innerHTML = borrowed.map(b => bookCardHTML(b, "Retourner", "return", "btn-primary")).join("");
  document.getElementById("returnEmptyState").hidden = borrowed.length !== 0;
}

document.getElementById("borrowGrid").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action='borrow']");
  if (btn) borrowBook(btn.dataset.id);
});

document.getElementById("returnGrid").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action='return']");
  if (btn) returnBook(btn.dataset.id);
});

/* ---------------------------------------------------------------------
   12) RENDU — STATISTIQUES
   --------------------------------------------------------------------- */
function renderStatsView() {
  const s = computeStats();
  const cardsEl = document.getElementById("statsCards");
  cardsEl.innerHTML = `
    ${statCardHTML("Nombre total de livres", s.totalBooks, "▤")}
    ${statCardHTML("Nombre total d'exemplaires", s.totalCopies, "≣")}
    ${statCardHTML("Livres disponibles", s.availableTitles, "✓")}
    ${statCardHTML("Livres empruntés (exemplaires)", s.borrowedCopies, "↷")}
  `;

  // Répartition par catégorie : simple graphique à barres en CSS
  const byCategory = {};
  books.forEach(b => { byCategory[b.category] = (byCategory[b.category] || 0) + 1; });
  const entries = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
  const max = entries.length ? entries[0][1] : 1;

  const chart = document.getElementById("categoryChart");
  chart.innerHTML = entries.length
    ? entries.map(([cat, count]) => `
        <div class="category-row">
          <div class="cat-label">${escapeHTML(cat)}</div>
          <div class="bar-track">
            <div class="bar-fill" style="width:${(count / max) * 100}%; background:${colorForCategory(cat)}"></div>
          </div>
          <div class="cat-count">${count}</div>
        </div>`).join("")
    : `<p class="empty-state">Aucune donnée à afficher pour le moment.</p>`;
}

/* ---------------------------------------------------------------------
   13) EXPORTS (bonus) — PDF et Excel
   --------------------------------------------------------------------- */
document.getElementById("exportPdfBtn").addEventListener("click", () => {
  if (!books.length) { showToast("Aucun livre à exporter.", "error"); return; }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text("Bibliothèque — Liste des livres", 14, 16);

  const rows = books.map(b => [
    b.id, b.title, b.author, b.category, String(b.year), `${b.copies}/${b.maxCopies}`,
  ]);

  doc.autoTable({
    head: [["ID", "Titre", "Auteur", "Catégorie", "Année", "Exemplaires"]],
    body: rows,
    startY: 22,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [31, 58, 52] },
  });

  doc.save("bibliotheque.pdf");
  showToast("Export PDF généré.", "success");
});

document.getElementById("exportExcelBtn").addEventListener("click", () => {
  if (!books.length) { showToast("Aucun livre à exporter.", "error"); return; }

  const data = books.map(b => ({
    ID: b.id,
    Titre: b.title,
    Auteur: b.author,
    Catégorie: b.category,
    Année: b.year,
    "Exemplaires disponibles": b.copies,
    "Exemplaires total": b.maxCopies,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Livres");
  XLSX.writeFile(workbook, "bibliotheque.xlsx");
  showToast("Export Excel généré.", "success");
});

/* ---------------------------------------------------------------------
   14) UTILITAIRES (échappement HTML pour éviter les injections)
   --------------------------------------------------------------------- */
function escapeHTML(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
function escapeAttr(str) {
  return String(str).replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/* ---------------------------------------------------------------------
   15) RENDU GLOBAL — appelé à chaque changement de vue ou de données
   --------------------------------------------------------------------- */
function renderAll() {
  renderQuickStats();
  renderDashboard();
  renderListView();
  renderBorrowView();
  renderReturnView();
  renderStatsView();
}

// Premier rendu au chargement de la page
renderAll();
