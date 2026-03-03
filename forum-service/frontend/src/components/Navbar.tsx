"use client";

import Link from "next/link";
import { useUser } from "@/context/UserContext";
import { SearchBar } from "@/components/SearchBar";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Home, User, MessageSquare } from "lucide-react";

export function Navbar() {
  const { userId, setUserId } = useUser();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-parla-ice/40 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-xl tracking-tight shrink-0"
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-parla-crimson to-parla-burgundy text-white text-sm font-black">
            P
          </span>
          <span className="bg-linear-to-r from-parla-crimson to-parla-burgundy bg-clip-text text-transparent">
            Parla
          </span>
        </Link>

        {/* Nav links */}
        <nav className="hidden sm:flex items-center gap-1">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-parla-crimson hover:bg-parla-crimson-light transition-colors"
          >
            <Home className="h-4 w-4" />
            Home
          </Link>
          <Link
            href="/my-posts"
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-parla-cerulean hover:bg-parla-cerulean-light transition-colors"
          >
            <MessageSquare className="h-4 w-4" />
            My Posts
          </Link>
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Search */}
        <SearchBar />

        {/* User ID input */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="relative w-40 shrink-0">
              <User className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Your User ID"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="pl-9 h-9 bg-white/70 border-parla-ice focus-visible:ring-parla-cerulean font-mono text-sm"
              />
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Enter your user ID to post and interact</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}
