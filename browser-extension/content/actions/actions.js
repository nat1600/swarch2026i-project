/**
 * actions.js
 *
 * Handles the two main user actions triggered from the floating popup:
 *   - savePhrase  → sends the selected text + translation to the backend
 *   - speakText   → reads the selected text aloud via Web Speech API
 *
 * Also exposes showNotification(), used by other modules to
 * display brief toast messages on screen.
 */

const ParlaActions = {

    // ===========================
    // SAVE PHRASE
    // ===========================
  
    /**
     * Saves the selected phrase to the core-service via background.js.
     * Builds the phrase object expected by POST /phrases/.
     *
     * @param {string} originalText    - Text the user selected on the page
     * @param {string} translatedText  - Translation returned by the API
     * @param {number} sourceLangId    - ID of the source language (default: 1 = English)
     * @param {number} targetLangId    - ID of the target language (default: 2 = Spanish)
     */
    async savePhrase(originalText, translatedText, sourceLangId = 1, targetLangId = 2) {
      console.log(' Saving phrase:', originalText);
  
      const phrase = {
        user_id:            1,              // TODO: replace with real user id once auth is in place
        source_language_id: sourceLangId,
        target_language_id: targetLangId,
        original_text:      originalText,
        translated_text:    translatedText,
        pronunciation:      null            // TODO: add pronunciation support
      };
  
      // Send to background.js → POST /phrases/
      chrome.runtime.sendMessage({ action: 'savePhrase', phrase }, (response) => {
        if (response?.success) {
          console.log(' Phrase saved:', response.savedPhrase);
          window.ParlaPopup?.hide();
          showNotification('✓ Frase guardada');
        } else {
          console.error(' Error saving phrase:', response?.error);
          showNotification(' Error al guardar');
        }
      });
    },
  
    // ===========================
    // SPEAK TEXT
    // ===========================
  
    /**
     * Uses the browser's Web Speech API to read the given text aloud.
     * Language is set to en-US. Rate is slightly slower for clarity.
     *
     * @param {string} text - Text to speak
     */
    speakText(text) {
      console.log('Speaking:', text);
  
      if (!('speechSynthesis' in window)) {
        showNotification('Text-to-speech no disponible');
        return;
      }
  
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;   // Slightly slower than default for better clarity
      speechSynthesis.speak(utterance);
  
      showNotification(' Reproduciendo...');
    }
  
  };
  
  // ===========================
  // TOAST NOTIFICATION
  // ===========================
  
  /**
   * Shows a brief toast notification at the bottom-right of the screen.
   * Automatically dismisses after 2 seconds.
   * Exposed globally so other modules (popup.js, etc.) can use it too.
   *
   * @param {string} message - Message to display
   */
  function showNotification(message) {
    const notif = document.createElement('div');
    notif.className = 'parla-notification';
    notif.textContent = message;
    document.body.appendChild(notif);
  
    // Trigger CSS fade-in transition
    setTimeout(() => notif.classList.add('parla-notification-visible'), 10);
  
    // Fade out and remove after 2s
    setTimeout(() => {
      notif.classList.remove('parla-notification-visible');
      setTimeout(() => notif.remove(), 300);  // Wait for fade-out transition
    }, 2000);
  }
  
  window.ParlaActions = ParlaActions;
  window.showNotification = showNotification;