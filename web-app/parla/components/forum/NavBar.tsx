"use client";

import Link from "next/link";
import { useUser } from "@auth0/nextjs-auth0";
import { SearchBar } from "@/components/forum/SearchBar";
import { Home, User, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function NavBar() {
  const { user, isLoading } = useUser();

  return (
    <header className="sticky top-0 z-50 w-full border-b-4 border-parla-dark bg-white">
      <div className="mx-auto flex h-20 max-w-5xl items-center gap-4 px-6">
        {/* Logo */}
        <Link
          href="/forum"
          className="flex items-center gap-3 shrink-0 hover:scale-105 transition-transform bg-parla-red px-4 py-2 rounded-2xl"
        >
          <span className="font-brand text-3xl text-parla-mist tracking-tight hidden sm:block">
            Foro
          </span>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-2 ml-4">
          <Link
            href="/home"
            className="inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-black text-parla-dark hover:text-white hover:bg-parla-blue transition-colors"
          >
            <Home className="h-5 w-5" strokeWidth={2.5} />
            Inicio
          </Link>
          <Link
            href="/forum/my-posts"
            className="inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-black text-parla-dark hover:text-white hover:bg-parla-red transition-colors"
          >
            <MessageSquare className="h-5 w-5" strokeWidth={2.5} />
            Mis Hilos
          </Link>
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Search */}
        <div className="hidden sm:block w-full max-w-xs">
          <SearchBar />
        </div>

        {/* User indicator */}
        {!isLoading && user && (
          <div className="flex items-center gap-2 shrink-0 bg-parla-mist border-4 border-parla-light rounded-2xl px-3 py-2">
            <User className="h-5 w-5 text-parla-blue" strokeWidth={2.5} />
            <span className="text-xs font-bold text-parla-dark truncate max-w-32">
              {user.name || user.email || user.sub}
            </span>
          </div>
        )}
        
        <Link href="/api/auth/logout">
          <Button
            variant="ghost"
            size="icon"
            className="text-parla-dark/50 hover:text-parla-red hover:bg-parla-red/10 rounded-xl cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </Link>
      </div>
    </header>
  );
}
