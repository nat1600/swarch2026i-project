from __future__ import annotations

from enum import Enum
from datetime import datetime
from uuid import uuid4

from sqlalchemy import DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class PaymentStatus(str, Enum):
    pending = "pending"
    approved = "approved"
    authorized = "authorized"
    in_process = "in_process"
    rejected = "rejected"
    cancelled = "cancelled"
    refunded = "refunded"
    charged_back = "charged_back"
    failed = "failed"


class Payment(Base, TimestampMixin):
    __tablename__ = "payments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_sub: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    plan_type: Mapped[str] = mapped_column(String(64), nullable=False)
    amount: Mapped[int] = mapped_column(Integer, nullable=False)
    currency_id: Mapped[str] = mapped_column(String(8), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default=PaymentStatus.pending.value)
    external_reference: Mapped[str] = mapped_column(String(36), unique=True, index=True, nullable=False)
    preference_id: Mapped[str | None] = mapped_column(String(128), unique=True, index=True)
    mercadopago_payment_id: Mapped[str | None] = mapped_column(String(64), unique=True, index=True)
    checkout_url: Mapped[str | None] = mapped_column(Text)
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
