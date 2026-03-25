"use client";

import { Globe, BookOpen, BarChart3, X } from "lucide-react";
import {
  DictionaryFilters,
  Language,
  GrammaticalCategory,
  Difficulty,
  LANGUAGE_NAMES,
  GRAMMATICAL_CATEGORY_NAMES,
} from "@/lib/types/dictionary";

interface DictionaryFiltersProps {
  filters: DictionaryFilters;
  onFilterChange: (filters: DictionaryFilters) => void;
  resultCount: number;
  totalCount: number;
}

export function DictionaryFiltersPanel({
  filters,
  onFilterChange,
  resultCount,
  totalCount,
}: DictionaryFiltersProps) {
  const hasActiveFilters =
    filters.language !== "all" ||
    filters.wordType !== "all" ||
    filters.difficulty !== "all" ||
    filters.status !== "all";

  const clearFilters = () => {
    onFilterChange({
      language: "all",
      wordType: "all",
      difficulty: "all",
      status: "all",
    });
  };

  return (
    <div className="bg-white border-4 border-parla-light rounded-3xl p-5 shadow-[0_4px_0_0_var(--color-parla-light)] flex flex-wrap gap-3 items-center">
      {/* Language Filter */}
      <div className="relative">
        <select
          value={filters.language}
          onChange={(e) =>
            onFilterChange({
              ...filters,
              language: e.target.value as Language | "all",
            })
          }
          className="appearance-none h-12 pl-12 pr-10 rounded-2xl border-4 border-parla-light bg-white text-parla-dark font-black text-sm focus:outline-none focus:border-parla-blue transition-colors cursor-pointer"
        >
          <option value="all">Todos los idiomas</option>
          {Object.entries(LANGUAGE_NAMES).map(([code, name]) => (
            <option key={code} value={code}>
              {name}
            </option>
          ))}
        </select>
        <Globe
          className="absolute left-4 top-1/2 -translate-y-1/2 text-parla-blue h-5 w-5 pointer-events-none"
          strokeWidth={3}
        />
      </div>

      {/* Word Type Filter */}
      <div className="relative">
        <select
          value={filters.wordType}
          onChange={(e) =>
            onFilterChange({
              ...filters,
              wordType: e.target.value as GrammaticalCategory | "all",
            })
          }
          className="appearance-none h-12 pl-12 pr-10 rounded-2xl border-4 border-parla-light bg-white text-parla-dark font-black text-sm focus:outline-none focus:border-parla-blue transition-colors cursor-pointer"
        >
          <option value="all">Todos los tipos</option>
          {Object.entries(GRAMMATICAL_CATEGORY_NAMES).map(([code, name]) => (
            <option key={code} value={code}>
              {name}
            </option>
          ))}
        </select>
        <BookOpen
          className="absolute left-4 top-1/2 -translate-y-1/2 text-teal-500 h-5 w-5 pointer-events-none"
          strokeWidth={3}
        />
      </div>

      {/* Difficulty Filter */}
      <div className="relative">
        <select
          value={filters.difficulty}
          onChange={(e) =>
            onFilterChange({
              ...filters,
              difficulty: e.target.value as Difficulty | "all",
            })
          }
          className="appearance-none h-12 pl-12 pr-10 rounded-2xl border-4 border-parla-light bg-white text-parla-dark font-black text-sm focus:outline-none focus:border-parla-blue transition-colors cursor-pointer"
        >
          <option value="all">Todas</option>
          <option value="easy">🟢 Fácil</option>
          <option value="medium">🟡 Medio</option>
          <option value="hard">🔴 Difícil</option>
        </select>
        <BarChart3
          className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500 h-5 w-5 pointer-events-none"
          strokeWidth={3}
        />
      </div>

      {/* Status Filter */}
      <div className="relative">
        <select
          value={filters.status}
          onChange={(e) =>
            onFilterChange({
              ...filters,
              status: e.target.value as "all" | "learned" | "learning" | "favorites",
            })
          }
          className="appearance-none h-12 pl-4 pr-10 rounded-2xl border-4 border-parla-light bg-white text-parla-dark font-black text-sm focus:outline-none focus:border-parla-blue transition-colors cursor-pointer"
        >
          <option value="all">Todos</option>
          <option value="learned">✅ Aprendidas</option>
          <option value="learning">📚 Aprendiendo</option>
          <option value="favorites">⭐ Favoritas</option>
        </select>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="h-12 px-5 rounded-2xl border-2 border-parla-red bg-white text-parla-red font-black text-sm hover:bg-parla-red hover:text-white transition-all flex items-center gap-2"
        >
          <X className="w-4 h-4" strokeWidth={3} />
          Limpiar
        </button>
      )}

      {/* Result Count */}
      <div className="ml-auto text-sm font-black text-parla-blue">
        {resultCount} de {totalCount} palabras
      </div>
    </div>
  );
}
