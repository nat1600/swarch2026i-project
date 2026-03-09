/**
 * content.js — Main Orchestrator
 *
 * This is the entry point of the extension on every web page.
 * It is responsible for:
 *   1. Loading settings from storage
 *   2. Detecting the type of page (YouTube, Netflix, PDF, or general web)
 *   3. Initializing the correct platform module
 *   4. Listening for text selection events and showing the floating popup
 *   5. Handling SPA navigation (YouTube / Netflix change URLs without reload)
 */

console.log(' Parla: Initializing...');

// ===========================
// GLOBAL STATE
// ===========================

// Tracks which type of page we are on
let pageType = {
  isYouTube: false,
  isNetflix: false,
  isPDF:     false
};

// ===========================
// INITIALIZATION
// ===========================

/**
 * Main entry point.
 * Loads settings, detects the page type, and sets up event listeners.
 */
async function init() {
  console.log(' Parla: Starting initialization...');

  // 1. Load saved settings (active/inactive state)
  await ParlaSettings.load();

  // 2. Listen for toggle messages from the extension popup
  ParlaSettings.setupMessageListener();

  // 3. Detect page type and initialize the correct platform module
  detectPageType();

  // 4. Listen for text selection events on the page
  setupEventListeners();

  console.log(' Parla: Ready');
}

// ===========================
// PAGE TYPE DETECTION
// ===========================

/**
 * Detects whether we are on YouTube, Netflix, a PDF, or a general web page.
 * Initializes the corresponding platform module.
 */
function detectPageType() {
  const url = window.location.href;

  pageType = {
    isYouTube: url.includes('youtube.com/watch'),
    isNetflix: url.includes('netflix.com/watch'),
    isPDF:     url.includes('.pdf') || document.contentType === 'application/pdf'
  };

  console.log('📄 Page type:', pageType);

  if (pageType.isYouTube) {
    console.log(' Initializing YouTube module...');
    ParlaYouTube.setup();
  } else if (pageType.isNetflix) {
    console.log('itializing Netflix module...');
    ParlaNetflix.setup();
  } else if (pageType.isPDF) {
    console.log(' Initializing PDF module...');
    ParlaPDF.setup();
  }
}

// ===========================
// EVENT LISTENERS
// ===========================

/**
 * Sets up global event listeners:
 *   - mouseup → detect text selection and show floating popup
 *   - keydown → close popup on Escape
 */
function setupEventListeners() {
  let selectionTimeout;

  // Debounce mouseup to avoid firing before selection is finalized
  document.addEventListener('mouseup', (e) => {
    clearTimeout(selectionTimeout);
    selectionTimeout = setTimeout(() => handleTextSelection(e), 150);
  });

  // Close popup when user presses Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') ParlaPopup.hide();
  });
}

// ===========================
// TEXT SELECTION HANDLER
// ===========================

/**
 * Called after every mouseup event.
 * Checks if the user selected text and shows the floating popup.
 *
 * @param {MouseEvent} e
 */
function handleTextSelection(e) {

  // Do nothing if the extension is disabled
  if (!ParlaSettings.isExtensionActive) return;

  // Ignore clicks inside the popup itself
  if (ParlaPopup.floatingPopup?.contains(e.target)) return;
  if (e.target.closest('[data-parla-popup="true"]')) return;

  // Let platform modules handle subtitle clicks on YouTube / Netflix
  if (pageType.isYouTube && e.target.closest('.ytp-caption-segment')) return;
  if (pageType.isNetflix && e.target.closest('[class*="timedtext"]'))  return;

  const text = window.getSelection().toString().trim();

  if (text.length > 0) {
    // Determine context label for saving metadata
    const context = pageType.isYouTube ? 'YouTube'
                  : pageType.isNetflix ? 'Netflix'
                  : pageType.isPDF     ? 'PDF'
                  : window.location.hostname;

    ParlaPopup.show(e.clientX, e.clientY, text, context);
  } else {
    // No text selected — hide popup if open
    ParlaPopup.hide();
  }
}

// ===========================
// POPUP INTEGRITY GUARD
// ===========================

/**
 * Some sites aggressively remove foreign DOM elements.
 * This observer detects if our popup was removed unexpectedly and resets the reference.
 */
const popupGuard = new MutationObserver(() => {
  if (ParlaPopup.floatingPopup && !document.contains(ParlaPopup.floatingPopup)) {
    console.warn(' Parla: Popup was removed by the site — resetting reference');
    ParlaPopup.hide();
  }
});

popupGuard.observe(document.body, { childList: true, subtree: true });

// ===========================
// SPA NAVIGATION HANDLING
// ===========================

/**
 * YouTube and Netflix are Single Page Applications — they change the URL
 * without reloading the page. We listen for popstate to re-run detection.
 */
window.addEventListener('popstate', () => {
  console.log('Parla: Navigation detected — re-initializing...');

  // Clean up Netflix overlay if present
  document.getElementById('parla-netflix-static-container')?.remove();

  // Re-detect page type after a short delay (let the SPA settle)
  setTimeout(detectPageType, 1000);
});

// ===========================
// CLEANUP ON PAGE UNLOAD
// ===========================

window.addEventListener('beforeunload', () => {
  ParlaPopup.hide();
});

// ===========================
// START
// ===========================

// Wait for DOM if still loading, otherwise initialize immediately
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

