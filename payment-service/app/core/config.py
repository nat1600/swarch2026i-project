from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=PROJECT_ROOT / ".env", extra="ignore")

    database_url: str
    mercadopago_access_token: str
    mercadopago_public_key: str | None = None
    mercadopago_notification_url: str | None = None
    vip_price: int = 29900
    vip_currency: str = "COP"
    vip_title: str = "Parla VIP"
    vip_description: str = "Acceso VIP a Parla"
    debug: bool = False


@lru_cache
def get_settings() -> Settings:
    return Settings()
