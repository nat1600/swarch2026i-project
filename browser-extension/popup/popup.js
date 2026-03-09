/**
 * popup.js
 *
 * Controls the extension popup — the window that opens when the user
 * clicks the Parla icon in the Chrome toolbar.
 *
 * Responsibilities:
 *   - Toggle the extension on/off and persist the state
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

// ===========================
// STATE
// ===========================

let allPhrases = [];   // Full list of phrases loaded from backend

// ===========================
// INITIALIZATION
// ===========================

/**
 * Entry point — runs when the popup DOM is ready.
 * Loads settings, fetches phrases, and sets up listeners.
 */
document.addEventListener('DOMContentLoaded', async () => {
  await loadToggleState();
  await loadPhrases();
  setupToggleListener();
  setupTabListeners();
  setupSearchListener();
});

// ===========================
// EXTENSION TOGGLE
// ===========================

/**
 * Reads the saved toggle state from chrome.storage and reflects it in the UI.
 */
async function loadToggleState() {
  const result = await chrome.storage.local.get(['parla_extension_active']);

  // Default to active if not set
  const isActive = result.parla_extension_active !== false;

  extensionToggle.checked = isActive;
  updateToggleStatus(isActive);
}

/**
 * Listens for toggle changes, saves the new state, and
 * broadcasts it to all content scripts via chrome.tabs.sendMessage.
 */
function setupToggleListener() {
  extensionToggle.addEventListener('change', async () => {
    const isActive = extensionToggle.checked;

    // Persist state
    await chrome.storage.local.set({ parla_extension_active: isActive });

    // Update status label
    updateToggleStatus(isActive);

    // Notify all active tabs
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, {
        action: 'toggleExtension',
        active: isActive
      }).catch(() => {
        // Tab may not have content script — ignore silently
      });
    });
  });
}

/**
 * Updates the toggle status label text and color.
 * @param {boolean} isActive
 */
function updateToggleStatus(isActive) {
  toggleStatus.textContent = isActive ? 'Activa' : 'Inactiva';
  toggleStatus.style.color = isActive
    ? 'rgba(255,255,255,0.9)'
    : 'rgba(255,255,255,0.4)';
}

// ===========================
// PHRASES
// ===========================

/**
 * Fetches all saved phrases from the core-service backend.
 * Renders them into the phrases container.
 */
async function loadPhrases() {
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

    // Update saved count badge
    savedCount.textContent = allPhrases.length;

    renderPhrases(allPhrases);

  } catch (error) {
    console.error('❌ Error loading phrases:', error);
    phrasesContainer.innerHTML = `
      <div class="empty-state">
        <i class="bi bi-wifi-off"></i>
        <h3>No se pudo conectar</h3>
        <p>Verifica que el backend esté corriendo en localhost:8000</p>
      </div>
    `;
  }
}

/**
 * Renders a list of phrase cards into the phrases container.
 * @param {Array} phrases - List of phrase objects from the backend
 */
function renderPhrases(phrases) {
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

  phrasesContainer.innerHTML = phrases
    .map(phrase => buildPhraseCard(phrase))
    .join('');

  // Attach delete listeners to all cards
  phrasesContainer.querySelectorAll('.phrase-delete').forEach(btn => {
    btn.addEventListener('click', () => deletePhrase(Number(btn.dataset.id)));
  });
}

/**
 * Builds the HTML string for a single phrase card.
 * @param {object} phrase - Phrase object from the backend
 * @returns {string} HTML string
 */
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

/**
 * Sends a DELETE request to the backend and removes the card from the UI.
 * @param {number} id - Phrase ID to delete
 */
async function deletePhrase(id) {
  try {
    const response = await fetch(
      `${CONFIG.backend.url}${CONFIG.backend.endpoints.phrases}${id}`,
      { method: 'DELETE' }
    );

    if (!response.ok) throw new Error('Failed to delete phrase');

    // Remove from local list and re-render
    allPhrases = allPhrases.filter(p => p.id !== id);
    savedCount.textContent = allPhrases.length;

    // Re-apply current search filter
    const query = searchInput.value.trim().toLowerCase();
    renderPhrases(query ? filterPhrases(query) : allPhrases);

  } catch (error) {
    console.error('❌ Error deleting phrase:', error);
  }
}

// ===========================
// SEARCH
// ===========================

/**
 * Filters the phrases list in real time as the user types.
 */
function setupSearchListener() {
  searchInput?.addEventListener('input', () => {
    const query = searchInput.value.trim().toLowerCase();
    renderPhrases(query ? filterPhrases(query) : allPhrases);
  });
}

/**
 * Filters phrases by original or translated text.
 * @param {string} query - Lowercase search string
 * @returns {Array} Filtered phrases
 */
function filterPhrases(query) {
  return allPhrases.filter(p =>
    p.original_text.toLowerCase().includes(query) ||
    p.translated_text.toLowerCase().includes(query)
  );
}

// ===========================
// COLLAPSIBLE TABS
// ===========================

/**
 * Attaches click listeners to all tab trigger buttons.
 * Toggles the corresponding collapse panel open/closed.
 */
function setupTabListeners() {
  document.querySelectorAll('.tab-trigger').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const tabName  = trigger.dataset.tab;
      const collapse = document.getElementById(`${tabName}-collapse`);
      const arrow    = trigger.querySelector('.tab-arrow');

      const isOpen = collapse.classList.contains('open');

      // Close all tabs first
      document.querySelectorAll('.tab-collapse').forEach(c => c.classList.remove('open'));
      document.querySelectorAll('.tab-arrow').forEach(a => a.classList.remove('open'));

      // Open clicked tab if it was closed
      if (!isOpen) {
        collapse.classList.add('open');
        arrow.classList.add('open');

        // Reload phrases when opening the saved tab
        if (tabName === 'saved') loadPhrases();
      }
    });
  });
}

// ===========================
// HELPERS
// ===========================

/**
 * Escapes HTML special characters to prevent XSS
 * when rendering user-saved text in phrase cards.
 * @param {string} text
 * @returns {string}
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}