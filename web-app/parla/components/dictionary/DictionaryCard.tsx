"use client";

import { useState } from "react";
import { Volume2, Star, StarOff, Check, X, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { DictionaryWord, GRAMMATICAL_CATEGORY_NAMES, GRAMMATICAL_CATEGORY_COLORS } from "@/lib/types/dictionary";

interface DictionaryCardProps {
  word: DictionaryWord;
  onToggleFavorite: (id: string) => void;
  onToggleLearned: (id: string) => void;
  onDelete: (id: string) => void;
  onSpeak?: (text: string, lang: string) => void;
  isSpeaking?: boolean;
}

export function DictionaryCard({
  word,
  onToggleFavorite,
  onToggleLearned,
  onDelete,
  onSpeak,
  isSpeaking = false,
}: DictionaryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white border-4 border-parla-dark rounded-3xl shadow-[0_6px_0_0_var(--color-parla-dark)] overflow-hidden transition-all hover:shadow-[0_8px_0_0_var(--color-parla-dark)] hover:-translate-y-1">
      {/* Header - Clickable */}
      <div
        className="p-5 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Word and pronunciation */}
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h3 className="font-brand text-2xl md:text-3xl text-parla-dark">
                {word.word}
              </h3>
              {word.pronunciation && (
                <span className="text-sm text-parla-blue font-bold">
                  {word.pronunciation}
                </span>
              )}
              <span
                className={`text-xs font-black px-3 py-1 rounded-xl border-2 ${GRAMMATICAL_CATEGORY_COLORS[word.wordType]}`}
              >
                {GRAMMATICAL_CATEGORY_NAMES[word.wordType]}
              </span>
            </div>

            {/* Translation */}
            <p className="text-lg md:text-xl text-parla-blue font-extrabold mb-2">
              {word.translation}
            </p>

            {/* First definition preview */}
            {word.definitions[0] && (
              <p className="text-sm text-parla-dark/70 font-semibold line-clamp-1">
                {word.definitions[0].meaning}
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {onSpeak && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSpeak(word.word, word.language);
                }}
                className={`w-10 h-10 rounded-xl border-2 border-parla-light flex items-center justify-center transition-all hover:border-parla-blue hover:bg-parla-mist ${
                  isSpeaking ? "bg-parla-blue text-white" : "bg-white text-parla-blue"
                }`}
              >
                <Volume2 className="w-5 h-5" strokeWidth={2.5} />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(word.id);
              }}
              className="w-10 h-10 rounded-xl border-2 border-parla-light flex items-center justify-center transition-all hover:border-yellow-400 hover:bg-yellow-50"
            >
              {word.isFavorite ? (
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" strokeWidth={2.5} />
              ) : (
                <StarOff className="w-5 h-5 text-parla-light" strokeWidth={2.5} />
              )}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleLearned(word.id);
              }}
              className="w-10 h-10 rounded-xl border-2 border-parla-light flex items-center justify-center transition-all hover:border-green-500 hover:bg-green-50"
            >
              {word.isLearned ? (
                <Check className="w-5 h-5 text-green-500" strokeWidth={3} />
              ) : (
                <X className="w-5 h-5 text-parla-light" strokeWidth={2.5} />
              )}
            </button>
            <div className="w-6 h-6 flex items-center justify-center">
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-parla-blue" strokeWidth={3} />
              ) : (
                <ChevronDown className="w-5 h-5 text-parla-blue" strokeWidth={3} />
              )}
            </div>
          </div>
        </div>

        {/* Tags */}
        {word.tags && word.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {word.tags.map((tag, i) => (
              <span
                key={i}
                className="text-xs font-black px-3 py-1 rounded-full bg-parla-mist text-parla-blue border-2 border-parla-light"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-5 pb-5 border-t-4 border-parla-mist pt-5 space-y-5">
          {/* Definitions */}
          {word.definitions.length > 0 && (
            <div>
              <h4 className="font-black text-sm text-parla-light uppercase mb-3 tracking-wider">
                Definiciones
              </h4>
              <ul className="space-y-3">
                {word.definitions.map((def, i) => (
                  <li key={def.id} className="flex gap-3">
                    <span className="font-brand text-xl text-parla-blue shrink-0">
                      {i + 1}.
                    </span>
                    <div>
                      <p className="text-parla-dark font-bold">{def.meaning}</p>
                      {def.example && (
                        <p className="text-sm text-parla-blue/70 italic mt-1">
                          &ldquo;{def.example}&rdquo;
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Examples */}
          {word.examples.length > 0 && (
            <div>
              <h4 className="font-black text-sm text-parla-light uppercase mb-3 tracking-wider">
                Ejemplos
              </h4>
              <ul className="space-y-3">
                {word.examples.map((ex) => (
                  <li
                    key={ex.id}
                    className="bg-parla-mist border-2 border-parla-light rounded-2xl p-4"
                  >
                    <p className="text-parla-dark font-bold italic">
                      &ldquo;{ex.sentence}&rdquo;
                    </p>
                    {ex.translation && (
                      <p className="text-parla-blue font-extrabold text-sm mt-2">
                        → {ex.translation}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Synonyms & Antonyms */}
          <div className="flex flex-wrap gap-6">
            {word.synonyms && word.synonyms.length > 0 && (
              <div>
                <h4 className="font-black text-sm text-parla-light uppercase mb-2 tracking-wider">
                  Sinónimos
                </h4>
                <div className="flex flex-wrap gap-2">
                  {word.synonyms.map((syn, i) => (
                    <span
                      key={i}
                      className="text-xs font-black px-3 py-1 rounded-xl bg-green-100 text-green-700 border-2 border-green-300"
                    >
                      {syn}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {word.antonyms && word.antonyms.length > 0 && (
              <div>
                <h4 className="font-black text-sm text-parla-light uppercase mb-2 tracking-wider">
                  Antónimos
                </h4>
                <div className="flex flex-wrap gap-2">
                  {word.antonyms.map((ant, i) => (
                    <span
                      key={i}
                      className="text-xs font-black px-3 py-1 rounded-xl bg-red-100 text-red-700 border-2 border-red-300"
                    >
                      {ant}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Delete button */}
          <div className="flex justify-end pt-3">
            <button
              onClick={() => onDelete(word.id)}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-parla-red text-white font-black text-sm border-b-4 border-[#8C0327] hover:bg-[#a0032e] active:border-b-0 active:translate-y-1 transition-all shadow-[0_4px_0_0_rgba(0,0,0,0.1)]"
            >
              <Trash2 className="w-4 h-4" strokeWidth={2.5} />
              Eliminar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
