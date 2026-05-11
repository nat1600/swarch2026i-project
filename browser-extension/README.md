# Browser Extension

Chrome extension that turns any web page, YouTube video, or Netflix show into a vocabulary learning experience. Part of the [swarch2026i language learning platform](../README.md).

## Overview

The extension intercepts subtitles on YouTube and Netflix, letting users click any word to get an instant translation. On general web pages and PDFs, a mini selection toolbar appears when the user highlights text. Saved phrases are sent to the core-service backend and become part of the user's personal dictionary and flashcard deck.

## Tech Stack

| Layer        | Technology                              |
|--------------|-----------------------------------------|
| Platform     | Chrome Extension — Manifest V3          |
| Languages    | Vanilla JS (ES6+), CSS3, HTML5          |
| Background   | Service Worker (MV3)                    |
| Storage      | `chrome.storage.local`                  |
| Speech       | Web Speech API                          |
| Backend      | core-service REST API |

## Project Structure

```
browser-extension/
├── manifest.json
├── assets/
│   └── icons/
│       ├── icon16.png, icon32.png, icon48.png, icon128.png
│       ├── chiguiro.png           # Mascot — idle
│       ├── chiguirohesitating.png # Mascot — thinking
│       ├── chiguiroup.png         # Mascot — happy
│       └── parlaglobe.png         # Logo globe
├── background/
│   └── service-worker.js          # Handles translate + savePhrase messages
├── config/
│   └── config.js                  # Backend URL and endpoint constants
├── content/
│   ├── content.css                # All injected UI styles
│   ├── content.js                 # Main orchestrator
│   ├── actions/
│   │   └── actions.js             # savePhrase, speakText, showNotification
│   ├── platforms/
│   │   ├── youtube.js             # YouTube subtitle interception
│   │   ├── netflix.js             # Netflix subtitle interception
│   │   └── pdf.js                 # PDF stub, but not works:C
│   └── ui/
│       ├── selection-toolbar.js   # Mini toolbar on text selection
│       └── floating-popup.js      # Full translation popup
├── popup-extension/
│   ├── popup.html                 # Extension icon popup
│   ├── popup.css                  # Popup styles
│   └── popup.js                   # Toggle, saved phrases, settings
└── utils/
    ├── helpers.js                 # escapeHtml, showNotification, detectPageType
    ├── settings.js                # Load/persist active state via chrome.storage
    └── translation.js             # Send translate message → render result
```

## How It Works

### General Web Pages 
1. User highlights any text on a page
2. A **mini selection toolbar** appears above the selection with a chiguiro mascot and "Traducir" button
3. Clicking "Traducir" opens the **full floating popup** with translation, Guardar, and Escuchar buttons
4. The power button in the toolbar disables the extension instantly

### YouTube & Netflix
1. Extension intercepts native subtitles and renders them in a custom container
2. Each word is individually clickable — the **full floating popup** opens directly (no toolbar step)
3. Video auto-pauses when the user hovers over the subtitle container
4. On SPA navigation (changing episodes/videos), the module cleans up and re-initializes automatically

### Floating Popup
- Shows **ORIGINAL** text and **TRADUCCIÓN** result
- **Guardar** → sends phrase to `POST /phrases/` on core-service
- **Escuchar** → reads text aloud via Web Speech API
- Closes only via the **×** button or **Escape** key — not on outside click

## UI Components

### Selection Toolbar
Appears above selected text on general web pages. Compact dark pill with:
-  **Traducir** — opens floating popup
- **⏻** — disables extension (persisted to `chrome.storage`)

### Floating Popup
Full translation card injected into the page at the cursor position:
- Header: chiguiro logo + "Parla" title + close button
- Body: original text box → divider arrow → translation result
- Actions: Guardar (primary) + Escuchar (secondary)
- Viewport-aware: flips position if it would overflow screen edges
- Works in fullscreen (YouTube/Netflix) by appending to `document.fullscreenElement`

### Extension Popup
Opens when clicking the Parla icon in the Chrome toolbar:
- Toggle to enable/disable the extension
- **Mis frases** tab — lists all saved phrases with search and delete
- **Ajustes** tab — auto-pause video, show pronunciation toggles
- Footer with chiguiro mascot and version number

## Content Script Load Order

Scripts are injected in this order to respect dependencies:

```
config.js → helpers.js → settings.js → translation.js →
actions.js → selection-toolbar.js → floating-popup.js →
youtube.js → netflix.js → pdf.js → content.js
```

## Platform Modules

### YouTube (`youtube.js`)
- Hides native `.ytp-caption-window-container` via injected CSS
- Creates `#parla-youtube-subtitles` container fixed at bottom of screen
- `MutationObserver` on `#movie_player` detects subtitle changes
- Re-initializes on SPA navigation via `watchURLChanges()` in `content.js`
- Uses recursive `setTimeout` (not `setInterval`) to find video element — avoids zombie intervals on navigation

### Netflix (`netflix.js`)
- Disables pointer events on `.player-timedtext` so our container is interactive
- Creates `#parla-netflix-subtitles` container with blur backdrop
- Extracts text preserving line breaks from nested Netflix span structure
- Same SPA-aware re-init pattern as YouTube

## API Communication

All network requests go through the **service worker** (`background/service-worker.js`) via `chrome.runtime.sendMessage` — content scripts never call `fetch` directly.

| Action        | Message                              | Endpoint              |
|---------------|--------------------------------------|-----------------------|
| `translate`   | `{ action: 'translate', text }`      | `POST /translate`     |
| `savePhrase`  | `{ action: 'savePhrase', ... }`      | `POST /phrases/`      |

> **Note:** For `prototype_1`, `user_id` is hardcoded to `1`. Authentication is not yet implemented in the extension.

## Permissions

| Permission    | Reason                                              |
|---------------|-----------------------------------------------------|
| `storage`     | Persist extension active state                      |
| `activeTab`   | Access current tab to send toggle messages          |
| `scripting`   | Inject content scripts programmatically if needed   |
| `tabs`        | Broadcast toggle state to all open tabs             |

## Brand Colors

```css
--color-parla-blue:  #2D83A6;   /* Primary blue */
--color-parla-dark:  #254159;   /* Dark navy */
--color-parla-red:   #BF0436;   /* Error / destructive */
--color-parla-light: #A9CBD9;   /* Accent / muted */
--color-parla-mist:  #E6F0F4;   /* Background */
```

## Running Locally

### 1. Open Chrome extensions page

```
chrome://extensions
```

### 2. Enable Developer Mode (top right toggle)

### 3. Click "Load unpacked" and select the `browser-extension/` folder

### 4. Start the core-service backend

```bash
cd core-service
docker compose up -d
uv sync
bash scripts/migrate.sh
uvicorn app.main:app --reload
```

The extension connects to `http://localhost:3000` by default (edge reverse proxy). To change the backend URL, edit `config/config.js`.

## Reloading After Changes

After editing any extension file, go to `chrome://extensions` and click the **reload** button on the Parla card, then refresh the tab you are testing on.

## Known Limitations

- `user_id` is hardcoded to `1` — auth integration pending
- PDF module is a stub — text selection works via global `mouseup` handler
- Translation requires the stack running (reverse proxy + gateway + core-service) — no cloud fallback in extension
- Netflix subtitle selector (`.player-timedtext-text-container`) may break on Netflix DOM updates
