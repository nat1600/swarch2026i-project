# Parla

App web estilo Duolingo para aprender idiomas. Lecciones cortas, racha diaria, gamificacion y una comunidad que te motiva.

## Tech Stack

| Capa | Tecnologia |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | React 19, TypeScript, Tailwind CSS v4, shadcn/ui |
| Autenticacion | Auth0 (`@auth0/nextjs-auth0` v4) |
| API | Apollo Client 4 + GraphQL |
| Animaciones | `tailwind-animations`, `tw-animate-css` |
| Package manager | pnpm |

## Prerrequisitos

- **Node.js** >= 20
- **pnpm** >= 9 — si no lo tienes: `npm install -g pnpm`

## Instalacion

```bash
# 1. Clonar el repositorio
git clone <url-del-repo>

# 2. Navegar al proyecto
cd swarch2026i-project/web-app/parla

# 3. Instalar dependencias
pnpm install

# 4. Configurar variables de entorno
cp .env.example .env
# Editar .env con las credenciales de tu tenant Auth0
```

## Variables de entorno

Copia `.env.example` a `.env` y completa los valores:

| Variable | Descripcion |
|---|---|
| `AUTH0_SECRET` | Secreto aleatorio de >= 32 caracteres. Generar con `openssl rand -hex 32` |
| `AUTH0_DOMAIN` | Hostname del tenant Auth0 (ej. `dev-xxxxx.us.auth0.com`) |
| `AUTH0_CLIENT_ID` | Client ID de tu aplicacion Auth0 |
| `AUTH0_CLIENT_SECRET` | Client Secret de tu aplicacion Auth0 |
| `APP_BASE_URL` | URL base de la app (default: `http://localhost:3000`) |
| `NEXT_PUBLIC_GRAPHQL_URL` | URL del endpoint GraphQL (default: `http://localhost:4000/graphql`) |

Para obtener las credenciales de Auth0, crea una **Regular Web Application** en [manage.auth0.com](https://manage.auth0.com). Configura las siguientes URLs en la aplicacion:

- **Allowed Callback URLs**: `http://localhost:3000/auth/callback`
- **Allowed Logout URLs**: `http://localhost:3000`

Mas info en la [documentacion de @auth0/nextjs-auth0](https://github.com/auth0/nextjs-auth0).

## Scripts

```bash
pnpm dev        # Servidor de desarrollo (http://localhost:3000)
pnpm build      # Build de produccion
pnpm start      # Servir build de produccion
pnpm lint       # Ejecutar ESLint
```

## Estructura del proyecto

```
parla/
├── proxy.ts                    # Proteccion de rutas (Next.js 16 proxy)
├── app/
│   ├── globals.css             # Tokens de diseno, utilidades CSS, componentes
│   ├── layout.tsx              # Layout raiz (Auth0Provider, Apollo, fuentes)
│   ├── page.tsx                # Landing page publica (/)
│   ├── login/page.tsx          # Inicio de sesion (/login)
│   ├── onboarding/page.tsx     # Seleccion de idioma (/onboarding)
│   ├── home/page.tsx           # Dashboard autenticado (/home)
│   └── api/auth/[auth0]/
│       └── route.ts            # Route handler de Auth0
├── components/
│   ├── scroll-reveal.tsx       # Animaciones de scroll (IntersectionObserver)
│   └── ui/                     # Componentes shadcn/ui
├── lib/
│   ├── auth0.ts                # Singleton de Auth0Client
│   ├── apollo-client.ts        # Apollo para Server Components
│   ├── apollo-wrapper.tsx      # Apollo para Client Components
│   └── utils.ts                # Utilidad cn() (clsx + tailwind-merge)
└── public/                     # Assets estaticos
```

## Notas

- **El backend GraphQL aun no existe.** La app funciona en modo standalone con datos hardcodeados. Las mutaciones a GraphQL fallan silenciosamente sin bloquear la navegacion.
- **Las animaciones de scroll** usan `IntersectionObserver` a traves del componente `<ScrollReveal>`, no CSS `animation-timeline: view()` (soporte limitado en navegadores).
- **Proxy (middleware)**: En Next.js 16 el archivo de middleware se llama `proxy.ts` y exporta una funcion `proxy` (no `middleware.ts`).
