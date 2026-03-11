import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";
import { registerApolloClient } from "@apollo/experimental-nextjs-app-support";

/**
 * Cliente Apollo para Server Components (RSC) y Route Handlers.
 *
 * Usa `registerApolloClient` de @apollo/experimental-nextjs-app-support para
 * garantizar que cada request del servidor tenga su propia instancia de caché,
 * evitando contaminación de datos entre usuarios.
 *
 * Uso en un Server Component:
 *   import { getClient } from "@/lib/apollo-client";
 *
 *   const { data } = await getClient().query({
 *     query: MY_QUERY,
 *   });
 *
 * Nota: El header Authorization con el token de Auth0 se añadirá aquí
 * cuando el backend GraphQL esté listo. Ejemplo:
 *   const session = await auth0.getSession();
 *   headers: { Authorization: `Bearer ${session?.tokenSet.accessToken}` }
 */
export const { getClient, query, PreloadQuery } = registerApolloClient(() => {
  return new ApolloClient({
    cache: new InMemoryCache(),
    link: new HttpLink({
      uri: process.env.NEXT_PUBLIC_GRAPHQL_URL ?? "http://localhost:4000/graphql",
      // El fetch nativo de Node.js / Next.js se usa por defecto en el servidor.
      fetchOptions: { cache: "no-store" },
    }),
  });
});
