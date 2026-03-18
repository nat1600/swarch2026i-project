"use client";

import { ApolloClient, ApolloNextAppProvider, InMemoryCache } from "@apollo/client-integration-nextjs";
import { HttpLink } from "@apollo/client";
import { SetContextLink } from "@apollo/client/link/context";

import { getClientToken } from "@/actions/auth/authActions";

export function ApolloWrapper({ children }: { children: React.ReactNode }) {
  
  const makeClient = () => {
    const httpLink = new HttpLink({
      uri: process.env.NEXT_PUBLIC_GRAPHQL_URL ?? "http://api_gateway:8080/api/core/graphql",
    });

    const authLink = new SetContextLink(async ({ headers }) => {

      const token = await getClientToken();
      
      if (token) {
        return {
          headers: {
            ...headers,
            Authorization: `Bearer ${token}`,
          },
        };
      }
      
      return { headers };
    });

    return new ApolloClient({
      cache: new InMemoryCache(),
      link: authLink.concat(httpLink),
    });
  };

  return (
    <ApolloNextAppProvider makeClient={makeClient}>
      {children}
    </ApolloNextAppProvider>
  );
}