"use client";

import { useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useUser } from "@auth0/nextjs-auth0";
import { redirect } from "next/navigation";

// Lista de idiomas disponibles (puedes expandirla luego conectándola a tu backend)
const LANGUAGES = [
  { id: "en", name: "Inglés", emoji: "🇺🇸" },
  { id: "fr", name: "Francés", emoji: "🇫🇷" },
  { id: "it", name: "Italiano", emoji: "🇮🇹" },
  { id: "de", name: "Alemán", emoji: "🇩🇪" },
  { id: "ca", name: "Catalán", emoji: "🐉" },
  { id: "pt", name: "Portugués", emoji: "🇧🇷" },
];

export default function OnboardingPage() {
  const { user, isLoading } = useUser();
  const [selectedLang, setSelectedLang] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-parla-light flex items-center justify-center font-app">
        <Sparkles className="text-parla-red animate-spin" size={48} />
      </div>
    );
  }

  if (!isLoading && !user) {
    window.location.href = "/login";
    return null; // Mientras se redirige, no renderizamos nada
  }

  const handleStart = () => {
    if (!selectedLang) return;
    setIsStarting(true);

    const langName = LANGUAGES.find((l) => l.id === selectedLang)?.name;
    toast.success(`¡Excelente elección! 🎯`, {
      description: `Preparando tu primera lección de ${langName}...`,
    });

    // Aquí harías la mutación a tu API (Apollo Client) para guardar el idioma del usuario
    setTimeout(() => {
      // Redirigir al dashboard principal
      redirect("/home");
    }, 2000);
  };

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
        .font-app { font-family: 'Nunito', sans-serif; }
        
        /* Fondo animado suave */
        .bg-wave {
          background-color: #A9CBD9;
          background-image: repeating-radial-gradient(
            circle at 0 0, 
            transparent 0, 
            #A9CBD9 40px, 
            #2D83A6 40px, 
            #2D83A6 42px, 
            transparent 42px, 
            transparent 80px
          );
          background-size: 100px 100px;
          animation: waveMove 20s linear infinite;
        }
        
        @keyframes waveMove {
          0% { background-position: 0 0; }
          100% { background-position: 100px 100px; }
        }
      `,
        }}
      />

      <div className="min-h-screen w-full bg-wave font-app flex flex-col items-center justify-center p-4 overflow-hidden selection:bg-parla-blue selection:text-white">
        {/* Barra de progreso superior (Estilo juego) */}
        <div className="top-8 w-full max-w-md px-4 flex items-center gap-4 animate-slide-in-top py-4">
          <div className="w-12 h-12 bg-white rounded-full border-4 border-parla-dark shadow-[0_4px_0_0_#254159] flex items-center justify-center">
            <span className="text-xl font-black text-parla-blue">1</span>
          </div>
          <div className="flex-1 h-6 bg-white rounded-full border-4 border-parla-dark shadow-[0_4px_0_0_#254159] p-1 overflow-hidden">
            <div className="h-full bg-parla-red rounded-full w-1/3 animate-pulse animation-duration-[2000ms]"></div>
          </div>
        </div>

        {/* CONTENEDOR PRINCIPAL */}
        <div
          className={`w-full max-w-md transition-all duration-500 ${isStarting ? "scale-110 opacity-0 blur-sm" : "scale-100 opacity-100"}`}
        >
          <div className="text-center mb-8 animate-slide-in-bottom animate-delay-100 bg-white/90 backdrop-blur-sm p-6 rounded-3xl border-4 border-parla-dark shadow-[0_8px_0_0_#254159]">
            <div className="flex justify-center mb-2">
              <Sparkles
                className="text-parla-red animate-spin animation-duration-[3000ms]"
                size={32}
              />
            </div>
            <h1 className="text-3xl font-black text-parla-dark tracking-tight mb-2">
              ¡Cuenta creada!
            </h1>
            <p className="text-parla-blue font-extrabold text-lg">
              ¿Qué idioma quieres aprender hoy?
            </p>
          </div>

          {/* GRID DE IDIOMAS (Cartas 3D) */}
          <div className="grid grid-cols-2 gap-4 mb-8 animate-slide-in-bottom  animate-delay-200">
            {LANGUAGES.map((lang, index) => {
              const isSelected = selectedLang === lang.id;

              return (
                <button
                  key={lang.id}
                  onClick={() => setSelectedLang(lang.id)}
                  className={`
                    relative group flex flex-col items-center justify-center p-6 rounded-4xl border-4 transition-all duration-200
                    ${
                      isSelected
                        ? "bg-parla-light border-parla-blue translate-y-2 shadow-[0_0px_0_0_#2D83A6]" // Estado Presionado
                        : "bg-white border-parla-dark hover:bg-[#F8FAFC] shadow-[0_8px_0_0_#254159] hover:translate-y-1 hover:shadow-[0_4px_0_0_#254159]" // Estado Normal
                    }
                  `}
                  // Añadimos un pequeño retraso dinámico a cada carta para que entren en cascada
                  style={{ animationDelay: `${200 + index * 100}ms` }}
                >
                  {isSelected && (
                    <div className="absolute -top-3 -right-3 w-8 h-8 bg-parla-red rounded-full border-4 border-parla-dark flex items-center justify-center animate-zoom-in">
                      <span className="text-white text-sm font-black">✓</span>
                    </div>
                  )}
                  <span className="text-5xl mb-3 drop-shadow-md group-hover:scale-110 transition-transform">
                    {lang.emoji}
                  </span>
                  <span
                    className={`font-black text-lg ${isSelected ? "text-parla-blue" : "text-parla-dark"}`}
                  >
                    {lang.name}
                  </span>
                </button>
              );
            })}
          </div>

          {/* BOTÓN CONTINUAR */}
          <div className="animate-slide-in-bottom animate-delay-300">
            <Button
              variant="active_button"
              onClick={handleStart}
              disabled={!selectedLang || isStarting}
              size="lg"
            >
              {isStarting ? "Cargando aventura..." : "¡Continuar!"}
              {!isStarting && <ArrowRight strokeWidth={4} />}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
