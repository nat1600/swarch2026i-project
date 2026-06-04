"use client";

import Link from "next/link";
import { GameCard } from "@/components/games/GameCard";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "@/components/games/useTranslation";

export default function GamesPage() {
    const { t } = useTranslation();

    const games = [
        {
            id: "fill-in-the-word",
            title: t.dashboard.games.fillInTheWord.title,
            description: t.dashboard.games.fillInTheWord.desc,
            icon: "PenLine",
            href: "/games/fill-in-the-word",
            color: "blue" as const,
        },
        {
            id: "stopwatch",
            title: t.dashboard.games.stopwatch.title,
            description: t.dashboard.games.stopwatch.desc,
            icon: "Timer",
            href: "/games/stopwatch",
            color: "red" as const,
        },
        {
            id: "matching",
            title: t.dashboard.games.matching.title,
            description: t.dashboard.games.matching.desc,
            icon: "Shuffle",
            href: "/games/matching",
            color: "dark" as const,
        },
    ];

    return (
        <div className="font-app min-h-screen bg-polka p-6 md:p-12">
            <div className="max-w-6xl mx-auto space-y-12">
                {/* Header */}
                <div className="relative">
                    <Link
                        href="/home"
                        className="inline-flex items-center gap-2 font-black text-parla-dark hover:text-parla-blue transition-colors mb-8 group"
                    >
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        {t.common.back}
                    </Link>

                    <div className="text-center space-y-4">
                        <h1 className="font-brand text-6xl md:text-8xl text-parla-dark tracking-tight bg-white inline-block px-8 py-4 border-8 border-parla-dark rounded-4xl shadow-[0_12px_0_0_#254159] -rotate-1">
                            {t.dashboard.title}
                        </h1>
                        <p className="text-xl md:text-2xl font-black text-parla-blue max-w-2xl mx-auto">
                            {t.dashboard.subtitle}
                        </p>
                    </div>
                </div>

                {/* Games Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8">
                    {games.map((game) => (
                        <GameCard key={game.id} {...game} />
                    ))}
                </div>
            </div>
        </div>
    );
}
