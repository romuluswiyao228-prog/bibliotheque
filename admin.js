/* =========================================================================
   ADMIN.JS — Script dédié au Portail Administrateur
   Bibliothèque — Gestion sécurisée des collections, contenus & Supabase
   ========================================================================= */

'use strict';

/* -------------------------------------------------------------------------
   1) CONSTANTES & STORAGE KEYS
   ------------------------------------------------------------------------- */
const ADMIN_PASSWORD      = "admin1234";
const ADMIN_SESSION_KEY   = "biblio_admin_sess";
const STORAGE_KEY         = "biblio_books";
const COUNTER_KEY         = "biblio_next_id";
const SUPABASE_CONFIG_KEY = "biblio_supa_config";

const SPINE_COLORS = [
  "#1F3A34", "#B8874A", "#3E7D51", "#7B4B3A", "#4A5E8C", "#8C4A6B", "#A3762F", "#2A526A"
];

/* -------------------------------------------------------------------------
   2) ÉTAT GLOBAL ADMIN
   ------------------------------------------------------------------------- */
let books = loadBooks();
let supabaseClient = null;
let editingBookId = null;
let activeEditorBookId = null;
let pendingDeleteId = null;

/* -------------------------------------------------------------------------
   3) CHARGEMENT & PERSISTANCE LIVRES
   ------------------------------------------------------------------------- */
function loadBooks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveBooks(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    showToast("Erreur lors de la sauvegarde locale.", "error");
  }
}

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

function colorForCategory(cat) {
  if (!cat) return SPINE_COLORS[0];
  let hash = 0;
  for (let i = 0; i < cat.length; i++) hash = cat.charCodeAt(i) + ((hash << 5) - hash);
  return SPINE_COLORS[Math.abs(hash) % SPINE_COLORS.length];
}

/* -------------------------------------------------------------------------
   4) INITIALISATION & SÉCURITÉ
   ------------------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  checkAdminAuth();
  initNav();
  initBookForm();
  initContentEditor();
  initManageBooks();
  initSupabase();
  initImportExport();
});

function checkAdminAuth() {
  const isAuth = sessionStorage.getItem(ADMIN_SESSION_KEY) === "true";
  const lockScreen = document.getElementById("adminLockScreen");
  const adminApp = document.getElementById("adminApp");

  if (isAuth) {
    if (lockScreen) lockScreen.style.display = "none";
    if (adminApp) adminApp.style.display = "grid";
    renderAllAdminViews();
  } else {
    if (lockScreen) lockScreen.style.display = "grid";
    if (adminApp) adminApp.style.display = "none";
    setTimeout(() => document.getElementById("adminPasscode")?.focus(), 150);
  }
}

// Formulaire de déverrouillage
document.getElementById("adminLockForm")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const input = document.getElementById("adminPasscode");
  const err = document.getElementById("adminPasscodeError");

  if (input.value === ADMIN_PASSWORD) {
    sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
    err.textContent = "";
    input.value = "";
    checkAdminAuth();
    showToast("Bienvenue dans le portail Administrateur ⚙️", "success");
  } else {
    err.textContent = "❌ Mot de passe incorrect.";
    input.select();
  }
});

// Bouton déconnexion
document.getElementById("adminExitBtn")?.addEventListener("click", () => {
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
  checkAdminAuth();
  showToast("Session administrateur fermée.", "info");
});

/* -------------------------------------------------------------------------
   5) NAVIGATION ADMIN
   ------------------------------------------------------------------------- */
const ADMIN_TITLES = {
  "dashboard": { title: "Tableau de bord Admin", subtitle: "Vue d'ensemble et gestion de la bibliothèque" },
  "add-book": { title: "Ajouter un livre", subtitle: "Création d'un nouvel ouvrage (Réservé administrateur)" },
  "content-editor": { title: "Éditeur de chapitres", subtitle: "Rédiger, découper et enrichir les textes de lecture" },
  "manage-books": { title: "Gestion des collections", subtitle: "Modifier, mettre à jour ou supprimer des ouvrages" },
  "users": { title: "Utilisateurs Cloud", subtitle: "Lecteurs inscrits et synchronisés avec Supabase" },
  "database": { title: "Base de données Supabase", subtitle: "Connexion Cloud et synchronisation temps réel" },
  "import-export": { title: "Import / Export & Sauvegardes", subtitle: "Exports JSON, PDF, Excel et gestion des données" }
};

function switchAdminView(viewName) {
  document.querySelectorAll(".admin-view").forEach(v => v.classList.remove("active"));
  const target = document.getElementById("view-" + viewName);
  if (target) target.classList.add("active");

  document.querySelectorAll("#adminNav .nav-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.view === viewName);
  });

  if (ADMIN_TITLES[viewName]) {
    document.getElementById("adminViewTitle").textContent = ADMIN_TITLES[viewName].title;
    document.getElementById("adminViewSubtitle").textContent = ADMIN_TITLES[viewName].subtitle;
  }

  if (viewName === "manage-books") renderManageBooksTable();
  if (viewName === "content-editor") renderContentBooksList();
  if (viewName === "dashboard") renderDashboardView();
  if (viewName === "users") loadCloudUsers();
}

function initNav() {
  document.getElementById("adminNav")?.addEventListener("click", (e) => {
    const btn = e.target.closest(".nav-btn");
    if (!btn) return;
    switchAdminView(btn.dataset.view);
  });

  document.addEventListener("click", (e) => {
    const navEl = e.target.closest("[data-nav]");
    if (navEl) {
      switchAdminView(navEl.dataset.nav);
    }
  });
}

/* -------------------------------------------------------------------------
   6) DASHBOARD ADMIN
   ------------------------------------------------------------------------- */
function renderDashboardView() {
  books = loadBooks();
  const totalBooks = books.length;
  const totalCopies = books.reduce((s, b) => s + (parseInt(b.maxCopies, 10) || 1), 0);
  const withContent = books.filter(b => b.content && b.content.trim()).length;
  const withoutContent = totalBooks - withContent;

  const cardsContainer = document.getElementById("adminDashboardCards");
  if (cardsContainer) {
    cardsContainer.innerHTML = `
      <div class="stat-card">
        <div class="stat-icon">📚</div>
        <div class="stat-label">Total des livres</div>
        <div class="stat-value">${totalBooks}</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📦</div>
        <div class="stat-label">Exemplaires physiques</div>
        <div class="stat-value">${totalCopies}</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">✅</div>
        <div class="stat-label">Prêts pour la lecture</div>
        <div class="stat-value">${withContent}</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">⚠️</div>
        <div class="stat-label">Sans contenu texte</div>
        <div class="stat-value">${withoutContent}</div>
      </div>
    `;
  }

  // Derniers ajouts
  const tbody = document.getElementById("adminRecentBooksBody");
  if (tbody) {
    const recents = books.slice(-6).reverse();
    tbody.innerHTML = recents.length
      ? recents.map(b => {
          const hasC = !!(b.content && b.content.trim());
          const thumb = b.cover
            ? `<img src="${escapeAttr(b.cover)}" alt="" style="width:34px;height:46px;object-fit:cover;border-radius:3px;" />`
            : `<div style="width:34px;height:46px;background:${colorForCategory(b.category)};border-radius:3px;display:grid;place-items:center;color:#fff;font-size:11px;font-weight:700;">${escapeHTML(b.title.slice(0,2))}</div>`;
          return `
            <tr>
              <td>${thumb}</td>
              <td><span class="id-chip">${b.id}</span></td>
              <td><b>${escapeHTML(b.title)}</b></td>
              <td>${escapeHTML(b.author)}</td>
              <td>${escapeHTML(b.category)}</td>
              <td><span class="admin-content-badge ${hasC ? 'ok' : 'missing'}">${hasC ? '✓ Texte OK' : '⚠ Vide'}</span></td>
              <td>
                <button class="btn btn-outline btn-sm" onclick="openContentEditor('${b.id}')">📝 Éditer texte</button>
              </td>
            </tr>
          `;
        }).join("")
      : `<tr><td colspan="7" class="empty-state">Aucun livre pour le moment.</td></tr>`;
  }
}

/* -------------------------------------------------------------------------
   7) FORMULAIRE AJOUT / MODIFICATION LIVRE
   ------------------------------------------------------------------------- */
function initBookForm() {
  const form = document.getElementById("adminBookForm");
  const coverInput = document.getElementById("bookCover");
  const coverFile = document.getElementById("bookCoverFile");
  const txtImport = document.getElementById("bookTxtFileImport");
  const cancelBtn = document.getElementById("adminCancelEditBtn");
  const removeCoverBtn = document.getElementById("adminRemoveCoverBtn");

  coverInput?.addEventListener("input", () => {
    updateCoverPreview(coverInput.value.trim());
  });

  coverFile?.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const maxW = 400, maxH = 600;
        let w = img.width, h = img.height;
        if (w > maxW || h > maxH) {
          const ratio = Math.min(maxW / w, maxH / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
        coverInput.value = dataUrl;
        updateCoverPreview(dataUrl);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });

  removeCoverBtn?.addEventListener("click", () => {
    coverInput.value = "";
    if (coverFile) coverFile.value = "";
    updateCoverPreview("");
  });

  txtImport?.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      document.getElementById("bookTextContent").value = ev.target.result;
      showToast(`Fichier texte « ${file.name} » chargé !`, "success");
    };
    reader.readAsText(file, "UTF-8");
    e.target.value = "";
  });

  cancelBtn?.addEventListener("click", resetBookForm);

  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = document.getElementById("bookTitle").value.trim();
    const author = document.getElementById("bookAuthor").value.trim();
    const category = document.getElementById("bookCategory").value.trim();
    const year = parseInt(document.getElementById("bookYear").value, 10);
    const copies = parseInt(document.getElementById("bookCopies").value, 10);
    const cover = document.getElementById("bookCover").value.trim();
    const content = document.getElementById("bookTextContent").value.trim();

    if (!title || !author || !category || isNaN(year) || isNaN(copies)) {
      showToast("Veuillez remplir tous les champs obligatoires.", "error");
      return;
    }

    books = loadBooks();

    if (editingBookId) {
      const book = books.find(b => b.id === editingBookId);
      if (book) {
        book.title = title;
        book.author = author;
        book.category = category;
        book.year = year;
        book.maxCopies = copies;
        book.copies = Math.min(copies, book.copies || copies);
        book.cover = cover;
        book.content = content;
        saveBooks(books);
        syncBookToSupabase(book);
        showToast(`« ${title} » modifié avec succès !`, "success");
      }
    } else {
      const newBook = {
        id: generateId(),
        title,
        author,
        category,
        year,
        maxCopies: copies,
        copies,
        cover,
        content
      };
      books.push(newBook);
      saveBooks(books);
      syncBookToSupabase(newBook);
      showToast(`« ${title} » ajouté à la bibliothèque !`, "success");
    }

    resetBookForm();
    renderAllAdminViews();
    switchAdminView("manage-books");
  });
}

function updateCoverPreview(src) {
  const container = document.getElementById("adminCoverPreviewContainer");
  const img = document.getElementById("adminCoverPreviewImg");
  if (!container || !img) return;

  if (src && src.trim()) {
    img.src = src;
    container.hidden = false;
  } else {
    img.src = "";
    container.hidden = true;
  }
}

function editBookInForm(bookId) {
  books = loadBooks();
  const book = books.find(b => b.id === bookId);
  if (!book) return;

  editingBookId = book.id;
  document.getElementById("adminBookId").value = book.id;
  document.getElementById("bookTitle").value = book.title;
  document.getElementById("bookAuthor").value = book.author;
  document.getElementById("bookCategory").value = book.category;
  document.getElementById("bookYear").value = book.year;
  document.getElementById("bookCopies").value = book.maxCopies;
  document.getElementById("bookCover").value = book.cover || "";
  document.getElementById("bookTextContent").value = book.content || "";

  updateCoverPreview(book.cover || "");

  document.getElementById("adminFormTitle").textContent = `✏️ Modifier « ${book.title} »`;
  document.getElementById("adminSubmitBookBtn").textContent = "Enregistrer les modifications";
  document.getElementById("adminCancelEditBtn").hidden = false;

  switchAdminView("add-book");
}

function resetBookForm() {
  editingBookId = null;
  const form = document.getElementById("adminBookForm");
  if (form) form.reset();
  updateCoverPreview("");
  document.getElementById("adminFormTitle").textContent = "➕ Ajouter un nouveau livre";
  document.getElementById("adminSubmitBookBtn").textContent = "💾 Enregistrer le livre";
  document.getElementById("adminCancelEditBtn").hidden = true;
}

/* -------------------------------------------------------------------------
   8) GESTION DE TOUS LES LIVRES
   ------------------------------------------------------------------------- */
function initManageBooks() {
  document.getElementById("manageSearchInput")?.addEventListener("input", (e) => {
    renderManageBooksTable(e.target.value.trim().toLowerCase());
  });

  document.getElementById("managePushSupaBtn")?.addEventListener("click", pushAllBooksToSupabase);

  document.getElementById("adminQuickSyncBtn")?.addEventListener("click", pushAllBooksToSupabase);
  document.getElementById("adminQuickSeedBtn")?.addEventListener("click", () => {
    if (confirm("Charger les 20 livres de démonstration complets avec couvertures et chapitres ?")) {
      seedDemoData();
      renderAllAdminViews();
      showToast("20 livres chargés avec succès !", "success");
    }
  });
}

function renderManageBooksTable(query = "") {
  books = loadBooks();
  const tbody = document.getElementById("manageBooksTableBody");
  if (!tbody) return;

  const filtered = query
    ? books.filter(b => b.title.toLowerCase().includes(query) || b.author.toLowerCase().includes(query) || b.category.toLowerCase().includes(query))
    : books;

  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="9" class="empty-state">Aucun livre ne correspond à votre recherche.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(b => {
    const hasC = !!(b.content && b.content.trim());
    const chaptersCount = hasC ? b.content.split(/^---/m).filter(s => s.trim()).length : 0;
    const thumb = b.cover
      ? `<img src="${escapeAttr(b.cover)}" alt="" style="width:36px;height:50px;object-fit:cover;border-radius:4px;" />`
      : `<div style="width:36px;height:50px;background:${colorForCategory(b.category)};border-radius:4px;display:grid;place-items:center;color:#fff;font-size:12px;font-weight:700;">${escapeHTML(b.title.slice(0,2))}</div>`;

    return `
      <tr>
        <td>${thumb}</td>
        <td><span class="id-chip">${b.id}</span></td>
        <td><b>${escapeHTML(b.title)}</b></td>
        <td>${escapeHTML(b.author)}</td>
        <td>${escapeHTML(b.category)}</td>
        <td>${b.year}</td>
        <td>${b.copies}/${b.maxCopies}</td>
        <td>
          <span class="admin-content-badge ${hasC ? 'ok' : 'missing'}">
            ${hasC ? `✓ ${chaptersCount} ch.` : '⚠ Aucun texte'}
          </span>
        </td>
        <td>
          <div class="row-actions">
            <button class="btn btn-outline btn-sm" onclick="editBookInForm('${b.id}')">✏️ Modifier</button>
            <button class="btn btn-primary btn-sm" onclick="openContentEditor('${b.id}')">📝 Texte</button>
            <button class="btn btn-danger btn-sm" onclick="askDeleteBook('${b.id}')">🗑️</button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

function askDeleteBook(bookId) {
  books = loadBooks();
  const book = books.find(b => b.id === bookId);
  if (!book) return;

  pendingDeleteId = book.id;
  const overlay = document.getElementById("adminConfirmOverlay");
  const msg = document.getElementById("adminConfirmMessage");
  if (overlay && msg) {
    msg.textContent = `Voulez-vous vraiment supprimer définitivement « ${book.title} » ?`;
    overlay.hidden = false;
  }
}

document.getElementById("adminConfirmCancel")?.addEventListener("click", () => {
  pendingDeleteId = null;
  document.getElementById("adminConfirmOverlay").hidden = true;
});

document.getElementById("adminConfirmOk")?.addEventListener("click", () => {
  if (pendingDeleteId) {
    books = loadBooks().filter(b => b.id !== pendingDeleteId);
    saveBooks(books);
    if (supabaseClient) {
      supabaseClient.from("books").delete().eq("biblio_id", pendingDeleteId).then(() => {});
    }
    showToast("Livre supprimé de la collection.", "success");
    renderAllAdminViews();
  }
  pendingDeleteId = null;
  document.getElementById("adminConfirmOverlay").hidden = true;
});

/* -------------------------------------------------------------------------
   9) ÉDITEUR DE CONTENUS & CHAPITRES
   ------------------------------------------------------------------------- */
function initContentEditor() {
  document.getElementById("contentSearchInput")?.addEventListener("input", (e) => {
    renderContentBooksList(e.target.value.trim().toLowerCase());
  });

  document.getElementById("editorCloseBtn")?.addEventListener("click", () => {
    document.getElementById("adminEditorWorkPanel").hidden = true;
    activeEditorBookId = null;
  });

  document.getElementById("editorAddChapterBtn")?.addEventListener("click", () => {
    const container = document.getElementById("editorChaptersContainer");
    const idx = container.querySelectorAll(".admin-chapter-block").length;
    const block = document.createElement("div");
    block.className = "admin-chapter-block";
    block.dataset.idx = idx;
    block.innerHTML = `
      <div class="admin-chapter-block-head">
        <span class="admin-chapter-num">Ch.${idx + 1}</span>
        <input class="admin-chapter-title-input" value="Chapitre ${idx + 1}" placeholder="Titre du chapitre" />
        <button class="admin-chapter-del" title="Supprimer">✕</button>
      </div>
      <div class="admin-chapter-body">
        <textarea rows="6" placeholder="Rédigez ou collez le texte du chapitre ici..."></textarea>
      </div>
    `;
    container.appendChild(block);
    block.querySelector(".admin-chapter-title-input").focus();
    block.querySelector(".admin-chapter-del").addEventListener("click", () => {
      block.remove();
      syncBlocksToRaw();
    });
    block.querySelectorAll("input, textarea").forEach(el => el.addEventListener("input", syncBlocksToRaw));
    block.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });

  document.getElementById("editorTxtImport")?.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      document.getElementById("editorRawTextarea").value = text;
      parseRawToBlocks(text);
      showToast(`Fichier « ${file.name} » importé avec succès !`, "success");
    };
    reader.readAsText(file, "UTF-8");
    e.target.value = "";
  });

  document.getElementById("editorSaveBtn")?.addEventListener("click", () => {
    if (!activeEditorBookId) return;
    const raw = document.getElementById("editorRawTextarea").value.trim();
    books = loadBooks();
    const book = books.find(b => b.id === activeEditorBookId);
    if (!book) return;

    book.content = raw;
    saveBooks(books);
    syncBookToSupabase(book);

    showToast(`Contenu de « ${book.title} » sauvegardé !`, "success");
    document.getElementById("adminEditorWorkPanel").hidden = true;
    activeEditorBookId = null;
    renderAllAdminViews();
  });

  document.getElementById("editorRawTextarea")?.addEventListener("input", (e) => {
    parseRawToBlocks(e.target.value);
  });
}

function renderContentBooksList(query = "") {
  books = loadBooks();
  const container = document.getElementById("contentBooksList");
  if (!container) return;

  const filtered = query
    ? books.filter(b => b.title.toLowerCase().includes(query) || b.author.toLowerCase().includes(query))
    : books;

  if (!filtered.length) {
    container.innerHTML = `<p class="empty-state">Aucun livre trouvé.</p>`;
    return;
  }

  container.innerHTML = filtered.map(b => {
    const hasC = !!(b.content && b.content.trim());
    const chapters = hasC ? b.content.split(/^---/m).filter(s => s.trim()).length : 0;
    const thumb = b.cover
      ? `<div class="admin-book-thumb"><img src="${escapeAttr(b.cover)}" alt="" /></div>`
      : `<div class="admin-book-thumb" style="background:${colorForCategory(b.category)}">${escapeHTML(b.title.slice(0,2))}</div>`;

    return `
      <div class="admin-book-item ${hasC ? 'has-content' : 'no-content'}" onclick="openContentEditor('${b.id}')">
        ${thumb}
        <div class="admin-book-info">
          <h4>${escapeHTML(b.title)}</h4>
          <span>${escapeHTML(b.author)}</span>
        </div>
        <span class="admin-content-badge ${hasC ? 'ok' : 'missing'}">
          ${hasC ? `✓ ${chapters} ch.` : '⚠ Vide'}
        </span>
      </div>
    `;
  }).join("");
}

function openContentEditor(bookId) {
  books = loadBooks();
  const book = books.find(b => b.id === bookId);
  if (!book) return;

  activeEditorBookId = book.id;

  document.getElementById("editorBookTitle").textContent = book.title;
  document.getElementById("editorBookAuthor").textContent = `${book.author} (${book.year})`;
  const coverEl = document.getElementById("editorCoverThumb");
  if (coverEl) {
    coverEl.innerHTML = book.cover
      ? `<img src="${escapeAttr(book.cover)}" alt="" />`
      : `📖`;
  }

  const rawText = book.content || "";
  document.getElementById("editorRawTextarea").value = rawText;
  parseRawToBlocks(rawText);

  document.getElementById("adminEditorWorkPanel").hidden = false;
  switchAdminView("content-editor");
  document.getElementById("adminEditorWorkPanel").scrollIntoView({ behavior: "smooth", block: "start" });
}

function parseRawToBlocks(rawText) {
  const container = document.getElementById("editorChaptersContainer");
  if (!container) return;

  const sections = rawText.split(/^---/m).map(s => s.trim()).filter(Boolean);

  if (!sections.length) {
    container.innerHTML = `<p class="muted" style="padding:10px;">Aucun chapitre détecté. Utilisez le bouton ci-dessus pour en ajouter.</p>`;
    return;
  }

  container.innerHTML = sections.map((sec, idx) => {
    const lines = sec.split("\n");
    let title = `Chapitre ${idx + 1}`;
    let body = sec;
    const firstLine = lines[0].replace(/^---|---$/g, "").trim();
    if (firstLine.length < 90) {
      title = firstLine;
      body = lines.slice(1).join("\n").trim();
    }
    return `
      <div class="admin-chapter-block" data-idx="${idx}">
        <div class="admin-chapter-block-head">
          <span class="admin-chapter-num">Ch.${idx + 1}</span>
          <input class="admin-chapter-title-input" value="${escapeAttr(title)}" placeholder="Titre du chapitre" />
          <button class="admin-chapter-del" title="Supprimer">✕</button>
        </div>
        <div class="admin-chapter-body">
          <textarea rows="6" placeholder="Texte du chapitre...">${escapeHTML(body)}</textarea>
        </div>
      </div>
    `;
  }).join("");

  container.querySelectorAll(".admin-chapter-del").forEach(btn => {
    btn.addEventListener("click", () => {
      btn.closest(".admin-chapter-block").remove();
      syncBlocksToRaw();
    });
  });

  container.querySelectorAll("input, textarea").forEach(el => {
    el.addEventListener("input", syncBlocksToRaw);
  });
}

function syncBlocksToRaw() {
  const blocks = document.querySelectorAll("#editorChaptersContainer .admin-chapter-block");
  if (!blocks.length) return;

  const raw = Array.from(blocks).map((b, i) => {
    b.querySelector(".admin-chapter-num").textContent = `Ch.${i + 1}`;
    const t = b.querySelector(".admin-chapter-title-input").value.trim() || `Chapitre ${i + 1}`;
    const c = b.querySelector("textarea").value.trim();
    return `--- ${t} ---\n${c}`;
  }).join("\n\n");

  document.getElementById("editorRawTextarea").value = raw;
}

/* -------------------------------------------------------------------------
   10) SUPABASE INTEGRATION
   ------------------------------------------------------------------------- */
function initSupabase() {
  const cfg = loadSupabaseConfig();
  if (cfg.url && cfg.key) {
    document.getElementById("supaUrlInput").value = cfg.url;
    document.getElementById("supaKeyInput").value = cfg.key;
    connectSupabase(cfg.url, cfg.key);
  }

  document.getElementById("supaConfigForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const url = document.getElementById("supaUrlInput").value.trim();
    const key = document.getElementById("supaKeyInput").value.trim();
    saveSupabaseConfig(url, key);
    connectSupabase(url, key);
  });

  document.getElementById("supaSyncNowBtn")?.addEventListener("click", pushAllBooksToSupabase);
}

function loadSupabaseConfig() {
  try {
    const raw = localStorage.getItem(SUPABASE_CONFIG_KEY);
    return raw ? JSON.parse(raw) : { url: "", key: "" };
  } catch (e) {
    return { url: "", key: "" };
  }
}

function saveSupabaseConfig(url, key) {
  localStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify({ url, key }));
}

function connectSupabase(url, key) {
  try {
    if (!window.supabase) return;
    supabaseClient = window.supabase.createClient(url, key);

    supabaseClient.from("books").select("count", { count: "exact", head: true })
      .then(({ error }) => {
        if (error) {
          setSupaStatusUI(false, `Erreur : ${error.message}`);
        } else {
          setSupaStatusUI(true, "Connecté à Supabase ✓");
          loadCloudUsers();
        }
      })
      .catch(err => {
        setSupaStatusUI(false, "Impossible de joindre Supabase");
      });
  } catch (err) {
    setSupaStatusUI(false, `Erreur: ${err.message}`);
  }
}

function setSupaStatusUI(connected, label) {
  const headerStatus = document.getElementById("statusLabel");
  const headerDot = document.getElementById("statusDot");
  const configText = document.getElementById("supaConfigStatusText");
  const configDot = document.getElementById("supaConfigDot");

  if (headerStatus) headerStatus.textContent = label;
  if (headerDot) headerDot.className = "status-dot " + (connected ? "connected" : "error");
  if (configText) configText.textContent = label;
  if (configDot) configDot.className = "status-dot " + (connected ? "connected" : "error");
}

async function syncBookToSupabase(book) {
  if (!supabaseClient) return;
  await supabaseClient.from("books").upsert({
    biblio_id: book.id,
    title: book.title,
    author: book.author,
    category: book.category,
    year: book.year,
    max_copies: book.maxCopies,
    copies: book.copies,
    cover_url: book.cover,
    content: book.content
  }, { onConflict: "biblio_id" });
}

async function pushAllBooksToSupabase() {
  if (!supabaseClient) {
    showToast("Veuillez d'abord connecter Supabase avec vos clés d'API.", "error");
    switchAdminView("database");
    return;
  }

  books = loadBooks();
  showToast("Synchronisation avec Supabase en cours...", "info");

  const rows = books.map(b => ({
    biblio_id: b.id,
    title: b.title,
    author: b.author,
    category: b.category,
    year: b.year,
    max_copies: b.maxCopies,
    copies: b.copies,
    cover_url: b.cover,
    content: b.content
  }));

  const { error } = await supabaseClient.from("books").upsert(rows, { onConflict: "biblio_id" });

  if (error) {
    showToast("Erreur Supabase : " + error.message, "error");
  } else {
    showToast(`${books.length} livres synchronisés dans le Cloud Supabase ! ☁️`, "success");
  }
}

async function loadCloudUsers() {
  const container = document.getElementById("adminUsersContainer");
  if (!container) return;

  if (!supabaseClient) {
    container.innerHTML = `<p class="empty-state">Connectez Supabase pour afficher les utilisateurs enregistrés.</p>`;
    return;
  }

  container.innerHTML = `<p class="empty-state">Chargement des utilisateurs...</p>`;

  const { data, error } = await supabaseClient.from("user_profiles").select("*").order("created_at", { ascending: false });

  if (error) {
    container.innerHTML = `<p class="empty-state">Erreur : ${error.message}</p>`;
    return;
  }

  if (!data?.length) {
    container.innerHTML = `<p class="empty-state">Aucun utilisateur enregistré pour le moment.</p>`;
    return;
  }

  container.innerHTML = `
    <table class="book-table">
      <thead>
        <tr>
          <th>Avatar</th>
          <th>Nom</th>
          <th>Genre favori</th>
          <th>Objectif</th>
          <th>Date de création</th>
        </tr>
      </thead>
      <tbody>
        ${data.map(u => `
          <tr>
            <td style="font-size:22px;">${u.avatar_emoji || '👤'}</td>
            <td><b>${escapeHTML(u.display_name || 'Anonyme')}</b></td>
            <td>${escapeHTML(u.favorite_genre || '—')}</td>
            <td>${u.reading_goal || 12} livres/an</td>
            <td>${u.created_at ? new Date(u.created_at).toLocaleDateString('fr-FR') : '—'}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

/* -------------------------------------------------------------------------
   11) IMPORT / EXPORT
   ------------------------------------------------------------------------- */
function initImportExport() {
  // Export JSON
  document.getElementById("adminExportJsonBtn")?.addEventListener("click", () => {
    books = loadBooks();
    const json = JSON.stringify(books, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bibliotheque_backup_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Export JSON téléchargé !", "success");
  });

  // Import JSON
  document.getElementById("adminImportJsonFile")?.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target.result);
        if (!Array.isArray(imported)) throw new Error("Format de fichier non reconnu.");
        books = loadBooks();
        imported.forEach(ib => {
          const idx = books.findIndex(b => b.id === ib.id);
          if (idx >= 0) books[idx] = { ...books[idx], ...ib };
          else books.push(ib);
        });
        saveBooks(books);
        renderAllAdminViews();
        showToast(`${imported.length} livre(s) importé(s) avec succès !`, "success");
      } catch (err) {
        showToast("Erreur lors de l'import : " + err.message, "error");
      }
    };
    reader.readAsText(file, "UTF-8");
    e.target.value = "";
  });

  // Export PDF
  document.getElementById("adminExportPdfBtn")?.addEventListener("click", () => {
    books = loadBooks();
    if (!window.jspdf || !books.length) {
      showToast("Aucun livre à exporter.", "error"); return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Bibliothèque — Inventaire Administrateur", 14, 16);
    const rows = books.map(b => [b.id, b.title, b.author, b.category, String(b.year), `${b.copies}/${b.maxCopies}`]);
    doc.autoTable({
      head: [["ID", "Titre", "Auteur", "Catégorie", "Année", "Stock"]],
      body: rows,
      startY: 22,
      headStyles: { fillColor: [17, 32, 28] }
    });
    doc.save("inventaire_bibliotheque.pdf");
    showToast("Catalogue PDF généré !", "success");
  });

  // Export Excel
  document.getElementById("adminExportExcelBtn")?.addEventListener("click", () => {
    books = loadBooks();
    if (!window.XLSX || !books.length) {
      showToast("Aucun livre à exporter.", "error"); return;
    }
    const data = books.map(b => ({
      ID: b.id,
      Titre: b.title,
      Auteur: b.author,
      Catégorie: b.category,
      Année: b.year,
      "Disponibles": b.copies,
      "Total": b.maxCopies,
      "Contenu disponible": b.content ? "OUI" : "NON"
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Livres");
    XLSX.writeFile(wb, "inventaire_bibliotheque.xlsx");
    showToast("Fichier Excel généré !", "success");
  });

  // Reset local
  document.getElementById("adminResetLocalBtn")?.addEventListener("click", () => {
    if (confirm("⚠️ Réinitialiser toutes les données locales ? Cette action est irréversible.")) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(COUNTER_KEY);
      books = [];
      renderAllAdminViews();
      showToast("Données locales réinitialisées.", "info");
    }
  });
}

/* -------------------------------------------------------------------------
   12) DEMO DATA (20 Livres enrichis)
   ------------------------------------------------------------------------- */
function seedDemoData() {
  const SEED = [
    { title: "Le Petit Prince", author: "Antoine de Saint-Exupéry", category: "Roman", year: 1943, copies: 5, cover: "https://covers.openlibrary.org/b/id/12836262-L.jpg", content: "--- Chapitre 1 : Les grandes personnes et les boas ---\nLorsque j'avais six ans j'ai vu, une fois, une magnifique image...\n\n--- Chapitre 2 : La rencontre dans le désert ---\nJ'ai ainsi vécu seul, sans personne avec qui parler...\n\n--- Chapitre 3 : Le secret du Renard ---\nOn ne voit bien qu'avec le cœur. L'essentiel est invisible pour les yeux." },
    { title: "Python Facile", author: "Jean Dupont", category: "Informatique", year: 2020, copies: 3, cover: "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=600&auto=format&fit=crop&q=80", content: "--- Chapitre 1 : Introduction à Python ---\nPython est un langage élégant et lisible...\n\n--- Chapitre 2 : Variables et Fonctions ---\nLes variables se déclarent sans type explicite." },
    { title: "Les Misérables", author: "Victor Hugo", category: "Roman", year: 1862, copies: 4, cover: "https://covers.openlibrary.org/b/id/8231856-L.jpg", content: "--- Chapitre 1 : Un juste ---\nEn 1815, M. Charles-François-Bienvenu Myriel était évêque de Digne...\n\n--- Chapitre 2 : L'arrivée de Jean Valjean ---\nÀ l'heure où le soleil se couchait, un homme entra à pied..." },
    { title: "Une Brève Histoire du Temps", author: "Stephen Hawking", category: "Science", year: 1988, copies: 2, cover: "https://covers.openlibrary.org/b/id/8306073-L.jpg", content: "--- Chapitre 1 : Notre image de l'Univers ---\nUn scientifique réputé donnait un jour une conférence sur l'astronomie...\n\n--- Chapitre 2 : L'Espace et le Temps ---\nAlbert Einstein a démontré la relativité de l'espace-temps." },
    { title: "Sapiens", author: "Yuval Noah Harari", category: "Histoire", year: 2011, copies: 6, cover: "https://covers.openlibrary.org/b/id/12539702-L.jpg", content: "--- Chapitre 1 : Un animal sans importance ---\nIl y a 100 000 ans, au moins six espèces humaines habitaient la Terre...\n\n--- Chapitre 2 : La Révolution Cognitive ---\nLa capacité de créer et de croire en des fictions a permis la coopération." },
    { title: "1984", author: "George Orwell", category: "Science-fiction", year: 1949, copies: 5, cover: "https://covers.openlibrary.org/b/id/12547191-L.jpg", content: "--- Chapitre 1 : Big Brother vous regarde ---\nC'était une journée d'avril froide et claire...\n\n--- Chapitre 2 : Le journal intime interdit ---\nWinston s'assit hors de portée du télécran et commença à écrire." },
    { title: "Le Comte de Monte-Cristo", author: "Alexandre Dumas", category: "Roman", year: 1844, copies: 3, cover: "https://covers.openlibrary.org/b/id/8225261-L.jpg", content: "--- Chapitre 1 : L'arrivée à Marseille ---\nLe 24 février 1815, le trois-mâts le Pharaon arriva au port...\n\n--- Chapitre 2 : Le complot ---\nEdmond Dantès fut arrêté en plein banquet de fiançailles." },
    { title: "Clean Code", author: "Robert C. Martin", category: "Informatique", year: 2008, copies: 3, cover: "https://covers.openlibrary.org/b/id/10522435-L.jpg", content: "--- Chapitre 1 : Pourquoi le code propre compte ---\nUn code propre est lisible, simple et direct...\n\n--- Chapitre 2 : Nommer avec soin ---\nLes noms doivent révéler clairement l'intention." }
  ];

  books = SEED.map(s => ({
    id: generateId(),
    title: s.title,
    author: s.author,
    category: s.category,
    year: s.year,
    maxCopies: s.copies,
    copies: s.copies,
    cover: s.cover,
    content: s.content
  }));
  saveBooks(books);
}

/* -------------------------------------------------------------------------
   13) TOAST & UTILITAIRES
   ------------------------------------------------------------------------- */
function showToast(msg, type = "info") {
  const container = document.getElementById("toastContainer");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3200);
}

function escapeHTML(str) {
  return String(str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function escapeAttr(str) {
  return String(str || "").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function renderAllAdminViews() {
  renderDashboardView();
  renderManageBooksTable();
  renderContentBooksList();
}
