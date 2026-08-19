/* =========================================================================
   ADMIN.JS — Espace Admin + Intégration Supabase
   Bibliothèque — Gestion des contenus, Auth utilisateurs, Sync cloud
   =========================================================================

   POUR CONNECTER SUPABASE :
   1. Va sur https://supabase.com → crée un projet gratuit
   2. Dans Project Settings → API, copie :
      - Project URL  → colle dans le champ "URL du projet" dans l'admin
      - anon public  → colle dans "Clé publique"
   3. Dans SQL Editor, exécute le contenu de "supabase_schema.sql"
   ========================================================================= */

'use strict';

/* -------------------------------------------------------------------------
   CONSTANTES ADMIN
   ------------------------------------------------------------------------- */
const ADMIN_PASSWORD     = 'admin1234';          // Mot de passe admin
const ADMIN_SESSION_KEY  = 'biblio_admin_sess';  // sessionStorage
const SUPABASE_CONFIG_KEY= 'biblio_supa_config'; // localStorage

/* -------------------------------------------------------------------------
   1) ÉTAT SUPABASE
   ------------------------------------------------------------------------- */
let supabaseClient = null;   // Client Supabase (null si non configuré)
let currentUser    = null;   // Utilisateur connecté
let editingBookId  = null;   // Livre en cours d'édition dans l'admin

/* =========================================================================
   2) INITIALISATION AU CHARGEMENT
   ========================================================================= */
document.addEventListener('DOMContentLoaded', () => {
  initSupabase();
  initAdminView();
  initAuthModals();
  initSidebarButtons();
  updateAuthUI();
});

/* =========================================================================
   3) SUPABASE — INIT & CONFIG
   ========================================================================= */
function initSupabase() {
  const cfg = loadSupabaseConfig();
  if (cfg.url && cfg.key) {
    connectSupabase(cfg.url, cfg.key);
  } else {
    setSupabaseStatus('unconfigured', 'Supabase non configuré — cliquez sur ⚙️ pour configurer');
  }
}

function loadSupabaseConfig() {
  try {
    const raw = localStorage.getItem(SUPABASE_CONFIG_KEY);
    return raw ? JSON.parse(raw) : { url: '', key: '' };
  } catch(e) { return { url: '', key: '' }; }
}

function saveSupabaseConfig(url, key) {
  localStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify({ url, key }));
}

function connectSupabase(url, key) {
  try {
    const { createClient } = window.supabase;
    supabaseClient = createClient(url, key);

    // Vérification de connexion
    supabaseClient.from('books').select('count', { count: 'exact', head: true })
      .then(({ error }) => {
        if (error) {
          setSupabaseStatus('error', `Erreur : ${error.message}`);
        } else {
          setSupabaseStatus('connected', 'Supabase connecté ✓ — Base de données en ligne');
          loadCurrentUser();
        }
      })
      .catch(() => {
        setSupabaseStatus('error', 'Impossible de joindre Supabase — vérifiez vos clés');
      });

    setSupabaseStatus('connecting', 'Connexion à Supabase…');
  } catch(e) {
    setSupabaseStatus('error', `Erreur SDK : ${e.message}`);
  }
}

function setSupabaseStatus(state, label) {
  const dot = document.getElementById('statusDot');
  const lbl = document.getElementById('statusLabel');
  if (!dot || !lbl) return;
  dot.className = 'status-dot';
  if (state === 'connected')    dot.classList.add('connected');
  if (state === 'error')        dot.classList.add('error');
  lbl.textContent = label;
}

/* =========================================================================
   4) AUTHENTIFICATION UTILISATEURS (Supabase Auth)
   ========================================================================= */
async function loadCurrentUser() {
  if (!supabaseClient) return;
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session?.user) {
    currentUser = session.user;
    updateAuthUI();
    syncUserDataFromCloud();
  }

  // Écoute les changements d'auth
  supabaseClient.auth.onAuthStateChange((_event, session) => {
    currentUser = session?.user || null;
    updateAuthUI();
    if (currentUser) syncUserDataFromCloud();
  });
}

function updateAuthUI() {
  const authBtn  = document.getElementById('authBtn');
  const authIcon = document.getElementById('authBtnIcon');
  const authLbl  = document.getElementById('authBtnLabel');
  if (!authBtn) return;

  if (currentUser) {
    const profile = loadProfile ? loadProfile() : {};
    authIcon.textContent = profile.avatar || '👤';
    authLbl.textContent  = profile.name || currentUser.email?.split('@')[0] || 'Connecté';
    authBtn.classList.add('logged-in');
    authBtn.title = 'Cliquer pour se déconnecter';
    authBtn.dataset.action = 'logout';
  } else {
    authIcon.textContent = '👤';
    authLbl.textContent  = 'Se connecter';
    authBtn.classList.remove('logged-in');
    authBtn.title = 'Se connecter / Créer un compte';
    authBtn.dataset.action = 'login';
  }
}

/* =========================================================================
   5) MODALS AUTH — CONNEXION / INSCRIPTION
   ========================================================================= */
function initAuthModals() {
  const authOverlay   = document.getElementById('authOverlay');
  const closeBtn      = document.getElementById('authOverlayClose');
  const tabs          = document.querySelectorAll('.auth-tab');
  const loginForm     = document.getElementById('loginForm');
  const signupForm    = document.getElementById('signupForm');

  // Fermeture
  closeBtn?.addEventListener('click', () => { authOverlay.hidden = true; });
  authOverlay?.addEventListener('click', (e) => {
    if (e.target === authOverlay) authOverlay.hidden = true;
  });

  // Onglets
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.dataset.authTab;
      document.querySelectorAll('.auth-panel').forEach(p => p.classList.remove('active'));
      document.getElementById(`authPanel-${target}`)?.classList.add('active');
    });
  });

  // Formulaire connexion
  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email    = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errEl    = document.getElementById('loginError');
    const btn      = document.getElementById('loginSubmitBtn');

    if (!supabaseClient) {
      errEl.textContent = '⚠️ Supabase non configuré. Configurez-le dans l\'espace Admin d\'abord.';
      return;
    }

    btn.textContent = 'Connexion…';
    btn.disabled = true;

    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    btn.disabled = false;
    btn.textContent = 'Se connecter';

    if (error) {
      errEl.textContent = '❌ ' + (error.message === 'Invalid login credentials'
        ? 'Email ou mot de passe incorrect.'
        : error.message);
    } else {
      currentUser = data.user;
      authOverlay.hidden = true;
      updateAuthUI();
      syncUserDataFromCloud();
      if (typeof showToast === 'function') showToast('Connexion réussie ! Bienvenue 👋', 'success');
      errEl.textContent = '';
    }
  });

  // Formulaire inscription
  signupForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name     = document.getElementById('signupName').value.trim();
    const email    = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const errEl    = document.getElementById('signupError');
    const btn      = document.getElementById('signupSubmitBtn');

    if (!supabaseClient) {
      errEl.textContent = '⚠️ Supabase non configuré.';
      return;
    }

    btn.textContent = 'Création…';
    btn.disabled = true;

    const { data, error } = await supabaseClient.auth.signUp({ email, password });
    btn.disabled = false;
    btn.textContent = 'Créer mon compte';

    if (error) {
      errEl.textContent = '❌ ' + error.message;
    } else {
      currentUser = data.user;
      // Créer le profil en base
      if (currentUser) {
        await supabaseClient.from('user_profiles').upsert({
          id: currentUser.id,
          display_name: name,
          avatar_emoji: '📚',
          reading_goal: 12
        });
      }
      authOverlay.hidden = true;
      updateAuthUI();
      if (typeof showToast === 'function')
        showToast(`Compte créé ! Bienvenue ${name} ✨`, 'success');
      errEl.textContent = '';
    }
  });
}

/* =========================================================================
   6) BOUTONS SIDEBAR (Auth + Admin)
   ========================================================================= */
function initSidebarButtons() {
  // Bouton Se connecter / Déconnexion
  document.getElementById('authBtn')?.addEventListener('click', async () => {
    if (currentUser) {
      // Déconnexion
      if (supabaseClient) await supabaseClient.auth.signOut();
      currentUser = null;
      updateAuthUI();
      if (typeof showToast === 'function') showToast('Vous êtes déconnecté.', 'info');
    } else {
      document.getElementById('authOverlay').hidden = false;
    }
  });

  // Bouton Admin
  document.getElementById('adminAccessBtn')?.addEventListener('click', () => {
    if (sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true') {
      if (typeof switchView === 'function') switchView('admin');
    } else {
      document.getElementById('adminLoginOverlay').hidden = false;
      setTimeout(() => document.getElementById('adminPasswordInput')?.focus(), 100);
    }
  });

  // Clic sur sidebar profile → aller sur profil
  document.getElementById('sidebarProfile')?.addEventListener('click', (e) => {
    if (e.target.closest('.sidebar-profile-edit-btn')) {
      if (typeof switchView === 'function') switchView('profile');
    }
  });
}

/* =========================================================================
   7) MODAL CONNEXION ADMIN
   ========================================================================= */
function initAdminView() {
  const overlay   = document.getElementById('adminLoginOverlay');
  const form      = document.getElementById('adminLoginForm');
  const cancelBtn = document.getElementById('adminLoginCancel');

  // Annuler
  cancelBtn?.addEventListener('click', () => { overlay.hidden = true; });
  overlay?.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.hidden = true;
  });

  // Vérification mot de passe
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const pwd     = document.getElementById('adminPasswordInput').value;
    const errEl   = document.getElementById('adminPasswordError');
    if (pwd === ADMIN_PASSWORD) {
      sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
      overlay.hidden = true;
      document.getElementById('adminPasswordInput').value = '';
      errEl.textContent = '';
      if (typeof switchView === 'function') switchView('admin');
      renderAdminView();
      if (typeof showToast === 'function') showToast('Accès admin accordé ✓', 'success');
    } else {
      errEl.textContent = '❌ Mot de passe incorrect.';
      document.getElementById('adminPasswordInput').select();
    }
  });

  // Bouton Quitter admin
  document.getElementById('adminLogoutBtn')?.addEventListener('click', () => {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    if (typeof switchView === 'function') switchView('dashboard');
    if (typeof showToast === 'function') showToast('Session admin terminée.', 'info');
  });

  // Onglets admin
  document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.dataset.tab;
      document.querySelectorAll('.admin-tab-panel').forEach(p => p.classList.remove('active'));
      document.getElementById(`adminTab-${target}`)?.classList.add('active');
      if (target === 'books') renderAdminBooksTable();
      if (target === 'users') loadAdminUsers();
    });
  });

  // Config Supabase
  document.getElementById('adminConfigBtn')?.addEventListener('click', () => {
    const panel = document.getElementById('adminConfigPanel');
    panel.hidden = !panel.hidden;
    if (!panel.hidden) {
      const cfg = loadSupabaseConfig();
      document.getElementById('supabaseUrl').value = cfg.url || '';
      document.getElementById('supabaseKey').value = cfg.key || '';
    }
  });
  document.getElementById('cancelConfigBtn')?.addEventListener('click', () => {
    document.getElementById('adminConfigPanel').hidden = true;
  });

  document.getElementById('supabaseConfigForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const url = document.getElementById('supabaseUrl').value.trim();
    const key = document.getElementById('supabaseKey').value.trim();
    if (!url || !key) { alert('Remplissez les deux champs.'); return; }
    saveSupabaseConfig(url, key);
    connectSupabase(url, key);
    document.getElementById('adminConfigPanel').hidden = true;
    if (typeof showToast === 'function') showToast('Configuration Supabase enregistrée !', 'success');
  });

  // Sync global
  document.getElementById('adminSyncBtn')?.addEventListener('click', () => syncAllToSupabase());
  document.getElementById('adminFullSync')?.addEventListener('click', () => syncAllToSupabase());

  // Pousser livres
  document.getElementById('adminPushBooks')?.addEventListener('click', () => pushBooksToSupabase());

  // Export JSON
  document.getElementById('adminExportJson')?.addEventListener('click', exportBooksJson);

  // Import JSON
  document.getElementById('adminImportJson')?.addEventListener('change', importBooksJson);

  // Reset
  document.getElementById('adminResetAll')?.addEventListener('click', () => {
    if (confirm('⚠️ ATTENTION : Cette action supprime TOUTES les données locales (livres, progression, favoris, profil). Irréversible. Confirmer ?')) {
      ['biblio_books','biblio_next_id','biblio_reading_progress','biblio_favorites','biblio_reader_settings','biblio_user_profile']
        .forEach(k => localStorage.removeItem(k));
      location.reload();
    }
  });

  // Ajouter un livre → redirige vers formulaire
  document.getElementById('adminAddBook')?.addEventListener('click', () => {
    if (typeof switchView === 'function') switchView('add');
  });

  // Search livres dans éditeur
  document.getElementById('adminBookSearch')?.addEventListener('input', (e) => {
    renderAdminBooksList(e.target.value.trim().toLowerCase());
  });

  // Éditeur de contenu
  initContentEditor();
}

/* =========================================================================
   8) RENDU VUE ADMIN
   ========================================================================= */
function renderAdminView() {
  renderAdminBooksList('');
  renderAdminBooksTable();
  const cfg = loadSupabaseConfig();
  document.getElementById('supabaseUrl').value = cfg.url || '';
  document.getElementById('supabaseKey').value = cfg.key || '';
}

/* =========================================================================
   9) ÉDITEUR DE CONTENU
   ========================================================================= */

// Liste des livres pour l'éditeur
function renderAdminBooksList(query = '') {
  const container = document.getElementById('adminBooksList');
  if (!container) return;

  // books vient de script.js (variable globale)
  const bookList = typeof books !== 'undefined' ? books : [];
  const filtered = query
    ? bookList.filter(b => b.title.toLowerCase().includes(query) || b.author.toLowerCase().includes(query))
    : bookList;

  if (!filtered.length) {
    container.innerHTML = '<p class="empty-state">Aucun livre trouvé.</p>';
    return;
  }

  container.innerHTML = filtered.map(b => {
    const hasContent = !!(b.content && b.content.trim());
    const thumbHTML = b.cover
      ? `<div class="admin-book-thumb"><img src="${b.cover}" alt="" loading="lazy" onerror="this.style.display='none'" /></div>`
      : `<div class="admin-book-thumb" style="background:${typeof colorForCategory === 'function' ? colorForCategory(b.category) : '#1F3A34'}">${b.title.slice(0,2)}</div>`;

    return `
      <div class="admin-book-item ${hasContent ? 'has-content' : 'no-content'}" data-id="${b.id}">
        ${thumbHTML}
        <div class="admin-book-info">
          <h4>${escapeHTMLAdmin(b.title)}</h4>
          <span>${escapeHTMLAdmin(b.author)}</span>
        </div>
        <span class="admin-content-badge ${hasContent ? 'ok' : 'missing'}">
          ${hasContent ? '✓ OK' : '⚠ Vide'}
        </span>
      </div>
    `;
  }).join('');

  // Clic → ouvrir éditeur
  container.querySelectorAll('.admin-book-item').forEach(item => {
    item.addEventListener('click', () => openContentEditor(item.dataset.id));
  });
}

// Table admin tous les livres
function renderAdminBooksTable() {
  const tbody = document.getElementById('adminBooksTableBody');
  if (!tbody) return;
  const bookList = typeof books !== 'undefined' ? books : [];

  tbody.innerHTML = bookList.map(b => {
    const hasContent = !!(b.content && b.content.trim());
    const chapters   = hasContent ? b.content.split(/^---/m).filter(s => s.trim()).length : 0;
    const thumbHTML  = b.cover
      ? `<img src="${b.cover}" alt="" style="width:36px;height:50px;object-fit:cover;border-radius:3px;" loading="lazy" />`
      : `<div style="width:36px;height:50px;background:${typeof colorForCategory === 'function' ? colorForCategory(b.category) : '#1F3A34'};border-radius:3px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:700;">${b.title.slice(0,2)}</div>`;

    return `
      <tr>
        <td>${thumbHTML}</td>
        <td><b>${escapeHTMLAdmin(b.title)}</b></td>
        <td>${escapeHTMLAdmin(b.author)}</td>
        <td>${escapeHTMLAdmin(b.category)}</td>
        <td>
          <span class="admin-content-indicator ${hasContent ? 'ok' : 'none'}">
            ${hasContent ? `✓ ${chapters} chapitre(s)` : '⚠ Aucun contenu'}
          </span>
        </td>
        <td>
          <div class="row-actions">
            <button class="btn btn-primary btn-sm" onclick="openContentEditor('${b.id}'); document.querySelector('.admin-tab[data-tab=content]').click()">✏️ Éditer</button>
            <button class="btn btn-outline btn-sm" onclick="if(typeof enterEditMode==='function') { enterEditMode(${JSON.stringify({id: b.id})}); if(typeof switchView==='function') switchView('add'); }">Modifier</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

/* =========================================================================
   10) ÉDITEUR DE CHAPITRES
   ========================================================================= */
function openContentEditor(bookId) {
  const bookList = typeof books !== 'undefined' ? books : [];
  const book = bookList.find(b => b.id === bookId);
  if (!book) return;

  editingBookId = bookId;

  // Affichage infos livre
  document.getElementById('adminEditorTitle').textContent  = book.title;
  document.getElementById('adminEditorAuthor').textContent = book.author + ' · ' + book.year;
  const coverEl = document.getElementById('adminEditorCover');
  coverEl.innerHTML = book.cover
    ? `<img src="${book.cover}" alt="" style="width:100%;height:100%;object-fit:cover;" />`
    : '📚';

  // Contenu brut
  document.getElementById('adminRawContent').value = book.content || '';

  // Chapitres parsés
  renderChapterBlocks(book.content || '');

  // Afficher le panneau
  document.getElementById('adminEditorPanel').hidden = false;
  document.getElementById('adminEditorPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderChapterBlocks(rawContent) {
  const container = document.getElementById('adminChaptersEditor');
  const sections  = rawContent.split(/^---/m);
  const chapters  = sections
    .map(sec => {
      const trimmed = sec.trim();
      if (!trimmed) return null;
      const lines     = trimmed.split('\n');
      const firstLine = lines[0].replace(/^---|---$/g, '').trim();
      const body      = lines.slice(1).join('\n').trim();
      const isTitle   = firstLine.length < 100;
      return { title: isTitle ? firstLine : 'Chapitre', body: isTitle ? body : trimmed };
    })
    .filter(Boolean);

  if (!chapters.length) {
    container.innerHTML = '<p class="muted" style="padding:12px;">Aucun chapitre détecté. Utilisez l\'éditeur brut ci-dessous ou ajoutez des chapitres.</p>';
    return;
  }

  container.innerHTML = chapters.map((ch, idx) => `
    <div class="admin-chapter-block" data-idx="${idx}">
      <div class="admin-chapter-block-head">
        <span class="admin-chapter-drag">⠿</span>
        <span class="admin-chapter-num">Ch.${idx + 1}</span>
        <input class="admin-chapter-title-input" value="${escapeAttrAdmin(ch.title)}" placeholder="Titre du chapitre" />
        <button class="admin-chapter-del" title="Supprimer ce chapitre" data-idx="${idx}">✕</button>
      </div>
      <div class="admin-chapter-body">
        <textarea rows="6" placeholder="Contenu du chapitre…">${escapeHTMLAdmin(ch.body)}</textarea>
      </div>
    </div>
  `).join('');

  // Synchro texte brut → chapitres visuels
  container.querySelectorAll('.admin-chapter-block').forEach(() => {
    syncChaptersToRaw();
  });

  // Supprimer chapitre
  container.querySelectorAll('.admin-chapter-del').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.admin-chapter-block').remove();
      renumberChapters();
      syncChaptersToRaw();
    });
  });

  // Mise à jour temps réel
  container.querySelectorAll('input, textarea').forEach(el => {
    el.addEventListener('input', syncChaptersToRaw);
  });
}

function renumberChapters() {
  document.querySelectorAll('.admin-chapter-block').forEach((block, idx) => {
    block.querySelector('.admin-chapter-num').textContent = `Ch.${idx + 1}`;
    block.dataset.idx = idx;
  });
}

function syncChaptersToRaw() {
  const blocks = document.querySelectorAll('.admin-chapter-block');
  if (!blocks.length) return;
  const raw = Array.from(blocks).map(block => {
    const title   = block.querySelector('.admin-chapter-title-input').value.trim() || 'Chapitre';
    const content = block.querySelector('textarea').value.trim();
    return `--- ${title} ---\n${content}`;
  }).join('\n\n');
  document.getElementById('adminRawContent').value = raw;
}

function initContentEditor() {
  // Ajouter un chapitre
  document.getElementById('adminAddChapter')?.addEventListener('click', () => {
    const container = document.getElementById('adminChaptersEditor');
    const existingCount = container.querySelectorAll('.admin-chapter-block').length;
    const newIdx = existingCount;
    const newBlock = document.createElement('div');
    newBlock.className = 'admin-chapter-block';
    newBlock.dataset.idx = newIdx;
    newBlock.innerHTML = `
      <div class="admin-chapter-block-head">
        <span class="admin-chapter-drag">⠿</span>
        <span class="admin-chapter-num">Ch.${newIdx + 1}</span>
        <input class="admin-chapter-title-input" value="Chapitre ${newIdx + 1}" placeholder="Titre du chapitre" />
        <button class="admin-chapter-del" title="Supprimer ce chapitre">✕</button>
      </div>
      <div class="admin-chapter-body">
        <textarea rows="6" placeholder="Contenu du chapitre…"></textarea>
      </div>
    `;
    container.appendChild(newBlock);
    newBlock.querySelector('.admin-chapter-title-input').focus();
    newBlock.querySelector('.admin-chapter-del').addEventListener('click', () => {
      newBlock.remove(); renumberChapters(); syncChaptersToRaw();
    });
    newBlock.querySelectorAll('input, textarea').forEach(el => {
      el.addEventListener('input', syncChaptersToRaw);
    });
    newBlock.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  // Import .txt
  document.getElementById('adminImportTxt')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      document.getElementById('adminRawContent').value = text;
      renderChapterBlocks(text);
      if (typeof showToast === 'function') showToast(`Fichier "${file.name}" importé !`, 'success');
    };
    reader.readAsText(file, 'UTF-8');
    e.target.value = '';
  });

  // Aperçu liseuse
  document.getElementById('adminPreviewContent')?.addEventListener('click', () => {
    if (!editingBookId) return;
    const raw = document.getElementById('adminRawContent').value;
    const bookList = typeof books !== 'undefined' ? books : [];
    const book = bookList.find(b => b.id === editingBookId);
    if (!book) return;
    const tempBook = { ...book, content: raw };
    // Sauvegarder temporairement et ouvrir liseuse
    const originalContent = book.content;
    book.content = raw;
    if (typeof openReader === 'function') openReader(editingBookId);
    // Restaurer après fermeture (si l'utilisateur ne sauvegarde pas)
    setTimeout(() => { book.content = originalContent; }, 100);
  });

  // Fermer éditeur
  document.getElementById('adminEditorClose')?.addEventListener('click', () => {
    document.getElementById('adminEditorPanel').hidden = true;
    editingBookId = null;
  });

  // Sauvegarder contenu
  document.getElementById('adminSaveContent')?.addEventListener('click', async () => {
    if (!editingBookId) return;
    const raw = document.getElementById('adminRawContent').value.trim();
    const bookList = typeof books !== 'undefined' ? books : [];
    const book = bookList.find(b => b.id === editingBookId);
    if (!book) return;

    book.content = raw;
    if (typeof saveBooks === 'function') saveBooks(bookList);

    // Sync Supabase si connecté
    if (supabaseClient) {
      const { error } = await supabaseClient
        .from('books')
        .update({ content: raw })
        .eq('biblio_id', book.id);
      if (error) {
        if (typeof showToast === 'function') showToast('Sauvegardé localement (erreur Supabase : ' + error.message + ')', 'info');
      } else {
        if (typeof showToast === 'function') showToast('Contenu sauvegardé en local et dans Supabase ✓', 'success');
      }
    } else {
      if (typeof showToast === 'function') showToast('Contenu sauvegardé localement ✓', 'success');
    }

    renderAdminBooksList(document.getElementById('adminBookSearch')?.value || '');
    renderAdminBooksTable();
    document.getElementById('adminEditorPanel').hidden = true;
    editingBookId = null;
  });
}

/* =========================================================================
   11) SYNC SUPABASE — PUSH LIVRES
   ========================================================================= */
async function pushBooksToSupabase() {
  if (!supabaseClient) {
    if (typeof showToast === 'function') showToast('Supabase non configuré.', 'error');
    return;
  }
  const bookList = typeof books !== 'undefined' ? books : [];
  if (!bookList.length) {
    if (typeof showToast === 'function') showToast('Aucun livre à synchroniser.', 'info');
    return;
  }

  if (typeof showToast === 'function') showToast('Synchronisation en cours…', 'info');

  const rows = bookList.map(b => ({
    biblio_id:  b.id,
    title:      b.title,
    author:     b.author,
    category:   b.category || '',
    year:       b.year || null,
    max_copies: b.maxCopies || 1,
    copies:     b.copies || 1,
    cover_url:  b.cover || null,
    content:    b.content || null
  }));

  const { error } = await supabaseClient
    .from('books')
    .upsert(rows, { onConflict: 'biblio_id' });

  if (error) {
    if (typeof showToast === 'function') showToast('Erreur Supabase : ' + error.message, 'error');
  } else {
    if (typeof showToast === 'function') showToast(`${bookList.length} livres synchronisés avec Supabase ✓`, 'success');
  }
}

async function syncAllToSupabase() {
  await pushBooksToSupabase();

  if (!supabaseClient || !currentUser) return;

  // Sync profil
  const profile = typeof loadProfile === 'function' ? loadProfile() : null;
  if (profile) {
    await supabaseClient.from('user_profiles').upsert({
      id:             currentUser.id,
      display_name:   profile.name || '',
      avatar_emoji:   profile.avatar || '📚',
      bio:            profile.bio || '',
      favorite_genre: profile.favoriteGenre || '',
      reading_goal:   profile.readingGoal || 12
    });
  }

  // Sync progression de lecture
  const prog = typeof loadReadingProgress === 'function' ? loadReadingProgress() : {};
  for (const [bookId, p] of Object.entries(prog)) {
    await supabaseClient.from('reading_progress').upsert({
      user_id:     currentUser.id,
      book_id:     bookId,
      percent:     p.percent || 0,
      chapter_idx: p.chapter || 0,
      is_finished: p.isFinished || false,
      last_read_at: p.lastReadAt || new Date().toISOString()
    }, { onConflict: 'user_id,book_id' });
  }

  // Sync favoris
  const favs = typeof loadFavorites === 'function' ? loadFavorites() : [];
  for (const bookId of favs) {
    await supabaseClient.from('favorites').upsert({
      user_id: currentUser.id,
      book_id: bookId
    }, { onConflict: 'user_id,book_id' });
  }

  if (typeof showToast === 'function') showToast('Synchronisation complète avec Supabase ✓', 'success');
}

/* =========================================================================
   12) SYNC SUPABASE → LOCAL (téléchargement depuis cloud)
   ========================================================================= */
async function syncUserDataFromCloud() {
  if (!supabaseClient || !currentUser) return;

  try {
    // Charger profil
    const { data: profileData } = await supabaseClient
      .from('user_profiles')
      .select('*')
      .eq('id', currentUser.id)
      .single();

    if (profileData && typeof saveProfile === 'function') {
      saveProfile({
        name: profileData.display_name || '',
        avatar: profileData.avatar_emoji || '📚',
        bio: profileData.bio || '',
        favoriteGenre: profileData.favorite_genre || '',
        readingGoal: profileData.reading_goal || 12
      });
    }

    // Charger progression
    const { data: progressData } = await supabaseClient
      .from('reading_progress')
      .select('*')
      .eq('user_id', currentUser.id);

    if (progressData?.length && typeof saveReadingProgress === 'function') {
      const prog = {};
      progressData.forEach(p => {
        prog[p.book_id] = {
          percent: p.percent,
          chapter: p.chapter_idx,
          isFinished: p.is_finished,
          lastReadAt: p.last_read_at
        };
      });
      saveReadingProgress(prog);
    }

    // Charger favoris
    const { data: favsData } = await supabaseClient
      .from('favorites')
      .select('book_id')
      .eq('user_id', currentUser.id);

    if (favsData?.length && typeof saveFavorites === 'function') {
      saveFavorites(favsData.map(f => f.book_id));
    }

    // Charger livres depuis Supabase
    const { data: booksData } = await supabaseClient
      .from('books')
      .select('*');

    if (booksData?.length) {
      // Enrichir les livres locaux avec les contenus du cloud
      const bookList = typeof books !== 'undefined' ? books : [];
      let modified = false;
      booksData.forEach(sb => {
        const local = bookList.find(b => b.id === sb.biblio_id);
        if (local) {
          if (sb.content && !local.content) { local.content = sb.content; modified = true; }
          if (sb.cover_url && !local.cover) { local.cover = sb.cover_url; modified = true; }
        }
      });
      if (modified && typeof saveBooks === 'function') saveBooks(bookList);
    }

    if (typeof renderAll === 'function') renderAll();
    if (typeof showToast === 'function') showToast('Données synchronisées depuis le cloud ✓', 'success');

  } catch(e) {
    console.warn('Erreur sync cloud:', e);
  }
}

/* =========================================================================
   13) UTILISATEURS (onglet admin)
   ========================================================================= */
async function loadAdminUsers() {
  const container = document.getElementById('adminUsersList');
  if (!container) return;

  if (!supabaseClient) {
    container.innerHTML = '<p class="empty-state">Connectez Supabase pour voir les utilisateurs.</p>';
    return;
  }

  container.innerHTML = '<p class="empty-state">Chargement…</p>';

  const { data, error } = await supabaseClient
    .from('user_profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    container.innerHTML = `<p class="empty-state">Erreur : ${error.message}</p>`;
    return;
  }

  if (!data?.length) {
    container.innerHTML = '<p class="empty-state">Aucun utilisateur inscrit pour l\'instant.</p>';
    return;
  }

  container.innerHTML = `
    <table class="book-table">
      <thead><tr>
        <th>Avatar</th><th>Nom</th><th>Genre favori</th><th>Objectif</th><th>Inscription</th>
      </tr></thead>
      <tbody>
        ${data.map(u => `
          <tr>
            <td style="font-size:22px">${u.avatar_emoji || '👤'}</td>
            <td><b>${escapeHTMLAdmin(u.display_name || 'Anonyme')}</b></td>
            <td>${escapeHTMLAdmin(u.favorite_genre || '—')}</td>
            <td>${u.reading_goal || '—'} livres/an</td>
            <td>${u.created_at ? new Date(u.created_at).toLocaleDateString('fr-FR') : '—'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

/* =========================================================================
   14) IMPORT / EXPORT JSON
   ========================================================================= */
function exportBooksJson() {
  const bookList = typeof books !== 'undefined' ? books : [];
  if (!bookList.length) {
    if (typeof showToast === 'function') showToast('Aucun livre à exporter.', 'error');
    return;
  }
  const json = JSON.stringify(bookList, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `bibliotheque_${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  if (typeof showToast === 'function') showToast('Export JSON téléchargé ✓', 'success');
}

function importBooksJson(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const imported = JSON.parse(ev.target.result);
      if (!Array.isArray(imported)) throw new Error('Format invalide');
      const ok = confirm(`Importer ${imported.length} livres ? Les livres existants avec le même ID seront mis à jour.`);
      if (!ok) return;

      const bookList = typeof books !== 'undefined' ? books : [];
      imported.forEach(ib => {
        const existing = bookList.findIndex(b => b.id === ib.id);
        if (existing >= 0) {
          bookList[existing] = { ...bookList[existing], ...ib };
        } else {
          bookList.push(ib);
        }
      });

      if (typeof saveBooks === 'function') saveBooks(bookList);
      if (typeof renderAll === 'function') renderAll();
      renderAdminView();
      if (typeof showToast === 'function') showToast(`${imported.length} livres importés ✓`, 'success');
    } catch(err) {
      if (typeof showToast === 'function') showToast('Fichier JSON invalide : ' + err.message, 'error');
    }
  };
  reader.readAsText(file, 'UTF-8');
  e.target.value = '';
}

/* =========================================================================
   15) UTILITAIRES
   ========================================================================= */
function escapeHTMLAdmin(str) {
  return String(str || '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function escapeAttrAdmin(str) {
  return String(str || '').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

/* =========================================================================
   16) EXTENSION VIEW_META — ADMIN
   ========================================================================= */
// Injecté après le chargement de script.js
window.addEventListener('load', () => {
  // Ajouter la vue admin dans VIEW_META si elle n'existe pas
  if (typeof VIEW_META !== 'undefined' && !VIEW_META.admin) {
    VIEW_META.admin = {
      title: 'Espace Administrateur',
      subtitle: 'Gestion des contenus, livres et synchronisation Supabase'
    };
  }

  // Rendre adminView quand on switche vers admin
  const originalSwitchView = window.switchView;
  if (typeof originalSwitchView === 'function') {
    window.switchView = function(viewName) {
      originalSwitchView(viewName);
      if (viewName === 'admin') {
        if (sessionStorage.getItem(ADMIN_SESSION_KEY) !== 'true') {
          originalSwitchView('dashboard');
          document.getElementById('adminLoginOverlay').hidden = false;
          return;
        }
        renderAdminView();
      }
    };
  }
});
