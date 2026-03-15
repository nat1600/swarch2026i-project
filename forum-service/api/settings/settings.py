from urllib.parse import quote_plus
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    """Settings for the forum service."""
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    DB_NAME: str
    PORT: int = 8003
    LOCAL_URI: str = "mongodb://mongo:27017"

    ATLAS_USER: str
    ATLAS_PASS: str
    ATLAS_CLUSTER: str
    ENV: str = "local"



    @property
    def get_mongo_uri(self) -> str:
        """Construct the MongoDB URI from the individual components safely."""
        # quote_plus convierte caracteres como '@' en '%40' para evitar bugs
        user = quote_plus(self.ATLAS_USER)
        password = quote_plus(self.ATLAS_PASS)
        
        return f"mongodb+srv://{user}:{password}@{self.ATLAS_CLUSTER}/{self.DB_NAME}?retryWrites=true&w=majority"

# Instanciamos la configuración
settings = Settings()