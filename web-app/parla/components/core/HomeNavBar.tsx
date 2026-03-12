"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Trophy, MessageSquare, BookOpen, Book, LogOut, Gamepad2, Medal } from "lucide-react";

interface HomeNavBarProps {
  userPicture: string;
  initials: string;
}

export default function HomeNavBar({
  userPicture,
  initials,
}: HomeNavBarProps) {
  return (
    <nav className="bg-white border-b-4 border-parla-dark px-4 py-3 sticky top-0 z-50 animate-fade-in-down">
      <div className="max-w-5xl mx-auto flex justify-between items-center">
        {/* Logo */}
        <Link href="/home" className="flex items-center gap-2 group">
          <div className="w-11 h-11 bg-parla-blue rounded-full flex items-center justify-center border-4 border-parla-dark shadow-[0_4px_0_0_#254159] group-hover:shadow-[0_2px_0_0_#254159] group-hover:translate-y-0.5 transition-all">
            <span className="font-brand text-xl text-white leading-none">
              P
            </span>
          </div>
          <span className="font-brand text-2xl text-parla-dark tracking-tight">
            Parla
          </span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* XP pill */}
          <Link
            href="/stats"
            className="hidden sm:flex items-center gap-1.5 bg-parla-mist px-3.5 py-1.5 rounded-full border-2 border-parla-blue/30 font-extrabold text-sm text-parla-blue hover:bg-parla-blue/10 transition-colors"
          >
            <Trophy className="w-4 h-4 text-yellow-500" />
            <span>120 XP</span>
          </Link>

          {/* Leaderboard link */}
          <Link
            href="/leaderboard"
            className="hidden lg:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border-2 border-yellow-500/30 font-extrabold text-sm text-yellow-600 hover:bg-yellow-500/10 transition-colors"
          >
            <Medal className="w-4 h-4" />
            <span>Clasificación</span>
          </Link>

          {/* Games link */}
          <Link
            href="/games"
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border-2 border-parla-blue/30 font-extrabold text-sm text-parla-blue hover:bg-parla-blue/10 transition-colors"
          >
            <Gamepad2 className="w-4 h-4" />
            <span>Juegos</span>
          </Link>

          {/* Forum link pill */}
          <Link
            href="/forum"
            className="hidden md:flex items-center gap-1.5  px-3.5 py-1.5 rounded-full border-2 border-parla-red/30 font-extrabold text-sm text-parla-red hover:bg-parla-red/20 transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Foro</span>
          </Link>

          <Link
            href="/vocabulary"
            className="inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-black text-parla-dark hover:text-white hover:bg-[#F5A623] transition-colors border-2 border-[#F5A623]/30 hover:border-[#F5A623]"
          >
            <BookOpen className="h-5 w-5" strokeWidth={2.5} />
            Mi Bóveda
          </Link>

          <Link
            href="/dictionary"
            className="inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-black text-parla-dark hover:text-white hover:bg-parla-blue transition-colors border-2 border-parla-blue/30 hover:border-parla-blue"
          >
            <Book className="h-5 w-5" strokeWidth={2.5} />
            Diccionario
          </Link>

          {/* Avatar */}
          <Avatar className="w-9 h-9 border-2 border-parla-dark shadow-[0_2px_0_0_#254159]">
            <AvatarImage src={userPicture} />
            <AvatarFallback className="font-extrabold text-parla-dark bg-parla-mist text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>

          {/* Logout */}
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
      </div>
    </nav>
  );
}
