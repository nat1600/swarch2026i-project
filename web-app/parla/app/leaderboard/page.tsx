"use client";

import Link from "next/link";
import { ArrowLeft, Medal, Crown, Star } from "lucide-react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { getDisplayName, getInitials } from "@/lib/user-utils";

interface LeaderboardUser {
    id: number;
    name: string;
    xp: number;
    streak: number;
    avatar: string | null;
    isMe?: boolean;
}

const MOCK_LEADERBOARD: LeaderboardUser[] = [
    { id: 2, name: "Sofia Lopez", xp: 2100, streak: 8, avatar: "https://i.pravatar.cc/150?u=sofia" },
    { id: 3, name: "Carlos Ruiz", xp: 1950, streak: 15, avatar: "https://i.pravatar.cc/150?u=carlos" },
    { id: 4, name: "Ana Maria", xp: 1800, streak: 5, avatar: "https://i.pravatar.cc/150?u=ana" },
    { id: 5, name: "Juan Perez", xp: 1650, streak: 3, avatar: "https://i.pravatar.cc/150?u=juan" },
    { id: 6, name: "Elena Gomez", xp: 1500, streak: 10, avatar: "https://i.pravatar.cc/150?u=elena" },
    { id: 7, name: "Diego Torres", xp: 1400, streak: 2, avatar: "https://i.pravatar.cc/150?u=diego" },
];

export default function LeaderboardPage() {
    const { user, isLoading } = useUser();

    if (isLoading) {
        return (
            <div className="min-h-screen bg-polka flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-parla-blue border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const currentUserData: LeaderboardUser = {
        id: 1,
        name: getDisplayName(user),
        xp: 2450,
        streak: 12,
        isMe: true,
        avatar: user?.picture || null,
    };

    const allData = [currentUserData, ...MOCK_LEADERBOARD].sort((a, b) => b.xp - a.xp);
    const top3 = allData.slice(0, 3);
    const others = allData.slice(3);

    return (
        <div className="font-app min-h-screen bg-polka p-6 md:p-12">
            <div className="max-w-4xl mx-auto space-y-10">
                {/* Header */}
                <header className="relative">
                    <Link
                        href="/home"
                        className="inline-flex items-center gap-2 font-black text-parla-dark hover:text-parla-blue transition-colors mb-8 group"
                    >
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        Volver
                    </Link>

                    <div className="text-center space-y-4">
                        <h1 className="font-brand text-6xl md:text-8xl text-parla-dark tracking-tight bg-white inline-block px-8 py-4 border-8 border-parla-dark rounded-4xl shadow-[0_12px_0_0_#254159] -rotate-1">
                            Clasificación
                        </h1>
                        <p className="text-xl md:text-2xl font-black text-parla-blue max-w-2xl mx-auto">
                            ¡Compite con otros usuarios y llega a la cima!
                        </p>
                    </div>
                </header>

                {/* Podium (Top 3) */}
                <div className="flex flex-col md:flex-row items-end justify-center gap-4 pt-12">
                    {/* Silver - Rank 2 */}
                    <div className="order-2 md:order-1 flex flex-col items-center gap-3 w-full md:w-48 animate-in slide-in-from-bottom duration-500 delay-100">
                        <div className="relative group">
                            <div className="w-24 h-24 rounded-full border-4 border-slate-300 overflow-hidden shadow-[0_4px_0_0_#94a3b8] group-hover:scale-110 transition-transform bg-white flex items-center justify-center font-brand text-2xl text-slate-400">
                                {top3[1].avatar ? <img src={top3[1].avatar} alt="" className="w-full h-full object-cover" /> : getInitials(top3[1].name)}
                            </div>
                            <div className="absolute -bottom-2 -right-2 bg-slate-300 p-1.5 rounded-lg border-2 border-parla-dark shadow-[0_2px_0_0_#94a3b8]">
                                <Medal className="w-4 h-4 text-parla-dark" />
                            </div>
                        </div>
                        <div className="bg-white border-4 border-slate-300 rounded-2xl p-4 w-full text-center shadow-[0_8px_0_0_#94a3b8] h-32 flex flex-col justify-center">
                            <span className="font-brand text-2xl text-slate-500">2º</span>
                            <p className="font-black text-parla-dark truncate">{top3[1].name}</p>
                            <p className="font-bold text-parla-blue">{top3[1].xp} XP</p>
                        </div>
                    </div>

                    {/* Gold - Rank 1 */}
                    <div className="order-1 md:order-2 flex flex-col items-center gap-3 w-full md:w-56 animate-in slide-in-from-bottom duration-500">
                        <div className="relative group">
                            <Crown className="absolute -top-12 left-1/2 -translate-x-1/2 w-12 h-12 text-yellow-400 rotate-12 animate-float" />
                            <div className="w-32 h-32 rounded-full border-8 border-yellow-400 overflow-hidden shadow-[0_8px_0_0_#ca8a04] group-hover:scale-110 transition-transform bg-white flex items-center justify-center font-brand text-4xl text-yellow-500">
                                {top3[0].avatar ? <img src={top3[0].avatar} alt="" className="w-full h-full object-cover" /> : getInitials(top3[0].name)}
                            </div>
                            <div className="absolute -bottom-2 -right-2 bg-yellow-400 p-2 rounded-lg border-2 border-parla-dark shadow-[0_4px_0_0_#ca8a04]">
                                <Medal className="w-6 h-6 text-parla-dark" />
                            </div>
                        </div>
                        <div className="bg-white border-8 border-yellow-400 rounded-3xl p-6 w-full text-center shadow-[0_12px_0_0_#ca8a04] h-40 flex flex-col justify-center scale-110 md:mb-4">
                            <span className="font-brand text-4xl text-yellow-600">1º</span>
                            <p className="font-black text-2xl text-parla-dark truncate">{top3[0].name}</p>
                            <p className="font-black text-xl text-parla-blue">{top3[0].xp} XP</p>
                        </div>
                    </div>

                    {/* Bronze - Rank 3 */}
                    <div className="order-3 flex flex-col items-center gap-3 w-full md:w-48 animate-in slide-in-from-bottom duration-500 delay-200">
                        <div className="relative group">
                            <div className="w-24 h-24 rounded-full border-4 border-amber-600 overflow-hidden shadow-[0_4px_0_0_#92400e] group-hover:scale-110 transition-transform bg-white flex items-center justify-center font-brand text-2xl text-amber-500">
                                {top3[2].avatar ? <img src={top3[2].avatar} alt="" className="w-full h-full object-cover" /> : getInitials(top3[2].name)}
                            </div>
                            <div className="absolute -bottom-2 -right-2 bg-amber-600 p-1.5 rounded-lg border-2 border-parla-dark shadow-[0_2px_0_0_#92400e]">
                                <Medal className="w-4 h-4 text-white" />
                            </div>
                        </div>
                        <div className="bg-white border-4 border-amber-600 rounded-2xl p-4 w-full text-center shadow-[0_8px_0_0_#92400e] h-32 flex flex-col justify-center">
                            <span className="font-brand text-2xl text-amber-700">3º</span>
                            <p className="font-black text-parla-dark truncate">{top3[2].name}</p>
                            <p className="font-bold text-parla-blue">{top3[2].xp} XP</p>
                        </div>
                    </div>
                </div>

                {/* List (Rank 4+) */}
                <div className="space-y-4 pt-12">
                    {others.map((u, idx) => (
                        <div
                            key={u.id}
                            className={`
                flex items-center gap-4 bg-white border-4 border-parla-dark rounded-2xl p-4 shadow-[0_6px_0_0_#254159]
                transition-all hover:-translate-y-1 hover:shadow-[0_8px_0_0_#254159]
                ${u.isMe ? 'ring-4 ring-parla-blue ring-offset-4' : ''}
              `}
                        >
                            <span className="font-brand text-3xl text-parla-dark/40 w-10 text-center">
                                {idx + 4}
                            </span>
                            <div className="w-14 h-14 rounded-full border-2 border-parla-dark overflow-hidden shrink-0 bg-parla-mist flex items-center justify-center font-brand text-parla-dark/40">
                                {u.avatar ? <img src={u.avatar} alt="" className="w-full h-full object-cover" /> : getInitials(u.name)}
                            </div>
                            <div className="flex-1">
                                <p className="font-black text-lg text-parla-dark">
                                    {u.name} {(u as any).isMe && <span className="text-xs bg-parla-blue text-white px-2 py-0.5 rounded-full ml-2">TÚ</span>}
                                </p>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-bold text-parla-dark/60 flex items-center gap-1">
                                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                        {u.streak} días racha
                                    </span>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-black text-2xl text-parla-blue leading-none">{u.xp}</p>
                                <p className="text-[10px] font-black text-parla-dark/40 uppercase tracking-widest">Puntos XP</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
