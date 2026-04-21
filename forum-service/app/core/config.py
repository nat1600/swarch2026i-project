from pathlib import Path
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=PROJECT_ROOT / '.env',
        extra='ignore'
    )
    mongo_url: str
    mongo_db: str
    debug: bool

@lru_cache
def get_settings() -> Settings:
    return Settings()