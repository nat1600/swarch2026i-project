"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ScrollReveal } from "@/components/core/ScrollReveal";
import { Search, Brain, Flame, BatteryWarning } from "lucide-react";
import Flashcard from "@/components/vocabulary/VocabFlashCard";
import { useUser } from "@auth0/nextjs-auth0";
import HomeNavBar from "@/components/core/HomeNavBar";
import { getInitials } from "../home/page";

// --- DATOS FALSOS PARA EL DISEÑO ---
// Luego los reemplazaremos con tu llamada a PostgreSQL / Apollo
const MOCK_WORDS = [
  {
    id: 1,
    word: "Developer",
    translation: "Desarrollador",
    strength: 5,
    type: "Noun",
  },
  {
    id: 2,
    word: "To debug",
    translation: "Depurar",
    strength: 2,
    type: "Verb",
  },
  {
    id: 3,
    word: "Awesome",
    translation: "Increíble",
    strength: 4,
    type: "Adjective",
  },
  {
    id: 4,
    word: "Database",
    translation: "Base de datos",
    strength: 5,
    type: "Noun",
  },
  {
    id: 5,
    word: "To deploy",
    translation: "Desplegar",
    strength: 1,
    type: "Verb",
  },
  { id: 6, word: "Thread", translation: "Hilo", strength: 3, type: "Noun" },
];

const FILTERS = ["Todos", "Débiles", "Verbos", "Sustantivos", "Adjetivos"];

// --- PÁGINA PRINCIPAL ---
export default function VocabularioPage() {
    const router = useRouter();
  const { user, isLoading } = useUser();
  const [activeFilter, setActiveFilter] = useState("Todos");
  const [searchQuery, setSearchQuery] = useState("");

  if (!user) {
    router.push("/login");
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-parla-dark text-lg font-bold">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="font-app min-h-screen w-full bg-polka overflow-x-hidden selection:bg-parla-blue selection:text-white pb-24">
      <HomeNavBar initials={getInitials(user?.given_name || "")} userPicture={user?.picture || ""} />

      <div className="max-w-5xl mx-auto px-6 mt-10 space-y-10">
        {/* HEADER: Título y Botón Principal */}
        <ScrollReveal className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h1 className="font-brand text-[clamp(2.5rem,6vw,3.5rem)] text-parla-dark leading-tight flex items-center gap-3">
              <span>🧳</span> Mi Bóveda
            </h1>
            <p className="text-parla-blue font-extrabold text-lg">
              Tienes 150 palabras en tu inventario.
            </p>
          </div>

          <button className="w-full md:w-auto bg-[#F5A623] text-white font-black text-xl py-4 px-8 rounded-2xl border-b-8 border-[#D08B1B] hover:bg-[#ffb53a] active:border-b-0 active:translate-y-2 transition-all flex items-center justify-center gap-3 shadow-[0_4px_0_0_rgba(0,0,0,0.1)]">
            <Brain className="h-6 w-6" strokeWidth={3} />
            Entrenar Cerebro
          </button>
        </ScrollReveal>

        {/* ESTADÍSTICAS RÁPIDAS */}
        <ScrollReveal
          animation="animate-slide-in-bottom"
          delay="100ms"
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <div className="bg-white border-4 border-parla-dark rounded-3xl p-5 shadow-[0_4px_0_0_var(--color-parla-dark)] flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-parla-mist border-4 border-parla-light flex items-center justify-center text-2xl">
              📝
            </div>
            <div>
              <p className="text-parla-light font-black text-sm uppercase">
                Dominadas
              </p>
              <p className="text-2xl font-brand text-parla-dark">42</p>
            </div>
          </div>
          <div className="bg-white border-4 border-parla-dark rounded-3xl p-5 shadow-[0_4px_0_0_var(--color-parla-dark)] flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#FFF4F0] border-4 border-[#F5A623] flex items-center justify-center">
              <BatteryWarning
                className="text-[#F5A623] h-7 w-7"
                strokeWidth={2.5}
              />
            </div>
            <div>
              <p className="text-parla-light font-black text-sm uppercase">
                Por Repasar
              </p>
              <p className="text-2xl font-brand text-parla-dark">12</p>
            </div>
          </div>
          <div className="bg-parla-dark border-4 border-[#1a2f40] rounded-3xl p-5 shadow-[0_4px_0_0_#1a2f40] flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-parla-red border-4 border-[#8C0327] flex items-center justify-center">
              <Flame className="text-white h-7 w-7" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-parla-mist font-black text-sm uppercase">
                Racha de Repaso
              </p>
              <p className="text-2xl font-brand text-white">5 días</p>
            </div>
          </div>
        </ScrollReveal>

        {/* CONTROLES: Búsqueda y Filtros */}
        <ScrollReveal
          animation="animate-fade-in"
          delay="200ms"
          className="space-y-4"
        >
          <div className="relative w-full">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-parla-blue h-6 w-6"
              strokeWidth={3}
            />
            <input
              type="text"
              placeholder="Buscar en tu inventario..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-14 pl-14 pr-4 rounded-2xl border-4 border-parla-light bg-white text-parla-dark font-bold text-lg placeholder:text-parla-light focus:outline-none focus:border-parla-blue transition-colors"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {FILTERS.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`shrink-0 px-5 py-2 rounded-xl border-2 font-black text-sm transition-all ${
                  activeFilter === filter
                    ? "bg-parla-blue border-parla-dark text-white shadow-[0_3px_0_0_var(--color-parla-dark)] translate-y-0.5"
                    : "bg-white border-parla-light text-parla-blue hover:border-parla-blue hover:bg-parla-mist"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </ScrollReveal>

        {/* GRID DE FLASHCARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pt-4">
          {MOCK_WORDS.map((item, index) => (
            <ScrollReveal
              key={item.id}
              animation="animate-slide-in-bottom"
              delay={`${index * 100}ms`}
            >
              <Flashcard item={item} />
            </ScrollReveal>
          ))}
        </div>
      </div>
    </div>
  );
}
