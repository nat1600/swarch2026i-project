"use client";

import Link from "next/link";
import { ScrollReveal } from "@/components/core/ScrollReveal";
import HomeNavBar from "@/components/core/HomeNavBar";
import {
  Sparkles,
  MessageSquare,
  Flame,
  Zap,
  ArrowRight,
  Gamepad2,
  Trophy,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface HomeUser {
  picture?: string;
  displayName: string;
  initials: string;
}

interface HomeContentProps {
  user: HomeUser;
}

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const QUICK_ACTIONS = [
  {
    href: "/forum",
    icon: MessageSquare,
    title: "Ir al Foro",
    desc: "Conversa con la comunidad, haz preguntas y comparte lo que sabes.",
    accent: "parla-red" as const,
    accentHex: "#BF0436",
    bgTint: "#FFF0F3",
    borderHex: "#BF0436",
    shadowHex: "#8C0327",
    enabled: true,
  },
  {
    href: "/games",
    icon: Gamepad2,
    title: "Juegos Arcade",
    desc: "Practica tu vocabulario con divertidos mini-juegos interactivos.",
    accent: "parla-blue" as const,
    accentHex: "#2D83A6",
    bgTint: "#E6F0F4",
    borderHex: "#2D83A6",
    shadowHex: "#1f6d8e",
    enabled: true,
  },
  {
    href: "/leaderboard",
    icon: Trophy,
    title: "Clasificación",
    desc: "Mira cómo vas comparado con otros estudiantes de Parla.",
    accent: "parla-dark" as const,
    accentHex: "#254159",
    bgTint: "#F6F8FA",
    borderHex: "#254159",
    shadowHex: "#1a2f40",
    enabled: true,
  },
];

const STATS = [
  {
    icon: Flame,
    value: "5",
    unit: "días",
    label: "Racha actual",
    sub: "¡No te detengas!",
    accentHex: "#E85D04",
    bgTint: "#FFF4ED",
    borderHex: "#E85D04",
    shadowHex: "#C04D03",
  },
  {
    icon: MessageSquare,
    value: "12",
    unit: "",
    label: "Comentarios",
    sub: "En el foro global",
    accentHex: "#BF0436",
    bgTint: "#FFF0F3",
    borderHex: "#BF0436",
    shadowHex: "#8C0327",
  },
  {
    icon: Zap,
    value: "120",
    unit: "XP",
    label: "Experiencia",
    sub: "Nivel principiante",
    accentHex: "#2D83A6",
    bgTint: "#E6F0F4",
    borderHex: "#2D83A6",
    shadowHex: "#1f6d8e",
  },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function HomeContent({ user }: HomeContentProps) {
  return (
    <div className="font-app min-h-screen w-full bg-polka overflow-x-hidden selection:bg-parla-blue selection:text-white">

      <HomeNavBar userPicture={user.picture || ""} initials={user.initials} />

      {/* MAIN */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-10">
        {/* ---------- WELCOME CARD ---------- */}
        <ScrollReveal animation="animate-bounce-fade-in">
          <div className="bg-white border-4 border-parla-dark rounded-4xl p-8 md:p-10 shadow-[0_12px_0_0_#254159]">
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* Avatar block */}
              <div className="relative shrink-0">
                <div className="w-28 h-28 md:w-36 md:h-36 bg-parla-mist rounded-full border-4 border-parla-dark overflow-hidden shadow-[0_8px_0_0_#254159]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={user.picture || ""}
                    alt={user.displayName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-yellow-400 p-2 rounded-xl border-2 border-parla-dark shadow-[0_4px_0_0_#254159]">
                  <Sparkles className="w-5 h-5 text-parla-dark" />
                </div>
              </div>

              {/* Text block */}
              <div className="text-center md:text-left space-y-2 flex-1">
                <h1 className="font-brand text-[clamp(2.2rem,6vw,3.5rem)] text-parla-dark leading-tight">
                  ¡Hola,{" "}
                  <span className="text-parla-blue">{user.displayName}</span>!
                </h1>
                <p className="text-lg font-bold text-parla-blue/80 max-w-md">
                  Qué bueno verte de nuevo. ¿Listo para practicar hoy?
                </p>

                {/* CTA — visible on mobile, hidden on md+ (actions grid takes over) */}
                <div className="pt-4 flex flex-wrap gap-3 justify-center md:hidden">
                  <Link href="/forum" className="btn-primary">
                    <MessageSquare className="w-5 h-5" />
                    Ir al Foro
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* ---------- QUICK ACTIONS ---------- */}
        <section>
          <ScrollReveal>
            <h2 className="font-brand text-[clamp(1.6rem,4vw,2.2rem)] text-parla-dark mb-5">
              ¿Qué quieres hacer hoy?
            </h2>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {QUICK_ACTIONS.map((action, i) => {
              const Icon = action.icon;
              const inner = (
                <div
                  className="relative bg-white border-4 rounded-3xl p-6 transition-all duration-200 group overflow-hidden h-full"
                  style={{
                    borderColor: action.borderHex,
                    boxShadow: `0 8px 0 0 ${action.shadowHex}`,
                  }}
                >
                  {/* Hover lift effect */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{ backgroundColor: action.bgTint }}
                  />

                  <div className="relative z-10">
                    {/* Icon circle */}
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 border-2"
                      style={{
                        backgroundColor: action.bgTint,
                        borderColor: action.borderHex,
                      }}
                    >
                      <Icon
                        className="w-6 h-6"
                        style={{ color: action.accentHex }}
                      />
                    </div>

                    <h3 className="font-brand text-xl text-parla-dark mb-1 flex items-center gap-2">
                      {action.title}
                      {!action.enabled && (
                        <span className="text-xs font-app font-bold bg-parla-mist text-parla-blue/60 px-2 py-0.5 rounded-full">
                          Pronto
                        </span>
                      )}
                    </h3>
                    <p className="text-parla-dark/70 font-semibold text-sm leading-relaxed">
                      {action.desc}
                    </p>

                    {action.enabled && (
                      <div
                        className="mt-4 flex items-center gap-1 font-extrabold text-sm"
                        style={{ color: action.accentHex }}
                      >
                        <span>Entrar</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    )}
                  </div>
                </div>
              );

              return (
                <ScrollReveal
                  key={action.title}
                  animation="animate-slide-in-bottom"
                  delay={`${i * 120}ms`}
                >
                  {action.enabled ? (
                    <Link
                      href={action.href}
                      className="block h-full group-hover:-translate-y-1"
                    >
                      {inner}
                    </Link>
                  ) : (
                    <div className="opacity-70 cursor-not-allowed h-full">
                      {inner}
                    </div>
                  )}
                </ScrollReveal>
              );
            })}
          </div>
        </section>

        {/* ---------- STATS ---------- */}
        <section>
          <ScrollReveal>
            <h2 className="font-brand text-[clamp(1.6rem,4vw,2.2rem)] text-parla-dark mb-5">
              Tu progreso
            </h2>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {STATS.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <ScrollReveal
                  key={stat.label}
                  animation="animate-fade-in-up"
                  delay={`${i * 120}ms`}
                >
                  <Link href="/stats" className="block h-full group">
                    <div
                      className="bg-white border-4 rounded-3xl p-6 flex items-center gap-4 group-hover:-translate-y-1 transition-all h-full"
                      style={{
                        borderColor: stat.borderHex,
                        boxShadow: `0 6px 0 0 ${stat.shadowHex}`,
                      }}
                    >
                      {/* Icon */}
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border-2 transition-transform group-hover:scale-110"
                        style={{
                          backgroundColor: stat.bgTint,
                          borderColor: stat.borderHex,
                        }}
                      >
                        <Icon
                          className="w-7 h-7"
                          style={{ color: stat.accentHex }}
                        />
                      </div>

                      {/* Text */}
                      <div>
                        <div className="flex items-baseline gap-1">
                          <span
                            className="font-brand text-3xl leading-none"
                            style={{ color: stat.accentHex }}
                          >
                            {stat.value}
                          </span>
                          {stat.unit && (
                            <span className="font-extrabold text-sm text-parla-dark/60">
                              {stat.unit}
                            </span>
                          )}
                        </div>
                        <p className="font-extrabold text-parla-dark text-sm mt-0.5">
                          {stat.label}
                        </p>
                        <p
                          className="font-bold text-xs"
                          style={{ color: stat.accentHex }}
                        >
                          {stat.sub}
                        </p>
                      </div>
                    </div>
                  </Link>
                </ScrollReveal>
              );
            })}
          </div>
        </section>

        {/* ---------- MOTIVATIONAL FOOTER ---------- */}
        <ScrollReveal animation="animate-fade-in-up">
          <div className="bg-parla-dark rounded-4xl border-4 border-[#1a2f40] shadow-[0_8px_0_0_#1a2f40] p-8 md:p-10 text-center">
            <span className="text-4xl mb-3 inline-block animate-bouncing animate-iteration-count-infinite animate-duration-slower">
              🚀
            </span>
            <h3 className="font-brand text-[clamp(1.5rem,4vw,2.2rem)] text-white leading-tight mb-2">
              Tu próxima palabra{" "}
              <span className="text-parla-light">te espera.</span>
            </h3>
            <p className="text-parla-light/80 font-bold text-sm mb-5 max-w-md mx-auto">
              Cada día que practicas, estás un paso más cerca de la fluidez.
            </p>
            <Link href="/forum" className="btn-primary text-base! py-4! px-10!">
              Explorar el Foro
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </ScrollReveal>
      </main>

      {/* ══════════════════════════════════════
          FOOTER
      ══════════════════════════════════════ */}
      <footer className="relative z-10 border-t-4 border-parla-dark/20 py-6 px-6 text-center mt-4">
        <div className="flex items-center justify-center gap-2 mb-1">
          <div className="w-7 h-7 bg-parla-blue rounded-full flex items-center justify-center border-2 border-parla-dark">
            <span className="font-brand text-sm text-white leading-none">
              P
            </span>
          </div>
          <span className="font-brand text-lg text-parla-dark">Parla</span>
        </div>
        <p className="text-parla-dark/50 font-semibold text-xs">
          © 2026 Parla · Aprende idiomas jugando
        </p>
      </footer>
    </div>
  );
}
