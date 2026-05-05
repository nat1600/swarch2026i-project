import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from uuid import uuid4

from app.models.payment import Payment, PaymentStatus
from app.services.mercadopago import MercadoPagoPreference, MercadoPagoError


class TestCheckoutEndpoint:
    """Test checkout endpoint."""
    
    def test_checkout_missing_user_sub_header(self, client):
        """Test that checkout fails without X-User-Sub header."""
        response = client.post(
            "/checkout",
            json={
                "plan_type": "vip",
                "success_url": "https://example.com/success",
                "failure_url": "https://example.com/failure",
            },
        )
        assert response.status_code == 401
        assert "Missing X-User-Sub header" in response.json()["detail"]
    
    def test_checkout_invalid_plan_type(self, client):
        """Test that checkout fails with unsupported plan type."""
        response = client.post(
            "/checkout",
            headers={"X-User-Sub": "user123"},
            json={
                "plan_type": "invalid_plan",
                "success_url": "https://example.com/success",
                "failure_url": "https://example.com/failure",
            },
        )
        # FastAPI validates the Literal type and returns 422 instead of 400
        assert response.status_code in [400, 422]
    
    @pytest.mark.asyncio
    async def test_checkout_success(self, client):
        """Test successful checkout creation."""
        mock_preference = MercadoPagoPreference(
            id="pref_123",
            checkout_url="https://checkout.mercadopago.com/abc",
            raw={},
        )
        
        with patch("app.routes.payments.MercadoPagoClient.create_preference", new_callable=AsyncMock) as mock_create:
            mock_create.return_value = mock_preference
            
            response = client.post(
                "/checkout",
                headers={"X-User-Sub": "user123"},
                json={
                    "plan_type": "vip",
                    "success_url": "https://example.com/success",
                    "failure_url": "https://example.com/failure",
                    "payer_email": "user@example.com",
                },
            )
        
        assert response.status_code == 200
        data = response.json()
        assert data["preference_id"] == "pref_123"
        assert data["checkout_url"] == "https://checkout.mercadopago.com/abc"
        assert data["status"] == "pending"
        assert data["plan_type"] == "vip"
        assert data["amount"] == 5000
        assert data["currency_id"] == "COP"
    
    @pytest.mark.asyncio
    async def test_checkout_mercadopago_error(self, client):
        """Test checkout handling of MercadoPago errors."""
        with patch("app.routes.payments.MercadoPagoClient.create_preference", new_callable=AsyncMock) as mock_create:
            mock_create.side_effect = MercadoPagoError("API Error")
            
            response = client.post(
                "/checkout",
                headers={"X-User-Sub": "user123"},
                json={
                    "plan_type": "vip",
                    "success_url": "https://example.com/success",
                    "failure_url": "https://example.com/failure",
                },
            )
        
        assert response.status_code == 502
        assert "API Error" in response.json()["detail"]


class TestWebhookEndpoint:
    """Test webhook endpoint."""
    
    def test_webhook_no_payment_id(self, client):
        """Test webhook with missing payment ID."""
        response = client.post("/webhook", json={})
        assert response.status_code == 200
        assert response.json()["status"] == "ignored"
    
    def test_webhook_with_query_params(self, client):
        """Test webhook with payment ID in query params."""
        with patch("app.routes.payments.MercadoPagoClient.fetch_payment", new_callable=AsyncMock) as mock_fetch:
            mock_fetch.return_value = {
                "id": "mp_123",
                "status": "approved",
                "external_reference": None,
            }
            
            response = client.post("/webhook?id=mp_123", json={})
        
        assert response.status_code == 200
        assert response.json()["status"] == "ignored"  # ignored because external_reference is None
    
    @pytest.mark.asyncio
    async def test_webhook_mercadopago_error(self, client):
        """Test webhook handling of MercadoPago errors."""
        with patch("app.routes.payments.MercadoPagoClient.fetch_payment", new_callable=AsyncMock) as mock_fetch:
            mock_fetch.side_effect = MercadoPagoError("API Error")
            
            response = client.post(
                "/webhook",
                json={"data": {"id": "mp_123"}},
            )
        
        assert response.status_code == 502


class TestListPaymentsEndpoint:
    """Test list payments endpoint."""
    
    def test_list_payments_missing_user_sub(self, client):
        """Test that list fails without X-User-Sub header."""
        response = client.get("/me")
        assert response.status_code == 401
        assert "Missing X-User-Sub header" in response.json()["detail"]
    
    def test_list_payments_empty(self, client):
        """Test listing payments when none exist."""
        response = client.get("/me", headers={"X-User-Sub": "user123"})
        assert response.status_code == 200
        assert response.json() == []
    
    @pytest.mark.asyncio
    async def test_list_payments_with_payments(self, client, test_session):
        """Test listing user payments."""
        # Create test payments
        from sqlalchemy.ext.asyncio import async_sessionmaker
        
        payment1 = Payment(
            id=str(uuid4()),
            user_sub="user123",
            plan_type="vip",
            amount=5000,
            currency_id="COP",
            status=PaymentStatus.pending.value,
            external_reference=str(uuid4()),
        )
        payment2 = Payment(
            id=str(uuid4()),
            user_sub="user123",
            plan_type="vip",
            amount=5000,
            currency_id="COP",
            status=PaymentStatus.approved.value,
            external_reference=str(uuid4()),
        )
        
        async with test_session as session:
            session.add(payment1)
            session.add(payment2)
            await session.commit()
        
        response = client.get("/me", headers={"X-User-Sub": "user123"})
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert data[0]["user_sub"] == "user123"
        assert data[0]["plan_type"] == "vip"


class TestGetPaymentEndpoint:
    """Test get payment endpoint."""
    
    def test_get_payment_missing_user_sub(self, client):
        """Test that get payment fails without X-User-Sub header."""
        response = client.get(f"/{uuid4()}")
        assert response.status_code == 401
    
    @pytest.mark.asyncio
    async def test_get_payment_not_found(self, client):
        """Test getting a non-existent payment."""
        response = client.get(
            f"/{uuid4()}",
            headers={"X-User-Sub": "user123"},
        )
        assert response.status_code == 404
    
    @pytest.mark.asyncio
    async def test_get_payment_success(self, client, test_session):
        """Test getting a payment."""
        payment = Payment(
            id=str(uuid4()),
            user_sub="user123",
            plan_type="vip",
            amount=5000,
            currency_id="COP",
            status=PaymentStatus.approved.value,
            external_reference=str(uuid4()),
        )
        
        async with test_session as session:
            session.add(payment)
            await session.commit()
        
        response = client.get(
            f"/{payment.id}",
            headers={"X-User-Sub": "user123"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == payment.id
        assert data["status"] == "approved"
