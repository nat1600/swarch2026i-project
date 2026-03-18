import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";
import { registerApolloClient } from "@apollo/client-integration-nextjs";

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
 */
export const { getClient, query, PreloadQuery } = registerApolloClient(() => {
  return new ApolloClient({
    cache: new InMemoryCache(),
    link: new HttpLink({
      uri: process.env.NEXT_PUBLIC_GRAPHQL_URL ?? "http://api_gateway:8080/api/core/graphql",
      // El fetch nativo de Node.js / Next.js se usa por defecto en el servidor.
      fetchOptions: { cache: "no-store" },
    }),
  });
});

