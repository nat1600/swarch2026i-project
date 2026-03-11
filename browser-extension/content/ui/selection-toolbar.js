/**
 * selection-toolbar.js
 */
const ParlaToolbar = (() => {
  let toolbar        = null;
  let isShowing      = false;
  let pendingText    = '';
  let pendingContext = '';
  let pendingX = 0;
  let pendingY = 0;

  function buildHTML() {
    const chiguiroURL = chrome.runtime.getURL('assets/icons/chiguiroup.png');
    return `
      <button class="parla-toolbar-btn parla-toolbar-translate" id="parla-tb-translate">
        <img src="${chiguiroURL}" class="parla-tb-mascot" alt="">
        <span class="parla-tb-label">Traducir</span>
      </button>
      <div class="parla-toolbar-divider"></div>
      <button class="parla-toolbar-btn parla-toolbar-toggle" id="parla-tb-toggle" title="Apagar Parla">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
          <path d="M18.36 6.64a9 9 0 11-12.73 0M12 2v10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
    `;
  }

  function positionAboveSelection() {
    if (!toolbar) return;
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    const range       = selection.getRangeAt(0);
    const rect        = range.getBoundingClientRect();
    const toolbarRect = toolbar.getBoundingClientRect();
    let left = rect.left + (rect.width / 2) - (toolbarRect.width / 2) + window.scrollX;
    let top  = rect.top  - toolbarRect.height - 10 + window.scrollY;
    left = Math.max(10, Math.min(left, window.innerWidth - toolbarRect.width - 10));
    if (top < window.scrollY + 10) top = rect.bottom + 10 + window.scrollY;
    toolbar.style.left = `${left}px`;
    toolbar.style.top  = `${top}px`;
  }

  return {
    show(text, context, x, y) {
      if (isShowing) return;
      isShowing      = true;
      pendingText    = text;
      pendingContext = context;
      pendingX       = x;
      pendingY       = y;

      this.hide();

      toolbar = document.createElement('div');
      toolbar.className = 'parla-selection-toolbar';
      toolbar.setAttribute('data-parla-toolbar', 'true');
      toolbar.innerHTML = buildHTML();
      document.body.appendChild(toolbar);

      requestAnimationFrame(() => {
        positionAboveSelection();
        toolbar?.classList.add('parla-toolbar-visible');
      });

      toolbar.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
      });

      toolbar.querySelector('#parla-tb-translate')
        ?.addEventListener('click', (e) => {
          e.stopPropagation();
          const t = pendingText, c = pendingContext;
          const px = pendingX,   py = pendingY;
          this.hide();
          setTimeout(() => ParlaPopup.show(px, py, t, c), 50);
        });

      toolbar.querySelector('#parla-tb-toggle')
        ?.addEventListener('click', async (e) => {
          e.stopPropagation();
          this.hide();
          // Guardar en storage — el listener en settings.js lo captura automáticamente
          await chrome.storage.local.set({ parla_extension_active: false });
          ParlaHelpers.showNotification('Parla desactivada');
        });

      setTimeout(() => { isShowing = false; }, 200);
    },

    hide() {
      if (!toolbar) return;
      toolbar.classList.remove('parla-toolbar-visible');
      const toRemove = toolbar;
      toolbar   = null;
      isShowing = false;
      setTimeout(() => toRemove?.parentNode?.removeChild(toRemove), 150);
    },

    get element() { return toolbar; }
  };
})();

window.ParlaToolbar = ParlaToolbar;