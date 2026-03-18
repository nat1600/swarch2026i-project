"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Flame, Zap, BarChart3, Clock, Calendar, TrendingUp, Star } from "lucide-react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { getDisplayName } from "@/lib/user-utils";
import {
  getUserStreak,
  getAllUserGameSessions,
  computeTotalXP,
  computeWeeklyActivity,
  UserStreakDTO,
  UserGameSessionDTO,
} from "@/lib/api/gamificationService";

export default function StatsPage() {
  const { user, isLoading: isUserLoading } = useUser();

  const [streak, setStreak] = useState<UserStreakDTO | null>(null);
  const [sessions, setSessions] = useState<UserGameSessionDTO[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    if (!user?.sub) return;

    const fetchStats = async () => {
      setIsLoadingStats(true);
      const [streakData, sessionData] = await Promise.all([
        getUserStreak(user.sub!),
        getAllUserGameSessions(user.sub!),
      ]);
      setStreak(streakData);
      setSessions(sessionData);
      setIsLoadingStats(false);
    };

    fetchStats();
  }, [user?.sub]);

  const totalXP = computeTotalXP(sessions);
  const weeklyData = computeWeeklyActivity(sessions);
  const maxMinutes = Math.max(...weeklyData.map((d) => d.minutes), 1);

  const currentStreak = streak?.currentStreak ?? 0;
  const longestStreak = streak?.longestStreak ?? 0;

  // Derive weekly stats from session data
  const weeklyTotal = weeklyData.reduce((acc, d) => acc + d.minutes, 0);
  const busiestDay =
    weeklyData.reduce((best, d) => (d.minutes > best.minutes ? d : best), weeklyData[0])?.day ??
    "—";

  if (isUserLoading) {
    return (
      <div className="min-h-screen bg-polka flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-parla-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const name = getDisplayName(user);

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
              Mi Progreso
            </h1>
          </div>
        </header>

        {/* Hero Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">
          {/* Streak Flame Card */}
          <div className="bg-white border-8 border-orange-500 rounded-4xl p-10 flex flex-col items-center justify-center text-center shadow-[0_12px_0_0_#c2410c] group hover:-translate-y-2 transition-transform">
            <div className="relative mb-6">
              <Flame className="w-32 h-32 text-orange-500 animate-float fill-orange-500" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-brand text-6xl text-white pt-4">
                {isLoadingStats ? (
                  <span className="text-4xl opacity-50">...</span>
                ) : (
                  currentStreak
                )}
              </div>
            </div>
            <h2 className="font-brand text-4xl text-parla-dark mb-2">¡Días seguidos!</h2>
            <p className="font-bold text-orange-600/80 text-xl">
              Tu racha más larga:{" "}
              <span className="text-orange-600">
                {isLoadingStats ? "..." : `${longestStreak} días`}
              </span>
            </p>
          </div>

          {/* XP & Level Card */}
          <div className="bg-white border-8 border-parla-blue rounded-4xl p-10 flex flex-col items-center justify-center text-center shadow-[0_12px_0_0_#1f6d8e] group hover:-translate-y-2 transition-transform">
            <div className="relative mb-6">
              <Zap className="w-32 h-32 text-parla-blue animate-float fill-parla-blue" />
              <div className="absolute -top-2 -right-2 bg-yellow-400 p-3 rounded-2xl border-4 border-parla-dark rotate-12 shadow-[0_4px_0_0_#254159]">
                <Star className="w-8 h-8 text-white fill-white" />
              </div>
            </div>
            <h2 className="font-brand text-4xl text-parla-dark mb-2">
              {isLoadingStats ? "..." : `Nivel ${Math.floor(totalXP / 500) + 1}`}
            </h2>
            <p className="font-bold text-parla-blue/80 text-xl mb-4">
              {isLoadingStats ? "..." : `${totalXP} / ${(Math.floor(totalXP / 500) + 1) * 500} XP`}
            </p>
            {/* Progress Bar */}
            <div className="w-full bg-parla-mist h-6 rounded-full border-4 border-parla-dark overflow-hidden p-1">
              <div
                className="h-full bg-parla-blue rounded-full transition-all duration-1000"
                style={{
                  width: isLoadingStats
                    ? "0%"
                    : `${((totalXP % 500) / 500) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Activity Chart */}
        <div className="bg-white border-8 border-parla-dark rounded-4xl p-8 md:p-12 shadow-[0_12px_0_0_#254159]">
          <div className="flex items-center gap-4 mb-10">
            <div className="p-4 bg-parla-mist rounded-2xl border-4 border-parla-dark">
              <BarChart3 className="w-8 h-8 text-parla-blue" />
            </div>
            <div>
              <h3 className="font-brand text-3xl text-parla-dark">Actividad Semanal</h3>
              <p className="font-bold text-parla-dark/50">Minutos de estudio por día</p>
            </div>
          </div>

          <div className="flex items-end justify-between gap-2 md:gap-4 h-64 border-b-4 border-parla-dark pb-2">
            {weeklyData.map((data, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-4 group">
                <div className="relative w-full flex flex-col items-center">
                  <div
                    className="w-full max-w-[50px] bg-parla-blue border-4 border-parla-dark rounded-t-xl transition-all duration-500 group-hover:bg-parla-red shadow-[0_4px_0_0_#1a2f40] group-hover:shadow-[0_4px_0_0_#8c0327]"
                    style={{
                      height: `${(data.minutes / maxMinutes) * 100}%`,
                      minHeight: data.minutes > 0 ? "20px" : "0px",
                    }}
                  >
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-parla-dark text-white font-black text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {data.minutes} min
                    </div>
                  </div>
                </div>
                <span className="font-black text-sm text-parla-dark/60">{data.day}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-parla-blue" />
              <div>
                <p className="font-black text-parla-dark leading-none">
                  {isLoadingStats ? "..." : `${weeklyTotal} min`}
                </p>
                <p className="text-xs font-bold text-parla-dark/40 uppercase">Total semanal</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-6 h-6 text-parla-red" />
              <div>
                <p className="font-black text-parla-dark leading-none">
                  {isLoadingStats ? "..." : busiestDay}
                </p>
                <p className="text-xs font-bold text-parla-dark/40 uppercase">Día más activo</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-green-500" />
              <div>
                <p className="font-black text-parla-dark leading-none">
                  {isLoadingStats ? "..." : `${totalXP} XP`}
                </p>
                <p className="text-xs font-bold text-parla-dark/40 uppercase">XP Total</p>
              </div>
            </div>
          </div>
        </div>

        {/* Motivation Card */}
        <div className="bg-parla-dark border-8 border-parla-dark rounded-4xl p-8 text-center text-white shadow-[0_12px_0_0_#1a2f40]">
          <h3 className="font-brand text-4xl mb-4">¡Vas por buen camino, {name.split(" ")[0]}!</h3>
          <p className="font-bold text-parla-light/80 text-xl max-w-xl mx-auto">
            {currentStreak > 0
              ? `Llevas ${currentStreak} días seguidos. ¡Sigue así para desbloquear el próximo logro!`
              : "¡Comienza a jugar hoy para iniciar tu racha!"}
          </p>
        </div>
      </div>
    </div>
  );
}
