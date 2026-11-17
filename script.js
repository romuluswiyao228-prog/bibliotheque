/* =========================================================================
   BIBLIOTHÈQUE — script.js
   -------------------------------------------------------------------------
   Gestion des livres, Espace personnel "Ma Bibliothèque",
   Couvertures haute qualité & Liseuse interactive (E-Reader).
   ========================================================================= */

/* ---------------------------------------------------------------------
   1) CONSTANTES & LOCALSTORAGE KEYS
   --------------------------------------------------------------------- */
const STORAGE_KEY = "biblio_books";
const COUNTER_KEY = "biblio_next_id";
const PROGRESS_KEY = "biblio_reading_progress";
const FAVORITES_KEY = "biblio_favorites";
const READER_SETTINGS_KEY = "biblio_reader_settings";
const PROFILE_KEY = "biblio_user_profile";

const SPINE_COLORS = [
  "#1F3A34", "#B8874A", "#3E7D51", "#7B4B3A", "#4A5E8C", "#8C4A6B", "#A3762F", "#2A526A"
];

/* ---------------------------------------------------------------------
   2) FONCTIONS DE CHARGEMENT & PERSISTANCE
   --------------------------------------------------------------------- */

/** Récupère la liste des livres depuis le localStorage */
function loadBooks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Erreur de lecture des livres :", e);
    return [];
  }
}

/** Sauvegarde la liste complète des livres */
function saveBooks(bList) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bList));
  } catch (e) {
    console.error("Erreur d'écriture des livres :", e);
    showToast("Impossible d'enregistrer les livres dans le localStorage.", "error");
  }
}

/** Génère un identifiant incrémental LIV-0001, LIV-0002... */
function generateId() {
  try {
    let next = parseInt(localStorage.getItem(COUNTER_KEY) || "1", 10);
    const id = "LIV-" + String(next).padStart(4, "0");
    localStorage.setItem(COUNTER_KEY, String(next + 1));
    return id;
  } catch (e) {
    return "LIV-" + Date.now();
  }
}

/** Suivi de la progression de lecture */
function loadReadingProgress() {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function saveReadingProgress(prog) {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(prog));
  } catch (e) {}
}

function getBookProgress(bookId) {
  const all = loadReadingProgress();
  return all[bookId] || { percent: 0, chapter: 0, isFinished: false, lastReadAt: null };
}

function setBookProgress(bookId, data) {
  const all = loadReadingProgress();
  all[bookId] = { ...(all[bookId] || {}), ...data, lastReadAt: new Date().toISOString() };
  saveReadingProgress(all);
}

/** Favoris */
function loadFavorites() {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveFavorites(favs) {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
  } catch (e) {}
}

function isFavorite(bookId) {
  return loadFavorites().includes(bookId);
}

function toggleFavorite(bookId) {
  let favs = loadFavorites();
  const index = favs.indexOf(bookId);
  if (index >= 0) {
    favs.splice(index, 1);
    showToast("Retiré des favoris.", "info");
  } else {
    favs.push(bookId);
    showToast("Ajouté aux favoris ❤️", "success");
  }
  saveFavorites(favs);
  renderAll();
}

/** Réglages liseuse */
function loadReaderSettings() {
  try {
    const raw = localStorage.getItem(READER_SETTINGS_KEY);
    return raw ? JSON.parse(raw) : { theme: "sepia", fontSize: 18, fontSerif: true };
  } catch (e) {
    return { theme: "sepia", fontSize: 18, fontSerif: true };
  }
}

function saveReaderSettings(settings) {
  try {
    localStorage.setItem(READER_SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {}
}

/* ---------------------------------------------------------------------
   PROFIL UTILISATEUR
   --------------------------------------------------------------------- */
const EMOJI_PRESETS = ['\ud83d\udcd6','\ud83e\udd89','\ud83e\udd85','\ud83d\udc3b','\ud83e\udd81','\ud83d\udc22','\ud83d\ude80','\ud83c\udf1f','\ud83c\udfaf','\ud83d\udcda','\u270d\ufe0f','\ud83d\udcd5','\ud83d\udcac','\ud83c\udf0d','\u2615'];

function loadProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : { name: 'Mon Profil', avatar: '\ud83d\udc64', bio: 'Passionn\u00e9(e) de lecture', favoriteGenre: '', readingGoal: 12 };
  } catch (e) {
    return { name: 'Mon Profil', avatar: '\ud83d\udc64', bio: 'Passionn\u00e9(e) de lecture', favoriteGenre: '', readingGoal: 12 };
  }
}

function saveProfile(p) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
  } catch (e) {}
}

function updateSidebarProfile() {
  const p = loadProfile();
  const allProg = loadReadingProgress();
  const finishedCount = books.filter(b => allProg[b.id]?.isFinished || allProg[b.id]?.percent === 100).length;
  document.getElementById('sidebarAvatar').textContent = p.avatar || '\ud83d\udc64';
  document.getElementById('sidebarName').textContent = p.name || 'Mon Profil';
  document.getElementById('sidebarReadCount').textContent = finishedCount + ' livre' + (finishedCount > 1 ? 's' : '') + ' lu' + (finishedCount > 1 ? 's' : '');
}

function renderProfileView() {
  const p = loadProfile();
  const allProg = loadReadingProgress();
  const favs = loadFavorites();

  // Hero
  document.getElementById('profileAvatarDisplay').textContent = p.avatar || '\ud83d\udc64';
  document.getElementById('profileNameDisplay').textContent = p.name || 'Mon Profil';
  document.getElementById('profileBioDisplay').textContent = p.bio || 'Passionn\u00e9(e) de lecture';

  // Badges d'accomplissement
  const finishedCount = books.filter(b => allProg[b.id]?.isFinished || allProg[b.id]?.percent === 100).length;
  const readingCount = books.filter(b => allProg[b.id]?.percent > 0 && !allProg[b.id]?.isFinished).length;
  const favCount = favs.length;
  const badgesEl = document.getElementById('profileHeroBadges');
  const badges = [];
  if (p.favoriteGenre) badges.push(`<span class="profile-badge">\ud83c\udff7\ufe0f ${escapeHTML(p.favoriteGenre)}</span>`);
  if (finishedCount >= 10) badges.push(`<span class="profile-badge gold">\ud83c\udfc6 Grand Lecteur</span>`);
  else if (finishedCount >= 5) badges.push(`<span class="profile-badge gold">\u2b50 Lecteur assidu</span>`);
  else if (finishedCount >= 1) badges.push(`<span class="profile-badge">\u2705 Premier livre terminé</span>`);
  if (favCount >= 5) badges.push(`<span class="profile-badge">❤\ufe0f ${favCount} favoris</span>`);
  badgesEl.innerHTML = badges.join('');

  // Stats row
  const totalRead = finishedCount;
  const goalPct = p.readingGoal ? Math.min(100, Math.round((finishedCount / p.readingGoal) * 100)) : 0;
  const statsEl = document.getElementById('profileStatsRow');
  statsEl.innerHTML = `
    <div class="profile-stat-card">
      <div class="profile-stat-icon">\ud83d\udcda</div>
      <div class="profile-stat-value">${books.length}</div>
      <div class="profile-stat-label">Livres dans la collection</div>
    </div>
    <div class="profile-stat-card">
      <div class="profile-stat-icon">\u2705</div>
      <div class="profile-stat-value">${totalRead}</div>
      <div class="profile-stat-label">Livres terminés</div>
    </div>
    <div class="profile-stat-card">
      <div class="profile-stat-icon">\ud83d\udcd6</div>
      <div class="profile-stat-value">${readingCount}</div>
      <div class="profile-stat-label">En cours de lecture</div>
    </div>
    <div class="profile-stat-card">
      <div class="profile-stat-icon">❤\ufe0f</div>
      <div class="profile-stat-value">${favCount}</div>
      <div class="profile-stat-label">Favoris</div>
    </div>
    ${p.readingGoal ? `
    <div class="profile-stat-card">
      <div class="profile-stat-icon">\ud83c\udfaf</div>
      <div class="profile-stat-value">${goalPct}%</div>
      <div class="profile-stat-label">Objectif ${p.readingGoal} livres/an</div>
      <div class="profile-goal-bar-wrap"><div class="profile-goal-bar" style="width:${goalPct}%"></div></div>
    </div>` : ''}
  `;

  // Formulaire
  document.getElementById('profileName').value = p.name || '';
  document.getElementById('profileAvatarEmoji').value = p.avatar || '';
  document.getElementById('profileBio').value = p.bio || '';
  document.getElementById('profileFavoriteGenre').value = p.favoriteGenre || '';
  document.getElementById('profileReadingGoal').value = p.readingGoal || '';

  // Emoji presets
  const presetsEl = document.getElementById('emojiPresets');
  presetsEl.innerHTML = EMOJI_PRESETS.map(em => `
    <button type="button" class="emoji-preset-btn ${p.avatar === em ? 'active' : ''}" data-emoji="${em}">${em}</button>
  `).join('');

  // Lectures récentes
  const recentEl = document.getElementById('profileRecentReads');
  const recentEmptyEl = document.getElementById('profileRecentEmpty');
  const booksWithProgress = books
    .filter(b => allProg[b.id] && allProg[b.id].percent > 0)
    .sort((a, b) => {
      const da = allProg[a.id]?.lastReadAt || '';
      const db = allProg[b.id]?.lastReadAt || '';
      return db.localeCompare(da);
    })
    .slice(0, 8);

  recentEmptyEl.hidden = booksWithProgress.length > 0;
  recentEl.innerHTML = booksWithProgress.map(b => {
    const prog = allProg[b.id];
    const statusLabel = prog.isFinished ? 'Terminé ✓' : 'En cours';
    const thumbHTML = b.cover
      ? `<div class="profile-read-thumb"><img src="${escapeAttr(b.cover)}" alt="" loading="lazy" decoding="async" width="48" height="64" onerror="this.style.display='none'" /></div>`
      : `<div class="profile-read-thumb" style="background:${colorForCategory(b.category)};">${escapeHTML(b.title.slice(0,2))}</div>`;
    return `
      <div class="profile-read-item" data-id="${b.id}">
        ${thumbHTML}
        <div class="profile-read-info">
          <div class="profile-read-title">${escapeHTML(b.title)}</div>
          <div class="profile-read-author">${escapeHTML(b.author)}</div>
        </div>
        <div class="profile-read-progress">
          <span class="profile-read-percent">${prog.percent}%</span>
          <span class="profile-read-status">${statusLabel}</span>
        </div>
        <button class="btn btn-primary btn-sm profile-read-btn" data-action="read" data-id="${b.id}">${prog.isFinished ? 'Relire' : 'Continuer'}</button>
      </div>
    `;
  }).join('');

  // Favoris
  const favGrid = document.getElementById('profileFavoritesGrid');
  const favEmptyEl = document.getElementById('profileFavoritesEmpty');
  const favBooks = books.filter(b => favs.includes(b.id));
  favEmptyEl.hidden = favBooks.length > 0;
  favGrid.innerHTML = favBooks.map(b => {
    const spineBg = colorForCategory(b.category);
    const coverHTML = b.cover
      ? `<img src="${escapeAttr(b.cover)}" alt="${escapeAttr(b.title)}" loading="lazy" decoding="async" width="120" height="180" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
         <div class="profile-fav-fallback" style="background:${spineBg}; display:none;">
           <span>\ud83d\udcd6</span>
           <div class="fav-title">${escapeHTML(b.title)}</div>
         </div>`
      : `<div class="profile-fav-fallback" style="background:${spineBg};">
           <span>\ud83d\udcd6</span>
           <div class="fav-title">${escapeHTML(b.title)}</div>
         </div>`;
    return `
      <div class="profile-fav-card" data-id="${b.id}">
        <div class="profile-fav-cover">${coverHTML}</div>
        <div class="profile-fav-info">
          <div class="fav-book-title">${escapeHTML(b.title)}</div>
          <div class="fav-author">${escapeHTML(b.author)}</div>
        </div>
        <button class="profile-fav-read-btn" data-action="read" data-id="${b.id}">\ud83d\udcd6 Lire</button>
      </div>
    `;
  }).join('');

  updateSidebarProfile();
}

/** Couleur stable pour chaque catégorie */
function colorForCategory(category) {
  if (!category) return SPINE_COLORS[0];
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % SPINE_COLORS.length;
  return SPINE_COLORS[index];
}

/* ---------------------------------------------------------------------
   3) ÉTAT GLOBAL DE L'APPLICATION
   --------------------------------------------------------------------- */
let books = loadBooks();
let editingId = null;
let pendingDeleteId = null;

/* ---------------------------------------------------------------------
   3b) CATALOGUE CLOUD SUPABASE (lecture publique)
   --------------------------------------------------------------------- */
function isSupabaseConfigured() {
  return !!(window.SUPABASE_URL && window.SUPABASE_ANON_KEY &&
    !window.SUPABASE_URL.includes("VOTRE") && !window.SUPABASE_ANON_KEY.includes("VOTRE") &&
    window.supabase && window.supabase.createClient);
}

function mapCloudBook(r) {
  return {
    id: r.biblio_id || r.id,
    isbn: r.isbn || "",
    title: r.title || "",
    author: r.author || "",
    category: r.category || "",
    year: r.year ?? null,
    language: r.language || "",
    description: r.description || "",
    maxCopies: r.max_copies ?? 1,
    copies: r.copies ?? 1,
    cover: r.cover_url || "",
    contentType: r.content_type || "text",
    content: r.content || "",
    pdfData: r.pdf_data || undefined,
    pdfUrl: r.file_url || undefined,
    pages: r.pages || undefined,
    _needsHeavy: r.content == null && r.pdf_data == null && r.pages == null
  };
}

const CLOUD_LIST_COLS = "biblio_id,isbn,title,author,category,year,language,description,max_copies,copies,cover_url,content_type,file_url";
const CLOUD_CACHE_KEY = "biblio_cloud_catalog";
const CLOUD_CACHE_TS_KEY = "biblio_cloud_catalog_ts";
const CLOUD_CACHE_TTL = 5 * 60 * 1000;
let _supaClient = null;

function getSupabaseClient() {
  if (!_supaClient && isSupabaseConfigured()) {
    _supaClient = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
  }
  return _supaClient;
}

function saveCloudCatalogCache(list) {
  try {
    sessionStorage.setItem(CLOUD_CACHE_KEY, JSON.stringify(list));
    sessionStorage.setItem(CLOUD_CACHE_TS_KEY, String(Date.now()));
  } catch (e) {}
}

function loadCloudCatalogCache() {
  try {
    const raw = sessionStorage.getItem(CLOUD_CACHE_KEY);
    const ts = parseInt(sessionStorage.getItem(CLOUD_CACHE_TS_KEY) || "0", 10);
    if (!raw || !ts || Date.now() - ts > CLOUD_CACHE_TTL) return null;
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : null;
  } catch (e) { return null; }
}

function invalidateCloudCatalogCache() {
  try {
    sessionStorage.removeItem(CLOUD_CACHE_KEY);
    sessionStorage.removeItem(CLOUD_CACHE_TS_KEY);
  } catch (e) {}
}

// Stratégie : cache session -> affichage immédiat -> refresh en arrière-plan
async function initCloudCatalog() {
  const client = getSupabaseClient();
  if (!client) return;
  _catalogLoading = true;

  const cached = loadCloudCatalogCache();
  if (cached && cached.length) {
    books = cached;
    renderAll();
  } else if (!books.length) {
    showListSkeleton();
  }

  try {
    const { data, error } = await client.from("books").select(CLOUD_LIST_COLS).order("created_at", { ascending: true });
    if (error) {
      console.warn("[Supabase] Erreur catalogue :", error.message);
      return;
    }
    const list = (data || []).map(mapCloudBook).filter(b => b.id && b.title);
    saveCloudCatalogCache(list);
    const sig = l => JSON.stringify(l.map(b => b.id + "|" + b.title + "|" + b.author + "|" + b.copies + "|" + b.category));
    const changed = sig(list) !== sig(books);
    books = list.length ? list : books;
    if (changed || !cached) renderAll();
  } catch (e) {
    console.warn("[Supabase] Catalogue cloud indisponible, utilisation du LocalStorage.", e);
  } finally {
    _catalogLoading = false;
    renderAll();
  }
}

// Charge à la demande les champs lourds (content, pdf_data, pages) d'un livre cloud
async function ensureBookHeavyContent(book) {
  if (!book || !book._needsHeavy) return book;
  // Rien à charger si le contenu utile est déjà présent (pdfUrl, pages, content)
  if (book.contentType === "pdf" && (book.pdfUrl || book.pdfData)) { book._needsHeavy = false; return book; }
  if (book.contentType === "images" && Array.isArray(book.pages) && book.pages.length) { book._needsHeavy = false; return book; }
  if (book.contentType === "text" && book.content) { book._needsHeavy = false; return book; }
  const client = getSupabaseClient();
  if (!client || !book.id) { book._needsHeavy = false; return book; }
  try {
    const { data, error } = await client.from("books")
      .select("content,pdf_data,pages")
      .eq("biblio_id", book.id)
      .maybeSingle();
    if (!error && data) {
      book.content = data.content || "";
      book.pdfData = data.pdf_data || undefined;
      book.pages = data.pages || undefined;
    }
  } catch (e) {
    console.warn("[Supabase] Chargement du contenu impossible pour", book.id, e);
  }
  book._needsHeavy = false;
  return book;
}



// Filtres de l'espace personnel
let personalFilter = "all"; // 'all', 'reading', 'finished', 'unread', 'favorites'
let personalQuery = "";
let personalCategory = "";
let personalSort = "recent";

// État de la liseuse active
let activeReadingBook = null;
let activeChapterIndex = 0;
let readerChapters = [];

/* ---------------------------------------------------------------------
   4) NAVIGATION
   --------------------------------------------------------------------- */
const VIEW_META = {
  dashboard: { title: "Tableau de bord", subtitle: "Vue d'ensemble de votre bibliothèque" },
  personal:  { title: "Ma Bibliothèque", subtitle: "Votre espace de lecture personnel et vos favoris" },
  profile:   { title: "Mon Profil", subtitle: "Vos statistiques, lectures récentes et favoris" },
  list:      { title: "Liste des livres", subtitle: "Rechercher, lire et emprunter des ouvrages" },
  borrow:    { title: "Emprunter", subtitle: "Sélectionner un livre disponible" },
  return:    { title: "Retourner", subtitle: "Enregistrer le retour d'un exemplaire" },
  stats:     { title: "Statistiques", subtitle: "Chiffres clés de la collection" },
};

function switchView(viewName) {
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  const targetView = document.getElementById("view-" + viewName);
  if (targetView) targetView.classList.add("active");

  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.view === viewName);
  });

  if (VIEW_META[viewName]) {
    document.getElementById("viewTitle").textContent = VIEW_META[viewName].title;
    document.getElementById("viewSubtitle").textContent = VIEW_META[viewName].subtitle;
  }

  // Animation d'apparition du titre + indicateur de nav glissant
  const tt = document.querySelector(".topbar-title");
  if (tt) { tt.classList.remove("tt-anim"); void tt.offsetWidth; tt.classList.add("tt-anim"); }
  updateNavIndicator();

  renderAll();
}

document.getElementById("mainNav").addEventListener("click", (e) => {
  const btn = e.target.closest(".nav-btn");
  if (!btn) return;
  switchView(btn.dataset.view);
});

/* ---------------------------------------------------------------------
   5) TOASTS & CONFIRMATIONS
   --------------------------------------------------------------------- */
function debounce(fn, ms) {
  let t = null;
  return function (...args) {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), ms);
  };
}

function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  const toast = document.createElement("div");
  toast.className = "toast " + type;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => { toast.classList.add("toast-out"); setTimeout(() => toast.remove(), 300); }, 2900);
}

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
   6) HELPER : RENDU DE COUVERTURE AVEC SECOURS VISUEL ÉLÉGANT
   --------------------------------------------------------------------- */
function renderCoverThumbHTML(book) {
  if (book.cover) {
    return `<div class="table-book-cover">
      <img src="${escapeAttr(book.cover)}" alt="${escapeAttr(book.title)}" loading="lazy" decoding="async" width="34" height="46" onerror="this.parentElement.innerHTML='📖'" />
    </div>`;
  }
  const bg = colorForCategory(book.category);
  return `<div class="table-book-cover" style="background:${bg}; color:#FFF; font-size:11px; font-weight:700;">
    ${escapeHTML(book.title.slice(0, 2).toUpperCase())}
  </div>`;
}

/* ---------------------------------------------------------------------
   7) PARSEUR DE TEXTE / CHAPITRES POUR LA LISEUSE
   --------------------------------------------------------------------- */
function parseBookChapters(book) {
  const defaultText = `--- Chapitre 1 : Début de l'ouvrage ---
Bienvenue dans la lecture de « ${book.title} » par ${book.author}.

Cet ouvrage fait partie de votre bibliothèque. Vous pouvez en savourer les chapitres à tout moment grâce à cette liseuse interactive.

Bonne lecture !`;

  const raw = book.content && book.content.trim() ? book.content : defaultText;
  const sections = raw.split(/^---/m);
  const chapters = [];

  sections.forEach((sec, idx) => {
    const trimmed = sec.trim();
    if (!trimmed) return;

    const lines = trimmed.split("\n");
    let title = `Chapitre ${chapters.length + 1}`;
    let bodyLines = lines;

    const firstLine = lines[0].replace(/^---|\s*---$/g, "").trim();
    if (firstLine.toLowerCase().startsWith("chapitre") || firstLine.toLowerCase().startsWith("fable") || firstLine.length < 80) {
      title = firstLine;
      bodyLines = lines.slice(1);
    }

    const htmlBody = bodyLines
      .join("\n")
      .trim()
      .split(/\n\s*\n/)
      .map(p => `<p>${escapeHTML(p.trim()).replace(/\n/g, "<br>")}</p>`)
      .join("");

    chapters.push({
      index: chapters.length,
      title: title,
      html: htmlBody || "<p>Contenu à venir...</p>"
    });
  });

  return chapters.length ? chapters : [{ index: 0, title: "Chapitre 1", html: `<p>${escapeHTML(raw)}</p>` }];
}

/* ---------------------------------------------------------------------
   8) MOTEUR DE LA LISEUSE (E-READER)
   --------------------------------------------------------------------- */
const readerOverlay = document.getElementById("readerOverlay");
const readerWindow = document.getElementById("readerWindow");
const readerTitle = document.getElementById("readerTitle");
const readerAuthor = document.getElementById("readerAuthor");
const readerChapterBadge = document.getElementById("readerChapterBadge");
const readerChapterTitle = document.getElementById("readerChapterTitle");
const readerArticle = document.getElementById("readerArticle");
const readerProgressBar = document.getElementById("readerProgressBar");
const readerFooterInfo = document.getElementById("readerFooterInfo");
const readerTocList = document.getElementById("readerTocList");
const readerTocSidebar = document.getElementById("readerTocSidebar");
const readerScrollArea = document.getElementById("readerScrollArea");

let readerSettings = loadReaderSettings();

function applyReaderSettings() {
  readerWindow.className = `reader-window theme-${readerSettings.theme || 'sepia'}`;
  document.querySelectorAll(".theme-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.theme === readerSettings.theme);
  });
  readerArticle.style.setProperty("--reader-font-size", (readerSettings.fontSize || 18) + "px");
  readerArticle.classList.toggle("font-serif", !!readerSettings.fontSerif);
  readerArticle.classList.toggle("font-sans", !readerSettings.fontSerif);
}

async function openReader(bookId, targetChapter = null) {
  const book = books.find(b => b.id === bookId);
  if (!book) return;
  await ensureBookHeavyContent(book); // contenu chargé à la demande (livres cloud)

  activeReadingBook = book;
  const prog = getBookProgress(book.id);
  const ct = book.contentType || "text";

  readerTitle.textContent = book.title;
  readerAuthor.textContent = book.author + (book.year ? " (" + book.year + ")" : "");

  applyReaderSettings();
  readerOverlay.hidden = false;
  document.body.style.overflow = "hidden";

  // Réinitialiser l'état de progression et fermer les panneaux latéraux
  _readerProgressDirty = false;
  _readerFinishedFlag = false;
  _searchMatches = [];
  readerTocSidebar.hidden = true;
  document.getElementById("readerBookmarksSidebar").hidden = true;
  document.getElementById("readerSearchBar").hidden = true;
  document.getElementById("readerSearchCount").textContent = "";

  if (ct === "pdf") {
    openPdfReader(book, prog);
  } else if (ct === "images") {
    openImagesReader(book, prog);
  } else {
    // Mode texte (par défaut)
    readerChapters = parseBookChapters(book);
    if (targetChapter !== null) {
      activeChapterIndex = Math.max(0, Math.min(targetChapter, readerChapters.length - 1));
    } else {
      activeChapterIndex = Math.max(0, Math.min(prog.chapter || 0, readerChapters.length - 1));
    }

    // S'assurer que les panneaux texte sont visibles
    document.getElementById("readerScrollArea").hidden = false;
    document.getElementById("readerPdfArea").hidden = true;
    document.getElementById("readerImagesArea").hidden = true;
    document.getElementById("readerTextControls").hidden = false;
    document.getElementById("readerPageControls").hidden = true;
    document.getElementById("readerThemeControls").hidden = false;
    const tocToggle = document.getElementById("readerTocToggle");
    if (tocToggle) tocToggle.hidden = false;

    renderTocSidebar();
    renderActiveChapter();
  }
}

function closeReader() {
  if (activeReadingBook && _readerProgressDirty && !_readerFinishedFlag) {
    updateProgressAndSave();
  }
  readerOverlay.hidden = true;
  document.body.style.overflow = "";
  const wrap = document.getElementById("readerPdfCanvasWrap");
  if (wrap) wrap.style.backgroundImage = "";
  activeReadingBook = null;
  renderAll();
}

function renderTocSidebar() {
  readerTocList.innerHTML = readerChapters.map((ch, idx) => `
    <li class="reader-toc-item ${idx === activeChapterIndex ? 'active' : ''}" data-idx="${idx}">
      ${escapeHTML(ch.title)}
    </li>
  `).join("");
}

function renderActiveChapter() {
  if (!readerChapters[activeChapterIndex]) return;
  const ch = readerChapters[activeChapterIndex];

  readerChapterBadge.textContent = `Section ${activeChapterIndex + 1} / ${readerChapters.length}`;
  readerChapterTitle.textContent = ch.title;
  readerArticle.innerHTML = ch.html;

  document.getElementById("readerPrevChapterBtn").disabled = activeChapterIndex <= 0;
  document.getElementById("readerNextChapterBtn").disabled = activeChapterIndex >= readerChapters.length - 1;
  readerScrollArea.scrollTop = 0;
  updateReadingProgressUI();
  renderTocSidebar();
}

function updateReadingProgressUI() {
  if (!activeReadingBook || !readerChapters.length) return;
  const total = readerChapters.length;
  const percent = Math.min(100, Math.round(((activeChapterIndex + 1) / total) * 100));
  readerProgressBar.style.width = percent + "%";
  readerFooterInfo.textContent = `Chapitre ${activeChapterIndex + 1} sur ${total} · ${percent}% lu`;
  // Floating progress indicator
  const floatEl = document.getElementById("readerFloatingProgress");
  if (floatEl) {
    floatEl.textContent = percent + "%";
    floatEl.classList.add("visible");
    clearTimeout(floatEl._hideTimer);
    floatEl._hideTimer = setTimeout(() => floatEl.classList.remove("visible"), 2000);
  }
}

function updateProgressAndSave(isFinished = false) {
  if (!activeReadingBook) return;
  if (!isFinished && !_readerProgressDirty) return;
  const ct = activeReadingBook.contentType || "text";
  if (ct === "pdf" || ct === "images") {
    const total = ct === "pdf" ? (_pdfDoc?.numPages || activeReadingBook.pageCount || 1) : _imagesPages.length;
    let percent = Math.min(100, Math.round((_currentPage / total) * 100));
    if (isFinished) percent = 100;
    setBookProgress(activeReadingBook.id, { percent, chapter: _currentPage - 1, isFinished: isFinished || percent === 100 });
  } else {
    if (!readerChapters.length) return;
    const total = readerChapters.length;
    let percent = Math.min(100, Math.round(((activeChapterIndex + 1) / total) * 100));
    if (isFinished) percent = 100;
    setBookProgress(activeReadingBook.id, { percent, chapter: activeChapterIndex, isFinished: isFinished || percent === 100 });
  }
}

// ---------- Mode PDF NATIF ----------
// Variables de contrôle du rendu
let _currentRenderTask = null;
let _isRendering = false;
let _pdfDoc = null;
let _currentPage = 1;
let _pdfPagesSeen = new Set();

// Cache des documents pdf.js : la réouverture d'un livre déjà consulté est quasi instantanée
const _pdfDocCache = new Map();
const PDF_DOC_CACHE_MAX = 3;

async function getPdfDocument(book) {
  const key = book.id + "|" + (book.pdfUrl || "data");
  const hit = _pdfDocCache.get(key);
  if (hit) { hit.lastUsed = Date.now(); return hit.promise; }

  let promise;
  const cMap = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/";
  if (book.pdfUrl) {
    // Chargement progressif : pdf.js ne télécharge que les plages nécessaires (Range requests, supportées par Supabase Storage)
    promise = pdfjsLib.getDocument({
      url: book.pdfUrl,
      disableAutoFetch: true,
      disableStream: false,
      rangeChunkSize: 262144,
      cMapUrl: cMap,
      cMapPacked: true
    }).promise;
  } else {
    const base64Str = book.pdfData.includes(",") ? book.pdfData.split(",")[1] : book.pdfData;
    const binaryStr = atob(base64Str);
    const uint8 = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) uint8[i] = binaryStr.charCodeAt(i);
    promise = pdfjsLib.getDocument({ data: uint8, cMapUrl: cMap, cMapPacked: true }).promise;
  }

  const entry = { promise, lastUsed: Date.now() };
  _pdfDocCache.set(key, entry);
  promise.catch(() => { if (_pdfDocCache.get(key) === entry) _pdfDocCache.delete(key); });

  // Éviction LRU : on garde au plus PDF_DOC_CACHE_MAX documents en mémoire
  if (_pdfDocCache.size > PDF_DOC_CACHE_MAX) {
    let oldestKey = null, oldest = Infinity;
    _pdfDocCache.forEach((v, k) => { if (v.lastUsed < oldest) { oldest = v.lastUsed; oldestKey = k; } });
    const old = _pdfDocCache.get(oldestKey);
    _pdfDocCache.delete(oldestKey);
    if (old) old.promise.then((d) => d.destroy()).catch(() => {});
  }
  return promise;
}

// Préchargement anticipé : réchauffe le cache HTTP (Range 0-512 Ko) puis initialise pdf.js
const _pdfPrefetchTimers = new Map();
function prefetchBookPdf(book) {
  if (!book || (book.contentType || "text") !== "pdf" || (!book.pdfUrl && !book.pdfData)) return;
  const key = book.id + "|" + (book.pdfUrl || "data");
  if (_pdfDocCache.has(key) || _pdfPrefetchTimers.has(book.id)) return;
  _pdfPrefetchTimers.set(book.id, setTimeout(() => {
    _pdfPrefetchTimers.delete(book.id);
    if (book.pdfUrl) {
      try { fetch(book.pdfUrl, { headers: { Range: "bytes=0-524287" } }).catch(() => {}); } catch (e) {}
    }
    getPdfDocument(book).catch(() => {});
  }, 200));
}
let _pdfZoom = 1.0;
let _imagesPages = [];
let _readerProgressDirty = false;
let _readerFinishedFlag = false;

async function openPdfReader(book, prog) {
  document.getElementById("readerScrollArea").hidden = true;
  document.getElementById("readerPdfArea").hidden = false;
  document.getElementById("readerImagesArea").hidden = true;
  document.getElementById("readerTextControls").hidden = true;
  document.getElementById("readerPageControls").hidden = false;
  document.getElementById("readerThemeControls").hidden = true;
  document.getElementById("readerTocToggle").hidden = true;

  // Annuler tout rendu en cours
  if (_currentRenderTask) {
    try { _currentRenderTask.cancel(); } catch(e) {}
    _currentRenderTask = null;
  }
  _isRendering = false;
  _pdfDoc = null;
  _pdfPagesSeen.clear();

  // Aperçu instantané : la couverture s'affiche en fond pendant le chargement
  const pdfWrap = document.getElementById("readerPdfCanvasWrap");
  if (pdfWrap) {
    pdfWrap.style.backgroundImage = book.cover ? `url('${escapeAttr(book.cover)}')` : "";
    pdfWrap.style.backgroundSize = "cover";
    pdfWrap.style.backgroundPosition = "center";
  }

  // Réinitialiser le canvas
  const canvas = document.getElementById("readerPdfCanvas");
  if (canvas) {
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, 1, 1);
  }

  _currentPage = Math.max(1, (prog.chapter || 0) + 1);
  _pdfZoom = 1.0;
  updateZoomLabel();

  const totalPages = book.pageCount || 1;
  document.getElementById("readerPageTotal").textContent = `/ ${totalPages}`;
  document.getElementById("readerPageInput").max = totalPages;
  document.getElementById("readerPageInput").value = _currentPage;
  updatePdfProgressUI(_currentPage, totalPages);

  if (!book.pdfData && !book.pdfUrl) {
    document.getElementById("readerPdfCanvasWrap").innerHTML = `<p class="empty-state">⚠️ Données PDF introuvables.</p>`;
    return;
  }

  try {
    document.getElementById("readerPdfLoading").hidden = false;

    _pdfDoc = await getPdfDocument(book); // doc mis en cache + chargement progressif (Range)

    document.getElementById("readerPdfLoading").hidden = true;
    document.getElementById("readerPageTotal").textContent = `/ ${_pdfDoc.numPages}`;
    document.getElementById("readerPageInput").max = _pdfDoc.numPages;
    await renderPdfPage(_currentPage);
  } catch (err) {
    document.getElementById("readerPdfLoading").hidden = true;
    showToast("Erreur lors de l'ouverture du PDF : " + (err.message || err), "error");
    console.error("[PDF Lecteur] openPdfReader error:", err);
  }
}

async function renderPdfPage(pageNum) {
  if (!_pdfDoc) return;

  // Annuler le rendu précédent s'il est encore en cours
  if (_currentRenderTask) {
    try { _currentRenderTask.cancel(); } catch(e) {}
    _currentRenderTask = null;
  }
  if (_isRendering) {
    _isRendering = false;
  }

  document.getElementById("readerPdfLoading").hidden = false;
  _isRendering = true;

  try {
    const page = await _pdfDoc.getPage(pageNum);
    const canvas = document.getElementById("readerPdfCanvas");
    const ctx = canvas.getContext("2d");
    const container = document.getElementById("readerPdfArea");

    // Attendre le prochain frame pour s'assurer que le layout est calculé
    await new Promise(r => requestAnimationFrame(r));

    // Mesurer les dimensions disponibles avec fallback robuste
    let availW = container.clientWidth - 48;
    let availH = container.clientHeight - 48;

    // Fallback si le conteneur n'a pas encore de dimensions
    if (availW <= 0) availW = window.innerWidth * 0.80 - 48;
    if (availH <= 0) availH = window.innerHeight * 0.75 - 48;

    const raw = page.getViewport({ scale: 1 });

    // Calculer l'échelle pour remplir la zone disponible
    const scaleW = availW / raw.width;
    const scaleH = availH / raw.height;
    const scaleToFit = Math.min(scaleW, scaleH, 2.0);

    // Vérification de sécurité (éviter NaN ou 0)
    const finalScale = (isFinite(scaleToFit) && scaleToFit > 0) ? scaleToFit * _pdfZoom : _pdfZoom;

    const dpr = Math.min(window.devicePixelRatio || 1, 2); // résolution adaptée à l'écran, plafonnée
    const viewport = page.getViewport({ scale: finalScale });

    // Dimensions physiques du canvas (haute résolution pour écrans Retina)
    canvas.width = Math.floor(viewport.width * dpr);
    canvas.height = Math.floor(viewport.height * dpr);

    // Dimensions CSS du canvas (taille d'affichage réelle)
    canvas.style.width = Math.floor(viewport.width) + "px";
    canvas.style.height = Math.floor(viewport.height) + "px";

    // Viewport haute résolution pour PDF.js (méthode officielle pour DPR)
    const vpHR = page.getViewport({ scale: finalScale * dpr });

    // Lancer le rendu
    _currentRenderTask = page.render({ canvasContext: ctx, viewport: vpHR });
    await _currentRenderTask.promise;
    _currentRenderTask = null;
    _isRendering = false;

    document.getElementById("readerPdfLoading").hidden = true;
    _currentPage = pageNum;
    document.getElementById("readerPageInput").value = pageNum;
    updatePdfProgressUI(pageNum, _pdfDoc.numPages);
    updateProgressAndSave();

    // Précharge les 2 pages adjacentes et libère les pages éloignées de la mémoire
    for (let d = -2; d <= 2; d++) {
      const p = pageNum + d;
      if (p >= 1 && p <= _pdfDoc.numPages) _pdfDoc.getPage(p).catch(() => {});
    }
    _pdfPagesSeen.add(pageNum);
    for (const p of [..._pdfPagesSeen]) {
      if (Math.abs(p - pageNum) > 4) {
        _pdfDoc.getPage(p).then((pg) => pg.cleanup()).catch(() => {});
        _pdfPagesSeen.delete(p);
      }
    }
  } catch (err) {
    _currentRenderTask = null;
    _isRendering = false;
    document.getElementById("readerPdfLoading").hidden = true;
    // Ne pas afficher d'erreur si le rendu a été annulé volontairement
    if (err && err.name !== 'RenderingCancelledException') {
      console.error("[PDF Lecteur] Erreur rendu page", pageNum, ":", err);
    }
  }
}

function updatePdfProgressUI(page, total) {
  const pct = Math.min(100, Math.round((page / total) * 100));
  readerProgressBar.style.width = pct + "%";
  readerFooterInfo.textContent = `Page ${page} / ${total} · ${pct}% lu`;
}

function updateZoomLabel() {
  document.getElementById("readerZoomLabel").textContent = Math.round(_pdfZoom * 100) + "%";
}

// ---------- Mode IMAGES ----------
function openImagesReader(book, prog) {
  document.getElementById("readerScrollArea").hidden = true;
  document.getElementById("readerPdfArea").hidden = true;
  document.getElementById("readerImagesArea").hidden = false;
  document.getElementById("readerTextControls").hidden = true;
  document.getElementById("readerPageControls").hidden = false;
  document.getElementById("readerThemeControls").hidden = true;
  document.getElementById("readerTocToggle").hidden = true;

  // Clear previous image
  document.getElementById("readerCurrentImage").src = "";

  _imagesPages = book.pages || [];
  _currentPage = Math.max(1, (prog.chapter || 0) + 1);
  _pdfZoom = 1.0;
  updateZoomLabel();

  const total = _imagesPages.length;
  document.getElementById("readerPageTotal").textContent = `/ ${total}`;
  document.getElementById("readerPageInput").max = total;
  renderImagePage(_currentPage);
}

function renderImagePage(pageNum) {
  if (!_imagesPages.length) return;
  _currentPage = Math.max(1, Math.min(pageNum, _imagesPages.length));
  const img = document.getElementById("readerCurrentImage");
  img.src = _imagesPages[_currentPage - 1];
  img.style.transform = `scale(${_pdfZoom})`;
  img.style.transformOrigin = "top center";
  document.getElementById("readerPageInput").value = _currentPage;
  const total = _imagesPages.length;
  const pct = Math.min(100, Math.round((_currentPage / total) * 100));
  readerProgressBar.style.width = pct + "%";
  readerFooterInfo.textContent = `Page ${_currentPage} / ${total} · ${pct}% lu`;
  updateProgressAndSave();
}

// ---------- MARQUE-PAGES ----------
const BOOKMARKS_KEY = "biblio_bookmarks";

function loadBookmarks(bookId) {
  try { return JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || "{}")[bookId] || []; }
  catch { return []; }
}

function saveBookmarks(bookId, marks) {
  try {
    const all = JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || "{}");
    all[bookId] = marks;
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(all));
  } catch {}
}

function addBookmark() {
  if (!activeReadingBook) return;
  const ct = activeReadingBook.contentType || "text";
  const page = (ct === "text") ? (activeChapterIndex + 1) : _currentPage;
  const label = (ct === "text") ? (readerChapters[activeChapterIndex]?.title || `Chapitre ${page}`) : `Page ${page}`;
  const marks = loadBookmarks(activeReadingBook.id);
  if (marks.find(m => m.page === page)) { showToast("Marque-page déjà présent.", "info"); return; }
  marks.push({ page, label });
  saveBookmarks(activeReadingBook.id, marks);
  renderBookmarksList();
  showToast(`🔖 Marque-page : ${label}`, "success");
}

function renderBookmarksList() {
  if (!activeReadingBook) return;
  const marks = loadBookmarks(activeReadingBook.id);
  const list = document.getElementById("readerBookmarksList");
  const empty = document.getElementById("readerBookmarksEmpty");
  empty.hidden = marks.length > 0;
  list.innerHTML = marks.map((m, idx) => `
    <li class="reader-toc-item reader-bookmark-item" data-page="${m.page}" data-idx="${idx}">
      <span>🔖 ${escapeHTML(m.label)}</span>
      <button class="bookmark-remove-btn" data-idx="${idx}">✕</button>
    </li>`).join("");

  list.querySelectorAll(".reader-bookmark-item").forEach(li => {
    li.addEventListener("click", async (e) => {
      if (e.target.classList.contains("bookmark-remove-btn")) {
        const i = parseInt(e.target.dataset.idx, 10);
        const m = loadBookmarks(activeReadingBook.id);
        m.splice(i, 1);
        saveBookmarks(activeReadingBook.id, m);
        renderBookmarksList();
        return;
      }
      const page = parseInt(li.dataset.page, 10);
      const ct = activeReadingBook.contentType || "text";
      _readerProgressDirty = true;
      if (ct === "text") { activeChapterIndex = Math.max(0, page - 1); renderActiveChapter(); }
      else if (ct === "pdf") await renderPdfPage(page);
      else if (ct === "images") renderImagePage(page);
      document.getElementById("readerBookmarksSidebar").hidden = true;
    });
  });
}

// ---------- RECHERCHE ----------
let _searchMatches = [], _searchCurrentIdx = 0;

function performSearch(query) {
  const count = document.getElementById("readerSearchCount");
  const ct = activeReadingBook?.contentType || "text";
  if (!query.trim() || ct !== "text") { count.textContent = ""; _searchMatches = []; return; }
  _searchMatches = readerChapters
    .map((ch, idx) => ({ idx, text: ch.html.replace(/<[^>]+>/g, " ") }))
    .filter(r => r.text.toLowerCase().includes(query.toLowerCase()))
    .map(r => r.idx);
  count.textContent = _searchMatches.length ? `${_searchMatches.length} chapitre(s)` : "Aucun résultat";
  _searchCurrentIdx = 0;
  if (_searchMatches.length) navigateSearchResult(0);
}

function navigateSearchResult(delta) {
  if (!_searchMatches.length) return;
  _readerProgressDirty = true;
  _searchCurrentIdx = (_searchCurrentIdx + delta + _searchMatches.length) % _searchMatches.length;
  activeChapterIndex = _searchMatches[_searchCurrentIdx];
  renderActiveChapter();
  document.getElementById("readerSearchCount").textContent =
    `${_searchCurrentIdx + 1} / ${_searchMatches.length}`;
}

// ========== ÉVÉNEMENTS LISEUSE ==========
document.getElementById("readerCloseBtn").addEventListener("click", closeReader);

document.getElementById("readerPrevChapterBtn").addEventListener("click", () => {
  if (activeChapterIndex > 0) { activeChapterIndex--; _readerProgressDirty = true; renderActiveChapter(); updateProgressAndSave(); }
});
document.getElementById("readerNextChapterBtn").addEventListener("click", () => {
  if (activeChapterIndex < readerChapters.length - 1) { activeChapterIndex++; _readerProgressDirty = true; renderActiveChapter(); updateProgressAndSave(); }
});
document.getElementById("readerMarkFinishedBtn").addEventListener("click", () => {
  updateProgressAndSave(true);
  _readerFinishedFlag = true;
  showToast(`Félicitations ! Vous avez terminé « ${activeReadingBook.title} ».`, "success");
  closeReader();
});
document.getElementById("readerResetProgressBtn").addEventListener("click", () => {
  if (confirm("Réinitialiser votre progression sur ce livre ?")) {
    setBookProgress(activeReadingBook.id, { percent: 0, chapter: 0, isFinished: false });
    _readerProgressDirty = false;
    _readerFinishedFlag = false;
    _currentPage = 1;
    const ct = activeReadingBook?.contentType || "text";
    if (ct === "pdf") renderPdfPage(1);
    else if (ct === "images") renderImagePage(1);
    else { activeChapterIndex = 0; renderActiveChapter(); }
    showToast("Progression réinitialisée.", "info");
  }
});

// Navigation par page (PDF/Images)
document.getElementById("readerPagePrev").addEventListener("click", async () => {
  if (_currentPage <= 1) return;
  _readerProgressDirty = true;
  const ct = activeReadingBook?.contentType;
  if (ct === "pdf") await renderPdfPage(_currentPage - 1);
  else if (ct === "images") renderImagePage(_currentPage - 1);
});
document.getElementById("readerPageNext").addEventListener("click", async () => {
  const ct = activeReadingBook?.contentType;
  const total = ct === "pdf" ? (_pdfDoc?.numPages || 1) : _imagesPages.length;
  if (_currentPage >= total) return;
  _readerProgressDirty = true;
  if (ct === "pdf") await renderPdfPage(_currentPage + 1);
  else if (ct === "images") renderImagePage(_currentPage + 1);
});
document.getElementById("readerPageInput").addEventListener("change", async (e) => {
  const p = parseInt(e.target.value, 10);
  if (isNaN(p)) return;
  _readerProgressDirty = true;
  const ct = activeReadingBook?.contentType;
  if (ct === "pdf") await renderPdfPage(p);
  else if (ct === "images") renderImagePage(p);
});

// Zoom
document.getElementById("readerZoomIn").addEventListener("click", async () => {
  _pdfZoom = Math.min(3.0, _pdfZoom + 0.25); updateZoomLabel();
  const ct = activeReadingBook?.contentType;
  if (ct === "pdf") await renderPdfPage(_currentPage);
  else if (ct === "images") renderImagePage(_currentPage);
});
document.getElementById("readerZoomOut").addEventListener("click", async () => {
  _pdfZoom = Math.max(0.5, _pdfZoom - 0.25); updateZoomLabel();
  const ct = activeReadingBook?.contentType;
  if (ct === "pdf") await renderPdfPage(_currentPage);
  else if (ct === "images") renderImagePage(_currentPage);
});
document.getElementById("readerPdfArea").addEventListener("wheel", async (e) => {
  if (!e.ctrlKey) return;
  e.preventDefault();
  _pdfZoom = Math.max(0.5, Math.min(3.0, _pdfZoom + (e.deltaY < 0 ? 0.1 : -0.1)));
  updateZoomLabel();
  if (activeReadingBook?.contentType === "pdf") await renderPdfPage(_currentPage);
}, { passive: false });
document.getElementById("readerImagesArea").addEventListener("wheel", (e) => {
  if (!e.ctrlKey) return;
  e.preventDefault();
  _pdfZoom = Math.max(0.5, Math.min(3.0, _pdfZoom + (e.deltaY < 0 ? 0.1 : -0.1)));
  updateZoomLabel();
  renderImagePage(_currentPage);
}, { passive: false });

// Sommaire
document.getElementById("readerTocToggle").addEventListener("click", () => {
  readerTocSidebar.hidden = !readerTocSidebar.hidden;
  document.getElementById("readerBookmarksSidebar").hidden = true;
});
document.getElementById("readerTocClose").addEventListener("click", () => { readerTocSidebar.hidden = true; });
readerTocList.addEventListener("click", (e) => {
  const item = e.target.closest(".reader-toc-item");
  if (!item) return;
  activeChapterIndex = parseInt(item.dataset.idx, 10);
  _readerProgressDirty = true;
  renderActiveChapter();
  updateProgressAndSave();
  if (window.innerWidth < 800) readerTocSidebar.hidden = true;
});

// Marque-pages
document.getElementById("readerBookmarkBtn").addEventListener("click", addBookmark);
document.getElementById("readerBookmarkListToggle").addEventListener("click", () => {
  const sb = document.getElementById("readerBookmarksSidebar");
  sb.hidden = !sb.hidden;
  if (!sb.hidden) { renderBookmarksList(); readerTocSidebar.hidden = true; }
});
document.getElementById("readerBookmarksSidebarClose").addEventListener("click", () => {
  document.getElementById("readerBookmarksSidebar").hidden = true;
});

// Recherche
document.getElementById("readerSearchToggle").addEventListener("click", () => {
  const bar = document.getElementById("readerSearchBar");
  bar.hidden = !bar.hidden;
  if (!bar.hidden) document.getElementById("readerSearchInput").focus();
});
document.getElementById("readerSearchClose").addEventListener("click", () => {
  document.getElementById("readerSearchBar").hidden = true;
  document.getElementById("readerSearchCount").textContent = "";
});
document.getElementById("readerSearchInput").addEventListener("input", (e) => performSearch(e.target.value));
document.getElementById("readerSearchPrev").addEventListener("click", () => navigateSearchResult(-1));
document.getElementById("readerSearchNext").addEventListener("click", () => navigateSearchResult(1));

// Thème / police
document.querySelectorAll(".theme-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    readerSettings.theme = btn.dataset.theme;
    saveReaderSettings(readerSettings);
    applyReaderSettings();
  });
});
document.getElementById("readerFontInc").addEventListener("click", () => {
  readerSettings.fontSize = Math.min(28, (readerSettings.fontSize || 18) + 2);
  saveReaderSettings(readerSettings);
  applyReaderSettings();
});
document.getElementById("readerFontDec").addEventListener("click", () => {
  readerSettings.fontSize = Math.max(13, (readerSettings.fontSize || 18) - 2);
  saveReaderSettings(readerSettings);
  applyReaderSettings();
});
document.getElementById("readerFontFamily").addEventListener("click", () => {
  readerSettings.fontSerif = !readerSettings.fontSerif;
  saveReaderSettings(readerSettings);
  applyReaderSettings();
  showToast(readerSettings.fontSerif ? "Police Serif activée" : "Police Sans-Serif activée", "info");
});

// Plein écran
document.getElementById("readerFullscreenBtn").addEventListener("click", () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
});

// Raccourci Échap
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !readerOverlay.hidden) {
    closeReader();
  }
});

/* ---------------------------------------------------------------------
   9) RENDU : VUE "MA BIBLIOTHÈQUE" (ESPACE PERSONNEL)
   --------------------------------------------------------------------- */
const readingFilterPills = document.getElementById("readingFilterPills");
const personalSearchInput = document.getElementById("personalSearchInput");
const personalCategorySelect = document.getElementById("personalCategorySelect");
const personalSortSelect = document.getElementById("personalSortSelect");

readingFilterPills.addEventListener("click", (e) => {
  const btn = e.target.closest(".pill-btn");
  if (!btn) return;
  personalFilter = btn.dataset.filter;
  document.querySelectorAll("#readingFilterPills .pill-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  renderPersonalView();
});

personalSearchInput.addEventListener("input", debounce((e) => {
  personalQuery = e.target.value.trim().toLowerCase();
  renderPersonalView();
}, 250));

personalCategorySelect.addEventListener("change", (e) => {
  personalCategory = e.target.value;
  renderPersonalView();
});

personalSortSelect.addEventListener("change", (e) => {
  personalSort = e.target.value;
  renderPersonalView();
});

function getPersonalFilteredBooks() {
  const favs = loadFavorites();
  const allProg = loadReadingProgress();

  let list = books.filter(b => {
    const prog = allProg[b.id] || { percent: 0, isFinished: false };
    const matchesQuery = !personalQuery ||
      (b.title || "").toLowerCase().includes(personalQuery) ||
      (b.author || "").toLowerCase().includes(personalQuery) ||
      (b.category || "").toLowerCase().includes(personalQuery);

    const matchesCategory = !personalCategory || b.category === personalCategory;

    let matchesFilter = true;
    if (personalFilter === "reading") {
      matchesFilter = prog.percent > 0 && !prog.isFinished;
    } else if (personalFilter === "finished") {
      matchesFilter = prog.isFinished || prog.percent === 100;
    } else if (personalFilter === "unread") {
      matchesFilter = !prog.percent || prog.percent === 0;
    } else if (personalFilter === "favorites") {
      matchesFilter = favs.includes(b.id);
    }

    return matchesQuery && matchesCategory && matchesFilter;
  });

  // Tri
  if (personalSort === "alpha") {
    list.sort((a, b) => a.title.localeCompare(b.title, "fr"));
  } else if (personalSort === "author") {
    list.sort((a, b) => a.author.localeCompare(b.author, "fr"));
  } else if (personalSort === "progress") {
    list.sort((a, b) => (allProg[b.id]?.percent || 0) - (allProg[a.id]?.percent || 0));
  } else if (personalSort === "recent") {
    list.sort((a, b) => {
      const dateA = allProg[a.id]?.lastReadAt || "";
      const dateB = allProg[b.id]?.lastReadAt || "";
      return dateB.localeCompare(dateA);
    });
  }

  return list;
}

function renderPersonalView() {
  const favs = loadFavorites();
  const allProg = loadReadingProgress();
  const grid = document.getElementById("personalBooksGrid");
  const emptyState = document.getElementById("personalEmptyState");

  // Mise à jour des compteurs sur les badges
  const totalCount = books.length;
  const readingCount = books.filter(b => (allProg[b.id]?.percent > 0 && !allProg[b.id]?.isFinished)).length;
  const finishedCount = books.filter(b => allProg[b.id]?.isFinished || allProg[b.id]?.percent === 100).length;
  const unreadCount = books.filter(b => !allProg[b.id] || allProg[b.id]?.percent === 0).length;
  const favoritesCount = books.filter(b => favs.includes(b.id)).length;

  document.getElementById("count-all").textContent = totalCount;
  document.getElementById("count-reading").textContent = readingCount;
  document.getElementById("count-finished").textContent = finishedCount;
  document.getElementById("count-unread").textContent = unreadCount;
  document.getElementById("count-favorites").textContent = favoritesCount;

  // Stat pills de l'en-tête
  const heroStats = document.getElementById("personalStatsPills");
  heroStats.innerHTML = `
    <div class="personal-stat-pill"><strong>${finishedCount}</strong><span>Lus</span></div>
    <div class="personal-stat-pill"><strong>${readingCount}</strong><span>En cours</span></div>
    <div class="personal-stat-pill"><strong>${favoritesCount}</strong><span>Favoris</span></div>
  `;

  // Menu déroulant des catégories
  const uniqueCats = [...new Set(books.map(b => b.category))].sort();
  personalCategorySelect.innerHTML = `<option value="">Toutes les catégories</option>` +
    uniqueCats.map(c => `<option value="${escapeAttr(c)}" ${personalCategory === c ? 'selected' : ''}>${escapeHTML(c)}</option>`).join("");

  const filtered = getPersonalFilteredBooks();
  emptyState.hidden = filtered.length !== 0;

  grid.innerHTML = filtered.map((b, idx) => {
    const prog = allProg[b.id] || { percent: 0, isFinished: false };
    const fav = favs.includes(b.id);
    const spineBg = colorForCategory(b.category);

    let statusBadgeHTML = "";
    if (prog.isFinished) {
      statusBadgeHTML = `<span class="p-card-status-badge status-finished">✓ Lu</span>`;
    } else if (prog.percent > 0) {
      statusBadgeHTML = `<span class="p-card-status-badge status-reading">📖 ${prog.percent}%</span>`;
    }

    const coverMarkup = b.cover
      ? `<img class="p-card-img" src="${escapeAttr(b.cover)}" alt="${escapeAttr(b.title)}" loading="lazy" decoding="async" width="200" height="300" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
         <div class="p-card-fallback-cover" style="background:${spineBg}; display:none;">
           <span class="p-fallback-deco">§</span>
           <div class="p-fallback-title">${escapeHTML(b.title)}</div>
           <div class="p-fallback-author">${escapeHTML(b.author)}</div>
         </div>`
      : `<div class="p-card-fallback-cover" style="background:${spineBg};">
           <span class="p-fallback-deco">§</span>
           <div class="p-fallback-title">${escapeHTML(b.title)}</div>
           <div class="p-fallback-author">${escapeHTML(b.author)}</div>
         </div>`;

    const actionLabel = prog.isFinished ? "Relire" : (prog.percent > 0 ? "Continuer" : "Lire");

    return `
      <div class="personal-book-card" style="--i:${idx}" data-id="${b.id}">
        <div class="p-card-cover-wrap">
          ${coverMarkup}
          <button class="btn-fav ${fav ? 'active' : ''}" data-action="favorite" data-id="${b.id}" title="${fav ? 'Retirer des favoris' : 'Ajouter aux favoris'}">
            ${fav ? '❤️' : '🤍'}
          </button>
          ${statusBadgeHTML}
        </div>
        <div class="p-card-body">
          <h3 class="p-card-title" title="${escapeAttr(b.title)}">
            ${escapeHTML(b.title)}
            ${contentTypeBadge(b)}
          </h3>
          <span class="p-card-author">${escapeHTML(b.author)}</span>
          <span class="p-card-category">${escapeHTML(b.category)}</span>

          <div class="p-card-progress-section">
            <div class="p-card-progress-bar">
              <div class="fill ${prog.isFinished ? 'finished' : ''}" style="width:${prog.percent || 0}%"></div>
            </div>
            <div class="p-card-progress-text">
              <span>${prog.isFinished ? 'Terminé' : (prog.percent > 0 ? 'En cours' : 'Non commencé')}</span>
              <b>${prog.percent || 0}%</b>
            </div>
          </div>

          <div class="p-card-actions">
            <button class="btn btn-primary btn-sm" data-action="read" data-id="${b.id}">${actionLabel}</button>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

// Délégation d'événements pour la grille personnelle
document.getElementById("personalBooksGrid").addEventListener("click", (e) => {
  const btnFav = e.target.closest("button[data-action='favorite']");
  if (btnFav) {
    e.stopPropagation();
    toggleFavorite(btnFav.dataset.id);
    return;
  }

  const btnRead = e.target.closest("button[data-action='read']");
  if (btnRead) {
    e.stopPropagation();
    openReader(btnRead.dataset.id);
    return;
  }

  const card = e.target.closest(".personal-book-card");
  if (card && !e.target.closest("button")) {
    openReader(card.dataset.id);
  }
});

/* ---------------------------------------------------------------------
   11) EMPRUNTER / RETOURNER
   --------------------------------------------------------------------- */
function borrowBook(id) {
  const book = books.find(b => b.id === id);
  if (!book) return;

  if (book.copies <= 0) {
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
   12) RECHERCHE & TRI (VUE "LISTE DES LIVRES")
   --------------------------------------------------------------------- */
const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");

// Active filter state for the grid view
let _gridActiveCat = "";
const LIST_PAGE_SIZE = 24;
let _listLimit = LIST_PAGE_SIZE;
let _listSig = "";
let _catalogLoading = false;

function skeletonCardsHTML(count) {
  return Array.from({ length: count }, () =>
    '<div class="skeleton-card"><div class="skeleton-cover"></div><div class="skeleton-line"></div><div class="skeleton-line short"></div></div>'
  ).join("");
}

function skeletonRowsHTML(count) {
  return Array.from({ length: count }, () =>
    '<div class="skeleton-row"><div class="skeleton-thumb"></div><div class="skeleton-line" style="flex:1"></div><div class="skeleton-line short"></div></div>'
  ).join("");
}

function showListSkeleton() {
  const gridView = document.getElementById("booksGridView");
  const listView = document.getElementById("booksListView");
  if (!gridView) return;
  gridView.hidden = false;
  if (listView) listView.hidden = true;
  gridView.innerHTML = skeletonCardsHTML(8);
  const countEl = document.getElementById("booksResultsCount");
  if (countEl) countEl.textContent = "Chargement du catalogue…";
}

searchInput.addEventListener("input", debounce(renderListView, 250));
sortSelect.addEventListener("change", renderListView);

/* ---------------------------------------------------------------------
   13) RENDU — TABLEAU DE BORD
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
  if (!el) return;
  el.innerHTML = `
    <div class="quick-stat"><b>${s.totalBooks}</b><span>Livres</span></div>
    <div class="quick-stat"><b>${s.availableCopies}</b><span>Dispo.</span></div>
    <div class="quick-stat"><b>${s.borrowedCopies}</b><span>Empruntés</span></div>
  `;
}

function renderDashboard() {
  const s = computeStats();
  const cardsEl = document.getElementById("dashboardCards");
  if (!cardsEl) return;
  cardsEl.innerHTML = `
    ${statCardHTML("Nombre total de livres", s.totalBooks, "▤")}
    ${statCardHTML("Nombre total d'exemplaires", s.totalCopies, "≣")}
    ${statCardHTML("Livres disponibles", s.availableTitles, "✓")}
    ${statCardHTML("Livres indisponibles", s.unavailableTitles, "✕")}
  `;

  // Panneau Reprendre la lecture
  const allProg = loadReadingProgress();
  const inProgressBooks = books.filter(b => allProg[b.id] && allProg[b.id].percent > 0 && !allProg[b.id].isFinished);
  const resumePanel = document.getElementById("resumeReadingPanel");

  if (inProgressBooks.length > 0) {
    inProgressBooks.sort((a, b) => (allProg[b.id]?.lastReadAt || "").localeCompare(allProg[a.id]?.lastReadAt || ""));
    const lastBook = inProgressBooks[0];
    const lastProg = allProg[lastBook.id];

    document.getElementById("resumeBookTitle").textContent = lastBook.title;
    document.getElementById("resumeBookMeta").textContent = `${lastBook.author} · Chapitre ${(lastProg.chapter || 0) + 1} · ${lastProg.percent}% lu`;
    document.getElementById("resumeProgressBar").style.width = `${lastProg.percent}%`;

    const resumeBtn = document.getElementById("resumeReadingBtn");
    resumeBtn.onclick = () => openReader(lastBook.id);
    resumePanel.hidden = false;
  } else {
    resumePanel.hidden = true;
  }

  // Cinq derniers livres ajoutés
  const tbody = document.querySelector("#recentTable tbody");
  const recent = books.slice(-5).reverse();
  tbody.innerHTML = recent.length
    ? recent.map(b => `
        <tr>
          <td>${renderCoverThumbHTML(b)}</td>
          <td><span class="id-chip">${b.id}</span></td>
          <td><b>${escapeHTML(b.title)}</b> ${contentTypeBadge(b)}</td>
          <td>${escapeHTML(b.author)}</td>
          <td>${escapeHTML(b.category)}</td>
          <td>${availabilityBadge(b)}</td>
          <td>
            <button class="btn btn-primary btn-sm" data-action="read" data-id="${b.id}">📖 Lire</button>
          </td>
        </tr>`).join("")
    : `<tr><td colspan="7" class="empty-state">Aucun livre pour le moment. Ajoutez votre premier livre !</td></tr>`;

  tbody.querySelectorAll("tr").forEach((r, i) => r.style.setProperty("--i", i));
  enhanceStatCards(cardsEl);
  renderCarousel();
}

document.querySelector("#recentTable").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action='read']");
  if (btn) openReader(btn.dataset.id);
});

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

function contentTypeBadge(book) {
  const ct = book.contentType || "text";
  if (ct === "pdf") return `<span class="badge" style="background:#e74c3c;color:#fff;">PDF</span>`;
  if (ct === "images") return `<span class="badge" style="background:#f39c12;color:#fff;">Images</span>`;
  return `<span class="badge" style="background:#3498db;color:#fff;">Texte</span>`;
}

/* ---------------------------------------------------------------------
   14) RENDU — LISTE DES LIVRES (GRILLE MODERNISÉE)
   --------------------------------------------------------------------- */
function getFilteredSortedBooks() {
  const query = searchInput.value.trim().toLowerCase();
  let result = books.filter(b => {
    const matchesQ = !query ||
      (b.title || "").toLowerCase().includes(query) ||
      (b.author || "").toLowerCase().includes(query) ||
      (b.category || "").toLowerCase().includes(query);
    const matchesCat = !_gridActiveCat || b.category === _gridActiveCat;
    return matchesQ && matchesCat;
  });

  const sortMode = sortSelect.value;
  if (sortMode === "alpha") result.sort((a, b) => (a.title || "").localeCompare(b.title || "", "fr"));
  else if (sortMode === "category") result.sort((a, b) => (a.category || "").localeCompare(b.category || "", "fr"));
  else if (sortMode === "year") result.sort((a, b) => (b.year || 0) - (a.year || 0));
  return result;
}

function renderListView() {
  const emptyState = document.getElementById("listEmptyState");
  const countEl = document.getElementById("booksResultsCount");
  const gridView = document.getElementById("booksGridView");
  const listView = document.getElementById("booksListView");
  const toggleGrid = document.getElementById("viewToggleGrid");

  // ✅ Bug 2 Fix — Guard si les éléments ne sont pas dans le DOM
  if (!gridView || !listView || !toggleGrid) return;

  const list = getFilteredSortedBooks();
  const isGridMode = toggleGrid.classList.contains("active");

  // Skeleton pendant le chargement du catalogue cloud
  if (!list.length && _catalogLoading) {
    if (countEl) countEl.textContent = "Chargement du catalogue…";
    if (emptyState) emptyState.hidden = true;
    const sk = skeletonCardsHTML(8);
    if (isGridMode) { gridView.hidden = false; listView.hidden = true; gridView.innerHTML = sk; }
    else { listView.hidden = false; gridView.hidden = true; listView.innerHTML = skeletonRowsHTML(6); }
    return;
  }

  // Category pills
  const pillsContainer = document.getElementById("booksCategoryPills");
  if (pillsContainer) {
    const uniqueCats = [...new Set(books.map(b => b.category).filter(Boolean))].sort();
    pillsContainer.innerHTML = `<button class="cat-pill ${!_gridActiveCat ? 'active' : ''}" data-cat="">Toutes</button>` +
      uniqueCats.map(c => `<button class="cat-pill ${_gridActiveCat === c ? 'active' : ''}" data-cat="${escapeAttr(c)}">${escapeHTML(c)}</button>`).join("");
  }

  if (emptyState) emptyState.hidden = list.length !== 0;
  if (countEl) countEl.textContent = `${list.length} livre${list.length !== 1 ? 's' : ''} trouvé${list.length !== 1 ? 's' : ''}`;

  // Réinitialiser la pagination quand filtres/tri changent
  const sig = searchInput.value + "|" + sortSelect.value + "|" + _gridActiveCat;
  if (sig !== _listSig) { _listSig = sig; _listLimit = LIST_PAGE_SIZE; }
  const visible = list.slice(0, _listLimit);

  if (isGridMode) {
    gridView.hidden = false;
    listView.hidden = true;
    gridView.innerHTML = visible.map(b => renderBookGridCard(b)).join("");
    gridView.querySelectorAll(".book-grid-card").forEach((cd, i) => cd.style.setProperty("--i", Math.min(i, 12)));
  } else {
    gridView.hidden = true;
    listView.hidden = false;
    listView.innerHTML = visible.map(b => renderBookListRow(b)).join("");
  }

  // Bouton "Charger plus"
  let moreBtn = document.getElementById("loadMoreBooksBtn");
  if (!moreBtn && emptyState && emptyState.parentNode) {
    moreBtn = document.createElement("button");
    moreBtn.id = "loadMoreBooksBtn";
    moreBtn.className = "btn btn-outline load-more-btn";
    moreBtn.addEventListener("click", () => {
      _listLimit += LIST_PAGE_SIZE;
      renderListView();
    });
    emptyState.parentNode.insertBefore(moreBtn, emptyState);
  }
  if (moreBtn) {
    const remaining = list.length - _listLimit;
    moreBtn.hidden = remaining <= 0;
    moreBtn.textContent = `Charger plus (${Math.max(0, remaining)} restant${remaining > 1 ? "s" : ""})`;
  }
}

function renderBookGridCard(b) {
  const spineBg = colorForCategory(b.category);
  const isAvail = b.copies > 0;
  const coverHTML = b.cover
    ? `<img class="bgc-cover-img" src="${escapeAttr(b.cover)}" alt="${escapeAttr(b.title)}" loading="lazy" decoding="async" width="300" height="450"
         onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
       <div class="bgc-fallback" style="background:${spineBg}; display:none;">
         <div class="bgc-fallback-title">${escapeHTML(b.title)}</div>
         <div class="bgc-fallback-author">${escapeHTML(b.author)}</div>
       </div>`
    : `<div class="bgc-fallback" style="background:${spineBg};">
         <div class="bgc-fallback-title">${escapeHTML(b.title)}</div>
         <div class="bgc-fallback-author">${escapeHTML(b.author)}</div>
       </div>`;

  return `
    <article class="book-grid-card" role="button" tabindex="0" data-id="${b.id}" aria-label="${escapeAttr(b.title)}">
      <div class="bgc-cover-wrap">
        ${coverHTML}
        <span class="bgc-avail-badge ${isAvail ? 'avail' : 'unavail'}">
          ${isAvail ? `✓ ${b.copies} dispo.` : 'Indisponible'}
        </span>
        <div class="bgc-hover-overlay">
          <button class="bgc-read-btn" data-action="read" data-id="${b.id}">📖 Lire maintenant</button>
        </div>
      </div>
      <div class="bgc-info">
        <div class="bgc-title">${escapeHTML(b.title)}</div>
        <div class="bgc-author">${escapeHTML(b.author)}</div>
        <span class="bgc-cat">${escapeHTML(b.category)}</span>
      </div>
    </article>`;
}

function renderBookListRow(b) {
  const spineBg = colorForCategory(b.category);
  const isAvail = b.copies > 0;
  const thumbHTML = b.cover
    ? `<div class="blr-thumb"><img src="${escapeAttr(b.cover)}" alt="" loading="lazy" decoding="async" width="48" height="64" onerror="this.style.display='none'" /></div>`
    : `<div class="blr-thumb" style="background:${spineBg}; color:#fff; font-size:11px; font-weight:700;">${escapeHTML(b.title.slice(0,2).toUpperCase())}</div>`;

  return `
    <div class="book-list-row" data-id="${b.id}">
      ${thumbHTML}
      <div class="blr-info">
        <div class="blr-title">${escapeHTML(b.title)} ${contentTypeBadge(b)}</div>
        <div class="blr-author">${escapeHTML(b.author)}</div>
        <div class="blr-meta">
          <span class="bgc-cat">${escapeHTML(b.category)}</span>
          <span class="bgc-cat">${b.year || '—'}</span>
          <span class="bgc-avail-badge ${isAvail ? 'avail' : 'unavail'}" style="position:static;">${isAvail ? `Disponible (${b.copies}/${b.maxCopies})` : 'Indisponible'}</span>
        </div>
      </div>
      <div class="blr-actions">
        <button class="btn btn-primary btn-sm" data-action="read" data-id="${b.id}">📖 Lire</button>
        <button class="btn btn-outline btn-sm" data-action="detail" data-id="${b.id}">Détail</button>
      </div>
    </div>`;
}

// Délégation d'événements grille
document.getElementById("booksGridView").addEventListener("click", handleGridAction);
document.getElementById("booksGridView").addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    const card = e.target.closest(".book-grid-card");
    if (card && !e.target.closest("button")) { e.preventDefault(); openBookDetail(card.dataset.id); }
  }
});
document.getElementById("booksListView").addEventListener("click", handleGridAction);

function handleGridAction(e) {
  const btnRead = e.target.closest("button[data-action='read']");
  if (btnRead) { e.stopPropagation(); openReader(btnRead.dataset.id); return; }

  const btnDetail = e.target.closest("button[data-action='detail']");
  if (btnDetail) { e.stopPropagation(); openBookDetail(btnDetail.dataset.id); return; }

  const card = e.target.closest(".book-grid-card");
  if (card && !e.target.closest("button")) { openBookDetail(card.dataset.id); return; }

  const row = e.target.closest(".book-list-row");
  if (row && !e.target.closest("button")) { openBookDetail(row.dataset.id); }
}

// Filtres catégories pills
document.getElementById("booksCategoryPills").addEventListener("click", (e) => {
  const pill = e.target.closest(".cat-pill");
  if (!pill) return;
  _gridActiveCat = pill.dataset.cat;
  renderListView();
});

// Toggle grille / liste
document.getElementById("viewToggleGrid").addEventListener("click", () => {
  document.getElementById("viewToggleGrid").classList.add("active");
  document.getElementById("viewToggleList").classList.remove("active");
  renderListView();
});
document.getElementById("viewToggleList").addEventListener("click", () => {
  document.getElementById("viewToggleList").classList.add("active");
  document.getElementById("viewToggleGrid").classList.remove("active");
  renderListView();
});

/* ---------------------------------------------------------------------
   14b) PANNEAU DÉTAIL LIVRE (slide-in)
   --------------------------------------------------------------------- */
let _detailBookId = null;

async function openBookDetail(bookId) {
  const book = books.find(b => b.id === bookId);
  if (!book) return;
  await ensureBookHeavyContent(book);
  _detailBookId = bookId;

  const overlay = document.getElementById("bookDetailOverlay");
  const panel = document.getElementById("bookDetailPanel");
  const spineBg = colorForCategory(book.category);

  // Hero background
  document.getElementById("bdpHeroBg").style.backgroundImage =
    book.cover ? `url('${escapeAttr(book.cover)}')` : `linear-gradient(135deg, ${spineBg}, #0e1916)`;

  // Cover
  const coverWrap = document.getElementById("bdpCoverWrap");
  if (book.cover) {
    coverWrap.innerHTML = `<img class="bdp-cover" src="${escapeAttr(book.cover)}" alt="${escapeAttr(book.title)}" decoding="async"
      onerror="this.style.display='none'; document.getElementById('bdpCoverWrap').innerHTML=getFallbackCoverHtml('${escapeAttr(spineBg)}', '${escapeAttr(book.title.slice(0,2).toUpperCase())}');" />`;
  } else {
    coverWrap.innerHTML = `<div class="bdp-cover-fallback" style="background:${spineBg};">
      <div style="font-size:26px;opacity:0.7;">📖</div>
      <div style="font-family:var(--font-display);font-size:13px;font-weight:700;line-height:1.2;">${escapeHTML(book.title)}</div>
    </div>`;
  }

  // Title / author
  document.getElementById("bdpTitle").textContent = book.title;
  document.getElementById("bdpAuthor").textContent = book.author;

  // Badges
  const badges = document.getElementById("bdpBadges");
  badges.innerHTML = [
    book.category ? `<span class="bdp-badge cat" style="--i:0">${escapeHTML(book.category)}</span>` : "",
    book.year ? `<span class="bdp-badge year" style="--i:1">${book.year}</span>` : "",
    `<span class="bdp-badge" style="--i:2;background:${book.copies > 0 ? 'rgba(62,125,81,0.75)' : 'rgba(174,59,59,0.75)'}">${book.copies > 0 ? `✓ ${book.copies}/${book.maxCopies} dispo.` : 'Indisponible'}</span>`
  ].join("");

  // Méta-données
  document.getElementById("bdpMetaGrid").innerHTML = `
    <div class="bdp-meta-item"><span class="bdp-meta-val">${book.year || '—'}</span><span class="bdp-meta-label">Année</span></div>
    <div class="bdp-meta-item"><span class="bdp-meta-val">${book.maxCopies || 1}</span><span class="bdp-meta-label">Exemplaires</span></div>
    <div class="bdp-meta-item"><span class="bdp-meta-val">${book.copies}</span><span class="bdp-meta-label">Disponibles</span></div>`;

  // Description
  let description = book.description || '';
  if (!description && book.content) {
    // Extraire le premier paragraphe du contenu comme description
    const firstPara = book.content.replace(/^---[^\n]*---/m, '').trim().split(/\n\s*\n/)[0];
    description = firstPara ? firstPara.replace(/\n/g, ' ').trim().slice(0, 300) + (firstPara.length > 300 ? '…' : '') : '';
  }
  document.getElementById("bdpDescription").textContent = description || 'Aucune description disponible pour cet ouvrage.';

  // Bouton lire
  const readBtn = document.getElementById("bdpReadBtn");
  const hasContent = !!(book.content || book.pdfData || book.pdfUrl || (book.pages && book.pages.length));
  readBtn.disabled = !hasContent;
  readBtn.title = hasContent ? '' : 'Aucun contenu disponible pour cet ouvrage';
  readBtn.onclick = () => { closeBookDetail(); openReader(bookId); };

  // Bouton emprunter
  const borrowBtn = document.getElementById("bdpBorrowBtn");
  borrowBtn.disabled = book.copies <= 0;
  borrowBtn.textContent = book.copies > 0 ? '↷ Emprunter ce livre' : '✕ Indisponible';
  borrowBtn.onclick = () => { borrowBook(bookId); closeBookDetail(); };

  overlay.hidden = false;
  panel.hidden = false;
  document.body.style.overflow = 'hidden';
  requestAnimationFrame(() => {
    overlay.classList.add('is-open');
    panel.classList.add('is-open');
  });
}

function closeBookDetail() {
  const overlay = document.getElementById("bookDetailOverlay");
  const panel = document.getElementById("bookDetailPanel");
  overlay.classList.remove('is-open');
  panel.classList.remove('is-open');
  setTimeout(() => {
    overlay.hidden = true;
    panel.hidden = true;
  }, 280);
  document.body.style.overflow = '';
  _detailBookId = null;
}

document.getElementById("bdpCloseBtn").addEventListener("click", closeBookDetail);
document.getElementById("bookDetailOverlay").addEventListener("click", closeBookDetail);
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !document.getElementById("bookDetailPanel").hidden) closeBookDetail();
});

/* ---------------------------------------------------------------------
   15) RENDU — EMPRUNTER / RETOURNER (CARTES)
   --------------------------------------------------------------------- */
function bookCardHTML(book, actionLabel, actionName, btnClass) {
  const spineColor = colorForCategory(book.category);
  const coverContent = book.cover
    ? `style="background-image:url('${escapeAttr(book.cover)}'); background-size:cover; background-position:center;"`
    : "";
  return `
    <div class="book-card">
      <div class="spine" style="background:${spineColor}"></div>
      <div class="cover" ${coverContent}>${book.cover ? "" : "📖"}</div>
      <div class="info">
        <h3>${escapeHTML(book.title)}</h3>
        <div class="author">${escapeHTML(book.author)}</div>
        <div class="meta">${book.year || '—'} · ${book.copies}/${book.maxCopies} exemplaire(s) dispo.</div>
        <span class="tag">${escapeHTML(book.category)}</span>
        <div class="card-actions">
          <button class="btn ${btnClass} btn-sm" data-action="${actionName}" data-id="${book.id}">${actionLabel}</button>
          <button class="btn btn-outline btn-sm" data-action="read" data-id="${book.id}">Lire</button>
        </div>
      </div>
    </div>`;
}

function renderBorrowView() {
  const grid = document.getElementById("borrowGrid");
  const available = books.filter(b => b.copies > 0);
  grid.innerHTML = available.map(b => bookCardHTML(b, "Emprunter", "borrow", "btn-success")).join("");
  grid.querySelectorAll(".book-card").forEach((c, i) => c.style.setProperty("--i", i));
  document.getElementById("borrowEmptyState").hidden = available.length !== 0;
}

function renderReturnView() {
  const grid = document.getElementById("returnGrid");
  const borrowed = books.filter(b => b.copies < b.maxCopies);
  grid.innerHTML = borrowed.map(b => bookCardHTML(b, "Retourner", "return", "btn-primary")).join("");
  grid.querySelectorAll(".book-card").forEach((c, i) => c.style.setProperty("--i", i));
  document.getElementById("returnEmptyState").hidden = borrowed.length !== 0;
}

document.getElementById("borrowGrid").addEventListener("click", (e) => {
  const btnBorrow = e.target.closest("button[data-action='borrow']");
  if (btnBorrow) borrowBook(btnBorrow.dataset.id);
  const btnRead = e.target.closest("button[data-action='read']");
  if (btnRead) openReader(btnRead.dataset.id);
});

document.getElementById("returnGrid").addEventListener("click", (e) => {
  const btnReturn = e.target.closest("button[data-action='return']");
  if (btnReturn) returnBook(btnReturn.dataset.id);
  const btnRead = e.target.closest("button[data-action='read']");
  if (btnRead) openReader(btnRead.dataset.id);
});

/* ---------------------------------------------------------------------
   16) RENDU — STATISTIQUES
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
  enhanceStatCards(cardsEl);

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
   17) EXPORTS (PDF & Excel)
   --------------------------------------------------------------------- */
document.getElementById("exportPdfBtn").addEventListener("click", () => {
  if (!books.length) { showToast("Aucun livre à exporter.", "error"); return; }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text("Bibliothèque — Liste des livres", 14, 16);

  const rows = books.map(b => [
    b.id, b.title, b.author, b.category, String(b.year ?? ''), `${b.copies}/${b.maxCopies}`,
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
   18) UTILITAIRES
   --------------------------------------------------------------------- */
function escapeHTML(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
function escapeAttr(str) {
  return String(str || "").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/* ---------------------------------------------------------------------
   19) PROFIL — ÉVÉNEMENTS
   --------------------------------------------------------------------- */

// Clic sur la mini-carte sidebar -> aller sur le profil
document.getElementById('sidebarProfile').addEventListener('click', (e) => {
  if (e.target.closest('.sidebar-profile-edit-btn')) {
    switchView('profile');
  }
});

// Emoji presets
document.getElementById('emojiPresets').addEventListener('click', (e) => {
  const btn = e.target.closest('.emoji-preset-btn');
  if (!btn) return;
  document.getElementById('profileAvatarEmoji').value = btn.dataset.emoji;
  document.querySelectorAll('.emoji-preset-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('profileAvatarDisplay').textContent = btn.dataset.emoji;
});

// Saisie manuelle de l'emoji -> update avatar aperçu
document.getElementById('profileAvatarEmoji').addEventListener('input', (e) => {
  const val = e.target.value.trim();
  if (val) document.getElementById('profileAvatarDisplay').textContent = val;
});

// Formulaire profil submit
document.getElementById('profileForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const p = {
    name: document.getElementById('profileName').value.trim() || 'Mon Profil',
    avatar: document.getElementById('profileAvatarEmoji').value.trim() || '\ud83d\udc64',
    bio: document.getElementById('profileBio').value.trim() || 'Passionn\u00e9(e) de lecture',
    favoriteGenre: document.getElementById('profileFavoriteGenre').value.trim(),
    readingGoal: parseInt(document.getElementById('profileReadingGoal').value, 10) || 12,
  };
  saveProfile(p);
  renderProfileView();
  showToast('Profil enregistré avec succès ✓', 'success');
});

// Clic sur un livre dans les lectures récentes / favoris du profil
document.getElementById('profileRecentReads').addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-action="read"]');
  if (btn) { openReader(btn.dataset.id); return; }
  const item = e.target.closest('.profile-read-item');
  if (item) openReader(item.dataset.id);
});
document.getElementById('profileFavoritesGrid').addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-action="read"]');
  if (btn) { openReader(btn.dataset.id); return; }
  const card = e.target.closest('.profile-fav-card');
  if (card && !e.target.closest('button')) openReader(card.dataset.id);
});


/* ---------------------------------------------------------------------
   19b) MOTION DESIGN — compteurs, indicateur nav, révélation au scroll
   --------------------------------------------------------------------- */
function animateStatValue(el, target) {
  if (_carousel.reduced || target === 0) { el.textContent = target; return; }
  const dur = 750;
  const t0 = performance.now();
  const tick = (t) => {
    const p = Math.min(1, (t - t0) / dur);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(target * eased);
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function enhanceStatCards(container) {
  if (!container) return;
  container.querySelectorAll(".stat-card").forEach((card, i) => {
    card.style.setProperty("--i", i);
    const v = card.querySelector(".stat-value");
    if (v) {
      const t = parseInt(v.textContent, 10);
      if (!isNaN(t)) animateStatValue(v, t);
    }
  });
}

function updateNavIndicator() {
  const nav = document.getElementById("mainNav");
  const ind = nav ? nav.querySelector(".nav-indicator") : null;
  const active = nav ? nav.querySelector(".nav-btn.active") : null;
  if (!ind || !active) return;
  if (window.innerWidth <= 900) { ind.style.opacity = "0"; return; }
  ind.style.top = active.offsetTop + "px";
  ind.style.height = active.offsetHeight + "px";
  ind.style.opacity = "1";
}

let _revealIO = null;
function initScrollReveal() {
  if (_carousel.reduced || !("IntersectionObserver" in window)) return;
  if (_revealIO) return;
  _revealIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add("revealed"); _revealIO.unobserve(en.target); }
    });
  }, { threshold: 0.06 });
  document.querySelectorAll(".panel").forEach((p) => {
    p.classList.add("reveal");
    _revealIO.observe(p);
  });
}

/* ---------------------------------------------------------------------
   19c) CARROUSSEL 3D — cylindre de couvertures (vue Tableau de bord)
   --------------------------------------------------------------------- */
const CAROUSEL = {
  cardWidth: 220,          // 150 sur mobile (carouselMetrics)
  aspectRatio: 1,
  gap: 25,
  tilt: -5,                // degrés
  perspective: 2500,       // px
  cornerRadius: 12,
  speed: 14,               // °/s
  direction: "left",
  momentum: 0.6,
  parallax: 0.3,
  depthFade: 0.55,
  innerShade: 0.6,
  maxBooks: 12,
  minBooks: 6
};

const _carousel = {
  books: [], items: [], stage: null,
  rot: 0, vel: 0, mode: "auto", snapTarget: null, pendingOpen: null,
  dragging: false, moved: 0, lastX: 0, samples: [], clickItem: null, clickTarget: null,
  lastInteract: 0,
  hovered: false, visible: true, parX: 0, parY: 0, appliedRot: 0,
  raf: null, lastT: 0, reduced: false, sig: "", mobile: null,
  bound: false, io: null
};
_carousel.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
window.matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", (e) => {
  _carousel.reduced = e.matches;
  if (e.matches) _carousel.mode = "idle";
  else if (_carousel.mode === "idle") _carousel.mode = "auto";
});

function carouselMetrics() {
  const mobile = window.innerWidth <= 640;
  const cardWidth = mobile ? 150 : CAROUSEL.cardWidth;
  const cardHeight = Math.round(cardWidth / CAROUSEL.aspectRatio);
  const gap = mobile ? 18 : CAROUSEL.gap;
  const n = _carousel.books.length;
  const radius = n > 1 ? (cardWidth + gap) / (2 * Math.tan(Math.PI / n)) : 0;
  return { cardWidth, cardHeight, gap, radius, mobile };
}

function carouselCardInnerHTML(b) {
  const bg = colorForCategory(b.category);
  const title = escapeHTML(b.title.length > 40 ? b.title.slice(0, 40) + "…" : b.title);
  if (b.cover) {
    return `<img class="cr-cover" src="${escapeAttr(b.cover)}" alt="" loading="lazy" decoding="async" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
      <div class="cr-fallback" style="background:${bg};display:none;"><span class="cr-fallback-deco">§</span><b>${title}</b></div>`;
  }
  return `<div class="cr-fallback" style="background:${bg};"><span class="cr-fallback-deco">§</span><b>${title}</b></div>`;
}

function carouselMiniCardHTML(b) {
  const bg = colorForCategory(b.category);
  const cover = b.cover
    ? `<img class="carousel-mini-img" src="${escapeAttr(b.cover)}" alt="" loading="lazy" decoding="async" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
       <div class="carousel-mini-fallback" style="background:${bg};display:none;">${escapeHTML(b.title.slice(0, 2).toUpperCase())}</div>`
    : `<div class="carousel-mini-fallback" style="background:${bg};">${escapeHTML(b.title.slice(0, 2).toUpperCase())}</div>`;
  return `<button type="button" class="carousel-mini-card" data-id="${b.id}" aria-label="Voir le détail de ${escapeAttr(b.title)}">${cover}<span class="carousel-mini-title">${escapeHTML(b.title)}</span></button>`;
}

function renderCarousel(force) {
  const section = document.getElementById("carouselSection");
  const stage = document.getElementById("carouselStage");
  const grid = document.getElementById("carouselGrid");
  if (!section || !stage) return;
  const c = _carousel;
  const recent = books.slice(-CAROUSEL.maxBooks).reverse();
  const sig = recent.map(b => b.id).join("|");
  if (!force && sig === c.sig) return;
  c.sig = sig;
  c.books = recent;
  c.rot = 0; c.vel = 0; c.snapTarget = null; c.pendingOpen = null;
  c.mode = c.reduced ? "idle" : "auto";

  if (recent.length < CAROUSEL.minBooks) {
    stage.innerHTML = "";
    c.items = [];
    stage.hidden = true;
    if (grid) {
      grid.hidden = false;
      grid.innerHTML = recent.map(carouselMiniCardHTML).join("");
    }
    section.hidden = recent.length === 0;
    return;
  }

  stage.hidden = false;
  if (grid) { grid.hidden = true; grid.innerHTML = ""; }
  section.hidden = false;
  buildCarouselItems();
}

function buildCarouselItems() {
  const c = _carousel;
  const stage = c.stage = document.getElementById("carouselStage");
  const viewport = stage.parentElement;
  if (viewport) viewport.style.perspective = CAROUSEL.perspective + "px";
  const m = carouselMetrics();
  c.mobile = m.mobile;
  const n = c.books.length;
  const step = 360 / n;

  stage.style.setProperty("--cw", m.cardWidth + "px");
  stage.style.setProperty("--ch", m.cardHeight + "px");
  stage.innerHTML = "";
  c.items = c.books.map((b, i) => {
    const item = document.createElement("div");
    item.className = "cr-item";
    item.dataset.index = i;
    item.setAttribute("role", "button");
    item.setAttribute("aria-label", `Livre : ${b.title} par ${b.author}`);
    item.tabIndex = -1;
    item.style.transform = `rotateY(${i * step}deg) translateZ(${m.radius}px)`;
    item.innerHTML =
      `<div class="cr-rise" style="--i:${i}"><div class="cr-card" style="border-radius:${CAROUSEL.cornerRadius}px">        ${carouselCardInnerHTML(b)}        <div class="cr-shade"></div>        <div class="cr-caption"><strong>${escapeHTML(b.title)}</strong><span>${escapeHTML(b.author)}</span>
          <div class="cr-actions">
            <button type="button" class="cr-action-btn cr-read" data-act="read">📖 Lire</button>
            <button type="button" class="cr-action-btn cr-detail" data-act="detail">Détails</button>
          </div>
        </div>      </div></div>`;
    stage.appendChild(item);
    return { el: item, card: item.querySelector(".cr-card"), shade: item.querySelector(".cr-shade"), angle: i * step };
  });

  bindCarouselEvents(stage);
  observeCarouselViewport(viewport);
  if (!c.raf) carouselLoop();
}

function observeCarouselViewport(viewport) {
  const c = _carousel;
  if (c.io || !("IntersectionObserver" in window) || !viewport) return;
  c.io = new IntersectionObserver((entries) => {
    c.visible = entries[0].isIntersecting;
  }, { threshold: 0.05 });
  c.io.observe(viewport);
}

function nearestStepRotation(rot) {
  const n = _carousel.items.length;
  if (!n) return rot;
  const step = 360 / n;
  return Math.round(rot / step) * step;
}

function rotationForIndex(i) {
  const n = _carousel.books.length;
  if (!n) return 0;
  const a = (360 / n) * i;
  return a + 360 * Math.round((_carousel.rot - a) / 360);
}

function frontIndex() {
  const c = _carousel, n = c.items.length;
  if (!n) return 0;
  const step = 360 / n;
  let best = 0, bd = Infinity;
  for (let i = 0; i < n; i++) {
    const d = Math.abs((((i * step - c.rot) % 360) + 540) % 360 - 180);
    if (d < bd) { bd = d; best = i; }
  }
  return best;
}

function applyCarouselTransform() {
  const c = _carousel;
  if (!c.stage) return;
  const tilt = CAROUSEL.tilt + c.parY * CAROUSEL.parallax * 12;
  c.appliedRot = c.rot + c.parX * CAROUSEL.parallax * 4;
  c.stage.style.transform = `rotateX(${tilt}deg) rotateY(${c.appliedRot}deg)`;
  shadeCarouselItems();
}

function shadeCarouselItems() {
  const c = _carousel, n = c.items.length;
  if (!n) return;
  const step = 360 / n;
  const rot = c.appliedRot || c.rot;
  for (const it of c.items) {
    const rel = (((it.angle - rot) % 360) + 540) % 360 - 180;
    const facing = Math.cos(rel * Math.PI / 180);
    const dim = (1 - facing) / 2;
    it.card.style.opacity = (1 - dim * CAROUSEL.depthFade).toFixed(3);
    it.card.style.filter = `brightness(${(1 - dim * 0.5).toFixed(3)}) saturate(${(1 - dim * 0.35).toFixed(2)})`;
    it.shade.style.opacity = (dim * CAROUSEL.innerShade).toFixed(3);
    it.card.classList.toggle("is-front", Math.abs(rel) <= step / 2);
  }
}

function carouselLoop() {
  const c = _carousel;
  if (c.raf) return;
  c.lastT = performance.now();
  const tick = (now) => {
    c.raf = requestAnimationFrame(tick);
    if (!c.items.length || !c.stage) return;
    const dt = Math.min(0.06, (now - c.lastT) / 1000);
    c.lastT = now;
    if (document.hidden || !c.visible) { applyCarouselTransform(); return; }

    if (!c.reduced && !c.dragging && !c.hovered && c.mode === "auto" && (now - c.lastInteract) > 4000) {
      c.rot += (CAROUSEL.direction === "left" ? -1 : 1) * CAROUSEL.speed * dt;
    } else if (c.mode === "inertia") {
      c.rot += c.vel * dt;
      c.vel *= Math.exp(-2.6 * dt);
      if (Math.abs(c.vel) < 4) {
        c.mode = "snap";
        c.snapTarget = nearestStepRotation(c.rot);
      }
    } else if (c.mode === "snap" && c.snapTarget !== null) {
      const d = c.snapTarget - c.rot;
      c.rot += d * Math.min(1, dt * (c.reduced ? 18 : 9));
      if (Math.abs(d) < 0.05) {
        c.rot = c.snapTarget;
        c.snapTarget = null;
        if (c.pendingOpen) {
          const id = c.pendingOpen;
          c.pendingOpen = null;
          setTimeout(() => openBookDetail(id), 120);
        }
        c.mode = c.reduced ? "idle" : "auto";
      }
    }
    applyCarouselTransform();
  };
  c.raf = requestAnimationFrame(tick);
}

function carouselStep(delta) {
  const c = _carousel, n = c.items.length;
  if (!n) return;
  const f = frontIndex();
  const ni = (f + delta + n) % n;
  c.snapTarget = rotationForIndex(ni);
  c.mode = "snap";
  c.lastInteract = performance.now();
}

function handleCarouselTap(item, target) {
  const c = _carousel;
  if (!item || !c.books.length) return;
  const idx = parseInt(item.dataset.index, 10);
  if (isNaN(idx) || !c.books[idx]) return;
  c.lastInteract = performance.now();
  const btn = target && target.closest ? target.closest(".cr-action-btn") : null;
  if (btn) {
    if (btn.dataset.act === "read") openReader(c.books[idx].id);
    else openBookDetail(c.books[idx].id);
    return;
  }
  // Carte de face : lecture directe ; carte sur le côté : focus + pause
  if (idx === frontIndex()) { openReader(c.books[idx].id); return; }
  c.pendingOpen = null;
  c.snapTarget = rotationForIndex(idx);
  c.mode = "snap";
}

function bindCarouselEvents(stage) {
  const c = _carousel;
  if (c.bound) return;
  c.bound = true;

  stage.addEventListener("pointerover", (e) => {
    const it = e.target && e.target.closest ? e.target.closest(".cr-item") : null;
    if (!it) return;
    const b = _carousel.books[parseInt(it.dataset.index, 10)];
    if (b) prefetchBookPdf(b); // précharge après 200 ms de survol
  });

  stage.addEventListener("pointerdown", (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    c.dragging = true;
    c.moved = 0;
    c.clickItem = e.target && e.target.closest ? e.target.closest(".cr-item") : null;
    c.clickTarget = e.target;
    c.lastInteract = performance.now();
    if (c.clickItem) {
      const bi = parseInt(c.clickItem.dataset.index, 10);
      if (bi >= 0 && _carousel.books[bi]) prefetchBookPdf(_carousel.books[bi]); // première sélection : précharge immédiate
    }
    c.lastX = e.clientX;
    c.samples = [{ x: e.clientX, t: performance.now() }];
    c.vel = 0;
    c.mode = "drag";
    try { stage.setPointerCapture(e.pointerId); } catch (err) {}
    stage.classList.add("dragging");
  });

  stage.addEventListener("pointermove", (e) => {
    if (!c.dragging) {
      const r = stage.getBoundingClientRect();
      if (r.width && r.height) {
        c.parX = ((e.clientX - r.left) / r.width - 0.5) * 2;
        c.parY = ((e.clientY - r.top) / r.height - 0.5) * 2;
      }
      return;
    }
    const now = performance.now();
    const dx = e.clientX - c.lastX;
    c.lastX = e.clientX;
    c.rot += dx * 0.32;
    c.moved += Math.abs(dx);
    c.samples.push({ x: e.clientX, t: now });
    if (c.samples.length > 6) c.samples.shift();
    const s0 = c.samples[0], s1 = c.samples[c.samples.length - 1];
    if (s1.t > s0.t) c.vel = ((s1.x - s0.x) / (s1.t - s0.t)) * 0.32 * 1000;
  });

  const endDrag = (e) => {
    if (!c.dragging) return;
    c.dragging = false;
    stage.classList.remove("dragging");
    if (c.moved < 6) {
      if (c.clickItem) handleCarouselTap(c.clickItem, c.clickTarget);
      c.clickItem = null;
      c.clickTarget = null;
      c.vel = 0;
      c.mode = c.reduced ? "idle" : "auto";
      return;
    }
    c.vel = Math.max(-900, Math.min(900, c.vel * CAROUSEL.momentum));
    c.mode = "inertia";
  };
  stage.addEventListener("pointerup", endDrag);
  stage.addEventListener("pointercancel", endDrag);

  stage.addEventListener("pointerenter", () => { c.hovered = true; });
  stage.addEventListener("pointerleave", () => { c.hovered = false; c.parX = 0; c.parY = 0; });

  stage.addEventListener("keydown", (e) => {
    if (!c.items.length) return;
    if (e.key === "ArrowLeft") { e.preventDefault(); carouselStep(-1); }
    else if (e.key === "ArrowRight") { e.preventDefault(); carouselStep(1); }
    else if (e.key === "Enter") {
      e.preventDefault();
      const f = frontIndex();
      if (c.books[f]) openReader(c.books[f].id);
    } else if (e.key === "Escape") {
      // Reprendre la rotation immédiatement
      c.lastInteract = 0;
      if (c.mode === "snap") { c.mode = "auto"; c.snapTarget = null; c.pendingOpen = null; }
    }
  });
}

// Grille classique (fallback < 6 livres)
const carouselGridEl = document.getElementById("carouselGrid");
if (carouselGridEl) {
  carouselGridEl.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-id]");
    if (btn) openBookDetail(btn.dataset.id);
  });
}
/* ---------------------------------------------------------------------
   20) RENDU GLOBAL
   --------------------------------------------------------------------- */
function renderAll() {
  renderQuickStats();
  renderDashboard();
  renderPersonalView();
  renderListView();
  renderBorrowView();
  renderReturnView();
  renderStatsView();
  renderProfileView();
}

// Premier rendu au chargement
renderAll();


// Préconnexion vers Supabase (origin dynamique)
try {
  const origin = new URL(window.SUPABASE_URL).origin;
  const pre = document.createElement("link");
  pre.rel = "preconnect";
  pre.href = origin;
  pre.crossOrigin = "anonymous";
  document.head.appendChild(pre);
} catch (e) {}

// Initialisations motion design
updateNavIndicator();
initScrollReveal();
carouselLoop();
window.addEventListener("resize", debounce(() => {
  updateNavIndicator();
  const mob = window.innerWidth <= 640;
  if (mob !== _carousel.mobile) renderCarousel(true);
}, 300));

// Catalogue cloud : démarre après le premier rendu (cache + refresh arrière-plan)
if (isSupabaseConfigured()) initCloudCatalog();
