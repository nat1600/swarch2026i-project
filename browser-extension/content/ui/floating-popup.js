/**
 * content/ui/popup.js
 *
 * Controls the floating popup shown when the user selects text.
 * Singleton — only one popup at a time.
 */

const ParlaPopup = (() => {

  let floatingPopup = null;
  let selectedText   = '';
  let isShowing      = false;

  // ===========================
  // PRIVATE HELPERS
  // ===========================

  /**
   * Builds the full popup HTML with selected text already injected.
   * @param {string} text - Selected text
   * @returns {string} HTML string
   */
  function buildHTML(text) {
    const escaped    = escapeHtml(text);
    const chiguiroURL = chrome.runtime.getURL('assets/icons/parlaglobe.png');

    return `
      <!-- Header -->
      <div class="parla-popup-header">
        <img src="${chiguiroURL}" class="parla-header-mascot" alt="Parla">
        <span class="parla-popup-title">Parla</span>
        <button class="parla-popup-close" id="parla-close">&times;</button>
      </div>

      <!-- Body -->
      <div class="parla-popup-content">

        <!-- Original text -->
        <div class="parla-section">
          <span class="parla-section-label"> Original</span>
          <div class="parla-selected-text" id="parla-selected-text">${escaped}</div>
        </div>

        <!-- Divider -->
        <div class="parla-divider">
          <div class="parla-divider-line"></div>
          <span class="parla-divider-icon">↓</span>
          <div class="parla-divider-line"></div>
        </div>

        <!-- Translation -->
        <div class="parla-section">
          <span class="parla-section-label"> Traducción</span>
          <div class="parla-translation-container" id="parla-translation">
            <div class="parla-loading">
              <div class="parla-spinner"></div>
              <span>Traduciendo...</span>
            </div>
          </div>
        </div>

      </div>

      <!-- Actions -->
      <div class="parla-popup-actions">
        <button class="parla-action-btn parla-btn-primary" id="parla-save">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" stroke="currentColor" stroke-width="2"/>
            <path d="M17 21v-8H7v8M7 3v5h8" stroke="currentColor" stroke-width="2"/>
          </svg>
          Guardar
        </button>
        <button class="parla-action-btn parla-btn-secondary" id="parla-speak">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <path d="M11 5L6 9H2v6h4l5 4V5z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M15.54 8.46a5 5 0 010 7.07" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          Escuchar
        </button>
      </div>
    `;
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function getContainer() {
    return document.fullscreenElement       ||
           document.webkitFullscreenElement ||
           document.body;
  }

  // ===========================
  // PUBLIC API
  // ===========================

  return {

    get floatingPopup() { return floatingPopup; },

    show(x, y, text, context) {
      if (isShowing) return;
      isShowing    = true;
      selectedText = text;

      this.hide();

      floatingPopup = document.createElement('div');
      floatingPopup.className = 'parla-floating-popup';
      floatingPopup.setAttribute('data-parla-popup', 'true');
      floatingPopup.innerHTML = buildHTML(text);

      getContainer().appendChild(floatingPopup);
      this.position(x, y);
      this.setupListeners(context);

      requestAnimationFrame(() => floatingPopup?.classList.add('parla-popup-visible'));

      const translationContainer = floatingPopup.querySelector('#parla-translation');
      if (translationContainer) ParlaTranslation.translate(text, translationContainer);

      setTimeout(() => { isShowing = false; }, 300);
      console.log('✅ Popup shown for:', text, '| context:', context);
    },

    position(x, y) {
      if (!floatingPopup) return;

      const rect = floatingPopup.getBoundingClientRect();
      const vw   = window.innerWidth;
      const vh   = window.innerHeight;

      let left = x + 10;
      let top  = y + 10;

      if (left + rect.width  > vw) left = x - rect.width  - 10;
      if (top  + rect.height > vh) top  = y - rect.height - 10;

      left = Math.max(10, Math.min(left, vw - rect.width  - 10));
      top  = Math.max(10, Math.min(top,  vh - rect.height - 10));

      floatingPopup.style.left = `${left}px`;
      floatingPopup.style.top  = `${top}px`;
    },

    hide() {
      if (!floatingPopup) return;

      floatingPopup.classList.remove('parla-popup-visible');
      const toRemove = floatingPopup;
      floatingPopup  = null;
      isShowing      = false;

      setTimeout(() => toRemove?.parentNode?.removeChild(toRemove), 200);
    },

    setupListeners(context) {
      if (!floatingPopup) return;

      floatingPopup.querySelector('#parla-close')
        ?.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.hide();
        });

      floatingPopup.querySelector('#parla-save')
        ?.addEventListener('click', async (e) => {
          e.preventDefault();
          e.stopPropagation();
          const translationEl  = floatingPopup.querySelector('.parla-translation-text');
          const translatedText = translationEl?.textContent?.trim() || '';
          //const user = await getCurrentUser();   // TODO:  UNCOMENT WHEN WE HAVE USE// fetch  
          await ParlaActions.savePhrase(selectedText, translatedText, 1, 2);
        });

      floatingPopup.querySelector('#parla-speak')
        ?.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          ParlaActions.speakText(selectedText);
        });

      floatingPopup.addEventListener('mousedown', (e) => {
        if (!e.target.closest('button, input, textarea')) e.stopPropagation();
      });

      floatingPopup.addEventListener('mouseup', (e) => {
        if (!e.target.closest('button, input, textarea')) e.stopPropagation();
      });
    }
  };

})();

window.ParlaPopup = ParlaPopup;