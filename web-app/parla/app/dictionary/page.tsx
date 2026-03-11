"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@auth0/nextjs-auth0/client";
import { ScrollReveal } from "@/components/core/ScrollReveal";
import { Search, Book, Plus, Loader2 } from "lucide-react";
import HomeNavBar from "@/components/core/HomeNavBar";
import { getInitials } from "../home/page";
import { useDictionary } from "@/contexts/DictionaryContext";
import { DictionaryCard } from "@/components/dictionary/DictionaryCard";
import { DictionaryStatsCards } from "@/components/dictionary/DictionaryStats";
import { DictionaryFiltersPanel } from "@/components/dictionary/DictionaryFilters";
import { WordDialog } from "@/components/dictionary/WordDialog";
import {
  DictionaryWord,
  DictionaryFilters,
  DictionarySort,
  DICTIONARY_SORT_NAMES,
} from "@/lib/types/dictionary";
import {
  searchWords,
  filterWords,
  sortWords,
  getWordStats,
} from "@/lib/services/dictionaryService";

export default function DictionaryPage() {
  const router = useRouter();
  const { user, isLoading: isUserLoading } = useUser();
  const {
    words,
    isLoading,
    isInitialized,
    loadDictionary,
    addWord,
    updateWord,
    deleteWord,
  } = useDictionary();

  const [searchQuery, setSearchQuery] = useState("");
  const [sort, setSort] = useState<DictionarySort>("alphabetical");
  const [filters, setFilters] = useState<DictionaryFilters>({
    language: "all",
    wordType: "all",
    difficulty: "all",
    status: "all",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [speakingWordId, setSpeakingWordId] = useState<string | null>(null);

  // Filter and sort words
  const displayedWords = useMemo(() => {
    let result = [...words];

    // Search
    if (searchQuery) {
      result = searchWords(result, searchQuery);
    }

    // Filter
    result = filterWords(result, filters);

    // Sort
    result = sortWords(result, sort);

    return result;
  }, [words, searchQuery, filters, sort]);

  // Stats
  const stats = useMemo(() => getWordStats(words), [words]);

  // Load dictionary on mount
  useEffect(() => {
    if (!isInitialized) {
      loadDictionary();
    }
  }, [isInitialized, loadDictionary]);

  // Redirect if not logged in
  useEffect(() => {
    if (!user && !isUserLoading) {
      router.push("/login");
    }
  }, [user, isUserLoading, router]);

  // Handlers
  const handleSpeak = (text: string, wordId: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      setSpeakingWordId(wordId);
      window.speechSynthesis.speak(utterance);
      setTimeout(() => setSpeakingWordId(null), 2000);
    }
  };

  const handleToggleFavorite = (id: string) => {
    const word = words.find((w) => w.id === id);
    if (word) {
      updateWord(id, { isFavorite: !word.isFavorite });
    }
  };

  const handleToggleLearned = (id: string) => {
    const word = words.find((w) => w.id === id);
    if (word) {
      updateWord(id, { isLearned: !word.isLearned });
    }
  };

  const handleAddWord = (wordData: {
    word: string;
    translation: string;
    pronunciation?: string;
    audioUrl?: string;
    definition?: string;
    example?: string;
    exampleTranslation?: string;
    language: import("@/lib/types/dictionary").Language;
    targetLanguage: import("@/lib/types/dictionary").Language;
    difficulty: import("@/lib/types/dictionary").Difficulty;
    wordType: import("@/lib/types/dictionary").GrammaticalCategory;
  }) => {
    const newWord: DictionaryWord = {
      id: `word_${Date.now()}`,
      word: wordData.word,
      translation: wordData.translation,
      pronunciation: wordData.pronunciation || "",
      audioUrl: wordData.audioUrl,
      definitions: wordData.definition
        ? [
            {
              id: `d${Date.now()}`,
              meaning: wordData.definition,
              partOfSpeech: wordData.wordType,
            },
          ]
        : [],
      examples: wordData.example
        ? [
            {
              id: `e${Date.now()}`,
              sentence: wordData.example,
              translation: wordData.exampleTranslation || "",
            },
          ]
        : [],
      synonyms: [],
      antonyms: [],
      language: wordData.language,
      targetLanguage: wordData.targetLanguage,
      difficulty: wordData.difficulty,
      wordType: wordData.wordType,
      isFavorite: false,
      isLearned: false,
      reviewCount: 0,
      createdAt: new Date(),
    };

    addWord(newWord);
  };

  const hasActiveFilters =
    filters.language !== "all" ||
    filters.wordType !== "all" ||
    filters.difficulty !== "all" ||
    filters.status !== "all";

  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-polka">
        <Loader2 className="w-12 h-12 text-parla-blue animate-spin" />
      </div>
    );
  }

  return (
    <div className="font-app min-h-screen w-full bg-polka overflow-x-hidden selection:bg-parla-blue selection:text-white pb-24">
      <HomeNavBar
        initials={getInitials(user?.given_name || user?.name || "")}
        userPicture={user?.picture || ""}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-10 space-y-8">
        {/* HEADER */}
        <ScrollReveal className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h1 className="font-brand text-[clamp(2.5rem,6vw,3.5rem)] text-parla-dark leading-tight flex items-center gap-3">
              <Book className="w-12 h-12 text-parla-blue" strokeWidth={2.5} />
              Mi Diccionario
            </h1>
            <p className="text-parla-blue font-extrabold text-lg">
              {stats.total} palabras en tu colección
            </p>
          </div>

          <button
            onClick={() => setIsAddDialogOpen(true)}
            className="w-full md:w-auto bg-parla-red text-white font-black text-xl py-4 px-8 rounded-2xl border-b-8 border-[#8C0327] hover:bg-[#a0032e] active:border-b-0 active:translate-y-2 transition-all flex items-center justify-center gap-3 shadow-[0_4px_0_0_rgba(0,0,0,0.1)]"
          >
            <Plus className="h-6 w-6" strokeWidth={3} />
            Agregar Palabra
          </button>
        </ScrollReveal>

        {/* STATS */}
        <ScrollReveal animation="animate-slide-in-bottom" delay="100ms">
          <DictionaryStatsCards stats={stats} />
        </ScrollReveal>

        {/* SEARCH AND SORT */}
        <ScrollReveal animation="animate-fade-in" delay="200ms">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-parla-blue h-6 w-6"
                strokeWidth={3}
              />
              <input
                type="text"
                placeholder="Buscar palabras, definiciones, sinónimos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-14 pl-14 pr-4 rounded-2xl border-4 border-parla-light bg-white text-parla-dark font-bold text-lg placeholder:text-parla-light focus:outline-none focus:border-parla-blue transition-colors"
              />
            </div>

            {/* Sort */}
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as DictionarySort)}
              className="h-14 px-4 rounded-2xl border-4 border-parla-light bg-white text-parla-dark font-black focus:outline-none focus:border-parla-blue transition-colors cursor-pointer"
            >
              {Object.entries(DICTIONARY_SORT_NAMES).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>

            {/* Toggle Filters */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`h-14 px-6 rounded-2xl font-black border-4 transition-all ${
                showFilters || hasActiveFilters
                  ? "bg-parla-blue border-parla-dark text-white shadow-[0_4px_0_0_var(--color-parla-dark)]"
                  : "bg-white border-parla-light text-parla-blue hover:border-parla-blue hover:bg-parla-mist"
              }`}
            >
              Filtros {hasActiveFilters && "✓"}
            </button>
          </div>
        </ScrollReveal>

        {/* FILTERS PANEL */}
        {showFilters && (
          <ScrollReveal animation="animate-slide-in-bottom" delay="100ms">
            <DictionaryFiltersPanel
              filters={filters}
              onFilterChange={setFilters}
              resultCount={displayedWords.length}
              totalCount={words.length}
            />
          </ScrollReveal>
        )}

        {/* WORDS LIST */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white/80 backdrop-blur rounded-3xl border-4 border-parla-light">
            <Loader2 className="w-12 h-12 text-parla-blue animate-spin mb-4" />
            <h3 className="text-lg font-black text-parla-dark">
              Cargando diccionario...
            </h3>
          </div>
        ) : displayedWords.length === 0 ? (
          <div className="text-center py-20 bg-white/80 backdrop-blur rounded-3xl border-4 border-parla-light">
            <Book className="w-16 h-16 mx-auto text-parla-light mb-4" />
            <h3 className="text-xl font-black text-parla-dark mb-2">
              {searchQuery || hasActiveFilters
                ? "No se encontraron palabras"
                : "Tu diccionario está vacío"}
            </h3>
            <p className="text-parla-blue font-bold mb-6">
              {searchQuery || hasActiveFilters
                ? "Intenta con otros filtros o términos"
                : "Comienza agregando palabras a tu diccionario"}
            </p>
            {!searchQuery && !hasActiveFilters && (
              <button
                onClick={() => setIsAddDialogOpen(true)}
                className="bg-parla-blue text-white font-black text-lg py-3 px-8 rounded-2xl border-b-4 border-[#1f6d8e] hover:bg-[#25719a] active:border-b-0 active:translate-y-1 transition-all flex items-center gap-2 mx-auto"
              >
                <Plus className="w-5 h-5" strokeWidth={3} />
                Agregar palabra
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {displayedWords.map((word, index) => (
              <ScrollReveal
                key={word.id}
                animation="animate-slide-in-bottom"
                delay={`${Math.min(index * 50, 300)}ms`}
              >
                <DictionaryCard
                  word={word}
                  onToggleFavorite={handleToggleFavorite}
                  onToggleLearned={handleToggleLearned}
                  onDelete={deleteWord}
                  onSpeak={handleSpeak}
                  isSpeaking={speakingWordId === word.id}
                />
              </ScrollReveal>
            ))}
          </div>
        )}
      </div>

      {/* ADD WORD DIALOG */}
      <WordDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAddWord={handleAddWord}
      />
    </div>
  );
}
