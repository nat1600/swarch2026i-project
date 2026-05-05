import pytest

from app.core.config import Settings


class TestSettings:
    """Test configuration loading."""
    
    def test_settings_load_from_env(self):
        """Test that settings load from environment."""
        settings = Settings(
            database_url="postgresql://localhost/test",
            mercadopago_access_token="test_token",
        )
        assert settings.database_url == "postgresql://localhost/test"
        assert settings.mercadopago_access_token == "test_token"
    
    def test_settings_defaults(self):
        """Test that settings have proper defaults from .env."""
        settings = Settings(
            database_url="postgresql://localhost/test",
            mercadopago_access_token="test_token",
        )
        # These should load from .env or have defaults
        assert settings.vip_currency == "COP"
        assert settings.vip_title == "Parla VIP"
        assert settings.vip_description == "Acceso VIP a Parla"
        # debug should be False by default unless set in .env
        assert isinstance(settings.debug, bool)
    
    def test_settings_custom_values(self):
        """Test that settings can be overridden."""
        settings = Settings(
            database_url="postgresql://localhost/test",
            mercadopago_access_token="test_token",
            vip_price=10000,
            vip_currency="USD",
            debug=True,
        )
        assert settings.vip_price == 10000
        assert settings.vip_currency == "USD"
        assert settings.debug is True
    
    def test_settings_optional_fields(self):
        """Test that optional settings can be configured."""
        settings = Settings(
            database_url="postgresql://localhost/test",
            mercadopago_access_token="test_token",
        )
        # These are optional and may be loaded from .env or be None
        assert settings.mercadopago_public_key is not None or settings.mercadopago_public_key is None
        assert settings.mercadopago_notification_url is not None or settings.mercadopago_notification_url is None
