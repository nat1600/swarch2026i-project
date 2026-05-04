# app/config.py
from pathlib import Path
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict

PROJECT_ROOT = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=PROJECT_ROOT / '.env',
        extra='ignore'
    )
    rabbitmq_url: str
    queue_name: str
    mongo_url: str
    mongo_db: str
    mongo_collection: str
    anthropic_api_key: str

@lru_cache
def get_settings() -> Settings:
    return Settings()