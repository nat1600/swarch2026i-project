/**
 * youtube.js
 *
 * Handles subtitle interception and display on YouTube watch pages.
 *
 * How it works:
 *   1. Waits for the YouTube video player to load
 *   2. Observes the native subtitle container for text changes
 *   3. Mirrors the subtitle text into a custom Parla container
 *      that allows text selection and word clicks
 *   4. On word click or text selection → shows the floating popup
 *
 * The native YouTube subtitle container is hidden via CSS so that
 * only our custom container is visible.
 */

const ParlaYouTube = {

    videoElement:      null,   // The <video> element on the page
    observer:          null,   // MutationObserver watching subtitle changes
    subtitleContainer: null,   // Our custom subtitle DOM element
  
    // ===========================
    // SETUP
    // ===========================
  
    /**
     * Entry point — called by content.js when a YouTube watch page is detected.
     * Injects CSS and waits for the video player to be ready.
     */
    setup() {
      console.log(' YouTube: Setting up...');
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
     * Also hides the native YouTube subtitle container.
     */
    injectCSS() {
      if (document.getElementById('parla-youtube-style')) return;
  
      const style = document.createElement('style');
      style.id = 'parla-youtube-style';
      style.innerHTML = `
  
        /* Hide native YouTube subtitles — we replace them with ours */
        .ytp-caption-window-container,
        .caption-window,
        .ytp-caption-segment {
          display: none !important;
        }
  
        /* Custom Parla subtitle container */
        #parla-youtube-subtitles {
          position:   fixed !important;
          bottom:     120px !important;
          left:       50% !important;
          transform:  translateX(-50%) !important;
  
          background:       rgba(8, 8, 12, 0.95) !important;
          backdrop-filter:  blur(16px) !important;
          padding:          16px 28px !important;
          border-radius:    14px !important;
          border:           1px solid rgba(255, 255, 255, 0.1) !important;
          box-shadow:       0 12px 40px rgba(0, 0, 0, 0.5) !important;
  
          max-width:    90vw !important;
          min-width:    200px !important;
          width:        fit-content !important;
          z-index:      9999999 !important;
          pointer-events: auto !important;
  
          /* Hidden by default */
          display: none !important;
          justify-content: center !important;
          align-items:     center !important;
        }
  
        /* Visible state */
        #parla-youtube-subtitles.active {
          display: flex !important;
        }
  
        /* Subtitle text wrapper */
        #parla-youtube-subtitles .subtitle-text {
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
        #parla-youtube-subtitles .subtitle-word {
          display:       inline-block !important;
          padding:       3px 6px !important;
          border-radius: 5px !important;
          cursor:        pointer !important;
          user-select:   text !important;
          transition:    background 0.15s ease !important;
        }
  
        #parla-youtube-subtitles .subtitle-word:hover {
          background: rgba(188, 162, 242, 0.3) !important;
        }
  
        /* Hide our container when extension is disabled */
        body.parla-disabled #parla-youtube-subtitles {
          display: none !important;
        }
  
        /* Restore native subtitles when extension is disabled */
        body.parla-disabled .ytp-caption-window-container,
        body.parla-disabled .ytp-caption-segment {
          display: block !important;
        }
      `;
  
      document.head.appendChild(style);
    },
  
    // ===========================
    // SUBTITLE CONTAINER
    // ===========================
  
    /**
     * Creates (or returns existing) custom subtitle container element.
     * @returns {HTMLElement}
     */
    createSubtitleContainer() {
      let container = document.getElementById('parla-youtube-subtitles');
      if (container) return container;
  
      container = document.createElement('div');
      container.id = 'parla-youtube-subtitles';
      document.body.appendChild(container);
      return container;
    },
  
    /**
     * Renders subtitle text into the container.
     * Splits text into individual word spans for click/hover support.
     *
     * @param {string} text
     */
    showSubtitle(text) {
      if (!ParlaSettings?.isExtensionActive) return;
  
      const words = text.trim().split(/\s+/)
        .map(word => `<span class="subtitle-word">${word}</span>`)
        .join(' ');
  
      this.subtitleContainer.innerHTML = `<div class="subtitle-text">${words}</div>`;
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
        ParlaPopup?.show(e.clientX, e.clientY, selected, 'YouTube');
        return;
      }
  
      // Single word click
      const word = e.target.textContent.trim();
      if (word) {
        ParlaPopup?.show(e.clientX, e.clientY, word, 'YouTube');
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
      }, 300);
    },
  
    // ===========================
    // SUBTITLE OBSERVER
    // ===========================
  
    /**
     * Waits for the YouTube player to appear in the DOM,
     * then starts observing subtitle changes.
     */
    waitForPlayer() {
      const interval = setInterval(() => {
        this.videoElement = document.querySelector('video');
        if (this.videoElement) {
          clearInterval(interval);
          console.log('🎥 YouTube: Player found — starting subtitle observer');
          this.startSubtitleObserver();
        }
      }, 500);
    },
  
    /**
     * Observes the YouTube player for subtitle text changes.
     * When subtitles change, mirrors them to our custom container.
     */
    startSubtitleObserver() {
      this.observer = new MutationObserver(() => {
        if (!ParlaSettings?.isExtensionActive) {
          this.hideSubtitle();
          return;
        }
  
        const nativeSubtitle = document.querySelector('.ytp-caption-segment');
  
        if (nativeSubtitle?.textContent.trim()) {
          this.showSubtitle(nativeSubtitle.textContent.trim());
        } else {
          this.hideSubtitle();
        }
      });
  
      const target = document.querySelector('#movie_player') || document.body;
      this.observer.observe(target, {
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
      console.log('🎥 YouTube: Extension state →', isActive);
  
      if (isActive) {
        document.body.classList.remove('parla-disabled');
      } else {
        document.body.classList.add('parla-disabled');
        this.hideSubtitle();
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
    }
  
  };
  
  window.ParlaYouTube = ParlaYouTube;