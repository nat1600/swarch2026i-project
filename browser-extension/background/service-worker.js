/**
 * service-worker.js — Parla Extension Background
 *
 * Runs in the background, separate from any web page.
 * Handles:
 *   - Auth0 PKCE authentication (login, logout, silent SSO)
 *   - HTTP requests to the API Gateway with Bearer token
 *   - Message relay from content scripts
 */

importScripts('./auth.js');

const BASE_URL = 'http://localhost:8080';

// ===========================
// API HELPER
// ===========================

async function callApi(endpoint, method = 'GET', body = null) {
  const token = await getAccessToken();

  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
  };

  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(BASE_URL + endpoint, options);

  if (response.status === 401) {
    await clearTokens();
    throw { message: 'No autenticado', code: 401 };
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw error;
  }

  return await response.json();
}

// ===========================
// MESSAGE LISTENER
// ===========================

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

  // ── Auth: login ──
  if (request.action === 'login') {
    login()
      .then(() => getAuthState())
      .then(state => sendResponse({ success: true, ...state }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  // ── Auth: logout ──
  if (request.action === 'logout') {
    logout()
      .then(() => sendResponse({ success: true, isLoggedIn: false }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  // ── Auth: state ──
  if (request.action === 'getAuthState') {
    getAuthState()
      .then(state => sendResponse({ success: true, ...state }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  // ── Toggle extension on/off ──
  if (request.action === 'toggleExtension') {
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        if (tab.url && (tab.url.startsWith('http://') || tab.url.startsWith('https://'))) {
          chrome.tabs.sendMessage(tab.id, {
            action: 'toggleExtension',
            active: request.active
          }).catch(() => {});
        }
      });
    });
    sendResponse({ success: true });
    return true;
  }

  // ── Translate ──
  if (request.action === 'translate') {
    callApi('/api/core/translate/', 'POST', {
      text:        request.text,
      source_lang: request.source_lang,
      target_lang: request.target_lang
    })
      .then(data  => {
        console.log('Translation data:', data);
        sendResponse({ success: true, translation: data.translated_text });
      })
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  // ── Save phrase ──
  if (request.action === 'savePhrase') {
    callApi('/api/core/phrases/', 'POST', request.phrase)
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