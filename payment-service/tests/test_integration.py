import pytest
from unittest.mock import AsyncMock, patch
from uuid import uuid4
from datetime import datetime, timezone

from sqlalchemy import select

from app.models.payment import Payment, PaymentStatus
from app.services.mercadopago import MercadoPagoPreference


class TestPaymentFlowIntegration:
    """Integration tests for complete payment flows."""
    
    @pytest.mark.asyncio
    async def test_complete_payment_flow(self, client, test_session):
        """Test the complete payment flow: checkout -> webhook -> verify."""
        user_sub = "user_integration_test"
        
        # Step 1: Create checkout
        mock_preference = MercadoPagoPreference(
            id="pref_integration_123",
            checkout_url="https://checkout.mercadopago.com/integration_test",
            raw={},
        )
        
        with patch("app.routes.payments.MercadoPagoClient.create_preference", new_callable=AsyncMock) as mock_create:
            mock_create.return_value = mock_preference
            
            checkout_response = client.post(
                "/checkout",
                headers={"X-User-Sub": user_sub},
                json={
                    "plan_type": "vip",
                    "success_url": "https://example.com/success",
                    "failure_url": "https://example.com/failure",
                    "payer_email": "integration@example.com",
                },
            )
        
        assert checkout_response.status_code == 200
        checkout_data = checkout_response.json()
        payment_id = checkout_data["payment_id"]
        external_reference = checkout_data["payment_id"]
        
        # Verify payment was created in DB
        async with test_session as session:
            result = await session.execute(
                select(Payment).where(Payment.id == payment_id)
            )
            payment = result.scalar_one_or_none()
            assert payment is not None
            assert payment.user_sub == user_sub
            assert payment.status == PaymentStatus.pending.value
            assert payment.preference_id == "pref_integration_123"
            assert payment.checkout_url == mock_preference.checkout_url
        
        # Step 2: Simulate webhook callback from MercadoPago
        with patch("app.routes.payments.MercadoPagoClient.fetch_payment", new_callable=AsyncMock) as mock_fetch:
            mock_fetch.return_value = {
                "id": "mp_integration_123",
                "status": "approved",
                "external_reference": external_reference,
            }
            
            webhook_response = client.post(
                "/webhook",
                json={"data": {"id": "mp_integration_123"}},
            )
        
        assert webhook_response.status_code == 200
        assert webhook_response.json()["status"] == "processed"
        
        # Step 3: Verify payment status was updated
        async with test_session as session:
            result = await session.execute(
                select(Payment).where(Payment.id == payment_id)
            )
            payment = result.scalar_one_or_none()
            assert payment is not None
            assert payment.status == PaymentStatus.approved.value
            assert payment.mercadopago_payment_id == "mp_integration_123"
            assert payment.approved_at is not None
        
        # Step 4: Verify user can retrieve their payment
        list_response = client.get("/me", headers={"X-User-Sub": user_sub})
        assert list_response.status_code == 200
        payments = list_response.json()
        assert len(payments) == 1
        assert payments[0]["status"] == "approved"
        assert payments[0]["mercadopago_payment_id"] == "mp_integration_123"
    
    @pytest.mark.asyncio
    async def test_webhook_updates_pending_payment(self, client, test_session):
        """Test that webhook properly updates pending payment status."""
        payment_id = str(uuid4())
        external_ref = str(uuid4())
        
        # Create a pending payment
        payment = Payment(
            id=payment_id,
            user_sub="webhook_test_user",
            plan_type="vip",
            amount=5000,
            currency_id="COP",
            status=PaymentStatus.pending.value,
            external_reference=external_ref,
            preference_id="pref_webhook_test",
        )
        
        async with test_session as session:
            session.add(payment)
            await session.commit()
        
        # Process webhook
        with patch("app.routes.payments.MercadoPagoClient.fetch_payment", new_callable=AsyncMock) as mock_fetch:
            mock_fetch.return_value = {
                "id": "mp_webhook_test",
                "status": "approved",
                "external_reference": external_ref,
            }
            
            response = client.post(
                "/webhook",
                json={"data": {"id": "mp_webhook_test"}},
            )
        
        assert response.status_code == 200
        
        # Verify status was updated
        async with test_session as session:
            result = await session.execute(
                select(Payment).where(Payment.id == payment_id)
            )
            updated_payment = result.scalar_one_or_none()
            assert updated_payment is not None
            assert updated_payment.status == "approved"
            assert updated_payment.approved_at is not None
    
    @pytest.mark.asyncio
    async def test_webhook_with_different_statuses(self, client, test_session):
        """Test webhook handling of different payment statuses."""
        test_cases = [
            ("approved", True),  # (status, should_have_approved_at)
            ("pending", False),
            ("rejected", False),
            ("in_process", False),
        ]
        
        for status_value, should_have_approved_at in test_cases:
            payment_id = str(uuid4())
            external_ref = str(uuid4())
            
            payment = Payment(
                id=payment_id,
                user_sub="test_user",
                plan_type="vip",
                amount=5000,
                currency_id="COP",
                status=PaymentStatus.pending.value,
                external_reference=external_ref,
            )
            
            async with test_session as session:
                session.add(payment)
                await session.commit()
            
            with patch("app.routes.payments.MercadoPagoClient.fetch_payment", new_callable=AsyncMock) as mock_fetch:
                mock_fetch.return_value = {
                    "id": f"mp_{status_value}",
                    "status": status_value,
                    "external_reference": external_ref,
                }
                
                response = client.post(
                    "/webhook",
                    json={"data": {"id": f"mp_{status_value}"}},
                )
            
            assert response.status_code == 200
            
            async with test_session as session:
                result = await session.execute(
                    select(Payment).where(Payment.id == payment_id)
                )
                updated_payment = result.scalar_one_or_none()
                assert updated_payment.status == status_value
                if should_have_approved_at:
                    assert updated_payment.approved_at is not None
                else:
                    assert updated_payment.approved_at is None
    
    @pytest.mark.asyncio
    async def test_multiple_users_payments_isolation(self, client, test_session):
        """Test that users only see their own payments."""
        user1 = "user_isolation_1"
        user2 = "user_isolation_2"
        
        # Create payments for both users
        payment1 = Payment(
            id=str(uuid4()),
            user_sub=user1,
            plan_type="vip",
            amount=5000,
            currency_id="COP",
            status=PaymentStatus.approved.value,
            external_reference=str(uuid4()),
        )
        payment2 = Payment(
            id=str(uuid4()),
            user_sub=user2,
            plan_type="vip",
            amount=5000,
            currency_id="COP",
            status=PaymentStatus.approved.value,
            external_reference=str(uuid4()),
        )
        
        async with test_session as session:
            session.add_all([payment1, payment2])
            await session.commit()
        
        # User1 should only see their payment
        response1 = client.get("/me", headers={"X-User-Sub": user1})
        assert response1.status_code == 200
        payments1 = response1.json()
        assert len(payments1) == 1
        assert payments1[0]["user_sub"] == user1
        
        # User2 should only see their payment
        response2 = client.get("/me", headers={"X-User-Sub": user2})
        assert response2.status_code == 200
        payments2 = response2.json()
        assert len(payments2) == 1
        assert payments2[0]["user_sub"] == user2
    
    @pytest.mark.asyncio
    async def test_webhook_ignores_unknown_payment(self, client):
        """Test that webhook ignores payments not in the database."""
        with patch("app.routes.payments.MercadoPagoClient.fetch_payment", new_callable=AsyncMock) as mock_fetch:
            mock_fetch.return_value = {
                "id": "mp_unknown",
                "status": "approved",
                "external_reference": str(uuid4()),  # Not in DB
            }
            
            response = client.post(
                "/webhook",
                json={"data": {"id": "mp_unknown"}},
            )
        
        assert response.status_code == 200
        assert response.json()["status"] == "ignored"
