"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ScrollReveal } from "@/components/core/ScrollReveal";
import { Search, Brain, Flame, BatteryWarning, Plus } from "lucide-react";
import PhraseCard from "@/components/vocabulary/PhraseCard";
import PhraseModal from "@/components/vocabulary/PhraseModal";
import { useUser } from "@auth0/nextjs-auth0/client";
import HomeNavBar from "@/components/core/HomeNavBar";
import { getInitials } from "@/lib/user-utils";
import { Phrase, PhraseCreate, PhraseUpdate } from "@/lib/types/phrases";
import { phrasesService } from "@/lib/services/phrasesService";
import { toast } from "sonner";

const FILTERS = ["Todos", "Recientes", "Necesitan Repaso", "Dominadas"];

export default function VocabularioPage() {
  const router = useRouter();
  const { user, isLoading } = useUser();
  const [activeFilter, setActiveFilter] = useState("Todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [isLoadingPhrases, setIsLoadingPhrases] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPhrase, setEditingPhrase] = useState<Phrase | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      fetchPhrases();
    }
  }, [user]);

  const fetchPhrases = async () => {
    try {
      setIsLoadingPhrases(true);
      const data = await phrasesService.getAllPhrases();
      setPhrases(data);
    } catch (error) {
      console.error("Error fetching phrases:", error);
      toast.error("Error al cargar las frases");
    } finally {
      setIsLoadingPhrases(false);
    }
  };

  const handleCreatePhrase = async (data: PhraseCreate | PhraseUpdate) => {
    try {
      await phrasesService.createPhrase(data as PhraseCreate);
      toast.success("Frase creada exitosamente");
      await fetchPhrases();
    } catch (error) {
      console.error("Error creating phrase:", error);
      toast.error("Error al crear la frase");
      throw error;
    }
  };

  const handleUpdatePhrase = async (data: PhraseCreate | PhraseUpdate) => {
    if (!editingPhrase) return;
    try {
      await phrasesService.updatePhrase(editingPhrase.id, data as PhraseUpdate);
      toast.success("Frase actualizada exitosamente");
      await fetchPhrases();
    } catch (error) {
      console.error("Error updating phrase:", error);
      toast.error("Error al actualizar la frase");
      throw error;
    }
  };

  const handleDeletePhrase = async (phraseId: number) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta frase?")) return;
    try {
      await phrasesService.deletePhrase(phraseId);
      toast.success("Frase eliminada exitosamente");
      await fetchPhrases();
    } catch (error) {
      console.error("Error deleting phrase:", error);
      toast.error("Error al eliminar la frase");
    }
  };

  const handleEditPhrase = (phrase: Phrase) => {
    setEditingPhrase(phrase);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPhrase(null);
  };

  const filteredPhrases = useMemo(() => {
    let filtered = phrases.filter((phrase) =>
      phrase.original_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      phrase.translated_text.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (activeFilter === "Recientes") {
      filtered = filtered.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ).slice(0, 20);
    } else if (activeFilter === "Necesitan Repaso") {
      filtered = filtered.filter((p) => {
        if (!p.last_reviewed_date) return true;
        const daysSince = Math.floor(
          (Date.now() - new Date(p.last_reviewed_date).getTime()) / (1000 * 60 * 60 * 24)
        );
        return daysSince > 7;
      });
    } else if (activeFilter === "Dominadas") {
      filtered = filtered.filter((p) => {
        if (!p.last_reviewed_date) return false;
        const daysSince = Math.floor(
          (Date.now() - new Date(p.last_reviewed_date).getTime()) / (1000 * 60 * 60 * 24)
        );
        return daysSince <= 7;
      });
    }

    return filtered;
  }, [phrases, searchQuery, activeFilter]);

  const stats = useMemo(() => {
    const mastered = phrases.filter((p) => {
      if (!p.last_reviewed_date) return false;
      const daysSince = Math.floor(
        (Date.now() - new Date(p.last_reviewed_date).getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysSince <= 7;
    }).length;

    const needReview = phrases.filter((p) => {
      if (!p.last_reviewed_date) return true;
      const daysSince = Math.floor(
        (Date.now() - new Date(p.last_reviewed_date).getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysSince > 7;
    }).length;

    return { mastered, needReview, total: phrases.length };
  }, [phrases]);

  if (isLoading || !user) {
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
        {/* HEADER: Título y Botones */}
        <ScrollReveal className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h1 className="font-brand text-[clamp(2.5rem,6vw,3.5rem)] text-parla-dark leading-tight flex items-center gap-3">
              <span>🧳</span> Mi Bóveda
            </h1>
            <p className="text-parla-blue font-extrabold text-lg">
              Tienes {stats.total} {stats.total === 1 ? 'frase' : 'frases'} en tu inventario.
            </p>
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <button
              onClick={() => {
                setEditingPhrase(null);
                setIsModalOpen(true);
              }}
              className="flex-1 md:flex-initial bg-parla-blue text-white font-black text-xl py-4 px-8 rounded-2xl border-b-8 border-[#1a5f8f] hover:bg-[#2a7ab8] active:border-b-0 active:translate-y-2 transition-all flex items-center justify-center gap-3 shadow-[0_4px_0_0_rgba(0,0,0,0.1)]"
            >
              <Plus className="h-6 w-6" strokeWidth={3} />
              Nueva Frase
            </button>
            <button 
              onClick={() => router.push('/vocabulary/practice')}
              className="flex-1 md:flex-initial bg-[#F5A623] text-white font-black text-xl py-4 px-8 rounded-2xl border-b-8 border-[#D08B1B] hover:bg-[#ffb53a] active:border-b-0 active:translate-y-2 transition-all flex items-center justify-center gap-3 shadow-[0_4px_0_0_rgba(0,0,0,0.1)]">
              <Brain className="h-6 w-6" strokeWidth={3} />
              Entrenar
            </button>
          </div>
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
              <p className="text-2xl font-brand text-parla-dark">{stats.mastered}</p>
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
              <p className="text-2xl font-brand text-parla-dark">{stats.needReview}</p>
            </div>
          </div>
          <div className="bg-parla-dark border-4 border-[#1a2f40] rounded-3xl p-5 shadow-[0_4px_0_0_#1a2f40] flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-parla-red border-4 border-[#8C0327] flex items-center justify-center">
              <Flame className="text-white h-7 w-7" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-parla-mist font-black text-sm uppercase">
                Total de Frases
              </p>
              <p className="text-2xl font-brand text-white">{stats.total}</p>
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
                className={`shrink-0 px-5 py-2 rounded-xl border-2 font-black text-sm transition-all ${activeFilter === filter
                    ? "bg-parla-blue border-parla-dark text-white shadow-[0_3px_0_0_var(--color-parla-dark)] translate-y-0.5"
                    : "bg-white border-parla-light text-parla-blue hover:border-parla-blue hover:bg-parla-mist"
                  }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </ScrollReveal>

        {/* GRID DE FRASES */}
        {isLoadingPhrases ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-parla-dark text-lg font-bold">Cargando frases...</p>
          </div>
        ) : filteredPhrases.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-parla-dark text-2xl font-brand mb-4">
              {searchQuery || activeFilter !== "Todos" 
                ? "No se encontraron frases" 
                : "¡Aún no tienes frases!"}
            </p>
            <p className="text-parla-light font-bold mb-6">
              {searchQuery || activeFilter !== "Todos"
                ? "Intenta con otro filtro o búsqueda"
                : "Comienza agregando tu primera frase"}
            </p>
            {!searchQuery && activeFilter === "Todos" && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-parla-blue text-white font-black text-lg py-3 px-6 rounded-2xl border-b-4 border-[#1a5f8f] hover:bg-[#2a7ab8] active:border-b-0 active:translate-y-1 transition-all"
              >
                <Plus className="inline h-5 w-5 mr-2" />
                Agregar Frase
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pt-4">
            {filteredPhrases.map((phrase, index) => (
              <ScrollReveal
                key={phrase.id}
                animation="animate-slide-in-bottom"
                delay={`${Math.min(index * 50, 500)}ms`}
              >
                <PhraseCard
                  phrase={phrase}
                  onEdit={handleEditPhrase}
                  onDelete={handleDeletePhrase}
                />
              </ScrollReveal>
            ))}
          </div>
        )}
      </div>

      <PhraseModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={editingPhrase ? handleUpdatePhrase : handleCreatePhrase}
        phrase={editingPhrase}
        userId={1}
      />
    </div>
  );
}
