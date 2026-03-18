/**
 * translation.js
 *
 * Handles text translation by sending a message to background.js,
 * which then calls POST /translate on the core-service.
 *
 * Renders the result (or an error) directly into a given DOM container,
 * so the floating popup stays updated in real time.
 * TODO: REVIEW THIS
 */

const ParlaTranslation = {

    /**
     * Translates the given text and renders the result into the container.
     * Shows a loading spinner while waiting for the response.
     *
     * @param {string}      text      - Text to translate
     * @param {HTMLElement} container - DOM element where the result will be rendered
     */
    async translate(text, container) {
      console.log('que estoy traduciendooo AHHHHHHH', text);
  
      // Show loading spinner while waiting for response
      container.innerHTML = `
        <div class="parla-loading">
          <div class="parla-spinner"></div>
          <span>Traduciendo...</span>
        </div>
      `;
  
      try {
        // Get target language from storage (defaults to Spanish)
        const settings = await chrome.storage.local.get(['parla_target_language']);
        const targetLanguage = settings.parla_target_language || 'es';
  
        // Send translation request to background.js
        chrome.runtime.sendMessage(
          {
            action:      'translate',
            text:        text,
            source_lang: 'en',
            target_lang: targetLanguage
          },
          (response) => {
            console.log('Translation response:', response); // log temporal
            
            if (chrome.runtime.lastError) {
              console.error(' Runtime error:', chrome.runtime.lastError);
              container.innerHTML = `<div class="parla-error">Error de conexión</div>`;
              return;
            }
          
            if (response?.success) {
              container.innerHTML = `
                <div class="parla-translation-result">
                  <span class="parla-translation-label"></span>
                  <p class="parla-translation-text">
                    ${_escapeHtml(response.translation)}
                  </p>
                </div>
              `;
            } else {
              container.innerHTML = `<div class="parla-error">Error al traducir</div>`;
              console.error(' Translation error:', response?.error);
            }
          }
        );
  
      } catch (error) {
        container.innerHTML = `
          <div class="parla-error"> Error al traducir</div>
        `;
        console.error('Translation error:', error);
      }
    }
  
  };
  
  // ===========================
  // PRIVATE HELPERS
  // ===========================
  
  /**
   * Escapes HTML special characters to prevent XSS
   * when rendering user-provided or API-returned text.
   *
   * @param {string} text
   * @returns {string} Escaped HTML string
   */
  function _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  window.ParlaTranslation = ParlaTranslation;