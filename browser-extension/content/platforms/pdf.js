/**
 * pdf.js
 *
 * Handles text selection and translation on PDF pages.
 *
  it not works ;C
 */

const ParlaPDF = {

    // ===========================
    // SETUP
    // ===========================
  
    /**
     * Entry point — called by content.js when a PDF page is detected.
     * For now, just logs that we are on a PDF — text selection is handled
     * by the global mouseup listener in content.js.
     */
    setup() {
      console.log(' PDF: Module initialized (stub)');
  
      // Nothing special needed for basic text selection —
      // content.js already handles mouseup globally.
      // Future: inject annotation toolbar, page navigator, etc.
    },
  
    // ===========================
    // EXTENSION STATE
    // ===========================
  
    /**
     * Called by settings.js when the user toggles the extension on/off.
     * @param {boolean} isActive
     */
    updateExtensionState(isActive) {
      console.log(' PDF: Extension state →', isActive);
      // Nothing to show/hide for now
    },
  
    // ===========================
    // CLEANUP
    // ===========================
  
    /** No resources to clean up in the stub */
    cleanup() {}
};
