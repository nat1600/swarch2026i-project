import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { UserProvider } from "@/context/UserContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navbar } from "@/components/Navbar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Parla - Language Learning Forum",
  description:
    "A vibrant community forum for language learners to share, discuss, and grow together.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-gradient-to-br from-[#fce4ec] via-white to-[#e8f4f8]`}
      >
        <UserProvider>
          <TooltipProvider delayDuration={300}>
            <Navbar />
            <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
          </TooltipProvider>
        </UserProvider>
      </body>
    </html>
  );
}
