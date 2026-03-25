/**
 * auth.js — Auth0 PKCE Authentication for Chrome Extension
 *
 * OAuth 2.0 Authorization Code Flow with PKCE via chrome.identity.
 * Supports silent SSO: if the user already logged in via the web app,
 * Auth0's session cookie allows token acquisition without interaction.
 *
 * ─── SETUP REQUIRED ───────────────────────────────────────────────
 * 1. In Auth0 Dashboard → Applications → Create Application:
 *      - Type: "Single Page Application"
 *      - Allowed Callback URLs:  paste the value of chrome.identity.getRedirectURL()
 *        (looks like https://<extension-id>.chromiumapp.org/)
 *      - Allowed Logout URLs:    same as above
 *      - Allowed Web Origins:    same as above
 *    Copy the Client ID and paste it below in AUTH0_CLIENT_ID.
 *
 * 2. Make sure the SPA app has the same API audience as the web app
 *    (APIs → the same API with identifier https://parla.com).
 * ──────────────────────────────────────────────────────────────────
 */

// ===========================
// AUTH0 CONFIGURATION
// ===========================

const AUTH0_DOMAIN    = 'dev-pzxsxsfqc2je00n4.us.auth0.com';
// Temporary default: using current project Auth0 client id.
// Recommended: replace with a dedicated SPA application's client id.
const AUTH0_CLIENT_ID = 'Vza1VVcm5JfiLPzkibO4klyqLPTRceNw';
const AUTH0_AUDIENCE  = 'https://parla.com';
const AUTH0_SCOPE     = 'openid profile email';

// Automatic redirect URI based on extension ID
const REDIRECT_URL = chrome.identity.getRedirectURL();

// ===========================
// PKCE HELPERS
// ===========================

function generateRandomString(length) {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

async function sha256(plain) {
  const data = new TextEncoder().encode(plain);
  return crypto.subtle.digest('SHA-256', data);
}

function base64urlEncode(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function generatePKCE() {
  const verifier  = generateRandomString(32);
  const challenge = base64urlEncode(await sha256(verifier));
  return { verifier, challenge };
}

// ===========================
// TOKEN STORAGE (chrome.storage.session — cleared on browser close)
// ===========================

async function storeTokens(tokens) {
  await chrome.storage.session.set({
    access_token: tokens.access_token,
    expires_at:   Date.now() + (tokens.expires_in * 1000),
  });
}

async function getStoredToken() {
  const data = await chrome.storage.session.get(['access_token', 'expires_at']);
  if (!data.access_token) return null;
  if (data.expires_at && Date.now() > data.expires_at - 60_000) return null;
  return data.access_token;
}

async function clearTokens() {
  await chrome.storage.session.remove(['access_token', 'expires_at']);
}

function buildAuthErrorMessage(title, details = {}) {
  const parts = [title];

  if (details.error) parts.push(`error=${details.error}`);
  if (details.errorDescription) parts.push(`description=${details.errorDescription}`);
  if (details.redirectUri) parts.push(`redirect_uri=${details.redirectUri}`);
  if (details.clientId) parts.push(`client_id=${details.clientId}`);

  return parts.join(' | ');
}

// ===========================
// AUTH FLOWS
// ===========================

/**
 * Core PKCE flow via chrome.identity.launchWebAuthFlow.
 * @param {boolean} interactive — true = shows login UI; false = silent SSO
 */
async function authLogin(interactive = true) {
  if (!AUTH0_CLIENT_ID || AUTH0_CLIENT_ID === 'REPLACE_WITH_SPA_CLIENT_ID') {
    throw new Error('Auth0 Client ID not configured. See background/auth.js');
  }

  const { verifier, challenge } = await generatePKCE();

  const params = new URLSearchParams({
    response_type:         'code',
    client_id:             AUTH0_CLIENT_ID,
    redirect_uri:          REDIRECT_URL,
    audience:              AUTH0_AUDIENCE,
    scope:                 AUTH0_SCOPE,
    code_challenge:        challenge,
    code_challenge_method: 'S256',
  });
  if (!interactive) params.set('prompt', 'none');

  const authUrl     = `https://${AUTH0_DOMAIN}/authorize?${params}`;
  let responseUrl;

  try {
    responseUrl = await chrome.identity.launchWebAuthFlow({ url: authUrl, interactive });
  } catch (error) {
    throw new Error(buildAuthErrorMessage(
      'Auth request failed before callback',
      {
        errorDescription: error?.message || 'launchWebAuthFlow failed',
        redirectUri: REDIRECT_URL,
        clientId: AUTH0_CLIENT_ID,
      }
    ));
  }

  if (!responseUrl) {
    throw new Error(buildAuthErrorMessage('Auth callback URL missing', {
      redirectUri: REDIRECT_URL,
      clientId: AUTH0_CLIENT_ID,
    }));
  }

  const redirectParams = new URL(responseUrl).searchParams;
  const code  = redirectParams.get('code');
  const error = redirectParams.get('error');
  const errorDescription = redirectParams.get('error_description');

  if (error) {
    throw new Error(buildAuthErrorMessage('Auth0 /authorize rejected request', {
      error,
      errorDescription,
      redirectUri: REDIRECT_URL,
      clientId: AUTH0_CLIENT_ID,
    }));
  }

  if (!code) {
    throw new Error(buildAuthErrorMessage('No authorization code received', {
      redirectUri: REDIRECT_URL,
      clientId: AUTH0_CLIENT_ID,
    }));
  }

  // Exchange code → tokens
  const tokenRes = await fetch(`https://${AUTH0_DOMAIN}/oauth/token`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type:    'authorization_code',
      client_id:     AUTH0_CLIENT_ID,
      code,
      code_verifier: verifier,
      redirect_uri:  REDIRECT_URL,
    }),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.json().catch(() => ({}));
    throw new Error(buildAuthErrorMessage('Token exchange failed', {
      error: err.error,
      errorDescription: err.error_description || tokenRes.statusText,
      redirectUri: REDIRECT_URL,
      clientId: AUTH0_CLIENT_ID,
    }));
  }

  const tokens = await tokenRes.json();
  await storeTokens(tokens);
  return tokens.access_token;
}

/**
 * Returns a valid access token. Tries cached → silent SSO.
 * Returns null when no session exists (user must login interactively).
 */
async function getAccessToken() {
  const cached = await getStoredToken();
  if (cached) return cached;

  try { return await authLogin(false); }
  catch { return null; }
}

/** Interactive login — opens Auth0 popup. */
async function login() {
  return authLogin(true);
}

/** Logout — clears local tokens only (does NOT end Auth0 session, so the web-app stays logged in). */
async function logout() {
  await clearTokens();
}

/** Returns { isLoggedIn } for UI rendering. */
async function getAuthState() {
  const token = await getStoredToken();
  return { isLoggedIn: !!token };
}
