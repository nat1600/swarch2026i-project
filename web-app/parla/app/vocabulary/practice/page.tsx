"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@auth0/nextjs-auth0/client";
import { ScrollReveal } from "@/components/core/ScrollReveal";
import { Brain, ArrowLeft, RotateCcw, CheckCircle, Loader2, Trophy } from "lucide-react";
import HomeNavBar from "@/components/core/HomeNavBar";
import { getInitials } from "@/lib/user-utils";
import { Phrase, ReviewQuality } from "@/lib/types/phrases";
import { phrasesService } from "@/lib/services/phrasesService";
import { toast } from "sonner";
import confetti from "canvas-confetti";

const QUALITY_OPTIONS = [
  {
    value: ReviewQuality.COMPLETE_BLACKOUT,
    label: "No recordé nada",
    emoji: "😵",
    color: "bg-red-500",
    description: "Olvido total"
  },
  {
    value: ReviewQuality.INCORRECT_EASY_RECALL,
    label: "Recordé con mucha ayuda",
    emoji: "😓",
    color: "bg-orange-500",
    description: "Incorrecto pero fácil de recordar"
  },
  {
    value: ReviewQuality.INCORRECT_HARD_RECALL,
    label: "Recordé con ayuda",
    emoji: "😅",
    color: "bg-yellow-500",
    description: "Incorrecto pero difícil de recordar"
  },
  {
    value: ReviewQuality.CORRECT_DIFFICULT,
    label: "Correcto con dificultad",
    emoji: "🤔",
    color: "bg-blue-400",
    description: "Correcto pero difícil"
  },
  {
    value: ReviewQuality.CORRECT_HESITATION,
    label: "Correcto con duda",
    emoji: "😊",
    color: "bg-green-400",
    description: "Correcto con hesitación"
  },
  {
    value: ReviewQuality.PERFECT,
    label: "¡Perfecto!",
    emoji: "🎯",
    color: "bg-green-600",
    description: "Respuesta perfecta"
  }
];

export default function PracticePage() {
  const router = useRouter();
  const { user, isLoading: isUserLoading } = useUser();
  const [duePhrases, setDuePhrases] = useState<Phrase[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login");
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    if (user) {
      fetchDuePhrases();
    }
  }, [user]);

  const fetchDuePhrases = async () => {
    try {
      setIsLoading(true);
      // TODO: Get actual user ID from Auth0 session - for now the backend extracts it from JWT
      const userId = 1;
      const data = await phrasesService.getDuePhrases(userId);
      setDuePhrases(data);
      
      if (data.length === 0) {
        toast.info("¡No tienes frases pendientes de repaso!");
      }
    } catch (error) {
      console.error("Error fetching due phrases:", error);
      toast.error("Error al cargar las frases pendientes");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFlip = () => {
    if (!showRating) {
      setIsFlipped(!isFlipped);
      if (!isFlipped) {
        // Show rating options after flipping to see answer
        setTimeout(() => setShowRating(true), 300);
      }
    }
  };

  const handleRating = async (quality: number) => {
    const currentPhrase = duePhrases[currentIndex];
    if (!currentPhrase || isSubmitting) return;

    try {
      setIsSubmitting(true);
      
      const result = await phrasesService.reviewPhrase(currentPhrase.id, quality);
      
      // Show feedback based on quality
      if (quality >= 4) {
        toast.success(`¡Excelente! Próxima revisión en ${result.inner_repetition_interval} días`);
      } else if (quality >= 2) {
        toast.info(`Revisarás esta frase en ${result.inner_repetition_interval} días`);
      } else {
        toast.warning("Sigue practicando esta frase");
      }

      setReviewedCount(prev => prev + 1);

      // Move to next phrase or complete session
      if (currentIndex < duePhrases.length - 1) {
        setTimeout(() => {
          setCurrentIndex(prev => prev + 1);
          setIsFlipped(false);
          setShowRating(false);
        }, 500);
      } else {
        // Session complete!
        setSessionComplete(true);
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error("Error al enviar la calificación");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowRating(false);
    setSessionComplete(false);
    setReviewedCount(0);
    fetchDuePhrases();
  };

  if (isUserLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-polka">
        <Loader2 className="w-12 h-12 text-parla-blue animate-spin" />
      </div>
    );
  }

  const currentPhrase = duePhrases[currentIndex];
  const progress = duePhrases.length > 0 ? ((currentIndex + 1) / duePhrases.length) * 100 : 0;

  return (
    <div className="font-app min-h-screen w-full bg-polka overflow-x-hidden selection:bg-parla-blue selection:text-white pb-24">
      <HomeNavBar
        initials={getInitials(user?.given_name || user?.name || "")}
        userPicture={user?.picture || ""}
      />

      <div className="max-w-4xl mx-auto px-6 mt-10 space-y-8">
        {/* HEADER */}
        <ScrollReveal className="flex justify-between items-center">
          <button
            onClick={() => router.push("/vocabulary")}
            className="flex items-center gap-2 text-parla-blue font-black hover:text-parla-dark transition-colors"
          >
            <ArrowLeft className="h-6 w-6" strokeWidth={3} />
            Volver
          </button>
          <div className="flex items-center gap-3">
            <Brain className="h-8 w-8 text-parla-blue" strokeWidth={2.5} />
            <h1 className="font-brand text-3xl text-parla-dark">Entrenamiento</h1>
          </div>
          <div className="w-20"></div>
        </ScrollReveal>

        {sessionComplete ? (
          /* SESSION COMPLETE */
          <ScrollReveal className="text-center space-y-6 py-12">
            <div className="inline-block p-6 bg-white rounded-full border-4 border-parla-dark shadow-[0_6px_0_0_var(--color-parla-dark)]">
              <Trophy className="h-20 w-20 text-[#F5A623]" strokeWidth={2} />
            </div>
            <h2 className="font-brand text-4xl text-parla-dark">
              ¡Sesión Completada!
            </h2>
            <p className="text-xl font-bold text-parla-blue">
              Has revisado {reviewedCount} {reviewedCount === 1 ? 'frase' : 'frases'}
            </p>
            <div className="flex gap-4 justify-center pt-6">
              <button
                onClick={handleRestart}
                className="bg-parla-blue text-white font-black text-xl py-4 px-8 rounded-2xl border-b-8 border-[#1a5f8f] hover:bg-[#2a7ab8] active:border-b-0 active:translate-y-2 transition-all flex items-center gap-3 shadow-[0_4px_0_0_rgba(0,0,0,0.1)]"
              >
                <RotateCcw className="h-6 w-6" strokeWidth={3} />
                Nueva Sesión
              </button>
              <button
                onClick={() => router.push("/vocabulary")}
                className="bg-white text-parla-blue font-black text-xl py-4 px-8 rounded-2xl border-4 border-parla-blue hover:bg-parla-mist active:translate-y-1 transition-all"
              >
                Ir a Mi Bóveda
              </button>
            </div>
          </ScrollReveal>
        ) : duePhrases.length === 0 ? (
          /* NO PHRASES DUE */
          <ScrollReveal className="text-center space-y-6 py-12">
            <div className="inline-block p-6 bg-white rounded-full border-4 border-parla-dark shadow-[0_6px_0_0_var(--color-parla-dark)]">
              <CheckCircle className="h-20 w-20 text-green-500" strokeWidth={2} />
            </div>
            <h2 className="font-brand text-4xl text-parla-dark">
              ¡Todo al día!
            </h2>
            <p className="text-xl font-bold text-parla-blue">
              No tienes frases pendientes de repaso
            </p>
            <button
              onClick={() => router.push("/vocabulary")}
              className="bg-parla-blue text-white font-black text-xl py-4 px-8 rounded-2xl border-b-8 border-[#1a5f8f] hover:bg-[#2a7ab8] active:border-b-0 active:translate-y-2 transition-all inline-flex items-center gap-3 shadow-[0_4px_0_0_rgba(0,0,0,0.1)]"
            >
              <ArrowLeft className="h-6 w-6" strokeWidth={3} />
              Volver a Mi Bóveda
            </button>
          </ScrollReveal>
        ) : (
          <>
            {/* PROGRESS BAR */}
            <ScrollReveal animation="animate-fade-in">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <p className="text-parla-dark font-black text-sm">
                    Frase {currentIndex + 1} de {duePhrases.length}
                  </p>
                  <p className="text-parla-blue font-black text-sm">
                    {Math.round(progress)}%
                  </p>
                </div>
                <div className="w-full bg-parla-mist rounded-full h-4 border-4 border-parla-light overflow-hidden">
                  <div
                    className="bg-parla-blue h-full transition-all duration-500 rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </ScrollReveal>

            {/* FLASHCARD */}
            <ScrollReveal animation="animate-slide-in-bottom" delay="100ms">
              <div
                onClick={handleFlip}
                className="relative h-96 cursor-pointer perspective-1000"
                style={{ perspective: "1000px" }}
              >
                <div
                  className={`relative w-full h-full transition-all duration-500`}
                  style={{
                    transformStyle: "preserve-3d",
                    transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)"
                  }}
                >
                  {/* FRONT - Original Text */}
                  <div
                    className="absolute inset-0 bg-white border-4 border-parla-dark rounded-3xl p-8 shadow-[0_8px_0_0_var(--color-parla-dark)] flex flex-col justify-between"
                    style={{ backfaceVisibility: "hidden" }}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-black text-white uppercase tracking-wider bg-parla-blue px-3 py-1 rounded-lg">
                        {currentPhrase?.source_language.name}
                      </span>
                      <span className="text-parla-light font-black text-sm">
                        Toca para voltear ↺
                      </span>
                    </div>
                    <div className="text-center flex-1 flex items-center justify-center">
                      <h3 className="font-brand text-5xl text-parla-dark leading-tight">
                        {currentPhrase?.original_text}
                      </h3>
                    </div>
                    <div className="text-center">
                      <p className="text-parla-blue font-bold text-sm">
                        ¿Recuerdas la traducción?
                      </p>
                    </div>
                  </div>

                  {/* BACK - Translated Text */}
                  <div
                    className="absolute inset-0 bg-parla-blue border-4 border-parla-dark rounded-3xl p-8 shadow-[0_8px_0_0_var(--color-parla-dark)] flex flex-col justify-between"
                    style={{
                      backfaceVisibility: "hidden",
                      transform: "rotateY(180deg)"
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-black text-parla-dark uppercase tracking-wider bg-white px-3 py-1 rounded-lg">
                        {currentPhrase?.target_language.name}
                      </span>
                    </div>
                    <div className="text-center flex-1 flex items-center justify-center">
                      <h3 className="font-brand text-5xl text-white leading-tight">
                        {currentPhrase?.translated_text}
                      </h3>
                    </div>
                    <div className="text-center">
                      <p className="text-white font-bold text-sm opacity-90">
                        ¿Qué tan bien lo recordaste?
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* RATING OPTIONS */}
            {showRating && (
              <ScrollReveal animation="animate-slide-in-bottom" delay="200ms">
                <div className="space-y-4">
                  <h3 className="text-center font-black text-xl text-parla-dark">
                    ¿Qué tan bien lo recordaste?
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {QUALITY_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleRating(option.value)}
                        disabled={isSubmitting}
                        className={`${option.color} text-white font-black text-sm py-4 px-4 rounded-2xl border-b-4 border-opacity-50 border-black hover:brightness-110 active:border-b-0 active:translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center gap-2 shadow-[0_4px_0_0_rgba(0,0,0,0.2)]`}
                      >
                        <span className="text-3xl">{option.emoji}</span>
                        <span className="text-center leading-tight">{option.label}</span>
                        <span className="text-xs opacity-80">{option.description}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-center text-parla-light font-bold text-sm">
                    Tu respuesta ayuda al algoritmo a programar la próxima revisión
                  </p>
                </div>
              </ScrollReveal>
            )}
          </>
        )}
      </div>
    </div>
  );
}
