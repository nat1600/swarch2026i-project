"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Phrase, PhraseCreate, PhraseUpdate } from "@/lib/types/phrases";

interface PhraseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: PhraseCreate | PhraseUpdate) => Promise<void>;
  phrase?: Phrase | null;
  userId: number;
}

export default function PhraseModal({ isOpen, onClose, onSave, phrase, userId }: PhraseModalProps) {
  const [originalText, setOriginalText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [pronunciation, setPronunciation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (phrase) {
      setOriginalText(phrase.original_text);
      setTranslatedText(phrase.translated_text);
      setPronunciation(phrase.pronunciation || "");
    } else {
      setOriginalText("");
      setTranslatedText("");
      setPronunciation("");
    }
  }, [phrase, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (phrase) {
        const updateData: PhraseUpdate = {
          original_text: originalText,
          translated_text: translatedText,
          pronunciation: pronunciation || null,
        };
        await onSave(updateData);
      } else {
        const createData: PhraseCreate = {
          user_id: userId,
          source_language_id: 1,
          target_language_id: 2,
          original_text: originalText,
          translated_text: translatedText,
          pronunciation: pronunciation || null,
        };
        await onSave(createData);
      }
      onClose();
    } catch (error) {
      console.error("Error saving phrase:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl border-4 border-parla-dark shadow-[0_8px_0_0_var(--color-parla-dark)] max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-brand text-3xl text-parla-dark">
            {phrase ? "Editar Frase" : "Nueva Frase"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-parla-mist rounded-lg transition-colors"
            aria-label="Cerrar"
          >
            <X className="h-6 w-6 text-parla-dark" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-parla-dark font-bold mb-2">
              Texto Original *
            </label>
            <input
              type="text"
              value={originalText}
              onChange={(e) => setOriginalText(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border-2 border-parla-light focus:border-parla-blue focus:outline-none font-bold"
              placeholder="Ej: Hello, how are you?"
            />
          </div>

          <div>
            <label className="block text-parla-dark font-bold mb-2">
              Traducción *
            </label>
            <input
              type="text"
              value={translatedText}
              onChange={(e) => setTranslatedText(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border-2 border-parla-light focus:border-parla-blue focus:outline-none font-bold"
              placeholder="Ej: Hola, ¿cómo estás?"
            />
          </div>

          <div>
            <label className="block text-parla-dark font-bold mb-2">
              Pronunciación (opcional)
            </label>
            <input
              type="text"
              value={pronunciation}
              onChange={(e) => setPronunciation(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-parla-light focus:border-parla-blue focus:outline-none font-bold"
              placeholder="Ej: /həˈloʊ/"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-6 rounded-xl border-2 border-parla-light text-parla-dark font-black hover:bg-parla-mist transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 px-6 rounded-xl bg-parla-blue text-white font-black border-b-4 border-[#1a5f8f] hover:bg-[#2a7ab8] active:border-b-0 active:translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
