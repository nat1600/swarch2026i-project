/**
 * background.js — Service Worker
 *
 * Runs in the background, separate from any web page.
 * Its main job is to make HTTP requests to the core-service on behalf
 * of the content scripts, since content scripts can't call localhost
 * directly due to CORS restrictions.
 *
 * Listens for two messages:
 *   - 'translate'   → POST /translate
 *   - 'savePhrase'  → POST /phrases/
 */

const BASE_URL = 'http://127.0.0.1:8000';

// ===========================
// API HELPER
// ===========================

/**
 * Makes a JSON request to the core-service.
 * Throws an error if the response is not OK.
 *
 * @param {string} endpoint - e.g. '/translate'
 * @param {string} method   - HTTP method (GET, POST, DELETE...)
 * @param {object} body     - Request body (only for non-GET requests)
 * @returns {Promise<object>} Parsed JSON response
 */
async function callApi(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };

  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(BASE_URL + endpoint, options);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw error;
  }

  return await response.json();
}

// ===========================
// MESSAGE LISTENER
// ===========================

/**
 * Single listener for all messages coming from content scripts.
 * Returns true to indicate the response will be sent asynchronously.
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

  if (request.action === 'toggleExtension') {
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        // Only send to real http/https tabs (not chrome:// etc.)
        if (tab.url && (tab.url.startsWith('http://') || tab.url.startsWith('https://'))) {
          chrome.tabs.sendMessage(tab.id, {
            action: 'toggleExtension',
            active: request.active
          }).catch(() => {}); // ignore tabs where content script isn't loaded
        }
      });
    });
    sendResponse({ success: true });
    return true;
  }

  // translate
  if (request.action === 'translate') {
    callApi('/translate/', 'POST', {
      text:        request.text,
      source_lang: request.source_lang,
      target_lang: request.target_lang
    })
      .then(data  => {
        console.log(' Translation data:', data);
        sendResponse({ success: true, translation: data.translated_text });
      })
      .catch(error => sendResponse({ success: false, error: error.message }));
  
    return true;
  }

// save
  if (request.action === 'savePhrase') {
    callApi('/phrases/', 'POST', request.phrase)
      .then(data  => sendResponse({ success: true,  savedPhrase: data }))
      .catch(error => sendResponse({ success: false, error: error.message || error }));

    return true;
  }

});


chrome.runtime.onConnect.addListener((port) => {
  port.onDisconnect.addListener(() => {});
});


setInterval(() => {
  chrome.runtime.getPlatformInfo(() => {});
}, 20000);