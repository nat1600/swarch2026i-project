import { auth0 } from "@/lib/auth0";
import { NextRequest } from "next/server";

/**
 * Route handler de Auth0 para Next.js App Router (v4).
 *
 * Construye un NextRequest para que authClient.handler pueda acceder
 * a nextUrl (requerido internamente). El proxy.ts excluye /api/auth/*
 * de su matcher, así que esta ruta nunca pasa por el proxy.
 *
 * Rutas expuestas:
 *   GET /api/auth/login    → Inicia el flujo de login (redirige a Auth0)
 *   GET /api/auth/logout   → Cierra la sesión y redirige a /
 *   GET /api/auth/callback → Procesa el callback de Auth0 tras el login
 *   GET /api/auth/profile  → Devuelve el perfil del usuario autenticado (JSON)
 *
 * Para login passwordless (email OTP):
 *   /api/auth/login?connection=email&login_hint=user@example.com
 *
 * Para login con Google:
 *   /api/auth/login?connection=google-oauth2
 */
async function handleAuth(request: Request) {
  const nextRequest = new NextRequest(request.url, {
    method: request.method,
    headers: request.headers,
    body: request.body ?? undefined,
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (auth0 as any).authClient.handler(nextRequest);
}

export const GET = handleAuth;
export const POST = handleAuth;
