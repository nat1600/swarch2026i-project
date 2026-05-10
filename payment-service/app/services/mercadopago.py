from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import httpx


class MercadoPagoError(RuntimeError):
    pass


@dataclass(slots=True)
class MercadoPagoPreference:
    id: str
    checkout_url: str
    raw: dict[str, Any]


class MercadoPagoClient:
    base_url = "https://api.mercadopago.com"

    def __init__(self, access_token: str, timeout: float = 10.0):
        self.access_token = access_token
        self.timeout = timeout

    async def create_preference(self, payload: dict[str, Any]) -> MercadoPagoPreference:
        if not self.access_token:
            raise MercadoPagoError("MERCADOPAGO_ACCESS_TOKEN is not configured")

        async with httpx.AsyncClient(base_url=self.base_url, timeout=self.timeout) as client:
            response = await client.post(
                "/checkout/preferences",
                json=payload,
                headers=self._headers(),
            )

        if response.status_code >= 400:
            raise MercadoPagoError(self._format_error(response))

        data = response.json()
        checkout_url = data.get("init_point") or data.get("sandbox_init_point")
        if not checkout_url:
            raise MercadoPagoError("MercadoPago response missing checkout url")

        return MercadoPagoPreference(
            id=data["id"],
            checkout_url=checkout_url,
            raw=data,
        )

    async def fetch_payment(self, payment_id: str) -> dict[str, Any]:
        if not self.access_token:
            raise MercadoPagoError("MERCADOPAGO_ACCESS_TOKEN is not configured")

        async with httpx.AsyncClient(base_url=self.base_url, timeout=self.timeout) as client:
            response = await client.get(
                f"/v1/payments/{payment_id}",
                headers=self._headers(),
            )

        if response.status_code >= 400:
            raise MercadoPagoError(self._format_error(response))

        return response.json()

    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json",
        }

    @staticmethod
    def _format_error(response: httpx.Response) -> str:
        detail = response.text.strip()
        if not detail:
            detail = response.reason_phrase
        return f"MercadoPago API error ({response.status_code}): {detail}"
