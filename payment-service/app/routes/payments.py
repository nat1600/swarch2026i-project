from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_session
from app.models.payment import Payment, PaymentStatus
from app.schemas.payment import CheckoutRequest, CheckoutResponse, PaymentRead
from app.services.mercadopago import MercadoPagoClient, MercadoPagoError


router = APIRouter(tags=["payments"])

PLAN_CATALOG: dict[str, dict[str, Any]] = {
    "vip": {
        "title": "Parla VIP",
        "description": "Acceso VIP a Parla",
    }
}


def require_user_sub(x_user_sub: str | None = Header(default=None, alias="X-User-Sub")) -> str:
    if not x_user_sub:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing X-User-Sub header")
    return x_user_sub


async def get_mercadopago_client(request: Request) -> MercadoPagoClient:
    settings = request.app.state.settings
    return MercadoPagoClient(settings.mercadopago_access_token)


def _build_preference_payload(
    *,
    settings,
    payment: Payment,
    request_body: CheckoutRequest,
    user_sub: str,
) -> dict[str, Any]:
    plan = PLAN_CATALOG[payment.plan_type]
    back_urls: dict[str, str] = {
        "success": str(request_body.success_url),
        "failure": str(request_body.failure_url),
    }
    if request_body.pending_url is not None:
        back_urls["pending"] = str(request_body.pending_url)

    payload: dict[str, Any] = {
        "items": [
            {
                "title": plan["title"],
                "description": plan["description"],
                "quantity": 1,
                "unit_price": settings.vip_price,
                "currency_id": settings.vip_currency,
            }
        ],
        "back_urls": back_urls,
        "external_reference": payment.external_reference,
        "metadata": {
            "payment_id": payment.id,
            "user_sub": user_sub,
            "plan_type": payment.plan_type,
        },
        "payer": {},
    }

    if request_body.payer_email:
        payload["payer"]["email"] = request_body.payer_email
    else:
        payload.pop("payer")

    if settings.mercadopago_notification_url:
        payload["notification_url"] = settings.mercadopago_notification_url

    # Only set auto_return when back_urls.success is a non-localhost HTTPS URL.
    # MercadoPago rejects certain local URLs for auto_return; avoid sending
    # auto_return for localhost to prevent 400 errors in dev.
    success_url = back_urls.get("success", "")
    if isinstance(success_url, str) and success_url.startswith("https://"):
        payload["auto_return"] = "approved"

    return payload


@router.post("/checkout", response_model=CheckoutResponse)
async def create_checkout(
    body: CheckoutRequest,
    request: Request,
    user_sub: str = Depends(require_user_sub),
    session: AsyncSession = Depends(get_session),
    client: MercadoPagoClient = Depends(get_mercadopago_client),
) -> CheckoutResponse:
    settings = request.app.state.settings

    plan = PLAN_CATALOG.get(body.plan_type)
    if plan is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported plan type")

    payment_id = str(uuid4())
    payment = Payment(
        id=payment_id,
        user_sub=user_sub,
        plan_type=body.plan_type,
        amount=settings.vip_price,
        currency_id=settings.vip_currency,
        status=PaymentStatus.pending.value,
        external_reference=payment_id,
    )
    session.add(payment)
    await session.flush()

    preference_payload = _build_preference_payload(
        settings=settings,
        payment=payment,
        request_body=body,
        user_sub=user_sub,
    )

    try:
        preference = await client.create_preference(preference_payload)
    except MercadoPagoError as exc:
        await session.rollback()
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc

    payment.preference_id = preference.id
    payment.checkout_url = preference.checkout_url
    await session.commit()

    return CheckoutResponse(
        payment_id=payment.id,
        preference_id=preference.id,
        checkout_url=preference.checkout_url,
        status=payment.status,
        plan_type=payment.plan_type,
        amount=payment.amount,
        currency_id=payment.currency_id,
    )


@router.post("/webhook")
async def mercadopago_webhook(
    request: Request,
    session: AsyncSession = Depends(get_session),
    client: MercadoPagoClient = Depends(get_mercadopago_client),
) -> dict[str, str]:
    payload: dict[str, Any] = {}
    try:
        payload = await request.json()
    except Exception:
        payload = {}

    payment_id = (
        payload.get("data", {}).get("id")
        or request.query_params.get("data.id")
        or request.query_params.get("id")
    )
    if not payment_id:
        return {"status": "ignored"}

    try:
        remote_payment = await client.fetch_payment(str(payment_id))
    except MercadoPagoError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc

    external_reference = remote_payment.get("external_reference")
    if not external_reference:
        return {"status": "ignored"}

    result = await session.execute(select(Payment).where(Payment.external_reference == external_reference))
    payment = result.scalar_one_or_none()
    if payment is None:
        return {"status": "ignored"}

    payment.mercadopago_payment_id = str(remote_payment.get("id", payment_id))
    payment.status = str(remote_payment.get("status", payment.status))
    if payment.status == PaymentStatus.approved.value:
        payment.approved_at = datetime.now(timezone.utc)
    await session.commit()

    return {"status": "processed"}


@router.get("/me", response_model=list[PaymentRead])
async def list_my_payments(
    user_sub: str = Depends(require_user_sub),
    session: AsyncSession = Depends(get_session),
) -> list[PaymentRead]:
    result = await session.execute(
        select(Payment).where(Payment.user_sub == user_sub).order_by(Payment.created_at.desc())
    )
    return list(result.scalars().all())


@router.get("/{payment_id}", response_model=PaymentRead)
async def get_payment(
    payment_id: str,
    user_sub: str = Depends(require_user_sub),
    session: AsyncSession = Depends(get_session),
) -> Payment:
    result = await session.execute(select(Payment).where(Payment.id == payment_id))
    payment = result.scalar_one_or_none()
    if payment is None or payment.user_sub != user_sub:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")
    return payment
