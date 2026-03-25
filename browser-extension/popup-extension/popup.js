/**
 * popup.js — Parla Extension
 *
 * Responsibilities:
 *   - Toggle the extension on/off and persist the state
 *   - Quick action buttons (Practice, Stats, Share, Landing)
 *   - Load saved phrases from the core-service backend
 *   - Render phrase cards with delete support
 *   - Handle search/filter on the phrases list
 *   - Control collapsible tabs (Guardadas / Ajustes)
 */

// ===========================
// DOM REFERENCES
// ===========================

const extensionToggle  = document.getElementById('extension-toggle');
const toggleStatus     = document.getElementById('toggle-status');
const savedCount       = document.getElementById('saved-count');
const phrasesContainer = document.getElementById('phrases-container');
const searchInput      = document.getElementById('search-input');

// Auth elements
const authLoggedOut = document.getElementById('auth-loggedout');
const authLoggedIn  = document.getElementById('auth-loggedin');
const btnLogin      = document.getElementById('btn-login');
const btnLogout     = document.getElementById('btn-logout');
const authError     = document.getElementById('auth-error');

// Quick action buttons
const btnPractice = document.getElementById('btn-practice');
const btnStats    = document.getElementById('btn-stats');
const btnShare    = document.getElementById('btn-share');
const btnLanding  = document.getElementById('btn-landing');

// ===========================
// QUICK ACTION URLS
// Change these to your actual URLs
// ===========================

const URLS = {
  practice: 'https://app.parla.com/practice',
  stats:    'https://app.parla.com/stats',
  share:    'https://app.parla.com/achievements',
  landing:  'https://parla.com'
};

// ===========================
// STATE
// ===========================

let allPhrases = [];

// ===========================
// INITIALIZATION
// ===========================

document.addEventListener('DOMContentLoaded', async () => {
  await loadToggleState();
  await loadAuthState();
  setupToggleListener();
  setupAuthListeners();
  setupTabListeners();
  setupSearchListener();
  setupQuickActions();
});

// ===========================
// AUTH
// ===========================

async function loadAuthState() {
  chrome.runtime.sendMessage({ action: 'getAuthState' }, (res) => {
    updateAuthUI(res?.isLoggedIn ?? false);
  });
}

function updateAuthUI(isLoggedIn) {
  if (authLoggedOut) authLoggedOut.style.display = isLoggedIn ? 'none' : 'flex';
  if (authLoggedIn)  authLoggedIn.style.display  = isLoggedIn ? 'flex' : 'none';
  showAuthError('');
}

function showAuthError(message) {
  if (!authError) return;
  authError.textContent = message;
  authError.style.display = message ? 'block' : 'none';
}

function setupAuthListeners() {
  btnLogin?.addEventListener('click', () => {
    showAuthError('');
    btnLogin.disabled = true;
    btnLogin.textContent = '...';
    chrome.runtime.sendMessage({ action: 'login' }, (res) => {
      btnLogin.disabled = false;
      btnLogin.textContent = 'Entrar';

      if (chrome.runtime.lastError) {
        const msg = `No response from background: ${chrome.runtime.lastError.message}`;
        showAuthError(msg);
        console.error(msg);
        return;
      }

      if (res?.success) updateAuthUI(true);
      else {
        const msg = res?.error || 'No se pudo iniciar sesion';
        showAuthError(msg);
        console.error('Login failed:', msg);
      }
    });
  });

  btnLogout?.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'logout' }, (res) => {
      if (res?.success) updateAuthUI(false);
    });
  });
}

/** Helper: fetch with Bearer token from session storage. */
async function authenticatedFetch(url, options = {}) {
  const data = await chrome.storage.session.get(['access_token']);
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (data.access_token) headers['Authorization'] = `Bearer ${data.access_token}`;
  return fetch(url, { ...options, headers });
}

// ===========================
// QUICK ACTIONS
// ===========================

function openTab(url) {
  chrome.tabs.create({ url });
}

/**
 * Attaches click listeners to the 4 quick action buttons.
 * Each button opens its corresponding URL in a new tab.
 */
function setupQuickActions() {
  btnPractice?.addEventListener('click', () => openTab(URLS.practice));
  btnStats?.addEventListener('click',    () => openTab(URLS.stats));
  btnShare?.addEventListener('click',    () => openTab(URLS.share));
  btnLanding?.addEventListener('click',  () => openTab(URLS.landing));
}

// ===========================
// EXTENSION TOGGLE
// ===========================

async function loadToggleState() {
  const result   = await chrome.storage.local.get(['parla_extension_active']);

  const isActive = result.parla_extension_active !== false;
  extensionToggle.checked = isActive;
  updateToggleStatus(isActive);
}

function setupToggleListener() {
  extensionToggle.addEventListener('change', async () => {
    const isActive = extensionToggle.checked;


    await chrome.storage.local.set({ parla_extension_active: isActive });


    updateToggleStatus(isActive);

    console.log('Parla popup: toggle →', isActive);
  });
}

function updateToggleStatus(isActive) {
  toggleStatus.textContent  = isActive ? 'Activa' : 'Inactiva';
  toggleStatus.style.color  = isActive
    ? 'rgba(255,255,255,0.9)'
    : 'rgba(255,255,255,0.4)';
}

// ===========================
// PHRASES
// ===========================

async function loadPhrases() {
  if (!phrasesContainer) return;
  try {
    phrasesContainer.innerHTML = `
      <div class="empty-state">
        <div class="parla-loading">
          <div class="parla-spinner" style="border-color: #EDDEFD; border-top-color: #BCA2F2;"></div>
          <span>Cargando...</span>
        </div>
      </div>
    `;

    const response = await authenticatedFetch(`${CONFIG.backend.url}${CONFIG.backend.endpoints.phrases}`);
    if (!response.ok) throw new Error('Failed to fetch phrases');

    allPhrases = await response.json();
    if (savedCount) savedCount.textContent = allPhrases.length;
    renderPhrases(allPhrases);

  } catch (error) {
    console.error('Error loading phrases:', error);
    phrasesContainer.innerHTML = `
      <div class="empty-state">
        <i class="bi bi-wifi-off"></i>
        <h3>No se pudo conectar</h3>
        <p>Verifica tu conexión o inicia sesión</p>
      </div>
    `;
  }
}

function renderPhrases(phrases) {
  if (!phrasesContainer) return;
  if (phrases.length === 0) {
    phrasesContainer.innerHTML = `
      <div class="empty-state">
        <i class="bi bi-bookmark"></i>
        <h3>No hay frases guardadas</h3>
        <p>Selecciona texto en cualquier página y guárdalo para empezar.</p>
      </div>
    `;
    return;
  }

  phrasesContainer.innerHTML = phrases.map(p => buildPhraseCard(p)).join('');

  phrasesContainer.querySelectorAll('.phrase-delete').forEach(btn => {
    btn.addEventListener('click', () => deletePhrase(Number(btn.dataset.id)));
  });
}

function buildPhraseCard(phrase) {
  return `
    <div class="phrase-card" data-id="${phrase.id}">
      <div class="phrase-card-content">
        <div class="phrase-original">${escapeHtml(phrase.original_text)}</div>
        <div class="phrase-translation">${escapeHtml(phrase.translated_text)}</div>
      </div>
      <button class="phrase-delete" data-id="${phrase.id}" title="Eliminar">
        <i class="bi bi-trash3"></i>
      </button>
    </div>
  `;
}

async function deletePhrase(id) {
  try {
    const response = await authenticatedFetch(
      `${CONFIG.backend.url}${CONFIG.backend.endpoints.phrases}${id}`,
      { method: 'DELETE' }
    );
    if (!response.ok) throw new Error('Failed to delete phrase');
    allPhrases = allPhrases.filter(p => p.id !== id);
    if (savedCount) savedCount.textContent = allPhrases.length;
    const query = searchInput?.value.trim().toLowerCase() || '';
    renderPhrases(query ? filterPhrases(query) : allPhrases);
  } catch (error) {
    console.error('Error deleting phrase:', error);
  }
}

// ===========================
// SEARCH
// ===========================

function setupSearchListener() {
  searchInput?.addEventListener('input', () => {
    const query = searchInput.value.trim().toLowerCase();
    renderPhrases(query ? filterPhrases(query) : allPhrases);
  });
}

function filterPhrases(query) {
  return allPhrases.filter(p =>
    p.original_text.toLowerCase().includes(query) ||
    p.translated_text.toLowerCase().includes(query)
  );
}

// ===========================
// COLLAPSIBLE TABS
// ===========================

function setupTabListeners() {
  document.querySelectorAll('.tab-trigger').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const tabName  = trigger.dataset.tab;
      const collapse = document.getElementById(`${tabName}-collapse`);
      const arrow    = trigger.querySelector('.tab-arrow');
      const isOpen   = collapse?.classList.contains('open');

      document.querySelectorAll('.tab-collapse').forEach(c => c.classList.remove('open'));
      document.querySelectorAll('.tab-arrow').forEach(a => a.classList.remove('open'));

      if (!isOpen && collapse) {
        collapse.classList.add('open');
        arrow?.classList.add('open');
        if (tabName === 'saved') loadPhrases();
      }
    });
  });
}

// ===========================
// HELPERS
// ===========================

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}