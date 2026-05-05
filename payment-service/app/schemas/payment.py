from datetime import datetime
from typing import Literal

from pydantic import AnyHttpUrl, BaseModel, ConfigDict, Field


class CheckoutRequest(BaseModel):
    plan_type: Literal["vip"] = "vip"
    success_url: AnyHttpUrl
    failure_url: AnyHttpUrl
    pending_url: AnyHttpUrl | None = None
    payer_email: str | None = Field(default=None, min_length=3)


class CheckoutResponse(BaseModel):
    payment_id: str
    preference_id: str
    checkout_url: str
    status: str
    plan_type: str
    amount: int
    currency_id: str


class PaymentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_sub: str
    plan_type: str
    amount: int
    currency_id: str
    status: str
    external_reference: str
    preference_id: str | None = None
    mercadopago_payment_id: str | None = None
    checkout_url: str | None = None
    approved_at: datetime | None = None
    created_at: datetime
    updated_at: datetime
