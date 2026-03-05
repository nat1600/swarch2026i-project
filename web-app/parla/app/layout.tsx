import type { Metadata } from "next";
import { Nunito, Boogaloo } from "next/font/google";
import { Auth0Provider } from "@auth0/nextjs-auth0";
import { Toaster } from "sonner";
import { ApolloWrapper } from "@/lib/apollo-wrapper";
import "./globals.css";

/*
 * Fuentes de Parla cargadas via next/font (self-hosted, preload automático,
 * sin @import inline ni peticiones externas en runtime).
 *
 * Las variables CSS --font-nunito y --font-boogaloo se inyectan en <html>
 * y son consumidas por los tokens --font-app y --font-brand de globals.css.
 */
const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
  style: ["normal", "italic"],
});

const boogaloo = Boogaloo({
  variable: "--font-boogaloo",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "Parla — Aprende idiomas",
  description: "Aprende idiomas de forma divertida con Parla.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${nunito.variable} ${boogaloo.variable}`}>
      <body className="antialiased">
        {/*
         * Auth0Provider: expone el contexto de sesión a todos los Client Components.
         * Permite usar useUser(), getSession(), etc. en cualquier parte del árbol.
         *
         * ApolloWrapper: registra el ApolloClient para Client Components.
         * Permite usar useQuery(), useMutation(), useSuspenseQuery(), etc.
         *
         * Toaster: notificaciones globales de Sonner.
         */}
        <Auth0Provider>
          <ApolloWrapper>
            {children}
            <Toaster richColors position="top-center" />
          </ApolloWrapper>
        </Auth0Provider>
      </body>
    </html>
  );
}
