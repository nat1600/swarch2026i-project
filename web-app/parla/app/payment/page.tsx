import { VIPCheckoutForm } from "@/components/payment/VIPCheckoutForm";
import Link from "next/link";

export const metadata = {
  title: "Parla VIP - Desbloquea todo el potencial",
  description: "Consigue acceso VIP a todas las features premium de Parla",
};

export default function PaymentPage() {
  return (
    <div className="min-h-screen bg-polka font-app">
      {/* Header */}
      <header className="border-b-4 border-parla-dark bg-white">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-parla-blue rounded-full flex items-center justify-center border-3 border-parla-dark shadow-[0_2px_0_0_#254159]">
              <span className="font-brand text-xl text-white">P</span>
            </div>
            <span className="font-brand text-2xl text-parla-dark">Parla</span>
          </Link>
          <Link href="/" className="text-parla-blue font-bold hover:underline">
            ← Volver al inicio
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-6 py-12">
        {/* Title */}
        <div className="text-center mb-12">
          <div className="inline-block bg-parla-red text-white font-brand text-lg px-6 py-2 rounded-full border-2 border-parla-dark shadow-[0_4px_0_0_#254159] mb-6">
            🏆 PARLA VIP
          </div>
          <h1 className="font-brand text-4xl md:text-5xl text-parla-dark mb-4">
            Desbloquea el máximo potencial
          </h1>
          <p className="text-lg text-parla-blue font-bold max-w-xl mx-auto">
            Acceso ilimitado a todas las lecciones premium, desafíos sin límite y
            mucho más.
          </p>
        </div>

        {/* VIP Features */}
        <div className="bg-white rounded-3xl border-4 border-parla-dark shadow-[0_8px_0_0_#254159] p-8 mb-8">
          <h2 className="font-brand text-2xl text-parla-dark mb-6">
            ¿Qué incluye Parla VIP?
          </h2>
          <ul className="space-y-4">
            <li className="flex items-start gap-4">
              <span className="text-2xl">⚡</span>
              <div>
                <h3 className="font-bold text-parla-dark">
                  Lecciones ilimitadas
                </h3>
                <p className="text-parla-blue text-sm">
                  Acceso a todos los cursos y lecciones premium
                </p>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <span className="text-2xl">🔥</span>
              <div>
                <h3 className="font-bold text-parla-dark">
                  Racha sin límites
                </h3>
                <p className="text-parla-blue text-sm">
                  Mantén tu racha sin interrupciones
                </p>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <span className="text-2xl">🏆</span>
              <div>
                <h3 className="font-bold text-parla-dark">
                  Desafíos premium
                </h3>
                <p className="text-parla-blue text-sm">
                  Participa en todos los desafíos y gana recompensas extras
                </p>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <span className="text-2xl">📊</span>
              <div>
                <h3 className="font-bold text-parla-dark">
                  Estadísticas avanzadas
                </h3>
                <p className="text-parla-blue text-sm">
                  Análisis detallado de tu progreso
                </p>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <span className="text-2xl">✨</span>
              <div>
                <h3 className="font-bold text-parla-dark">
                  Sin publicidad
                </h3>
                <p className="text-parla-blue text-sm">
                  Experiencia completamente libre de anuncios
                </p>
              </div>
            </li>
          </ul>
        </div>

        {/* Pricing Card */}
        <div className="bg-gradient-to-br from-parla-blue to-parla-dark rounded-3xl border-4 border-parla-dark shadow-[0_8px_0_0_#254159] p-8 text-white mb-8">
          <div className="text-center mb-8">
            <span className="text-5xl font-brand">$9.99</span>
            <span className="text-xl font-bold block">por mes</span>
            <p className="text-sm text-white/80 mt-2">
              Cancelable en cualquier momento
            </p>
          </div>
        </div>

        {/* Checkout Form */}
        <VIPCheckoutForm />

        {/* FAQ */}
        <div className="mt-12 bg-white rounded-3xl border-4 border-parla-dark shadow-[0_8px_0_0_#254159] p-8">
          <h3 className="font-brand text-2xl text-parla-dark mb-6">
            Preguntas frecuentes
          </h3>
          <div className="space-y-6">
            <div>
              <h4 className="font-bold text-parla-dark mb-2">
                ¿Puedo cancelar en cualquier momento?
              </h4>
              <p className="text-parla-blue text-sm">
                Sí, puedes cancelar tu suscripción en cualquier momento desde tu
                perfil.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-parla-dark mb-2">
                ¿Hay período de prueba gratuita?
              </h4>
              <p className="text-parla-blue text-sm">
                Disfruta de 7 días gratis cuando te suscribas a VIP.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-parla-dark mb-2">
                ¿Qué métodos de pago aceptan?
              </h4>
              <p className="text-parla-blue text-sm">
                Aceptamos todas las tarjetas de crédito y débito a través de
                MercadoPago.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t-4 border-parla-dark bg-white mt-12">
        <div className="max-w-6xl mx-auto px-6 py-8 text-center text-parla-blue font-bold text-sm">
          <p>© 2026 Parla. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
