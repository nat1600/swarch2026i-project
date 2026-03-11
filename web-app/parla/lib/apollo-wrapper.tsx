"use client";

import {
  ApolloClient,
  ApolloNextAppProvider,
  InMemoryCache,
} from "@apollo/experimental-nextjs-app-support";
import { HttpLink } from "@apollo/client";

/**
 * Fábrica del cliente Apollo para Client Components.
 *
 * Usa `ApolloClient` e `InMemoryCache` de `@apollo/experimental-nextjs-app-support`
 * (no de `@apollo/client` directamente) para garantizar compatibilidad con SSR
 * y streaming en Next.js App Router.
 *
 * TODO: Cuando el backend esté listo, inyectar el access token de Auth0
 * usando un `authLink`. Ejemplo:
 *
 *   import { setContext } from "@apollo/client/link/context";
 *   const authLink = setContext(async (_, { headers }) => {
 *     const res = await fetch("/api/auth/profile");
 *     const session = await res.json();
 *     return {
 *       headers: {
 *         ...headers,
 *         authorization: session?.accessToken ? `Bearer ${session.accessToken}` : "",
 *       },
 *     };
 *   });
 *   link: authLink.concat(httpLink)
 */
function makeClient() {
  const httpLink = new HttpLink({
    uri: process.env.NEXT_PUBLIC_GRAPHQL_URL ?? "http://localhost:4000/graphql",
  });

  return new ApolloClient({
    cache: new InMemoryCache(),
    link: httpLink,
  });
}

/**
 * Provider que envuelve la aplicación para que los Client Components
 * puedan usar `useQuery`, `useMutation`, `useSuspenseQuery`, etc.
 *
 * Se añade en app/layout.tsx, dentro de Auth0Provider.
 */
export function ApolloWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ApolloNextAppProvider makeClient={makeClient}>
      {children}
    </ApolloNextAppProvider>
  );
}
