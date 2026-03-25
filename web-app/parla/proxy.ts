import type { NextRequest } from "next/server";
import { auth0 } from "@/lib/auth0";

/**
 * Proxy de protección de rutas (Next.js 16+).
 * En Next.js 16 el archivo se llama "proxy.ts" y la función exportada "proxy".
 * ("middleware.ts" es el nombre deprecado de versiones anteriores.)
 *
 * Rutas PÚBLICAS (no requieren autenticación):
 *   /          → Página principal
 *   /login     → Página de login
 *
 * Rutas EXCLUIDAS del matcher (manejadas por sus propios route handlers):
 *   /api/auth/* → Manejadas por app/api/auth/[auth0]/route.ts
 *
 * Cualquier otra ruta (ej. /onboarding, /home) requiere sesión activa.
 * Si el usuario no está autenticado, Auth0 redirige automáticamente a /api/auth/login.
 */
export async function proxy(request: NextRequest) {
  return await auth0.middleware(request);
}

export const config = {
  /*
   * El proxy se ejecuta en todas las rutas EXCEPTO:
   *   - Archivos estáticos de Next.js (_next/static, _next/image, favicon)
   *   - Imágenes y assets públicos
   *   - /api/auth/* → manejado por el route handler de Auth0 directamente
   */
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
