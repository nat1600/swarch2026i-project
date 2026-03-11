"use client";

import { useState } from "react";
import { BatteryMedium, BatteryFull, BatteryWarning } from "lucide-react";

// --- DATOS FALSOS PARA EL DISEÑO ---
type WordItem = {
  id: number;
  word: string;
  translation: string;
  strength: number;
  type: string;
};



interface FlashcardProps {
  item: WordItem;
}

export default function Flashcard( { item }: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  // Seleccionamos el icono de batería según la fuerza de la palabra
  const getStrengthIcon = (strength: number) => {
    if (strength >= 4) return <BatteryFull className="text-green-500 h-5 w-5" />;
    if (strength >= 3) return <BatteryMedium className="text-[#F5A623] h-5 w-5" />;
    return <BatteryWarning className="text-parla-red h-5 w-5 animate-pulse" />;
  };

  return (
    <div 
      className="relative h-48 w-full cursor-pointer perspective-1000px group"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div 
        className={`relative w-full h-full transition-all duration-500 transform-3d ${
          isFlipped ? "transform-[rotateY(180deg)]" : ""
        }`}
      >
        {/* FRENTE DE LA TARJETA (Palabra en Inglés) */}
        <div className="absolute inset-0 backface-hidden bg-white border-4 border-parla-dark rounded-3xl p-5 shadow-[0_6px_0_0_var(--color-parla-dark)] group-hover:-translate-y-1 transition-transform flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-black text-parla-light uppercase tracking-wider bg-parla-mist px-2 py-1 rounded-lg">
              {item.type}
            </span>
            {getStrengthIcon(item.strength)}
          </div>
          <div className="text-center pb-4">
            <h3 className="font-brand text-3xl text-parla-dark">{item.word}</h3>
            <p className="text-parla-blue font-bold text-sm mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
              Toca para voltear ↺
            </p>
          </div>
        </div>

        {/* REVERSO DE LA TARJETA (Traducción) */}
        <div className="absolute inset-0 backface-hidden transform-[rotateY(180deg)] bg-parla-mist border-4 border-parla-blue rounded-3xl p-5 shadow-[0_6px_0_0_var(--color-parla-blue)] flex flex-col justify-center items-center text-center">
          <h3 className="font-brand text-3xl text-parla-blue mb-2">{item.translation}</h3>
          <p className="font-extrabold text-parla-dark text-sm">
            Fuerza actual: {item.strength}/5
          </p>
        </div>
      </div>
    </div>
  );
}