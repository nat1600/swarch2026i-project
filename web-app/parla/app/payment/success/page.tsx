import Link from "next/link";

export const metadata = {
  title: "¡Pago exitoso! - Parla VIP",
  description: "Tu suscripción a Parla VIP ha sido activada",
};

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 font-app flex items-center justify-center px-6 py-12">
      <div className="bg-white rounded-3xl border-4 border-green-600 shadow-[0_12px_0_0_rgba(22,163,74,0.5)] p-8 md:p-12 max-w-md mx-auto text-center">
        {/* Success Icon */}
        <div className="text-6xl mb-6">✨</div>

        <h1 className="font-brand text-4xl text-green-700 mb-4">
          ¡Bienvenido a VIP!
        </h1>

        <p className="text-green-600 font-bold text-lg mb-8">
          Tu suscripción ha sido activada correctamente. Ahora tienes acceso a
          todas las features premium de Parla.
        </p>

        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-8">
          <p className="text-sm text-green-700 font-bold">
            ✓ Acceso ilimitado a todas las lecciones
            <br />✓ Desafíos premium desbloqueados
            <br />✓ Estadísticas avanzadas disponibles
            <br />✓ Sin publicidad
          </p>
        </div>

        <Link
          href="/home"
          className="inline-block bg-green-600 text-white font-brand text-lg px-8 py-3 rounded-xl border-3 border-green-700 shadow-[0_4px_0_0_#15803d] hover:shadow-[0_6px_0_0_#15803d] transition-all"
        >
          Ir a mis lecciones →
        </Link>

        <p className="text-green-600 text-sm font-bold mt-6">
          Si tienes problemas, contacta a{" "}
          <a href="mailto:support@parla.com" className="underline">
            support@parla.com
          </a>
        </p>
      </div>
    </div>
  );
}
