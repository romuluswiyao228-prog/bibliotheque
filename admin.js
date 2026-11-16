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
let pendingDeleteAll = false;

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
  initAdvancedImports();
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
   6bis) IMPORT PDF — extraction du texte via pdf.js
   ------------------------------------------------------------------------- */
async function extractTextFromPdf(file) {
  if (!window["pdfjsLib"]) {
    throw new Error("La librairie pdf.js n'a pas pu se charger (vérifiez votre connexion internet).");
  }
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const pageBlocks = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => item.str).join(" ").replace(/\s+/g, " ").trim();
    pageBlocks.push(`--- Page ${i} ---\n${pageText || "(page vide ou image non extractible)"}`);
  }

  return pageBlocks.join("\n\n");
}

/* -------------------------------------------------------------------------
   6ter) STOCKAGE PDF NATIF — enregistre le PDF en base64 + génère des miniatures
   ------------------------------------------------------------------------- */
async function storePdfNative(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev) => resolve(ev.target.result); // data:application/pdf;base64,...
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function generatePdfPagePreviews(base64Data, maxPages = 4) {
  if (!window["pdfjsLib"]) return [];
  const previews = [];
  try {
    const pdfData = atob(base64Data.split(",")[1]);
    const uint8 = new Uint8Array(pdfData.length);
    for (let i = 0; i < pdfData.length; i++) uint8[i] = pdfData.charCodeAt(i);
    const pdf = await pdfjsLib.getDocument({ data: uint8 }).promise;
    const count = Math.min(maxPages, pdf.numPages);
    for (let i = 1; i <= count; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 0.4 });
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
      previews.push({ pageNum: i, dataUrl: canvas.toDataURL("image/jpeg", 0.7) });
    }
  } catch (e) {
    console.warn("Erreur génération miniatures PDF", e);
  }
  return previews;
}

async function getPdfPageCount(base64Data) {
  if (!window["pdfjsLib"]) return 0;
  try {
    const pdfData = atob(base64Data.split(",")[1]);
    const uint8 = new Uint8Array(pdfData.length);
    for (let i = 0; i < pdfData.length; i++) uint8[i] = pdfData.charCodeAt(i);
    const pdf = await pdfjsLib.getDocument({ data: uint8 }).promise;
    return pdf.numPages;
  } catch (e) { return 0; }
}

/* -------------------------------------------------------------------------
   6quart) STOCKAGE IMAGES — convertit les images en base64
   ------------------------------------------------------------------------- */
async function storeImages(files) {
  const pages = [];
  const sorted = Array.from(files).sort((a, b) => a.name.localeCompare(b.name));
  for (const file of sorted) {
    const data = await new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = ev => resolve(ev.target.result);
      r.onerror = reject;
      r.readAsDataURL(file);
    });
    pages.push(data);
  }
  return pages;
}

/* -------------------------------------------------------------------------
   7) FORMULAIRE AJOUT / MODIFICATION LIVRE (UNIVERSEL)
   ------------------------------------------------------------------------- */
// État de l'import en cours
let _pendingPdfBase64 = null;
let _pendingPdfPageCount = 0;
let _pendingImages = [];

function initBookForm() {
  const form = document.getElementById("adminBookForm");
  const coverInput = document.getElementById("bookCover");
  const coverFile = document.getElementById("bookCoverFile");
  const txtImport = document.getElementById("bookTxtFileImport");
  const cancelBtn = document.getElementById("adminCancelEditBtn");
  const removeCoverBtn = document.getElementById("adminRemoveCoverBtn");

  // ------ Navigation 3 Onglets ------
  document.querySelectorAll(".add-book-tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".add-book-tab-btn").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".add-book-tab-panel").forEach(p => p.classList.remove("active"));
      btn.classList.add("active");
      const targetId = "panel-" + btn.dataset.tab;
      document.getElementById(targetId)?.classList.add("active");
    });
  });

  // ------ Sélecteur de type de contenu ------
  document.querySelectorAll('input[name="bookContentType"]').forEach(radio => {
    radio.addEventListener("change", () => switchContentTypePanel(radio.value));
  });

  // ------ Couverture URL ------
  coverInput?.addEventListener("input", () => {
    updateCoverPreview(coverInput.value.trim());
  });

  // ------ Couverture fichier ------
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

  // ------ Import .txt pour mode texte ------
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

  // ------ Extraction texte d'un PDF (mode texte) ------
  const pdfTextImport = document.getElementById("bookPdfTextImport");
  const pdfStatus = document.getElementById("bookPdfImportStatus");
  pdfTextImport?.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    pdfStatus.hidden = false;
    pdfStatus.textContent = `⏳ Extraction du texte de « ${file.name} » en cours…`;
    try {
      const text = await extractTextFromPdf(file);
      document.getElementById("bookTextContent").value = text;
      const pageCount = (text.match(/^--- Page \d+ ---/gm) || []).length;
      pdfStatus.textContent = `✓ PDF importé : ${pageCount} page(s) converties en chapitres.`;
      showToast(`PDF « ${file.name} » importé et découpé en chapitres !`, "success");
    } catch (err) {
      pdfStatus.textContent = `✗ Échec de l'import PDF : ${err.message}`;
      showToast("Impossible d'extraire le texte de ce PDF.", "error");
    }
    e.target.value = "";
  });

  // ------ Import PDF natif ------
  const pdfNativeImport = document.getElementById("bookPdfNativeImport");
  pdfNativeImport?.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    await handlePdfNativeImport(file);
    e.target.value = "";
  });

  // Drag & Drop pour la zone PDF
  const pdfDropZone = document.getElementById("adminPdfDropZone");
  if (pdfDropZone) {
    pdfDropZone.addEventListener("dragover", (e) => { e.preventDefault(); pdfDropZone.classList.add("drag-over"); });
    pdfDropZone.addEventListener("dragleave", () => pdfDropZone.classList.remove("drag-over"));
    pdfDropZone.addEventListener("drop", async (e) => {
      e.preventDefault();
      pdfDropZone.classList.remove("drag-over");
      const file = e.dataTransfer.files[0];
      if (file && file.type === "application/pdf") await handlePdfNativeImport(file);
      else showToast("Veuillez déposer un fichier PDF.", "error");
    });
  }

  // Bouton supprimer PDF
  document.getElementById("adminPdfRemoveBtn")?.addEventListener("click", () => {
    _pendingPdfBase64 = null;
    _pendingPdfPageCount = 0;
    document.getElementById("bookPdfData").value = "";
    document.getElementById("bookPdfPageCount").value = "0";
    document.getElementById("adminPdfInfo").hidden = true;
    document.getElementById("adminPdfDropZone").hidden = false;
    showToast("PDF supprimé.", "info");
  });

  // ------ Import Images ------
  const imagesImport = document.getElementById("bookImagesImport");
  imagesImport?.addEventListener("change", async (e) => {
    const files = e.target.files;
    if (!files || !files.length) return;
    await handleImagesImport(files);
    e.target.value = "";
  });

  // Drag & Drop pour la zone images
  const imagesDropZone = document.getElementById("adminImagesDropZone");
  if (imagesDropZone) {
    imagesDropZone.addEventListener("dragover", (e) => { e.preventDefault(); imagesDropZone.classList.add("drag-over"); });
    imagesDropZone.addEventListener("dragleave", () => imagesDropZone.classList.remove("drag-over"));
    imagesDropZone.addEventListener("drop", async (e) => {
      e.preventDefault();
      imagesDropZone.classList.remove("drag-over");
      const files = e.dataTransfer.files;
      if (files.length) await handleImagesImport(files);
    });
  }

  document.getElementById("adminImagesRemoveAllBtn")?.addEventListener("click", () => {
    _pendingImages = [];
    document.getElementById("bookImagesData").value = "";
    document.getElementById("adminImagesPreviewGrid").hidden = true;
    document.getElementById("adminImagesDropZone").hidden = false;
    showToast("Toutes les images supprimées.", "info");
  });

  cancelBtn?.addEventListener("click", resetBookForm);

  // ------ Soumission du formulaire (avec vérif doublons) ------
  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const isbn = document.getElementById("bookIsbn").value.trim();
    const title = document.getElementById("bookTitle").value.trim();
    const author = document.getElementById("bookAuthor").value.trim();
    const category = document.getElementById("bookCategory").value.trim();
    const year = parseInt(document.getElementById("bookYear").value, 10);
    const language = document.getElementById("bookLanguage").value.trim();
    const description = document.getElementById("bookDescription").value.trim();
    const copies = parseInt(document.getElementById("bookCopies").value, 10);
    const cover = document.getElementById("bookCover").value.trim();
    const contentType = document.querySelector('input[name="bookContentType"]:checked')?.value || "text";

    if (!title || !author || !category || isNaN(year) || isNaN(copies)) {
      showToast("Veuillez remplir tous les champs obligatoires.", "error");
      return;
    }

    // Validation selon le type
    if (contentType === "pdf" && !_pendingPdfBase64 && !editingBookId) {
      showToast("Veuillez importer un fichier PDF.", "error");
      return;
    }
    if (contentType === "images" && _pendingImages.length === 0 && !editingBookId) {
      showToast("Veuillez importer au moins une image de page.", "error");
      return;
    }

    books = loadBooks();

    const bookData = {
      isbn, title, author, category, year, language, description,
      maxCopies: copies, cover, contentType
    };

    if (contentType === "text") {
      bookData.content = document.getElementById("bookTextContent").value.trim();
    } else if (contentType === "pdf") {
      if (_pendingPdfBase64) {
        bookData.pdfData = _pendingPdfBase64;
        bookData.pageCount = _pendingPdfPageCount;
      }
      bookData.content = "";
    } else if (contentType === "images") {
      if (_pendingImages.length > 0) {
        bookData.pages = _pendingImages;
        bookData.pageCount = _pendingImages.length;
      }
      bookData.content = "";
    }

    // Détection de doublons (uniquement en création)
    if (!editingBookId) {
      const dup = books.find(b => (isbn && b.isbn === isbn) || (b.title.toLowerCase() === title.toLowerCase() && b.author.toLowerCase() === author.toLowerCase()));
      if (dup) {
        showDuplicateModal(dup, bookData, (choice) => {
          if (choice === "update") {
            _proceedSaveBook(dup.id, bookData);
          } else if (choice === "new") {
            _proceedSaveBook(null, bookData);
          }
        });
        return;
      }
    }

    _proceedSaveBook(editingBookId, bookData);
  });

  // Action bouton Lookup manuel
  document.getElementById("isbnLookupManualBtn")?.addEventListener("click", async () => {
    const isbn = document.getElementById("bookIsbn").value.trim();
    if (!isbn) return showToast("Veuillez saisir un ISBN", "error");
    document.getElementById("isbnLookupManualBtn").textContent = "⏳";
    try {
      const data = await fetchIsbnData(isbn);
      if (data) {
        if (data.title) document.getElementById("bookTitle").value = data.title;
        if (data.author) document.getElementById("bookAuthor").value = data.author;
        if (data.year) document.getElementById("bookYear").value = data.year;
        if (data.cover) {
          document.getElementById("bookCover").value = data.cover;
          updateCoverPreview(data.cover);
        }
        document.getElementById("isbnAutoFillBadge").hidden = false;
        setTimeout(() => document.getElementById("isbnAutoFillBadge").hidden = true, 3000);
      } else {
        showToast("Aucun résultat pour cet ISBN", "info");
      }
    } catch(e) {
      showToast("Erreur API ISBN", "error");
    }
    document.getElementById("isbnLookupManualBtn").textContent = "🔍 Auto";
  });
}

function _proceedSaveBook(idToUpdate, bookData) {
  if (idToUpdate) {
    const book = books.find(b => b.id === idToUpdate);
    if (book) {
      Object.assign(book, bookData);
      book.copies = Math.min(bookData.maxCopies, book.copies || bookData.maxCopies);
      saveBooks(books);
      syncBookToSupabase(book);
      showToast(`« ${book.title} » mis à jour avec succès !`, "success");
    }
  } else {
    const newBook = {
      id: generateId(),
      copies: bookData.maxCopies,
      ...bookData
    };
    books.push(newBook);
    saveBooks(books);
    syncBookToSupabase(newBook);
    showToast(`« ${newBook.title} » ajouté à la bibliothèque !`, "success");
  }

  resetBookForm();
  renderAllAdminViews();
  switchAdminView("manage-books");
}

function showDuplicateModal(oldBook, newBookData, callback) {
  const overlay = document.getElementById("duplicateModalOverlay");
  const tbody = document.querySelector("#dupDiffTable tbody");
  tbody.innerHTML = "";

  const fields = [
    { key: 'isbn', label: 'ISBN' },
    { key: 'title', label: 'Titre' },
    { key: 'author', label: 'Auteur' },
    { key: 'category', label: 'Catégorie' },
    { key: 'year', label: 'Année' },
    { key: 'maxCopies', label: 'Exemplaires' }
  ];

  fields.forEach(f => {
    let oldVal = oldBook[f.key] || '—';
    let newVal = newBookData[f.key] || '—';
    if (oldVal != newVal) {
      tbody.innerHTML += `<tr>
        <td class="diff-field-name">${f.label}</td>
        <td class="diff-old-val">${escapeHTML(String(oldVal))}</td>
        <td class="diff-new-val">${escapeHTML(String(newVal))}</td>
      </tr>`;
    }
  });

  if (tbody.innerHTML === "") {
    tbody.innerHTML = `<tr><td colspan="3" class="muted">Aucune différence sur les champs principaux.</td></tr>`;
  }

  overlay.hidden = false;

  const btnUpdate = document.getElementById("dupUpdateBtn");
  const btnNew = document.getElementById("dupNewEditionBtn");
  const btnCancel = document.getElementById("dupCancelBtn");

  const cleanup = () => {
    overlay.hidden = true;
    btnUpdate.replaceWith(btnUpdate.cloneNode(true));
    btnNew.replaceWith(btnNew.cloneNode(true));
    btnCancel.replaceWith(btnCancel.cloneNode(true));
  };

  document.getElementById("dupUpdateBtn").addEventListener("click", () => { cleanup(); callback("update"); });
  document.getElementById("dupNewEditionBtn").addEventListener("click", () => { cleanup(); callback("new"); });
  document.getElementById("dupCancelBtn").addEventListener("click", () => { cleanup(); callback("cancel"); });
}

// Fonction utilitaire pour chercher ISBN via OpenLibrary
async function fetchIsbnData(isbn) {
  const cleanIsbn = isbn.replace(/[- ]/g, '');
  const res = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${cleanIsbn}&format=json&jscmd=data`);
  const data = await res.json();
  const book = data[`ISBN:${cleanIsbn}`];
  if (!book) return null;
  return {
    title: book.title || "",
    author: book.authors ? book.authors.map(a => a.name).join(", ") : "",
    year: book.publish_date ? parseInt(book.publish_date.match(/\d{4}/)?.[0]) : "",
    cover: book.cover ? book.cover.large : ""
  };
}

// Gestion import PDF natif
async function handlePdfNativeImport(file) {
  const dropZone = document.getElementById("adminPdfDropZone");
  const infoPanel = document.getElementById("adminPdfInfo");
  const previewEl = document.getElementById("adminPdfPagesPreview");

  showToast(`⏳ Chargement de « ${file.name} »…`, "info");
  dropZone.hidden = true;
  infoPanel.hidden = false;

  document.getElementById("adminPdfFileName").textContent = file.name;
  document.getElementById("adminPdfFileSize").textContent = formatFileSize(file.size) + " · analyse en cours…";
  previewEl.innerHTML = `<span class="muted">⏳ Génération des aperçus de pages…</span>`;

  try {
    _pendingPdfBase64 = await storePdfNative(file);
    _pendingPdfPageCount = await getPdfPageCount(_pendingPdfBase64);

    document.getElementById("bookPdfData").value = _pendingPdfBase64;
    document.getElementById("bookPdfPageCount").value = _pendingPdfPageCount;
    document.getElementById("adminPdfFileSize").textContent = `${formatFileSize(file.size)} · ${_pendingPdfPageCount} page(s)`;

    // Générer miniatures des premières pages
    const previews = await generatePdfPagePreviews(_pendingPdfBase64, 4);
    if (previews.length) {
      previewEl.innerHTML = `
        <div class="pdf-previews-label">Aperçu des premières pages :</div>
        <div class="pdf-previews-row">
          ${previews.map(p => `
            <div class="pdf-preview-thumb">
              <img src="${p.dataUrl}" alt="Page ${p.pageNum}" />
              <span>Page ${p.pageNum}</span>
            </div>`).join("")}
        </div>`;
    } else {
      previewEl.innerHTML = `<span class="muted">✅ PDF chargé (aperçu non disponible pour ce fichier)</span>`;
    }

    // Auto-fill couverture depuis la 1ère page si pas de couverture
    if (previews.length && !document.getElementById("bookCover").value.trim()) {
      document.getElementById("bookCover").value = previews[0].dataUrl;
      updateCoverPreview(previews[0].dataUrl);
    }

    showToast(`PDF « ${file.name} » chargé (${_pendingPdfPageCount} pages)`, "success");
  } catch (err) {
    dropZone.hidden = false;
    infoPanel.hidden = true;
    _pendingPdfBase64 = null;
    showToast(`Erreur lors du chargement du PDF : ${err.message}`, "error");
  }
}

// Gestion import images
async function handleImagesImport(files) {
  const dropZone = document.getElementById("adminImagesDropZone");
  const previewGrid = document.getElementById("adminImagesPreviewGrid");
  const thumbsEl = document.getElementById("adminImagesThumbs");
  const countEl = document.getElementById("adminImageCount");

  showToast(`⏳ Chargement de ${files.length} image(s)…`, "info");

  try {
    const validFiles = Array.from(files).filter(f => f.type.startsWith("image/"));
    _pendingImages = await storeImages(validFiles);
    document.getElementById("bookImagesData").value = JSON.stringify(_pendingImages);

    dropZone.hidden = true;
    previewGrid.hidden = false;
    countEl.textContent = `${_pendingImages.length} page(s) chargée(s)`;

    thumbsEl.innerHTML = _pendingImages.map((src, idx) => `
      <div class="image-thumb-item">
        <img src="${src}" alt="Page ${idx + 1}" />
        <span>Page ${idx + 1}</span>
      </div>`).join("");

    // Auto-fill couverture depuis la 1ère image si vide
    if (_pendingImages.length && !document.getElementById("bookCover").value.trim()) {
      document.getElementById("bookCover").value = _pendingImages[0];
      updateCoverPreview(_pendingImages[0]);
    }

    showToast(`${_pendingImages.length} image(s) chargée(s) comme pages de livre !`, "success");
  } catch (err) {
    showToast(`Erreur lors du chargement des images : ${err.message}`, "error");
  }
}

// Utilitaire taille de fichier
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + " o";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " Ko";
  return (bytes / (1024 * 1024)).toFixed(1) + " Mo";
}

// Basculer entre les panneaux selon le type sélectionné
function switchContentTypePanel(type) {
  document.getElementById("panelText").hidden = (type !== "text");
  document.getElementById("panelPdf").hidden = (type !== "pdf");
  document.getElementById("panelImages").hidden = (type !== "images");

  // Mise à jour visuelle des labels
  document.querySelectorAll(".content-type-btn").forEach(label => {
    label.classList.toggle("active", label.dataset.type === type);
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
  _pendingPdfBase64 = null;
  _pendingPdfPageCount = 0;
  _pendingImages = [];

  document.getElementById("adminBookId").value = book.id;
  document.getElementById("bookTitle").value = book.title;
  document.getElementById("bookAuthor").value = book.author;
  document.getElementById("bookCategory").value = book.category;
  document.getElementById("bookYear").value = book.year;
  document.getElementById("bookCopies").value = book.maxCopies;
  document.getElementById("bookCover").value = book.cover || "";

  const ct = book.contentType || "text";
  const radioEl = document.querySelector(`input[name="bookContentType"][value="${ct}"]`);
  if (radioEl) radioEl.checked = true;
  switchContentTypePanel(ct);

  if (ct === "text") {
    document.getElementById("bookTextContent").value = book.content || "";
  } else if (ct === "pdf" && book.pdfData) {
    _pendingPdfBase64 = book.pdfData;
    _pendingPdfPageCount = book.pageCount || 0;
    document.getElementById("bookPdfData").value = book.pdfData;
    document.getElementById("bookPdfPageCount").value = book.pageCount || 0;
    document.getElementById("adminPdfInfo").hidden = false;
    document.getElementById("adminPdfDropZone").hidden = true;
    document.getElementById("adminPdfFileName").textContent = "PDF enregistré";
    document.getElementById("adminPdfFileSize").textContent = `${book.pageCount || 0} page(s)`;
    document.getElementById("adminPdfPagesPreview").innerHTML = `<span class="muted">✅ PDF chargé — ${book.pageCount || 0} pages</span>`;
  } else if (ct === "images" && book.pages?.length) {
    _pendingImages = book.pages;
    document.getElementById("adminImagesDropZone").hidden = true;
    document.getElementById("adminImagesPreviewGrid").hidden = false;
    document.getElementById("adminImageCount").textContent = `${book.pages.length} page(s) chargée(s)`;
    document.getElementById("adminImagesThumbs").innerHTML = book.pages.map((src, idx) =>
      `<div class="image-thumb-item"><img src="${src}" alt="Page ${idx + 1}" /><span>Page ${idx + 1}</span></div>`
    ).join("");
  }

  updateCoverPreview(book.cover || "");

  document.getElementById("adminFormTitle").textContent = `✏️ Modifier « ${book.title} »`;
  document.getElementById("adminSubmitBookBtn").textContent = "Enregistrer les modifications";
  document.getElementById("adminCancelEditBtn").hidden = false;

  switchAdminView("add-book");
}

function resetBookForm() {
  editingBookId = null;
  _pendingPdfBase64 = null;
  _pendingPdfPageCount = 0;
  _pendingImages = [];

  const form = document.getElementById("adminBookForm");
  if (form) form.reset();

  updateCoverPreview("");
  switchContentTypePanel("text");

  // Réinitialiser panneaux PDF et images
  const pdfInfo = document.getElementById("adminPdfInfo");
  if (pdfInfo) pdfInfo.hidden = true;
  const pdfDrop = document.getElementById("adminPdfDropZone");
  if (pdfDrop) pdfDrop.hidden = false;
  const imgGrid = document.getElementById("adminImagesPreviewGrid");
  if (imgGrid) imgGrid.hidden = true;
  const imgDrop = document.getElementById("adminImagesDropZone");
  if (imgDrop) imgDrop.hidden = false;

  const pdfStatus = document.getElementById("bookPdfImportStatus");
  if (pdfStatus) pdfStatus.hidden = true;

  // ✅ Bug 1 Fix — Remettre le premier onglet (Ajout manuel) actif
  document.querySelectorAll(".add-book-tab-btn").forEach((b, i) => {
    b.classList.toggle("active", i === 0);
  });
  document.querySelectorAll(".add-book-tab-panel").forEach((p, i) => {
    p.classList.toggle("active", i === 0);
  });

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

  document.getElementById("manageDeleteAllBtn")?.addEventListener("click", askDeleteAllBooks);
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
  pendingDeleteAll = false;
  const overlay = document.getElementById("adminConfirmOverlay");
  const msg = document.getElementById("adminConfirmMessage");
  if (overlay && msg) {
    msg.textContent = `Voulez-vous vraiment supprimer définitivement « ${book.title} » ?`;
    overlay.hidden = false;
  }
}

function askDeleteAllBooks() {
  pendingDeleteAll = true;
  pendingDeleteId = null;
  const overlay = document.getElementById("adminConfirmOverlay");
  const title = document.getElementById("adminConfirmTitle");
  const msg = document.getElementById("adminConfirmMessage");
  if (overlay && msg) {
    if (title) title.textContent = "Supprimer tous les livres";
    msg.textContent = "Cette action est irréversible : tous les livres seront supprimés du LocalStorage et de Supabase. Continuer ?";
    overlay.hidden = false;
  }
}

async function deleteAllBooks() {
  const count = books.length;

  // LocalStorage
  books = [];
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(COUNTER_KEY);

  // Supabase (si configuré)
  if (supabaseClient) {
    try {
      const { data: rows, error: selErr } = await supabaseClient.from("books").select("biblio_id");
      if (selErr) throw selErr;
      const ids = [...new Set((rows || []).map(r => r.biblio_id).filter(Boolean))];

      const { error: nullErr } = await supabaseClient.from("books").delete().is("biblio_id", null);
      if (nullErr) throw nullErr;

      for (let i = 0; i < ids.length; i += 200) {
        const { error } = await supabaseClient.from("books").delete().in("biblio_id", ids.slice(i, i + 200));
        if (error) throw error;
      }
    } catch (err) {
      renderAllAdminViews();
      showToast(`Livres supprimés localement, mais échec de la suppression Supabase : ${err.message}`, "error");
      return;
    }
  }

  renderAllAdminViews();
  showToast(`✅ ${count} livre(s) supprimé(s) avec succès.`, "success");
}

document.getElementById("adminConfirmCancel")?.addEventListener("click", () => {
  pendingDeleteId = null;
  pendingDeleteAll = false;
  const title = document.getElementById("adminConfirmTitle");
  if (title) title.textContent = "Confirmer la suppression";
  document.getElementById("adminConfirmOverlay").hidden = true;
});

document.getElementById("adminConfirmOk")?.addEventListener("click", async () => {
  if (pendingDeleteAll) {
    pendingDeleteAll = false;
    const title = document.getElementById("adminConfirmTitle");
    if (title) title.textContent = "Confirmer la suppression";
    document.getElementById("adminConfirmOverlay").hidden = true;
    await deleteAllBooks();
    return;
  }
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

  document.getElementById("editorPdfImport")?.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    showToast(`⏳ Extraction du texte de « ${file.name} »…`, "info");
    try {
      const text = await extractTextFromPdf(file);
      document.getElementById("editorRawTextarea").value = text;
      parseRawToBlocks(text);
      showToast(`PDF « ${file.name} » importé et découpé en chapitres !`, "success");
    } catch (err) {
      showToast("Impossible d'extraire le texte de ce PDF.", "error");
    }
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
    isbn: book.isbn,
    title: book.title,
    author: book.author,
    category: book.category,
    year: book.year,
    language: book.language,
    description: book.description,
    max_copies: book.maxCopies,
    copies: book.copies,
    cover_url: book.cover,
    content_type: book.contentType,
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
    isbn: b.isbn,
    title: b.title,
    author: b.author,
    category: b.category,
    year: b.year,
    language: b.language,
    description: b.description,
    max_copies: b.maxCopies,
    copies: b.copies,
    cover_url: b.cover,
    content_type: b.contentType,
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

/* =========================================================================
   8) IMPORTS AVANCÉS (CSV / ISBN)
   ========================================================================= */
function initAdvancedImports() {
  // === IMPORT ISBN ===
  const isbnSearchBtn = document.getElementById("isbnSearchBtn");
  const isbnSearchInput = document.getElementById("isbnSearchInput");
  const isbnResultsList = document.getElementById("isbnResultsList");

  isbnSearchBtn?.addEventListener("click", async () => {
    const query = isbnSearchInput.value.trim();
    if (!query) return;

    isbnSearchBtn.textContent = "⏳";
    isbnSearchBtn.disabled = true;

    try {
      const data = await fetchIsbnData(query);
      if (!data) {
        isbnResultsList.innerHTML = `<div class="isbn-hint">Aucun livre trouvé pour cet ISBN.</div>`;
      } else {
        const isDup = books.some(b => (b.isbn === query) || (b.title.toLowerCase() === data.title.toLowerCase()));
        
        isbnResultsList.innerHTML = `
          <div class="isbn-result-card">
            <div class="isbn-result-cover">
              ${data.cover ? `<img src="${escapeAttr(data.cover)}" alt="cover">` : '📖'}
            </div>
            <div class="isbn-result-info">
              <strong>${escapeHTML(data.title)}</strong>
              <span>${escapeHTML(data.author || 'Auteur inconnu')} — ${escapeHTML(String(data.year || ''))}</span>
              <span class="isbn-result-badge ${isDup ? 'exists' : 'new'}">${isDup ? '⚠️ Existe déjà' : '✨ Nouveau'}</span>
            </div>
            <div class="isbn-result-actions">
              <button class="btn btn-primary btn-sm" id="isbnAddBtn">➕ Ajouter à la bibliothèque</button>
            </div>
          </div>
        `;

        document.getElementById("isbnAddBtn").addEventListener("click", () => {
          const newBook = {
            id: generateId(),
            isbn: query,
            title: data.title,
            author: data.author || 'Inconnu',
            category: 'Général',
            year: data.year,
            maxCopies: 1,
            copies: 1,
            cover: data.cover || '',
            contentType: 'text',
            content: ''
          };

          if (isDup) {
            const oldDup = books.find(b => (b.isbn === query) || (b.title.toLowerCase() === data.title.toLowerCase()));
            showDuplicateModal(oldDup, newBook, (choice) => {
              if (choice === 'update') _proceedSaveBook(oldDup.id, newBook);
              else if (choice === 'new') _proceedSaveBook(null, newBook);
            });
          } else {
            _proceedSaveBook(null, newBook);
          }
        });
      }
    } catch(e) {
      isbnResultsList.innerHTML = `<div class="isbn-hint" style="color:red;">Erreur lors de la recherche.</div>`;
    }
    isbnSearchBtn.textContent = "🔍 Rechercher";
    isbnSearchBtn.disabled = false;
  });

  // === IMPORT CSV ===
  const csvDropZone = document.getElementById("csvDropZone");
  const csvFileInput = document.getElementById("csvFileInput");
  const csvDownloadTemplateBtn = document.getElementById("csvDownloadTemplateBtn");

  csvDropZone?.addEventListener("dragover", (e) => { e.preventDefault(); csvDropZone.classList.add("dragover"); });
  csvDropZone?.addEventListener("dragleave", () => csvDropZone.classList.remove("dragover"));
  csvDropZone?.addEventListener("drop", (e) => {
    e.preventDefault();
    csvDropZone.classList.remove("dragover");
    if (e.dataTransfer.files.length) handleCsvFile(e.dataTransfer.files[0]);
  });

  csvFileInput?.addEventListener("change", (e) => {
    if (e.target.files.length) handleCsvFile(e.target.files[0]);
    e.target.value = "";
  });

  csvDownloadTemplateBtn?.addEventListener("click", () => {
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + 
      "titre,auteur,isbn,categorie,annee,langue,exemplaires,description,cover_url\n" +
      "Le Comte de Monte-Cristo,Alexandre Dumas,9782070418124,Roman,1844,Français,3,,https://example.com/cover.jpg\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "modele_import_livres.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
}

function handleCsvFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const text = e.target.result;
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");
    if (lines.length < 2) return showToast("Fichier CSV vide ou invalide.", "error");

    const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
    const dataRows = lines.slice(1).map(line => line.split(",").map(c => c.trim()));

    const previewSection = document.getElementById("csvPreviewSection");
    let html = `
      <div class="csv-preview-header">
        <h4>Aperçu de l'import (${dataRows.length} lignes)</h4>
      </div>
      <div class="csv-preview-wrap">
        <table class="csv-preview-table">
          <thead>
            <tr>${headers.map(h => `<th>${escapeHTML(h)}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${dataRows.slice(0, 5).map(row => `<tr>${row.map(cell => `<td>${escapeHTML(cell)}</td>`).join('')}</tr>`).join('')}
            ${dataRows.length > 5 ? `<tr><td colspan="${headers.length}" style="text-align:center; color:#746B5C;">... et ${dataRows.length - 5} autres lignes</td></tr>` : ''}
          </tbody>
        </table>
      </div>
      <div class="csv-import-actions">
        <button class="btn btn-primary" id="csvConfirmImportBtn">✅ Confirmer l'importation</button>
        <button class="btn btn-ghost" id="csvCancelImportBtn">Annuler</button>
      </div>
    `;

    previewSection.innerHTML = html;
    previewSection.hidden = false;

    document.getElementById("csvCancelImportBtn").addEventListener("click", () => {
      previewSection.hidden = true;
      previewSection.innerHTML = "";
    });

    document.getElementById("csvConfirmImportBtn").addEventListener("click", () => {
      let importedCount = 0;
      let ignoredCount = 0;
      let updatedCount = 0;

      const ignoreDups = document.getElementById("csvOptIgnoreDups").checked;
      const updateIsbn = document.getElementById("csvOptUpdateIsbn").checked;

      books = loadBooks();

      dataRows.forEach(row => {
        const getVal = (colName) => {
          const idx = headers.indexOf(colName);
          return idx >= 0 ? row[idx] : "";
        };

        const title = getVal("titre");
        if (!title) return;

        const isbn = getVal("isbn");
        const author = getVal("auteur") || "Inconnu";
        const category = getVal("categorie") || "Général";
        const year = parseInt(getVal("annee"), 10) || null;
        const language = getVal("langue") || "";
        const maxCopies = parseInt(getVal("exemplaires"), 10) || 1;
        const description = getVal("description") || "";
        const cover = getVal("cover_url") || "";

        const dupIndex = books.findIndex(b => (isbn && b.isbn === isbn) || (b.title.toLowerCase() === title.toLowerCase() && b.author.toLowerCase() === author.toLowerCase()));

        if (dupIndex >= 0) {
          if (updateIsbn) {
            books[dupIndex] = { ...books[dupIndex], title, author, category, year, language, maxCopies, description, cover };
            updatedCount++;
          } else if (ignoreDups) {
            ignoredCount++;
          } else {
            // Force create (not handled in bulk easily, treating as ignore unless specific logic)
            ignoredCount++;
          }
        } else {
          books.push({
            id: generateId(), isbn, title, author, category, year, language, maxCopies, description, cover,
            copies: maxCopies, contentType: "text", content: ""
          });
          importedCount++;
        }
      });

      saveBooks(books);
      renderAllAdminViews();
      switchAdminView("manage-books");
      previewSection.hidden = true;
      
      showToast(`${importedCount} ajoutés, ${updatedCount} mis à jour, ${ignoredCount} ignorés.`, "success");
    });
  };
  reader.readAsText(file, "UTF-8");
}

