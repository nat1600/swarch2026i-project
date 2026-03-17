"use client";

import { useState, useMemo } from "react";
import { BatteryMedium, BatteryFull, BatteryWarning, Pencil, Trash2 } from "lucide-react";
import { Phrase } from "@/lib/types/phrases";

interface PhraseCardProps {
  phrase: Phrase;
  onEdit: (phrase: Phrase) => void;
  onDelete: (phraseId: number) => void;
}

export default function PhraseCard({ phrase, onEdit, onDelete }: PhraseCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const strengthIcon = useMemo(() => {
    if (!phrase.last_reviewed_date) {
      return <BatteryWarning className="text-parla-red h-5 w-5 animate-pulse" />;
    }
    const daysSinceReview = Math.floor(
      (Date.now() - new Date(phrase.last_reviewed_date).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceReview <= 7) return <BatteryFull className="text-green-500 h-5 w-5" />;
    if (daysSinceReview <= 14) return <BatteryMedium className="text-[#F5A623] h-5 w-5" />;
    return <BatteryWarning className="text-parla-red h-5 w-5 animate-pulse" />;
  }, [phrase.last_reviewed_date]);

  return (
    <div className="relative h-48 w-full perspective-1000px group">
      <div
        className={`relative w-full h-full transition-all duration-500 transform-3d ${
          isFlipped ? "transform-[rotateY(180deg)]" : ""
        }`}
      >
        <div
          onClick={() => setIsFlipped(!isFlipped)}
          className="absolute inset-0 backface-hidden bg-white border-4 border-parla-dark rounded-3xl p-5 shadow-[0_6px_0_0_var(--color-parla-dark)] group-hover:-translate-y-1 transition-transform flex flex-col justify-between cursor-pointer"
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-black text-parla-light uppercase tracking-wider bg-parla-mist px-2 py-1 rounded-lg">
              {phrase.source_language.name}
            </span>
            {strengthIcon}
          </div>
          <div className="text-center pb-4">
            <h3 className="font-brand text-3xl text-parla-dark break-words">
              {phrase.original_text}
            </h3>
            <p className="text-parla-blue font-bold text-sm mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
              Toca para voltear ↺
            </p>
          </div>
          <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(phrase);
              }}
              className="p-2 bg-parla-blue text-white rounded-lg hover:bg-parla-dark transition-colors"
              aria-label="Editar frase"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(phrase.id);
              }}
              className="p-2 bg-parla-red text-white rounded-lg hover:bg-red-700 transition-colors"
              aria-label="Eliminar frase"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div
          onClick={() => setIsFlipped(!isFlipped)}
          className="absolute inset-0 backface-hidden transform-[rotateY(180deg)] bg-parla-mist border-4 border-parla-blue rounded-3xl p-5 shadow-[0_6px_0_0_var(--color-parla-blue)] flex flex-col justify-center items-center text-center cursor-pointer"
        >
          <h3 className="font-brand text-3xl text-parla-blue mb-2 break-words">
            {phrase.translated_text}
          </h3>
          {phrase.pronunciation && (
            <p className="font-bold text-parla-dark text-sm mt-2">
              [{phrase.pronunciation}]
            </p>
          )}
          <p className="font-extrabold text-parla-dark text-xs mt-3">
            {phrase.target_language.name}
          </p>
        </div>
      </div>
    </div>
  );
}
