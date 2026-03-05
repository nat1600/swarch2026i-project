import Link from "next/link";
import { ScrollReveal } from "@/components/scroll-reveal";

const FEATURES = [
  {
    emoji: "⚡",
    title: "Lecciones de 5 min",
    desc: "Aprende en el metro, el bus o antes de dormir. Cada sesión está pensada para caber en tu vida.",
    color: "#2D83A6",
  },
  {
    emoji: "🔥",
    title: "Racha diaria",
    desc: "La constancia es el secreto. Tu racha te motiva a volver cada día y celebra cada logro.",
    color: "#BF0436",
  },
  {
    emoji: "🏆",
    title: "Desafíos y XP",
    desc: "Compite con amigos, sube de nivel y desbloquea logros mientras tu vocabulario crece.",
    color: "#254159",
  },
];

const STATS = [
  { num: "50K+", label: "Estudiantes activos", color: "#2D83A6" },
  { num: "12", label: "Idiomas disponibles", color: "#BF0436" },
  { num: "4.9★", label: "Valoración media", color: "#254159" },
];

const STEPS = [
  {
    num: "01",
    title: "Crea tu cuenta",
    desc: "Regístrate en segundos con tu correo o Google. Sin tarjetas, sin sorpresas.",
    emoji: "✉️",
  },
  {
    num: "02",
    title: "Elige tu idioma",
    desc: "Inglés, francés, alemán… tú decides qué aventura empezar hoy.",
    emoji: "🌍",
  },
  {
    num: "03",
    title: "Aprende jugando",
    desc: "Completa lecciones, mantén tu racha y comparte el progreso con tu comunidad.",
    emoji: "🎮",
  },
];

const TICKER_LANGS = [
  "🇬🇧 Inglés",
  "🇫🇷 Francés",
  "🇩🇪 Alemán",
  "🇧🇷 Portugués",
  "🇮🇹 Italiano",
  "🐉 Catalán",
  "🇯🇵 Japonés",
  "🇰🇷 Coreano",
  "🇳🇱 Neerlandés",
  "🇵🇱 Polaco",
  "🇷🇺 Ruso",
  "🇦🇷 Español",
];

export default function LandingPage() {
  return (
    <div className="font-app min-h-screen w-full bg-polka overflow-x-hidden selection:bg-parla-blue selection:text-white ">
      {/* ══════════════════════════════════════
          NAV
      ══════════════════════════════════════ */}
      <nav className="relative z-50 flex items-center justify-between px-6 md:px-12 py-5 animate-fade-in-down">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-parla-blue rounded-full flex items-center justify-center border-4 border-parla-dark shadow-[0_4px_0_0_#254159] animate-jiggle animate-delay-500 animate-iteration-count-once">
            <span className="font-brand text-2xl text-white leading-none">
              P
            </span>
          </div>
          <span className="font-brand text-3xl text-parla-dark tracking-tight">
            Parla
          </span>
        </div>

        {/* Botón nav más pequeño: sobreescribimos padding/tamaño con Tailwind directamente */}
        <Link href="/login" className="btn-secondary  py-3! px-7 text-sm!">
          Iniciar sesión →
        </Link>
      </nav>

      {/* ══════════════════════════════════════
          HERO
      ══════════════════════════════════════ */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-4 pt-4 pb-20 overflow-hidden">
        {/* Watermark gigante */}
        <div className="watermark absolute inset-0 flex items-center justify-center">
          PARLA
        </div>

        {/* Emojis flotantes decorativos — tailwind-animations loops */}
        <span className="hidden md:block absolute top-[12%] left-[8%]  text-5xl animate-float    animate-iteration-count-infinite animate-duration-slow">
          🌍
        </span>
        <span className="hidden md:block absolute top-[20%] right-[7%] text-6xl animate-bouncing animate-iteration-count-infinite animate-duration-slower">
          ✨
        </span>
        <span className="hidden md:block absolute top-[55%] left-[5%]  text-4xl animate-float    animate-iteration-count-infinite animate-duration-slow">
          🗣️
        </span>
        <span className="hidden md:block absolute bottom-[15%] right-[9%] text-5xl animate-float animate-direction-reverse animate-iteration-count-infinite animate-duration-slower">
          🏆
        </span>
        <span className="hidden md:block absolute top-[38%] right-[3%] text-3xl animate-bouncing animate-direction-reverse animate-iteration-count-infinite animate-duration-slower">
          💬
        </span>
        <span className="hidden md:block absolute bottom-[25%] left-[10%] text-4xl animate-float animate-direction-reverse animate-iteration-count-infinite animate-duration-slow">
          🎯
        </span>

        {/* Hero card */}
        <div className="relative z-10 w-full max-w-2xl mx-auto">
          <div className="bg-white rounded-4xl border-4 border-parla-dark shadow-[0_12px_0_0_#254159] p-8 md:p-12 text-center animate-bounce-fade-in">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-parla-mist border-2 border-parla-blue text-parla-blue font-extrabold text-sm px-4 py-2 rounded-full mb-6 animate-slide-in-top animate-delay-200">
              <span className="animate-pulse animate-iteration-count-infinite">
                ●
              </span>
              Aprende con tus series y canciones favoritas
            </div>

            {/* Headline */}
            <h1 className="font-brand text-[clamp(3rem,10vw,5.5rem)] text-parla-dark leading-none tracking-tight mb-4 animate-slide-in-bottom animate-delay-100">
              Aprende idiomas
              <br />
              <span className="text-parla-red">jugando.</span>
            </h1>

            <p className="text-parla-blue font-bold text-lg md:text-xl max-w-md mx-auto mb-8 animate-fade-in animate-delay-300">
              Lecciones cortas, racha diaria y una comunidad que te motiva a
              llegar hasta el final.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-in-bottom animate-delay-400">
              <Link href="/login" className="btn-primary w-full sm:w-auto">
                Empieza gratis →
              </Link>
            </div>
          </div>

          {/* Sticker flotante */}
          <div className="absolute -top-6 -right-4 md:-right-8 bg-parla-red text-white font-brand text-2xl px-5 py-2 rounded-full border-4 border-parla-dark shadow-[0_4px_0_0_#254159] rotate-6 animate-swing-drop-in animate-delay-600">
            ¡Gratis!
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          LANGUAGE TICKER
      ══════════════════════════════════════ */}
      <div className="relative z-10 py-5 overflow-hidden bg-parla-dark border-y-4 border-[#1a2f40]">
        {/* Track duplicado para loop seamless */}
        <div className="ticker-track flex items-center gap-8 w-max">
          {[...TICKER_LANGS, ...TICKER_LANGS].map((lang, i) => (
            <span
              key={i}
              className="font-brand text-2xl text-white/80 whitespace-nowrap px-4"
            >
              {lang}
            </span>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════
          FEATURES
          Scroll reveal: <ScrollReveal> (IntersectionObserver)
      ══════════════════════════════════════ */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 md:px-12 py-20">
        <ScrollReveal className="text-center mb-12">
          <h2 className="font-brand text-[clamp(2.2rem,6vw,3.8rem)] text-parla-dark leading-tight mb-3">
            ¿Por qué Parla?
          </h2>
          <p className="text-parla-blue font-bold text-lg max-w-lg mx-auto">
            Diseñado para que nunca quieras parar.
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <ScrollReveal
              key={i}
              // 1. Agregamos "relative", "overflow-hidden" y "group" para los efectos
              className="feat-card relative overflow-hidden bg-white p-8 rounded-4xl border-4 border-parla-dark shadow-[0_8px_0_0_#254159] hover:-translate-y-1 transition-transform group"
              animation="animate-slide-in-bottom"
              delay={`${i * 150}ms`}
            >
              {/* 2. EMOJI GIGANTE DE FONDO */}
              <div className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none select-none">
                <span className="text-[12rem] opacity-10 drop-shadow-md transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6">
                  {f.emoji}
                </span>
              </div>

              {/* 3. CONTENIDO (Envuelto en un div con z-10 para que esté sobre el emoji) */}
              <div className="relative z-10 mt-4">
                {/* Usamos el color dinámico para el título */}
                <h3
                  className="font-brand text-3xl mb-3"
                  style={{ color: f.color }}
                >
                  {f.title}
                </h3>
                <p className="text-parla-dark font-bold text-lg leading-relaxed">
                  {f.desc}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════
          STATS
      ══════════════════════════════════════ */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 md:px-12 py-10 mb-10">
        <ScrollReveal className="bg-white rounded-4xl border-4 border-parla-dark shadow-[0_10px_0_0_#254159] p-8 md:p-12">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center divide-y sm:divide-y-0 sm:divide-x-4 divide-parla-mist">
            {STATS.map((s, i) => (
              <div
                key={i}
                className="py-4 sm:py-0 sm:px-8 first:pt-0 last:pb-0"
              >
                {/* Color y delay varían por ítem/index → style justificado */}
                <div
                  className="font-brand text-[clamp(2.8rem,8vw,4rem)] leading-none animate-bounce-fade-in"
                  style={{ color: s.color, animationDelay: `${i * 200}ms` }}
                >
                  {s.num}
                </div>
                <div className="text-parla-dark font-bold text-base mt-1">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </section>

      {/* ══════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════ */}
      <section className="relative z-10 max-w-3xl mx-auto px-6 md:px-12 py-10 mb-10">
        <ScrollReveal className="text-center mb-10">
          <h2 className="font-brand text-[clamp(2rem,6vw,3.4rem)] text-parla-dark">
            En 3 pasos
          </h2>
        </ScrollReveal>
        <div className="flex flex-col gap-4">
          {STEPS.map((step, i) => (
            <ScrollReveal
              key={i}
              className="flex items-start gap-5 bg-white rounded-3xl border-4 border-parla-dark p-6 shadow-[0_6px_0_0_#254159] hover:-translate-y-1 transition-transform duration-200"
              animation="animate-slide-in-left"
              delay={`${i * 100}ms`}
            >
              <div className="font-brand text-parla-red text-4xl leading-none shrink-0 w-14 text-center">
                {step.num}
              </div>
              <div className="flex-1">
                <h4 className="font-extrabold text-parla-dark text-xl mb-1">
                  {step.title}
                </h4>
                <p className="text-parla-blue font-semibold">{step.desc}</p>
              </div>
              <span className="text-3xl shrink-0">{step.emoji}</span>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════
          FINAL CTA
      ══════════════════════════════════════ */}
      <section className="relative z-10 px-6 pb-24 pt-6">
        <ScrollReveal className="max-w-2xl mx-auto text-center bg-parla-dark rounded-4xl border-4 border-[#1a2f40] shadow-[0_12px_0_0_#1a2f40] p-10 md:p-14">
          <div className="text-5xl mb-4 animate-bouncing animate-iteration-count-infinite animate-duration-slower inline-block">
            🚀
          </div>
          <h2 className="font-brand text-[clamp(2rem,6vw,3.5rem)] text-white leading-tight mb-4">
            Tu próxima palabra
            <br />
            <span className="text-parla-light">te está esperando.</span>
          </h2>
          <p className="text-parla-light font-bold text-lg mb-8">
            Únete a más de 50.000 personas que aprenden con Parla cada día. Es
            gratis.
          </p>
          <Link href="/login" className="btn-primary text-xl! py-5! px-14!">
            Quiero aprender ahora →
          </Link>
        </ScrollReveal>
      </section>

      {/* ══════════════════════════════════════
          FOOTER
      ══════════════════════════════════════ */}
      <footer className="relative z-10 border-t-4 border-parla-dark/30 py-8 px-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-8 h-8 bg-parla-blue rounded-full flex items-center justify-center border-2 border-parla-dark">
            <span className="font-brand text-base text-white leading-none">
              P
            </span>
          </div>
          <span className="font-brand text-xl text-parla-dark">Parla</span>
        </div>
        <p className="text-parla-dark/60 font-semibold text-sm">
          © 2026 Parla · Aprende idiomas jugando · Hecho con ❤️
        </p>
      </footer>
    </div>
  );
}
