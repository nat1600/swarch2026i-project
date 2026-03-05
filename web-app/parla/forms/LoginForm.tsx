"use client";

import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Globe2, MessageCircle } from "lucide-react";
import { toast } from "sonner";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";

const emailSchema = z.object({
  email: z.email({ message: "Ese correo no parece válido." }),
});

export default function ParlaLogin() {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });

  /**
   * Redirige a Auth0 Passwordless (email OTP).
   * Auth0 envía el código al correo, verifica en su propio portal y
   * hace callback a /api/auth/callback → redirect a /onboarding.
   *
   * Configuración requerida en el tenant Auth0:
   *   - Connections → Passwordless → Email → habilitado en esta app
   */
  const onSubmit = async (values: z.infer<typeof emailSchema>) => {
    setIsLoading(true);
    try {
      toast.success("¡Paloma mensajera enviada!", {
        description: `Revisa tu correo: ${values.email}`,
      });

      // Pausa breve para que el toast sea visible antes del redirect
      await new Promise((resolve) => setTimeout(resolve, 600));

      window.location.href = `/api/auth/login?connection=email&login_hint=${encodeURIComponent(values.email)}&returnTo=/onboarding`;
    } catch {
      setIsLoading(false);
      toast.error("No pudimos conectar con el servidor", {
        description: "Intenta de nuevo en un momento.",
      });
    }
  };

  return (
    /*
     * bg-polka, font-app: utilities definidas en globals.css.
     * Ningún <style> inline — todo el CSS vive en globals.css o en clases Tailwind.
     */
    <div className="font-app min-h-screen w-full bg-polka flex items-center justify-center p-4 overflow-hidden relative selection:bg-[#2D83A6] selection:text-white">

      {/* Elementos flotantes decorativos — tailwind-animations loops */}
      <div className="absolute top-10 left-10 text-[#254159] opacity-20 animate-pulsing animate-iteration-count-infinite animate-duration-[3000ms]">
        <MessageCircle size={80} fill="currentColor" />
      </div>
      <div className="absolute bottom-10 right-10 text-[#BF0436] opacity-20 animate-bouncing animate-iteration-count-infinite animate-duration-[4000ms]">
        <Globe2 size={100} />
      </div>

      {/* TARJETA CENTRAL */}
      <div className="w-full max-w-md bg-white rounded-4xl p-8 shadow-[0_12px_0_0_#2D83A6] border-4 border-[#254159] relative z-10 animate-zoom-in">

        {/* Logo */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="w-20 h-20 bg-[#2D83A6] rounded-full flex items-center justify-center mb-4 border-4 border-[#254159] shadow-[0_6px_0_0_#254159] animate-jiggle animate-delay-300 animate-iteration-count-once">
            <span className="font-brand text-4xl text-white font-black">P</span>
          </div>
          <h1 className="font-brand text-4xl text-[#254159] tracking-tight">Parla</h1>
        </div>

        <div className="space-y-6 animate-slide-in-bottom">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-extrabold text-[#254159] mb-2">¡Hola de nuevo! 👋</h2>
            <p className="text-[#2D83A6] font-bold">Ingresa tu correo para jugar y aprender.</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <input
                        type="email"
                        placeholder="tu@correo.com"
                        className="w-full bg-[#F8FAFC] border-4 border-[#A9CBD9] text-xl font-bold text-[#254159] placeholder:text-[#A9CBD9] rounded-2xl px-6 py-4 focus:outline-none focus:border-[#2D83A6] transition-colors"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-[#BF0436] font-bold ml-2" />
                  </FormItem>
                )}
              />

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#BF0436] text-white font-extrabold text-xl py-5 rounded-2xl border-b-8 border-[#8C0327] hover:bg-[#8C0327] active:border-b-0 active:translate-y-2 transition-all flex items-center justify-center gap-2 mt-4"
              >
                {isLoading ? "Enviando..." : "Comenzar a aprender"}
              </button>
            </form>
          </Form>

          <div className="flex items-center gap-4 py-2">
            <div className="h-1 flex-1 bg-[#A9CBD9] rounded-full"></div>
            <span className="text-[#2D83A6] font-extrabold text-sm">O TAMBIÉN</span>
            <div className="h-1 flex-1 bg-[#A9CBD9] rounded-full"></div>
          </div>

          {/* Botón de Google — Auth0 Social Connection */}
          <button
            type="button"
            onClick={() => {
              window.location.href = "/api/auth/login?connection=google-oauth2&returnTo=/onboarding";
            }}
            className="w-full bg-white text-[#254159] font-extrabold text-xl py-5 rounded-2xl border-4 border-[#A9CBD9] border-b-8 hover:bg-[#F8FAFC] hover:border-[#2D83A6] active:border-b-4 active:translate-y-1 transition-all flex items-center justify-center"
          >
            <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Usar Google
          </button>
        </div>
      </div>
    </div>
  );
}
