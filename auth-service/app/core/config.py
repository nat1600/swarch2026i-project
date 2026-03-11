from pathlib import Path
from functools import lru_cache

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=PROJECT_ROOT / '.env',
        extra='ignore'
    )

    postgres_db: str
    postgres_user: str
    postgres_host: str
    postgres_password: str
    postgres_port: int

    auth0_domain: str
    auth0_api_audience: str
    auth0_algorithms: str = "RS256"

    debug: bool = False
    cors_origins: list[str] | None

    @field_validator("cors_origins", mode='before')
    @classmethod
    def parse_cors(cls, v) -> list[str] | None:
        if v is None:
            return None
        if isinstance(v, str):
            return [item.strip() for item in v.split(",") if item.strip()]
        raise ValueError(f"Can not recognize origin: {v}")

    @model_validator(mode='after')
    def  validate_origins_required(self) -> "Settings":
        if not self.debug and self.cors_origins is None:
            raise ValueError(f"If not debug then allowed origins can not be None")
        return self

    @property
    def database_url(self) -> str:
        return (
            f"postgresql+asyncpg://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    @property
    def issuer(self) -> str:
        return f"https://{self.auth0_domain}/"

    @property
    def jwks_url(self) -> str:
        return f"https://{self.auth0_domain}/.well-known/jwks.json"

    @property
    def allowed_origins(self) -> list[str]:
        if self.debug:
            return ['*']
        return self.cors_origins


@lru_cache
def get_settings() -> Settings:
    return Settings()
