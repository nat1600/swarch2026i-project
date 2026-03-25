"use client";

import { Book, Star, CheckCircle } from "lucide-react";
import { DictionaryStats } from "@/lib/types/dictionary";

interface DictionaryStatsProps {
  stats: DictionaryStats;
}

export function DictionaryStatsCards({ stats }: DictionaryStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Total Words */}
      <div className="bg-white border-4 border-parla-dark rounded-3xl p-5 shadow-[0_4px_0_0_var(--color-parla-dark)] flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-parla-mist border-4 border-parla-light flex items-center justify-center">
          <Book className="text-parla-blue h-7 w-7" strokeWidth={2.5} />
        </div>
        <div>
          <p className="text-parla-light font-black text-sm uppercase">
            Total
          </p>
          <p className="text-2xl font-brand text-parla-dark">{stats.total}</p>
        </div>
      </div>

      {/* Learned Words */}
      <div className="bg-white border-4 border-parla-dark rounded-3xl p-5 shadow-[0_4px_0_0_var(--color-parla-dark)] flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-green-100 border-4 border-green-300 flex items-center justify-center">
          <CheckCircle className="text-green-600 h-7 w-7" strokeWidth={2.5} />
        </div>
        <div>
          <p className="text-parla-light font-black text-sm uppercase">
            Aprendidas
          </p>
          <p className="text-2xl font-brand text-parla-dark">{stats.learned}</p>
        </div>
      </div>

      {/* Favorites */}
      <div className="bg-parla-dark border-4 border-[#1a2f40] rounded-3xl p-5 shadow-[0_4px_0_0_#1a2f40] flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-yellow-400 border-4 border-yellow-500 flex items-center justify-center">
          <Star className="text-white h-7 w-7 fill-white" strokeWidth={2.5} />
        </div>
        <div>
          <p className="text-parla-mist font-black text-sm uppercase">
            Favoritas
          </p>
          <p className="text-2xl font-brand text-white">{stats.favorites}</p>
        </div>
      </div>
    </div>
  );
}
