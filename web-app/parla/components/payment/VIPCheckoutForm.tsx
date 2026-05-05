"use client";

import { useState } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useRouter } from "next/navigation";
import axios from "axios";

export function VIPCheckoutForm() {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    if (!user) {
      router.push("/login");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Get the auth token from auth0
      const response = await fetch("/api/auth/token");
      const { accessToken } = await response.json();

      // Call payment service to create checkout
      const paymentBaseUrl =
        process.env.NEXT_PUBLIC_PAYMENT_SERVICE_URL ??
        "http://localhost:8080/api/payments";

      const checkoutResponse = await axios.post(
        `${paymentBaseUrl}/checkout`,
        {
          plan_type: "vip",
          success_url: `${window.location.origin}/payment/success`,
          failure_url: `${window.location.origin}/payment/failure`,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      // Redirect to MercadoPago checkout
      if (checkoutResponse.data.checkout_url) {
        window.location.href = checkoutResponse.data.checkout_url;
      }
    } catch (err) {
      console.error("Checkout error:", err);
      setError(
        axios.isAxiosError(err)
          ? err.response?.data?.detail || "Error al procesar el pago"
          : "Error al procesar el pago"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-16 bg-gray-200 rounded-lg animate-pulse" />
    );
  }

  return (
    <div className="bg-white rounded-3xl border-4 border-parla-dark shadow-[0_8px_0_0_#254159] p-8">
      {error && (
        <div className="bg-red-50 border-2 border-parla-red rounded-lg p-4 mb-6">
          <p className="text-parla-red font-bold">{error}</p>
        </div>
      )}

      <button
        onClick={handleCheckout}
        disabled={isProcessing || (user ? false : isLoading)}
        className={`w-full py-4 px-6 rounded-xl border-3 border-parla-dark font-brand text-lg transition-all ${
          isProcessing || !user
            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
            : "bg-parla-red text-white hover:shadow-[0_4px_0_0_#BF0436] active:translate-y-1"
        }`}
      >
        {isProcessing ? "Procesando..." : "Continuar al pago"}
      </button>

      <p className="text-center text-parla-blue text-sm mt-4 font-bold">
        {user
          ? "Haz clic para proceder con MercadoPago"
          : "Necesitas iniciar sesión para continuar"}
      </p>

      <div className="mt-6 pt-6 border-t-2 border-parla-mist">
        <p className="text-xs text-parla-blue font-bold text-center">
          🔒 Tu información de pago está protegida por MercadoPago
        </p>
      </div>
    </div>
  );
}
