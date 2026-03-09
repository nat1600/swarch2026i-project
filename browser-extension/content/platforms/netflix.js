
/**
 * netflix.js
 *
 * Handles subtitle interception and display on Netflix watch pages.
 *
 * How it works:
 *   1. Waits for the Netflix video player to load
 *   2. Observes the native subtitle container for text changes
 *   3. Mirrors subtitle text into a custom Parla container
 *      that allows text selection and word clicks
 *   4. On word click or text selection → shows the floating popup
 *
 * Netflix subtitles are more complex than YouTube — they use
 * nested spans and <br> elements, so we need special extraction logic.
 */

const ParlaNetflix = {

  videoElement:    null,   // The <video> element on the page
  observer:        null,   // MutationObserver watching subtitle changes
  subtitleContainer: null, // Our custom subtitle DOM element
  lastText:        '',     // Last subtitle text shown (prevents re-renders)

  // ===========================
  // SETUP
  // ===========================

  /**
   * Entry point — called by content.js when a Netflix watch page is detected.
   * Injects CSS and waits for the video player to be ready.
   */
  setup() {
    console.log('Netflix: Setting up...');
    this.injectCSS();
    this.subtitleContainer = this.createSubtitleContainer();

    // Reflect initial extension state
    if (!ParlaSettings?.isExtensionActive) {
      document.body.classList.add('parla-disabled');
    }

    this.waitForPlayer();
  },

  // ===========================
  // CSS INJECTION
  // ===========================

  /**
   * Injects styles for the custom subtitle container.
   * Also disables pointer events on Netflix's blocking overlay layers
   * so the user can interact with our subtitle container.
   */
  injectCSS() {
    if (document.getElementById('parla-netflix-style')) return;

    const style = document.createElement('style');
    style.id = 'parla-netflix-style';
    style.innerHTML = `

      /* Allow text selection everywhere on Netflix */
      * {
        -webkit-user-select: text !important;
        user-select:         text !important;
      }

      /* Disable pointer events on Netflix blocking overlays */
      .player-timedtext,
      .player-timedtext-container,
      .player-timedtext-text-container {
        pointer-events: none !important;
      }

      /* Custom Parla subtitle container */
      #parla-netflix-subtitles {
        position:   fixed !important;
        bottom:     120px !important;
        left:       50% !important;
        transform:  translateX(-50%) !important;

        background:      rgba(8, 8, 12, 0.95) !important;
        backdrop-filter: blur(16px) !important;
        padding:         16px 28px !important;
        border-radius:   14px !important;
        border:          1px solid rgba(255, 255, 255, 0.1) !important;
        box-shadow:      0 12px 40px rgba(0, 0, 0, 0.5) !important;

        max-width:    90vw !important;
        min-width:    200px !important;
        width:        fit-content !important;
        z-index:      2147483645 !important;
        pointer-events: auto !important;
        user-select:    text !important;

        /* Hidden by default */
        display: none !important;
        justify-content: center !important;
        align-items:     center !important;
      }

      /* Visible state */
      #parla-netflix-subtitles.active {
        display: flex !important;
      }

      /* Subtitle text wrapper */
      #parla-netflix-subtitles .subtitle-text {
        font-size:   22px !important;
        font-weight: 700 !important;
        color:       #ffffff !important;
        line-height: 1.6 !important;
        text-align:  center !important;
        user-select: text !important;
        display:     flex !important;
        flex-wrap:   wrap !important;
        gap:         6px !important;
        justify-content: center !important;
      }

      /* Individual word — hoverable and clickable */
      #parla-netflix-subtitles .subtitle-word {
        display:       inline-block !important;
        padding:       3px 6px !important;
        border-radius: 5px !important;
        cursor:        pointer !important;
        user-select:   text !important;
        transition:    background 0.15s ease !important;
      }

      #parla-netflix-subtitles .subtitle-word:hover {
        background: rgba(188, 162, 242, 0.3) !important;
      }

      /* Text selection highlight */
      #parla-netflix-subtitles *::selection {
        background: rgba(74, 144, 226, 0.85) !important;
        color:      white !important;
      }

      /* Hide our container when extension is disabled */
      body.parla-disabled #parla-netflix-subtitles {
        display: none !important;
      }

      /* Restore native Netflix subtitles when extension is disabled */
      body.parla-disabled .player-timedtext,
      body.parla-disabled .player-timedtext-container {
        pointer-events: auto !important;
      }
    `;

    document.head.appendChild(style);
  },

  // ===========================
  // SUBTITLE CONTAINER
  // ===========================

  /**
   * Creates (or returns existing) custom subtitle container element.
   * Appended to the Netflix video wrapper if available, else to body.
   * @returns {HTMLElement}
   */
  createSubtitleContainer() {
    let container = document.getElementById('parla-netflix-subtitles');
    if (container) return container;

    container = document.createElement('div');
    container.id = 'parla-netflix-subtitles';

    // Prefer appending inside the video player wrapper
    const videoWrapper = document.querySelector(
      '.watch-video, .nf-player-container, .player-video-wrapper'
    ) || document.body;

    videoWrapper.appendChild(container);
    return container;
  },

  /**
   * Renders subtitle text into the container.
   * Splits text into individual word spans for click/hover support.
   * Preserves line breaks from multi-line subtitles.
   *
   * @param {string} text
   */
  showSubtitle(text) {
    if (!ParlaSettings?.isExtensionActive) return;

    // Split into lines, then words — preserving line breaks
    const html = text
      .split('\n')
      .map(line =>
        line.trim().split(/\s+/)
          .map(word => `<span class="subtitle-word">${word}</span>`)
          .join(' ')
      )
      .join('<br>');

    this.subtitleContainer.innerHTML = `<div class="subtitle-text">${html}</div>`;
    this.subtitleContainer.classList.add('active');

    this.attachWordListeners();
  },

  /**
   * Hides the subtitle container.
   */
  hideSubtitle() {
    this.subtitleContainer?.classList.remove('active');
  },

  // ===========================
  // WORD INTERACTION
  // ===========================

  /**
   * Attaches mouseup listeners to each word span.
   * Also pauses/resumes video on container hover.
   */
  attachWordListeners() {
    const words = this.subtitleContainer?.querySelectorAll('.subtitle-word');
    if (!words) return;

    words.forEach(word => {
      word.addEventListener('mouseup', (e) => this.handleWordClick(e));
    });

    // Pause video when hovering subtitle so user can read/interact
    this.subtitleContainer.addEventListener('mouseenter', () => this.pauseVideo());
    this.subtitleContainer.addEventListener('mouseleave', () => this.resumeVideo());
  },

  /**
   * Handles a click/mouseup on a subtitle word.
   * Prefers manual text selection over single word click.
   *
   * @param {MouseEvent} e
   */
  handleWordClick(e) {
    if (!ParlaSettings?.isExtensionActive) return;

    // Prefer manual selection (user dragged across multiple words)
    const selected = window.getSelection().toString().trim();
    if (selected.length > 1) {
      ParlaPopup?.show(e.clientX, e.clientY, selected, 'Netflix');
      return;
    }

    // Single word click
    const word = e.target.textContent.trim();
    if (word) {
      ParlaPopup?.show(e.clientX, e.clientY, word, 'Netflix');
    }
  },

  // ===========================
  // VIDEO CONTROL
  // ===========================

  /** Pauses the video (called on subtitle hover) */
  pauseVideo() {
    if (this.videoElement && !this.videoElement.paused) {
      this.videoElement.pause();
      this.subtitleContainer?.setAttribute('data-parla-paused', 'true');
    }
  },

  /** Resumes the video (called when leaving subtitle area) */
  resumeVideo() {
    setTimeout(() => {
      if (this.videoElement && this.subtitleContainer?.hasAttribute('data-parla-paused')) {
        this.videoElement.play();
        this.subtitleContainer.removeAttribute('data-parla-paused');
      }
    }, 250);
  },

  // ===========================
  // SUBTITLE TEXT EXTRACTION
  // ===========================

  /**
   * Extracts subtitle text from Netflix's native container.
   * Netflix uses nested spans and <br> elements — this method
   * preserves line breaks while stripping all other HTML.
   *
   * @param {HTMLElement} el - The native Netflix subtitle element
   * @returns {string} Clean subtitle text with \n for line breaks
   */
  extractText(el) {
    // Clone to avoid modifying the real DOM
    const clone = el.cloneNode(true);

    // Replace <br> elements with newline characters
    clone.querySelectorAll('br').forEach(br => br.replaceWith('\n'));

    return (clone.innerText || clone.textContent || '')
      .replace(/\n{2,}/g, '\n')   // Collapse multiple newlines
      .replace(/\s+\n/g,  '\n')   // Remove trailing spaces before newline
      .replace(/\n\s+/g,  '\n')   // Remove leading spaces after newline
      .trim();
  },

  // ===========================
  // SUBTITLE OBSERVER
  // ===========================

  /**
   * Waits for the Netflix video player to appear in the DOM,
   * then starts observing subtitle changes.
   */
  waitForPlayer() {
    const interval = setInterval(() => {
      this.videoElement = document.querySelector('video');
      if (this.videoElement) {
        clearInterval(interval);
        console.log('🎬 Netflix: Player found — starting subtitle observer');
        this.startSubtitleObserver();
      }
    }, 400);
  },

  /**
   * Observes the DOM for Netflix subtitle changes.
   * When subtitles change, mirrors them to our custom container.
   */
  startSubtitleObserver() {
    this.observer = new MutationObserver(() => {
      if (!ParlaSettings?.isExtensionActive) {
        this.hideSubtitle();
        return;
      }

      const nativeSubtitle = document.querySelector(
        '.player-timedtext-text-container'
      );

      if (!nativeSubtitle) {
        this.hideSubtitle();
        return;
      }

      const text = this.extractText(nativeSubtitle);

      // Only re-render if the text actually changed
      if (!text || text === this.lastText) return;
      this.lastText = text;

      this.showSubtitle(text);
    });

    this.observer.observe(document.body, {
      childList:     true,
      subtree:       true,
      characterData: true
    });
  },

  // ===========================
  // EXTENSION STATE
  // ===========================

  /**
   * Called by settings.js when the user toggles the extension on/off.
   * @param {boolean} isActive
   */
  updateExtensionState(isActive) {
    console.log('🎬 Netflix: Extension state →', isActive);

    if (isActive) {
      document.body.classList.remove('parla-disabled');
    } else {
      document.body.classList.add('parla-disabled');
      this.hideSubtitle();
      this.lastText = '';
    }
  },

  // ===========================
  // CLEANUP
  // ===========================

  /** Disconnects observer and removes injected elements */
  cleanup() {
    this.observer?.disconnect();
    this.subtitleContainer?.remove();
    this.subtitleContainer = null;
    this.observer = null;
    this.lastText = '';
  }

};

window.ParlaNetflix = ParlaNetflix;
