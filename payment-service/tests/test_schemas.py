import pytest
from pydantic import ValidationError
from datetime import datetime

from app.schemas.payment import CheckoutRequest, CheckoutResponse, PaymentRead


class TestCheckoutRequest:
    """Test CheckoutRequest schema."""
    
    def test_valid_checkout_request(self):
        """Test creating a valid CheckoutRequest."""
        request = CheckoutRequest(
            plan_type="vip",
            success_url="https://example.com/success",
            failure_url="https://example.com/failure",
        )
        
        assert request.plan_type == "vip"
        assert str(request.success_url) == "https://example.com/success"
        assert str(request.failure_url) == "https://example.com/failure"
    
    def test_checkout_request_with_pending_url(self):
        """Test CheckoutRequest with all URLs."""
        request = CheckoutRequest(
            plan_type="vip",
            success_url="https://example.com/success",
            failure_url="https://example.com/failure",
            pending_url="https://example.com/pending",
        )
        
        assert str(request.pending_url) == "https://example.com/pending"
    
    def test_checkout_request_with_email(self):
        """Test CheckoutRequest with payer email."""
        request = CheckoutRequest(
            plan_type="vip",
            success_url="https://example.com/success",
            failure_url="https://example.com/failure",
            payer_email="user@example.com",
        )
        
        assert request.payer_email == "user@example.com"
    
    def test_checkout_request_default_plan_type(self):
        """Test that plan_type defaults to 'vip'."""
        request = CheckoutRequest(
            success_url="https://example.com/success",
            failure_url="https://example.com/failure",
        )
        
        assert request.plan_type == "vip"
    
    def test_checkout_request_invalid_email(self):
        """Test that email validation works."""
        with pytest.raises(ValidationError):
            CheckoutRequest(
                plan_type="vip",
                success_url="https://example.com/success",
                failure_url="https://example.com/failure",
                payer_email="ab",  # Too short
            )
    
    def test_checkout_request_invalid_url(self):
        """Test that URL validation works."""
        with pytest.raises(ValidationError):
            CheckoutRequest(
                plan_type="vip",
                success_url="not-a-url",
                failure_url="https://example.com/failure",
            )


class TestCheckoutResponse:
    """Test CheckoutResponse schema."""
    
    def test_valid_checkout_response(self):
        """Test creating a valid CheckoutResponse."""
        response = CheckoutResponse(
            payment_id="12345",
            preference_id="pref_123",
            checkout_url="https://checkout.mercadopago.com/abc",
            status="pending",
            plan_type="vip",
            amount=5000,
            currency_id="COP",
        )
        
        assert response.payment_id == "12345"
        assert response.preference_id == "pref_123"
        assert response.status == "pending"
        assert response.plan_type == "vip"
        assert response.amount == 5000
        assert response.currency_id == "COP"


class TestPaymentRead:
    """Test PaymentRead schema."""
    
    def test_valid_payment_read(self):
        """Test creating a valid PaymentRead."""
        now = datetime.now()
        payment_data = {
            "id": "payment_id",
            "user_sub": "user123",
            "plan_type": "vip",
            "amount": 5000,
            "currency_id": "COP",
            "status": "approved",
            "external_reference": "ext_ref_123",
            "preference_id": "pref_123",
            "mercadopago_payment_id": "mp_123",
            "checkout_url": "https://checkout.mercadopago.com",
            "approved_at": now,
            "created_at": now,
            "updated_at": now,
        }
        
        payment = PaymentRead(**payment_data)
        
        assert payment.id == "payment_id"
        assert payment.user_sub == "user123"
        assert payment.status == "approved"
    
    def test_payment_read_with_none_optional_fields(self):
        """Test PaymentRead with None optional fields."""
        now = datetime.now()
        payment_data = {
            "id": "payment_id",
            "user_sub": "user123",
            "plan_type": "vip",
            "amount": 5000,
            "currency_id": "COP",
            "status": "pending",
            "external_reference": "ext_ref_123",
            "created_at": now,
            "updated_at": now,
        }
        
        payment = PaymentRead(**payment_data)
        
        assert payment.preference_id is None
        assert payment.mercadopago_payment_id is None
        assert payment.checkout_url is None
        assert payment.approved_at is None
