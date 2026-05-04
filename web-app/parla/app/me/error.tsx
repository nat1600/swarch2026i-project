"use client";

import Link from "next/link";

export default function MeError({ error }: { error: Error }) {
  return (
    <div className="font-app min-h-screen w-full bg-parla-mist flex flex-col items-center justify-center px-4 text-center">
      <div className="bg-white p-8 rounded-4xl border-4 border-parla-dark shadow-[0_8px_0_0_#254159]">
        <h2 className="font-brand text-3xl text-parla-red mb-2">¡Ups! Algo salió mal</h2>
        <p className="text-parla-dark font-bold">{error.message}</p>
        <Link href="/home" className="btn-secondary mt-6">Volver al inicio</Link>
      </div>
    </div>
  );
}
