import pytest
from unittest.mock import AsyncMock, patch, MagicMock
import httpx

from app.services.mercadopago import MercadoPagoClient, MercadoPagoError, MercadoPagoPreference


class TestMercadoPagoClient:
    """Test MercadoPagoClient."""
    
    def test_client_initialization(self):
        """Test creating a MercadoPagoClient."""
        client = MercadoPagoClient("test_token")
        assert client.access_token == "test_token"
        assert client.timeout == 10.0
    
    def test_client_with_custom_timeout(self):
        """Test creating a MercadoPagoClient with custom timeout."""
        client = MercadoPagoClient("test_token", timeout=20.0)
        assert client.timeout == 20.0
    
    @pytest.mark.asyncio
    async def test_create_preference_success(self):
        """Test successful preference creation."""
        client = MercadoPagoClient("test_token")
        
        payload = {
            "items": [
                {
                    "title": "Parla VIP",
                    "description": "Acceso VIP a Parla",
                    "quantity": 1,
                    "unit_price": 5000,
                    "currency_id": "COP",
                }
            ],
            "back_urls": {
                "success": "https://example.com/success",
                "failure": "https://example.com/failure",
            },
        }
        
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "id": "pref_123",
            "init_point": "https://checkout.mercadopago.com/abc",
            "sandbox_init_point": "https://sandbox.mercadopago.com/abc",
        }
        
        with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
            mock_post.return_value = mock_response
            
            preference = await client.create_preference(payload)
            
            assert isinstance(preference, MercadoPagoPreference)
            assert preference.id == "pref_123"
            assert preference.checkout_url == "https://checkout.mercadopago.com/abc"
    
    @pytest.mark.asyncio
    async def test_create_preference_uses_sandbox_url(self):
        """Test that sandbox_init_point is used when init_point is missing."""
        client = MercadoPagoClient("test_token")
        
        payload = {"items": []}
        
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "id": "pref_123",
            "sandbox_init_point": "https://sandbox.mercadopago.com/abc",
        }
        
        with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
            mock_post.return_value = mock_response
            
            preference = await client.create_preference(payload)
            
            assert preference.checkout_url == "https://sandbox.mercadopago.com/abc"
    
    @pytest.mark.asyncio
    async def test_create_preference_missing_token(self):
        """Test that error is raised when token is missing."""
        client = MercadoPagoClient("")
        
        with pytest.raises(MercadoPagoError, match="MERCADOPAGO_ACCESS_TOKEN is not configured"):
            await client.create_preference({})
    
    @pytest.mark.asyncio
    async def test_create_preference_missing_checkout_url(self):
        """Test that error is raised when checkout URL is missing."""
        client = MercadoPagoClient("test_token")
        
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"id": "pref_123"}  # No init_point or sandbox_init_point
        
        with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
            mock_post.return_value = mock_response
            
            with pytest.raises(MercadoPagoError, match="missing checkout url"):
                await client.create_preference({})
    
    @pytest.mark.asyncio
    async def test_create_preference_api_error(self):
        """Test handling of API errors."""
        client = MercadoPagoClient("test_token")
        
        mock_response = MagicMock()
        mock_response.status_code = 400
        mock_response.text = "Invalid request"
        mock_response.reason_phrase = "Bad Request"
        
        with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
            mock_post.return_value = mock_response
            
            with pytest.raises(MercadoPagoError, match="MercadoPago API error"):
                await client.create_preference({})
    
    @pytest.mark.asyncio
    async def test_fetch_payment_success(self):
        """Test successful payment fetch."""
        client = MercadoPagoClient("test_token")
        
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "id": "mp_123",
            "status": "approved",
            "external_reference": "ext_ref_123",
        }
        
        with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
            mock_get.return_value = mock_response
            
            payment = await client.fetch_payment("mp_123")
            
            assert payment["id"] == "mp_123"
            assert payment["status"] == "approved"
            assert payment["external_reference"] == "ext_ref_123"
    
    @pytest.mark.asyncio
    async def test_fetch_payment_missing_token(self):
        """Test that error is raised when token is missing."""
        client = MercadoPagoClient("")
        
        with pytest.raises(MercadoPagoError, match="MERCADOPAGO_ACCESS_TOKEN is not configured"):
            await client.fetch_payment("mp_123")
    
    @pytest.mark.asyncio
    async def test_fetch_payment_api_error(self):
        """Test handling of API errors."""
        client = MercadoPagoClient("test_token")
        
        mock_response = MagicMock()
        mock_response.status_code = 404
        mock_response.text = "Payment not found"
        mock_response.reason_phrase = "Not Found"
        
        with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
            mock_get.return_value = mock_response
            
            with pytest.raises(MercadoPagoError, match="MercadoPago API error"):
                await client.fetch_payment("mp_123")
    
    def test_headers(self):
        """Test that headers are correctly formatted."""
        client = MercadoPagoClient("test_token")
        headers = client._headers()
        
        assert headers["Authorization"] == "Bearer test_token"
        assert headers["Content-Type"] == "application/json"
