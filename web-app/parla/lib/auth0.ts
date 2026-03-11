import { Auth0Client } from "@auth0/nextjs-auth0/server";

/**
 * Instancia singleton del cliente Auth0.
 *
 * Variables de entorno requeridas (ver .env):
 *   AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET,
 *   AUTH0_SECRET, APP_BASE_URL
 *
 * Las rutas de Auth0 se configuran con el prefijo /api/auth para seguir
 * la convención de Next.js App Router. El route handler en
 * app/api/auth/[auth0]/route.ts las expone en:
 *   GET /api/auth/login    → inicia login (redirige a Auth0)
 *   GET /api/auth/logout   → cierra sesión
 *   GET /api/auth/callback → callback de Auth0 tras login
 *   GET /api/auth/profile  → perfil del usuario autenticado
 *
 * Configuración requerida en el tenant Auth0:
 *   - Application type: "Regular Web Application"
 *   - Allowed Callback URLs: http://localhost:3000/api/auth/callback
 *   - Allowed Logout URLs:   http://localhost:3000
 *   - Allowed Web Origins:   http://localhost:3000
 *
 * Para habilitar Passwordless (email OTP):
 *   - Connections → Passwordless → Email → Enable
 *   - Habilitar la connection en esta Application
 *
 * Para habilitar Google SSO:
 *   - Connections → Social → Google / Gmail → Enable
 */
export const auth0 = new Auth0Client({
  routes: {
    login: "/api/auth/login",
    logout: "/api/auth/logout",
    callback: "/api/auth/callback",
  },
});
