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
  setupToggleListener();
  setupTabListeners();
  setupSearchListener();
  setupQuickActions();
});

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

    const response = await fetch(`${CONFIG.backend.url}${CONFIG.backend.endpoints.phrases}`);
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
        <p>Verifica que el backend esté corriendo en localhost:8000</p>
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
    const response = await fetch(
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