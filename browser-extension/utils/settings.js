/**
 * settings.js
 *
 * Manages the global state of the extension (active/inactive).
 * Persists the state using chrome.storage.local so it survives
 * browser restarts.
 *
 * Also listens for toggle messages sent from the extension popup
 * (extension-popup.js) to update the state in real time across all tabs.
 */

const ParlaSettings = {

  // Whether the extension is currently active (default: true)
  isExtensionActive: true,

  // ===========================
  // LOAD
  // ===========================

  /**
   * Reads the saved state from chrome.storage.local.
   * Called once on content script initialization.
   */

  async load() {
    try {
      const result = await chrome.storage.local.get(['parla_extension_active']);
     
      // If the key doesn't exist yet, default to true
      this.isExtensionActive = result.parla_extension_active !== false;
    
      console.log('Parla Settings loaded — active:', this.isExtensionActive);
    } catch (error) {
      console.error('Error loading settings:', error);
      this.isExtensionActive = true;
    }
  },

  // ===========================
  // MESSAGE LISTENER
  // ===========================

  /**
   * Listens for messages from the extension popup.
   * When the user toggles the extension on/off, this updates
   * the local state and notifies platform modules (YouTube, Netflix).
   */
  setupMessageListener() {
    // Escucha cambios en storage — funciona siempre, sin depender de mensajes
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local' || !('parla_extension_active' in changes)) return;
      const isActive = changes.parla_extension_active.newValue !== false;
      console.log('Parla: storage cambió → active:', isActive);
      this._applyToggle(isActive);
    });

    // Fallback: mensajes directos
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

      // User toggled the extension on/off from the popup
      if (request.action === 'toggleExtension') {
        console.log('Parla: mensaje toggleExtension recibido → active:', request.active);
        
        // Notify platform modules so they can show/hide subtitles
        this._applyToggle(request.active);
        sendResponse({ success: true });
      }
      return true;
    });
  },

  _applyToggle(isActive) {
    this.isExtensionActive = isActive;
    window.ParlaYouTube?.updateExtensionState(isActive);
    window.ParlaNetflix?.updateExtensionState(isActive);
    if (!isActive) {
      window.ParlaToolbar?.hide();
      window.ParlaPopup?.hide();
    }
  }
};

window.ParlaSettings = ParlaSettings;
