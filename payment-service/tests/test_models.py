import pytest
from datetime import datetime
from uuid import uuid4

from app.models.payment import Payment, PaymentStatus


class TestPaymentModel:
    """Test Payment model."""
    
    def test_payment_creation(self):
        """Test creating a Payment instance."""
        payment_id = str(uuid4())
        payment = Payment(
            id=payment_id,
            user_sub="user123",
            plan_type="vip",
            amount=5000,
            currency_id="COP",
            external_reference=payment_id,
            status=PaymentStatus.pending.value,  # Explicitly set status
        )
        
        assert payment.id == payment_id
        assert payment.user_sub == "user123"
        assert payment.plan_type == "vip"
        assert payment.amount == 5000
        assert payment.currency_id == "COP"
        assert payment.status == PaymentStatus.pending.value
        assert payment.external_reference == payment_id
    
    def test_payment_status_enum(self):
        """Test PaymentStatus enum values."""
        assert PaymentStatus.pending.value == "pending"
        assert PaymentStatus.approved.value == "approved"
        assert PaymentStatus.rejected.value == "rejected"
        assert PaymentStatus.refunded.value == "refunded"
        assert PaymentStatus.charged_back.value == "charged_back"
        assert PaymentStatus.failed.value == "failed"
    
    def test_payment_with_preference_id(self):
        """Test Payment with preference_id."""
        payment_id = str(uuid4())
        payment = Payment(
            id=payment_id,
            user_sub="user123",
            plan_type="vip",
            amount=5000,
            currency_id="COP",
            external_reference=payment_id,
            preference_id="pref_123",
            checkout_url="https://checkout.mercadopago.com/abc123",
        )
        
        assert payment.preference_id == "pref_123"
        assert payment.checkout_url == "https://checkout.mercadopago.com/abc123"
    
    def test_payment_with_mercadopago_payment_id(self):
        """Test Payment with mercadopago_payment_id."""
        payment_id = str(uuid4())
        payment = Payment(
            id=payment_id,
            user_sub="user123",
            plan_type="vip",
            amount=5000,
            currency_id="COP",
            external_reference=payment_id,
            status=PaymentStatus.approved.value,
            mercadopago_payment_id="mp_123456",
        )
        
        assert payment.mercadopago_payment_id == "mp_123456"
        assert payment.status == PaymentStatus.approved.value
    
    def test_payment_explicit_status(self):
        """Test Payment with explicit status."""
        payment_id = str(uuid4())
        payment = Payment(
            id=payment_id,
            user_sub="user123",
            plan_type="vip",
            amount=5000,
            currency_id="COP",
            external_reference=payment_id,
            status=PaymentStatus.approved.value,
        )
        
        assert payment.status == PaymentStatus.approved.value
    
    def test_payment_with_approved_at(self):
        """Test Payment with approved_at timestamp."""
        payment_id = str(uuid4())
        now = datetime.now()
        payment = Payment(
            id=payment_id,
            user_sub="user123",
            plan_type="vip",
            amount=5000,
            currency_id="COP",
            external_reference=payment_id,
            approved_at=now,
        )
        
        assert payment.approved_at == now
