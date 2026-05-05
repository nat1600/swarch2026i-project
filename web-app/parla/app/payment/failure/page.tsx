import Link from "next/link";

export const metadata = {
  title: "Pago cancelado - Parla VIP",
  description: "Tu pago ha sido cancelado",
};

export default function FailurePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 font-app flex items-center justify-center px-6 py-12">
      <div className="bg-white rounded-3xl border-4 border-parla-red shadow-[0_12px_0_0_rgba(191,4,54,0.5)] p-8 md:p-12 max-w-md mx-auto text-center">
        {/* Error Icon */}
        <div className="text-6xl mb-6">⚠️</div>

        <h1 className="font-brand text-4xl text-parla-red mb-4">
          Pago no completado
        </h1>

        <p className="text-parla-red font-bold text-lg mb-8">
          Tu pago ha sido cancelado o no se pudo procesar. Por favor, intenta
          de nuevo.
        </p>

        <div className="bg-red-50 border-2 border-parla-red rounded-xl p-4 mb-8">
          <p className="text-sm text-parla-red font-bold">
            Razones comunes:
            <br />• Fondos insuficientes
            <br />• Tarjeta rechazada
            <br />• Número de tarjeta inválido
          </p>
        </div>

        <Link
          href="/payment"
          className="inline-block bg-parla-red text-white font-brand text-lg px-8 py-3 rounded-xl border-3 border-parla-dark shadow-[0_4px_0_0_#254159] hover:shadow-[0_6px_0_0_#254159] transition-all"
        >
          Intentar de nuevo →
        </Link>

        <p className="text-parla-blue text-sm font-bold mt-6">
          ¿Necesitas ayuda? Contacta a{" "}
          <a href="mailto:support@parla.com" className="underline">
            support@parla.com
          </a>
        </p>
      </div>
    </div>
  );
}
