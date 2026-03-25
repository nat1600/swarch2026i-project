"use client";

import { useState } from "react";
import { Search, Loader2, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Language, GrammaticalCategory, Difficulty, LANGUAGE_NAMES, GRAMMATICAL_CATEGORY_NAMES } from "@/lib/types/dictionary";
import { lookupWord, WordLookupResult } from "@/lib/services/translationService";

interface WordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddWord: (wordData: {
    word: string;
    translation: string;
    pronunciation?: string;
    audioUrl?: string;
    definition?: string;
    example?: string;
    exampleTranslation?: string;
    language: Language;
    targetLanguage: Language;
    difficulty: Difficulty;
    wordType: GrammaticalCategory;
  }) => void;
}

export function WordDialog({ open, onOpenChange, onAddWord }: WordDialogProps) {
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [formData, setFormData] = useState({
    word: "",
    translation: "",
    pronunciation: "",
    definition: "",
    example: "",
    exampleTranslation: "",
    language: "en" as Language,
    targetLanguage: "es" as Language,
    difficulty: "medium" as Difficulty,
    wordType: "noun" as GrammaticalCategory,
  });

  const handleLookup = async () => {
    if (!formData.word.trim()) return;

    setIsLookingUp(true);
    try {
      const result: WordLookupResult = await lookupWord(
        formData.word.trim(),
        formData.language,
        formData.targetLanguage
      );

      if (result.error) {
        console.error("Lookup error:", result.error);
        return;
      }

      setFormData((prev) => ({
        ...prev,
        translation: result.translation || prev.translation,
        pronunciation: result.pronunciation || prev.pronunciation,
        definition: result.definitions[0]?.meaning || prev.definition,
        example: result.examples[0]?.sentence || prev.example,
        wordType: result.definitions[0]?.partOfSpeech || prev.wordType,
      }));
    } catch (error) {
      console.error("Lookup failed:", error);
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleSubmit = () => {
    if (!formData.word.trim() || !formData.translation.trim()) return;

    onAddWord(formData);

    // Reset form
    setFormData({
      word: "",
      translation: "",
      pronunciation: "",
      definition: "",
      example: "",
      exampleTranslation: "",
      language: "en",
      targetLanguage: "es",
      difficulty: "medium",
      wordType: "noun",
    });

    onOpenChange(false);
  };

  const handleCancel = () => {
    setFormData({
      word: "",
      translation: "",
      pronunciation: "",
      definition: "",
      example: "",
      exampleTranslation: "",
      language: "en",
      targetLanguage: "es",
      difficulty: "medium",
      wordType: "noun",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white border-4 border-parla-dark rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-brand text-3xl text-parla-dark">
            Agregar Palabra
          </DialogTitle>
          <DialogDescription className="text-parla-blue font-bold">
            Añade una nueva palabra a tu diccionario personal
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Word Input with Lookup */}
          <div>
            <label className="block font-black text-sm text-parla-dark mb-2 uppercase tracking-wider">
              Palabra *
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.word}
                onChange={(e) => setFormData({ ...formData, word: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && handleLookup()}
                placeholder="Hello"
                className="flex-1 h-12 px-4 rounded-2xl border-4 border-parla-light bg-white text-parla-dark font-bold placeholder:text-parla-light focus:outline-none focus:border-parla-blue transition-colors"
              />
              <button
                type="button"
                onClick={handleLookup}
                disabled={isLookingUp || !formData.word.trim()}
                className="h-12 px-6 rounded-2xl bg-parla-blue text-white font-black border-b-4 border-[#1f6d8e] hover:bg-[#2571] active:border-b-0 active:translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLookingUp ? (
                  <Loader2 className="w-5 h-5 animate-spin" strokeWidth={3} />
                ) : (
                  <Search className="w-5 h-5" strokeWidth={3} />
                )}
                Buscar
              </button>
            </div>
            <p className="text-xs text-parla-blue font-bold mt-1">
              Presiona &ldquo;Buscar&rdquo; para auto-completar traducción y definición
            </p>
          </div>

          {/* Language Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-black text-sm text-parla-dark mb-2 uppercase tracking-wider">
                Idioma origen
              </label>
              <select
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value as Language })}
                className="w-full h-12 px-4 rounded-2xl border-4 border-parla-light bg-white text-parla-dark font-bold focus:outline-none focus:border-parla-blue transition-colors cursor-pointer"
              >
                {Object.entries(LANGUAGE_NAMES).map(([code, name]) => (
                  <option key={code} value={code}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-black text-sm text-parla-dark mb-2 uppercase tracking-wider">
                Idioma destino
              </label>
              <select
                value={formData.targetLanguage}
                onChange={(e) => setFormData({ ...formData, targetLanguage: e.target.value as Language })}
                className="w-full h-12 px-4 rounded-2xl border-4 border-parla-light bg-white text-parla-dark font-bold focus:outline-none focus:border-parla-blue transition-colors cursor-pointer"
              >
                {Object.entries(LANGUAGE_NAMES).map(([code, name]) => (
                  <option key={code} value={code}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Translation and Pronunciation */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-black text-sm text-parla-dark mb-2 uppercase tracking-wider">
                Traducción *
              </label>
              <input
                type="text"
                value={formData.translation}
                onChange={(e) => setFormData({ ...formData, translation: e.target.value })}
                placeholder="Hola"
                className="w-full h-12 px-4 rounded-2xl border-4 border-parla-light bg-white text-parla-dark font-bold placeholder:text-parla-light focus:outline-none focus:border-parla-blue transition-colors"
              />
            </div>
            <div>
              <label className="block font-black text-sm text-parla-dark mb-2 uppercase tracking-wider">
                Pronunciación
              </label>
              <input
                type="text"
                value={formData.pronunciation}
                onChange={(e) => setFormData({ ...formData, pronunciation: e.target.value })}
                placeholder="/həˈloʊ/"
                className="w-full h-12 px-4 rounded-2xl border-4 border-parla-light bg-white text-parla-dark font-bold placeholder:text-parla-light focus:outline-none focus:border-parla-blue transition-colors"
              />
            </div>
          </div>

          {/* Word Type and Difficulty */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-black text-sm text-parla-dark mb-2 uppercase tracking-wider">
                Tipo de palabra
              </label>
              <select
                value={formData.wordType}
                onChange={(e) => setFormData({ ...formData, wordType: e.target.value as GrammaticalCategory })}
                className="w-full h-12 px-4 rounded-2xl border-4 border-parla-light bg-white text-parla-dark font-bold focus:outline-none focus:border-parla-blue transition-colors cursor-pointer"
              >
                {Object.entries(GRAMMATICAL_CATEGORY_NAMES).map(([code, name]) => (
                  <option key={code} value={code}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-black text-sm text-parla-dark mb-2 uppercase tracking-wider">
                Dificultad
              </label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as Difficulty })}
                className="w-full h-12 px-4 rounded-2xl border-4 border-parla-light bg-white text-parla-dark font-bold focus:outline-none focus:border-parla-blue transition-colors cursor-pointer"
              >
                <option value="easy">Fácil</option>
                <option value="medium">Medio</option>
                <option value="hard">Difícil</option>
              </select>
            </div>
          </div>

          {/* Definition */}
          <div>
            <label className="block font-black text-sm text-parla-dark mb-2 uppercase tracking-wider">
              Definición
            </label>
            <textarea
              value={formData.definition}
              onChange={(e) => setFormData({ ...formData, definition: e.target.value })}
              placeholder="Significado de la palabra..."
              rows={3}
              className="w-full px-4 py-3 rounded-2xl border-4 border-parla-light bg-white text-parla-dark font-bold placeholder:text-parla-light focus:outline-none focus:border-parla-blue transition-colors resize-none"
            />
          </div>

          {/* Example */}
          <div>
            <label className="block font-black text-sm text-parla-dark mb-2 uppercase tracking-wider">
              Ejemplo
            </label>
            <input
              type="text"
              value={formData.example}
              onChange={(e) => setFormData({ ...formData, example: e.target.value })}
              placeholder="Hello, how are you?"
              className="w-full h-12 px-4 rounded-2xl border-4 border-parla-light bg-white text-parla-dark font-bold placeholder:text-parla-light focus:outline-none focus:border-parla-blue transition-colors mb-2"
            />
            <input
              type="text"
              value={formData.exampleTranslation}
              onChange={(e) => setFormData({ ...formData, exampleTranslation: e.target.value })}
              placeholder="Hola, ¿cómo estás?"
              className="w-full h-12 px-4 rounded-2xl border-4 border-parla-light bg-white text-parla-dark font-bold placeholder:text-parla-light focus:outline-none focus:border-parla-blue transition-colors"
            />
          </div>
        </div>

        <DialogFooter className="flex gap-3">
          <button
            onClick={handleCancel}
            className="flex-1 h-12 px-6 rounded-2xl bg-white text-parla-dark font-black border-4 border-parla-light hover:bg-parla-mist transition-all flex items-center justify-center gap-2"
          >
            <X className="w-5 h-5" strokeWidth={3} />
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!formData.word.trim() || !formData.translation.trim()}
            className="flex-1 h-12 px-6 rounded-2xl bg-parla-blue text-white font-black border-b-4 border-[#1f6d8e] hover:bg-[#25719a] active:border-b-0 active:translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Agregar
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
