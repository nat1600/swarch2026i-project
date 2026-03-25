/**
 * content.js — Main Orchestrator
 */

console.log(' Parla: ... initializatinggggg...');

let pageType = { isYouTube: false, isNetflix: false, isPDF: false };
let lastURL  = window.location.href;

async function init() {

  await ParlaSettings.load();
  ParlaSettings.setupMessageListener();
  detectPageType();
  setupEventListeners();
  watchURLChanges();
  setupPopupGuard();

}

function detectPageType() {
  const url = window.location.href;

  ParlaYouTube?.cleanup?.();
  ParlaNetflix?.cleanup?.();

  pageType = {
    isYouTube: url.includes('youtube.com/watch'),
    isNetflix: url.includes('netflix.com/watch'),
    isPDF: url.includes('.pdf') || document.contentType === 'application/pdf',
  };

  console.log(' Page type:', pageType);

  if (pageType.isYouTube) {
    ParlaYouTube.setup();
  } else if (pageType.isNetflix) {
    ParlaNetflix.setup();
  } else if (pageType.isPDF) {
    ParlaPDF.setup();
  }

}

function watchURLChanges() {
  const originalPushState = history.pushState;
  history.pushState = function (...args) {
    originalPushState.apply(this, args);
    handleURLChange();
  };
  window.addEventListener('popstate', handleURLChange);
  setInterval(() => {
    if (window.location.href !== lastURL) handleURLChange();
  }, 500);
}

function handleURLChange() {
  const newURL = window.location.href;
  if (newURL === lastURL) return;
  lastURL = newURL;
  ParlaToolbar.hide();
  ParlaPopup.hide();
  setTimeout(detectPageType, 1000);
}

function setupEventListeners() {
  let selectionTimeout;

  document.addEventListener('mouseup', (e) => {
    clearTimeout(selectionTimeout);
    selectionTimeout = setTimeout(() => handleTextSelection(e), 150);
  });

  document.addEventListener('mousedown', (e) => {
 
    if (!e.target.closest('[data-parla-toolbar="true"]') &&
        !e.target.closest('[data-parla-popup="true"]')) {
      ParlaToolbar.hide();
     
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      ParlaToolbar.hide();
      ParlaPopup.hide();
    }
  });
}

function handleTextSelection(e) {
  if (!ParlaSettings.isExtensionActive) return;
  if (e.target.closest('[data-parla-toolbar="true"]')) return;
  if (e.target.closest('[data-parla-popup="true"]'))   return;
  if (pageType.isYouTube && e.target.closest('.ytp-caption-segment')) return;
  if (pageType.isNetflix && e.target.closest('[class*="timedtext"]'))  return;

  const text = window.getSelection().toString().trim();

  if (text.length > 0) {
    const context = pageType.isYouTube ? 'YouTube'
                  : pageType.isNetflix ? 'Netflix'
                  : pageType.isPDF     ? 'PDF'
                  : window.location.hostname;

    if (pageType.isYouTube || pageType.isNetflix) {
      
      ParlaToolbar.hide();
      ParlaPopup.show(e.clientX, e.clientY, text, context);
    } else {
      ParlaPopup.hide();
      ParlaToolbar.show(text, context, e.clientX, e.clientY);
    }
  } else {
    ParlaToolbar.hide();
    ParlaPopup.hide();
  }

}

function setupPopupGuard() {
  const guard = new MutationObserver(() => {
    if (ParlaPopup.floatingPopup && !document.contains(ParlaPopup.floatingPopup)) {
      ParlaPopup.hide();
    }
  });
  guard.observe(document.body, { childList: true, subtree: true });
}

window.addEventListener('beforeunload', () => {
  ParlaToolbar.hide();
  ParlaPopup.hide();
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
