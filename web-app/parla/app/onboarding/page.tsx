"use client";

import { useState } from "react";
import { ArrowRight, Sparkles, User, Globe2, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@auth0/nextjs-auth0/client";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// 1. Definimos el esquema de validación con Zod
const onboardingSchema = z.object({
  username: z
    .string()
    .min(3, "El usuario debe tener al menos 3 letras")
    .max(20, "El usuario no puede tener más de 20 letras")
    .regex(/^[a-zA-Z0-9_]+$/, "Solo letras, números y guiones bajos (_)"),
  native_language: z.enum(
    ["Spanish", "English", "French"],
    "Selecciona tu idioma nativo",
  ),
  learning_language: z.enum(
    ["Spanish", "English", "French"],
    "Selecciona el idioma que quieres aprender",
  ),
});

type OnboardingFormValues = z.infer<typeof onboardingSchema>;

const LANGUAGES = [
  { id: "Spanish", name: "Español", emoji: "🇪🇸" },
  { id: "English", name: "Inglés", emoji: "🇺🇸" },
  { id: "French", name: "Francés", emoji: "🇫🇷" },
];

export default function OnboardingPage() {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const [isStarting, setIsStarting] = useState(false);

  // 2. Inicializamos React Hook Form
  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      username: "",
      // Puedes dejar estos vacíos para obligar al usuario a elegir
    },
  });

  // 3. Manejador del Submit (Aquí entra Apollo Client)
  const onSubmit = async (values: OnboardingFormValues) => {
    if (!user?.sub) return;
    setIsStarting(true);

    try {
      toast.success("¡Perfil creado! 🎯", {
        description: `Preparando tu aventura, ${values.username}...`,
      });

      // ---------------------------------------------------------
      // 🚀 AQUÍ VA TU MUTACIÓN DE APOLLO CLIENT
      // ---------------------------------------------------------
      /*
      await createProfileMutation({
        variables: {
          auth0Id: user.sub,
          username: values.username,
          nativeLanguage: values.native_language,
          learningLanguage: values.learning_language,
        }
      });
      */

      // Simulamos el tiempo de red
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Redirigimos al inicio
      router.push("/home");
      setIsStarting(false);
    } catch (error) {
      setIsStarting(false);
      toast.error("Hubo un error al guardar tu perfil. Intenta de nuevo.");
      console.error(error);
    }
  };

  // Pantalla de carga mientras Auth0 verifica la sesión
  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-parla-mist flex items-center justify-center font-app">
        <Sparkles className="text-parla-red animate-spin" size={48} />
      </div>
    );
  }

  // Protección de ruta
  if (!isLoading && !user) {
    router.push("/login");
    return null;
  }

  return (
    <div className="min-h-screen w-full bg-wave font-app flex flex-col items-center justify-center p-4 overflow-hidden selection:bg-parla-blue selection:text-white">
      {/* Barra de progreso superior */}
      <div className="absolute top-8 w-full max-w-md px-4 flex items-center gap-4 animate-slide-in-top">
        <div className="w-12 h-12 bg-white rounded-full border-4 border-parla-dark shadow-[0_4px_0_0_var(--color-parla-dark)] flex items-center justify-center shrink-0">
          <span className="text-xl font-black text-parla-blue">1</span>
        </div>
        <div className="flex-1 h-6 bg-white rounded-full border-4 border-parla-dark shadow-[0_4px_0_0_var(--color-parla-dark)] p-1 overflow-hidden">
          <div className="h-full bg-parla-red rounded-full w-1/2 animate-pulse"></div>
        </div>
      </div>

      {/* CONTENEDOR PRINCIPAL */}
      <div
        className={`w-full max-w-md transition-all duration-500 mt-16 ${
          isStarting ? "scale-110 opacity-0 blur-sm" : "scale-100 opacity-100"
        }`}
      >
        {/* Tarjeta del Formulario */}
        <div className="bg-white rounded-4xl border-4 border-parla-dark shadow-[0_12px_0_0_var(--color-parla-dark)] p-8 animate-slide-in-bottom">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="flex justify-center mb-3">
              <div className="w-16 h-16 bg-parla-mist rounded-full border-4 border-parla-light flex items-center justify-center">
                <Sparkles
                  className="text-parla-red animate-spin animate-duration-3000ms"
                  size={28}
                />
              </div>
            </div>
            <h1 className="text-3xl font-black text-parla-dark tracking-tight mb-2">
              ¡Casi listos!
            </h1>
            <p className="text-parla-blue font-extrabold text-base">
              Crea tu perfil para empezar a jugar.
            </p>
          </div>

          {/* FORMULARIO */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {/* 1. Username */}
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 font-black text-parla-dark text-base">
                      <User size={18} className="text-parla-red" />
                      Nombre de usuario
                    </FormLabel>
                    <FormControl>
                      <input
                        {...field}
                        placeholder="ej: ninja_poliglota"
                        className="w-full h-12 rounded-2xl border-4 border-parla-light bg-parla-mist px-4 text-parla-dark font-bold placeholder:text-parla-light focus:outline-none focus:border-parla-blue transition-colors"
                      />
                    </FormControl>
                    <FormMessage className="text-parla-red font-bold text-xs px-2" />
                  </FormItem>
                )}
              />

              {/* 2. Native Language */}
              <FormField
                control={form.control}
                name="native_language"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 font-black text-parla-dark text-base">
                      <Globe2 size={18} className="text-parla-blue" />
                      ¿Qué idioma hablas?
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <select
                          {...field}
                          className="w-full h-12 rounded-2xl border-4 border-parla-light bg-parla-mist px-4 pr-10 text-parla-dark font-bold appearance-none focus:outline-none focus:border-parla-blue transition-colors cursor-pointer"
                        >
                          <option value="" disabled>
                            Selecciona tu idioma...
                          </option>
                          {LANGUAGES.map((lang) => (
                            <option key={lang.id} value={lang.id}>
                              {lang.emoji} {lang.name}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-parla-blue font-black">
                          ▼
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage className="text-parla-red font-bold text-xs px-2" />
                  </FormItem>
                )}
              />

              {/* 3. Learning Language */}
              <FormField
                control={form.control}
                name="learning_language"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 font-black text-parla-dark text-base">
                      <BookOpen size={18} className="text-orange-500" />
                      ¿Qué idioma quieres aprender?
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <select
                          {...field}
                          className="w-full h-12 rounded-2xl border-4 border-parla-light bg-parla-mist px-4 pr-10 text-parla-dark font-bold appearance-none focus:outline-none focus:border-parla-blue transition-colors cursor-pointer"
                        >
                          <option value="" disabled>
                            Quiero aprender...
                          </option>
                          {LANGUAGES.map((lang) => (
                            <option key={lang.id} value={lang.id}>
                              {lang.emoji} {lang.name}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-parla-blue font-black">
                          ▼
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage className="text-parla-red font-bold text-xs px-2" />
                  </FormItem>
                )}
              />

              {/* BOTÓN CONTINUAR */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isStarting}
                  className="w-full bg-parla-red text-white font-black text-xl py-4 rounded-2xl border-b-8 border-[#8C0327] hover:bg-[#a6032f] active:border-b-0 active:translate-y-2 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isStarting ? "Guardando perfil..." : "¡Empezar aventura!"}
                  {!isStarting && (
                    <ArrowRight strokeWidth={4} className="h-6 w-6" />
                  )}
                </button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
